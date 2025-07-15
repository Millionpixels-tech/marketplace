import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, limit, startAfter, orderBy, QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { FiBox, FiPlus, FiTool } from "react-icons/fi";
import ShopOwnerName from "./ShopOwnerName";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import ContactSellerButton from "../../components/UI/ContactSellerButton";
import ShopReviews from "../../components/UI/ShopReviews";
import ResponsiveListingTile from "../../components/UI/ResponsiveListingTile";
import ResponsiveServiceTiles from "../../components/UI/ResponsiveServiceTiles";
import WithReviewStats from "../../components/HOC/WithReviewStats";
import { LoadingSpinner } from "../../components/UI";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getUserIP } from "../../utils/ipUtils";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { useResponsive } from "../../hooks/useResponsive";
import { getServicesCountByShop } from "../../utils/serviceUtils";
import { calculateShopRating } from "../../utils/serviceReviews";
import type { DeliveryType as DeliveryTypeType } from "../../types/enums";
import type { Service } from "../../types/service";

type Shop = {
    id: string;
    name: string;
    username: string;
    mobile: string;
    description: string;
    logo?: string;
    cover?: string;
    owner: string;
    rating?: number;
    ratingCount?: number;
};

type Listing = {
    id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
    deliveryType?: DeliveryTypeType;
    cashOnDelivery?: boolean;
    reviews?: Array<{ rating: number;[key: string]: any }>;
    __client_ip?: string;
};

const PAGE_SIZE = 8;

export default function ShopPage() {
    const { isMobile } = useResponsive();
    const { user } = useAuth();
    const { username } = useParams<{ username: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCursors, setPageCursors] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]); // First page starts at null
    const [ip, setIp] = useState<string | null>(null);
    
    // Services state
    const [services, setServices] = useState<Service[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesPage, setServicesPage] = useState(1);
    const [servicesTotalCount, setServicesTotalCount] = useState(0);
    const [servicesPageCursors, setServicesPageCursors] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]);
    
    // Reviews state for rating calculation
    const [shopRating, setShopRating] = useState<number | null>(null);
    const [shopRatingCount, setShopRatingCount] = useState<number>(0);

    // 1. Fetch user IP and shop info
    useEffect(() => {
        async function initialize() {
            // Get user IP
            const userIp = await getUserIP();
            setIp(userIp);

            // Fetch shop info
            setLoading(true);
            const shopQuery = query(collection(db, "shops"), where("username", "==", username));
            const shopSnap = await getDocs(shopQuery);
            if (shopSnap.empty) {
                setShop(null);
                setLoading(false);
                return;
            }
            const shopData = { ...shopSnap.docs[0].data(), id: shopSnap.docs[0].id } as Shop;
            setShop(shopData);
            setLoading(false);
        }
        if (username) initialize();
    }, [username]);

    // 2. Fetch listings count for pagination
    useEffect(() => {
        if (!shop) return;
       // console.log("ShopPage: Shop loaded with ID:", shop.id);
        async function getTotalCount() {
            // FIXED: Use getCountFromServer for efficient counting (if available)
            // Or use aggregation count query instead of fetching all documents
            try {
                // Use getCountFromServer if available (Firebase v9.8+)
                const { getCountFromServer } = await import('firebase/firestore');
                const countQuery = query(
                    collection(db, "listings"), 
                    where("shopId", "==", shop?.id)
                );
                const snapshot = await getCountFromServer(countQuery);
                setTotalCount(snapshot.data().count);
            } catch (error) {
                // Fallback to regular query with limit for older Firebase versions
               // console.log("Using fallback count method");
                const countQuery = query(
                    collection(db, "listings"), 
                    where("shopId", "==", shop?.id),
                    orderBy("createdAt", "desc"),
                    limit(1000) // Add limit to prevent excessive reads
                );
                const allListingsSnap = await getDocs(countQuery);
                setTotalCount(allListingsSnap.size);
            }
        }
        getTotalCount();
    }, [shop]);

    // 3. Fetch shop reviews from reviews collection
    useEffect(() => {
        if (!shop?.id) return;
        
        async function fetchShopReviews() {
            try {
                // Use the new combined rating calculation that includes both product and service reviews
                const ratingData = await calculateShopRating(shop!.id);
                setShopRating(ratingData.rating);
                setShopRatingCount(ratingData.count);
            } catch (error) {
                console.error("Error fetching shop reviews:", error);
                setShopRating(null);
                setShopRatingCount(0);
            }
        }
        
        fetchShopReviews();
    }, [shop]);

    // Refresh listings (after wishlist update)
    const refreshListings = async () => {
        if (!shop) return;
        await fetchListings(page, pageCursors);
    };

    // 3. Fetch paginated listings
    const fetchListings = useCallback(
        async (currentPage: number, cursors: Array<QueryDocumentSnapshot<DocumentData> | null>) => {
            if (!shop) return;
            setLoading(true);

            let q;
            if (currentPage === 1) {
                q = query(
                    collection(db, "listings"),
                    where("shopId", "==", shop.id),
                    orderBy("createdAt", "desc"),
                    limit(PAGE_SIZE)
                );
            } else {
                const cursor = cursors[currentPage - 2]; // previous page's last doc
                if (!cursor) return;
                q = query(
                    collection(db, "listings"),
                    where("shopId", "==", shop.id),
                    orderBy("createdAt", "desc"),
                    startAfter(cursor),
                    limit(PAGE_SIZE)
                );
            }
            const snap = await getDocs(q);
            const docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                __client_ip: ip,
            })) as Listing[];
            setListings(docs);

            // Set page cursors for navigation (forwards only)
            if (snap.docs.length > 0) {
                const newCursors = [...cursors];
                newCursors[currentPage - 1] = snap.docs[snap.docs.length - 1];
                setPageCursors(newCursors);
            }
            setLoading(false);
        },
        [shop, ip]
    );

    // 4. Fetch listings when shop, page, or pageCursors change
    useEffect(() => {
        if (!shop) return;
        fetchListings(page, pageCursors);
    }, [shop, page]); // eslint-disable-line

    // 5. Generate page numbers
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 6. Handle page navigation
    function handlePageChange(newPage: number) {
        setPage(newPage);
        // Cursors are only populated as you go, so if jumping forward by more than 1, refetch from page 1 forward
        // (For full "random access" page jumps, you'd need to store all cursors as you go forward, or load all IDs up front.)
    }

    // Services functions
    const refreshServices = async () => {
        if (!shop) return;
        await fetchServices(servicesPage, servicesPageCursors);
    };

    // Fetch paginated services
    const fetchServices = useCallback(
        async (currentPage: number, cursors: Array<QueryDocumentSnapshot<DocumentData> | null>) => {
            if (!shop) return;
            setServicesLoading(true);

            try {
                let q;
                if (currentPage === 1) {
                    q = query(
                        collection(db, "services"),
                        where("shopId", "==", shop.id),
                        orderBy("createdAt", "desc"),
                        limit(PAGE_SIZE)
                    );
                } else {
                    const cursor = cursors[currentPage - 2]; // previous page's last doc
                    if (!cursor) return;
                    q = query(
                        collection(db, "services"),
                        where("shopId", "==", shop.id),
                        orderBy("createdAt", "desc"),
                        startAfter(cursor),
                        limit(PAGE_SIZE)
                    );
                }
                const snap = await getDocs(q);
                const docs = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Service[];
                setServices(docs);

                // Set page cursors for navigation (forwards only)
                if (snap.docs.length > 0) {
                    const newCursors = [...cursors];
                    newCursors[currentPage - 1] = snap.docs[snap.docs.length - 1];
                    setServicesPageCursors(newCursors);
                }

                // Get total count (only on first page)
                if (currentPage === 1) {
                    const totalServicesCount = await getServicesCountByShop(shop.id);
                    setServicesTotalCount(totalServicesCount);
                }
                
                setServicesLoading(false);
            } catch (error) {
                console.error("Error fetching services:", error);
                setServicesLoading(false);
            }
        },
        [shop]
    );

    // Fetch services when shop, servicesPage, or servicesPageCursors change
    useEffect(() => {
        if (!shop) return;
        fetchServices(servicesPage, servicesPageCursors);
    }, [shop, servicesPage]); // eslint-disable-line

    // Services pagination 
    const servicesTotalPages = Math.ceil(servicesTotalCount / PAGE_SIZE);

    // Handle services page navigation
    function handleServicesPageChange(newPage: number) {
        setServicesPage(newPage);
    }

    // 7. Loading and not found states
    if (loading && !shop) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
                <div className="text-center" style={{ color: '#454955' }}>
                    <div className="text-2xl font-bold mb-2">Shop Not Found</div>
                    <div>This shop does not exist.</div>
                </div>
            </div>
        );
    }

    // Generate SEO data
    const generateShopSEO = () => {
        const shopName = shop.name || 'Shop';
        const description = shop.description || `Discover products, services, and digital content from ${shopName}`;
        const rating = shopRating || 0;
        const ratingCount = shopRatingCount || 0;
        
        return {
            title: `${shopName} - Products, Services & Digital Content`,
            description: description.length > 160 ? description.substring(0, 157) + '...' : description,
            keywords: generateKeywords([
                shopName,
                'Sri Lankan shop',
                'authentic products',
                'local entrepreneur',
                'online business',
                'Sri Lankan seller'
            ]),
            structuredData: {
                '@context': 'https://schema.org',
                '@type': 'Store',
                name: shopName,
                description,
                url: getCanonicalUrl(`/shop/${username}`),
                logo: shop.logo,
                image: shop.cover || shop.logo,
                ...(rating > 0 && ratingCount > 0 && {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: rating,
                        reviewCount: ratingCount
                    }
                })
            }
        };
    };

    const seoData = generateShopSEO();

    // 8. Pagination controls
    function Pagination() {
        if (totalPages <= 1) return null;

        return (
            <div className={`mt-8 flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {/* Previous button */}
                <button
                    onClick={() => page > 1 && handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm`}
                    style={{
                        backgroundColor: page === 1 ? '#f1f5f9' : '#ffffff',
                        color: page === 1 ? '#94a3b8' : '#374151',
                        border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={(e) => {
                        if (page !== 1) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#72b01d';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (page !== 1) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#374151';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                    }}
                    aria-label="Previous page"
                >
                    {isMobile ? '←' : '← Previous'}
                </button>

                {/* Page numbers */}
                <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    {/* First page */}
                    {page > 3 && !isMobile && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    border: '1px solid #e2e8f0'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                1
                            </button>
                            {page > 4 && (
                                <span className="px-2" style={{ color: '#94a3b8' }}>...</span>
                            )}
                        </>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= (isMobile ? 3 : 5)) {
                            pageNum = i + 1;
                        } else if (page <= (isMobile ? 2 : 3)) {
                            pageNum = i + 1;
                        } else if (page >= totalPages - (isMobile ? 1 : 2)) {
                            pageNum = totalPages - (isMobile ? 2 : 4) + i;
                        } else {
                            pageNum = page - (isMobile ? 1 : 2) + i;
                        }

                        if (pageNum < 1 || pageNum > totalPages) return null;
                        if (!isMobile && page > 3 && pageNum === 1) return null;
                        if (!isMobile && page < totalPages - 2 && pageNum === totalPages) return null;

                        const isCurrentPage = page === pageNum;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: isCurrentPage ? '#72b01d' : '#ffffff',
                                    color: isCurrentPage ? '#ffffff' : '#374151',
                                    border: `1px solid ${isCurrentPage ? '#72b01d' : '#e2e8f0'}`
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.borderColor = '#72b01d';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#374151';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    {/* Last page */}
                    {page < totalPages - 2 && !isMobile && (
                        <>
                            {page < totalPages - 3 && (
                                <span className="px-2" style={{ color: '#94a3b8' }}>...</span>
                            )}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    border: '1px solid #e2e8f0'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Next button */}
                <button
                    onClick={() => page < totalPages && handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm`}
                    style={{
                        backgroundColor: page === totalPages ? '#f1f5f9' : '#ffffff',
                        color: page === totalPages ? '#94a3b8' : '#374151',
                        border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={(e) => {
                        if (page !== totalPages) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#72b01d';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (page !== totalPages) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#374151';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                    }}
                    aria-label="Next page"
                >
                    {isMobile ? '→' : 'Next →'}
                </button>
            </div>
        );
    }

    // Services Pagination controls
    function ServicesPagination() {
        if (servicesTotalPages <= 1) return null;

        return (
            <div className={`mt-8 flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {/* Previous button */}
                <button
                    onClick={() => servicesPage > 1 && handleServicesPageChange(servicesPage - 1)}
                    disabled={servicesPage === 1}
                    className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm`}
                    style={{
                        backgroundColor: servicesPage === 1 ? '#f1f5f9' : '#ffffff',
                        color: servicesPage === 1 ? '#94a3b8' : '#374151',
                        border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={(e) => {
                        if (servicesPage !== 1) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#72b01d';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (servicesPage !== 1) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#374151';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                    }}
                    aria-label="Previous page"
                >
                    {isMobile ? '←' : '← Previous'}
                </button>

                {/* Page numbers */}
                <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                    {/* First page */}
                    {servicesPage > 3 && !isMobile && (
                        <>
                            <button
                                onClick={() => handleServicesPageChange(1)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    border: '1px solid #e2e8f0'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                1
                            </button>
                            {servicesPage > 4 && (
                                <span className="px-2" style={{ color: '#94a3b8' }}>...</span>
                            )}
                        </>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, servicesTotalPages) }, (_, i) => {
                        let pageNum;
                        if (servicesTotalPages <= (isMobile ? 3 : 5)) {
                            pageNum = i + 1;
                        } else if (servicesPage <= (isMobile ? 2 : 3)) {
                            pageNum = i + 1;
                        } else if (servicesPage >= servicesTotalPages - (isMobile ? 1 : 2)) {
                            pageNum = servicesTotalPages - (isMobile ? 2 : 4) + i;
                        } else {
                            pageNum = servicesPage - (isMobile ? 1 : 2) + i;
                        }

                        if (pageNum < 1 || pageNum > servicesTotalPages) return null;
                        if (!isMobile && servicesPage > 3 && pageNum === 1) return null;
                        if (!isMobile && servicesPage < servicesTotalPages - 2 && pageNum === servicesTotalPages) return null;

                        const isCurrentPage = servicesPage === pageNum;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handleServicesPageChange(pageNum)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: isCurrentPage ? '#72b01d' : '#ffffff',
                                    color: isCurrentPage ? '#ffffff' : '#374151',
                                    border: `1px solid ${isCurrentPage ? '#72b01d' : '#e2e8f0'}`
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.borderColor = '#72b01d';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#374151';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    {/* Last page */}
                    {servicesPage < servicesTotalPages - 2 && !isMobile && (
                        <>
                            {servicesPage < servicesTotalPages - 3 && (
                                <span className="px-2" style={{ color: '#94a3b8' }}>...</span>
                            )}
                            <button
                                onClick={() => handleServicesPageChange(servicesTotalPages)}
                                className={`${isMobile ? 'w-9 h-9 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition-all duration-200 hover:shadow-sm`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    border: '1px solid #e2e8f0'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = '#72b01d';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                {servicesTotalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Next button */}
                <button
                    onClick={() => servicesPage < servicesTotalPages && handleServicesPageChange(servicesPage + 1)}
                    disabled={servicesPage === servicesTotalPages}
                    className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm`}
                    style={{
                        backgroundColor: servicesPage === servicesTotalPages ? '#f1f5f9' : '#ffffff',
                        color: servicesPage === servicesTotalPages ? '#94a3b8' : '#374151',
                        border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={(e) => {
                        if (servicesPage !== servicesTotalPages) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#72b01d';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (servicesPage !== servicesTotalPages) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#374151';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }
                    }}
                    aria-label="Next page"
                >
                    {isMobile ? '→' : 'Next →'}
                </button>
            </div>
        );
    }

    // 9. Render shop page
    return (
        <>
            <SEOHead
                title={seoData.title}
                description={seoData.description}
                keywords={seoData.keywords}
                canonicalUrl={getCanonicalUrl(`/shop/${username}`)}
                ogImage={shop.cover || shop.logo || '/default-shop.jpg'}
                structuredData={seoData.structuredData}
            />
            <ResponsiveHeader />
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                {/* Minimal Shop Header */}
                <div className={`${isMobile ? 'pt-6 pb-8' : 'pt-10 pb-12'} border-b`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.1)' }}>
                    <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-6'}`}>
                        <div className={`flex ${isMobile ? 'flex-col items-center text-center shop-header-mobile' : 'items-start gap-6'}`}>
                            {/* Shop Logo */}
                            <div className={`${isMobile ? 'mb-4' : 'flex-shrink-0'} ${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-2xl shadow-sm border-2 flex items-center justify-center`} style={{ borderColor: 'rgba(114, 176, 29, 0.2)', backgroundColor: '#ffffff' }}>
                                {shop.logo ? (
                                    <img src={shop.logo} alt="Shop Logo" className="object-cover w-full h-full rounded-2xl" />
                                ) : (
                                    <FiBox className={`${isMobile ? 'text-2xl' : 'text-3xl'}`} style={{ color: '#72b01d' }} />
                                )}
                            </div>

                            {/* Shop Info */}
                            <div className={`flex-1 ${isMobile ? 'text-center' : 'text-left'}`}>
                                {/* Shop Name */}
                                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-2`} style={{ color: '#0d0a0b' }}>
                                    {shop.name}
                                </h1>

                                {/* Owner Name */}
                                <div className={`mb-3 ${isMobile ? 'shop-owner-name-mobile' : ''}`}>
                                    <ShopOwnerName ownerId={shop.owner} username={shop.username} />
                                </div>

                                {/* Shop Rating */}
                                {shopRating !== null && shopRatingCount > 0 && (
                                    <div className={`flex items-center ${isMobile ? 'justify-center shop-rating-mobile' : 'justify-start'} gap-3 mb-4`}>
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-semibold" style={{ color: '#0d0a0b' }}>
                                                {shopRating.toFixed(1)}
                                            </span>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <svg
                                                        key={i}
                                                        className="h-4 w-4"
                                                        style={{ color: shopRating && shopRating >= i - 0.25 ? "#fbbf24" : "#e5e7eb" }}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            className="text-sm font-medium hover:underline focus:outline-none transition-colors"
                                            style={{ color: '#72b01d' }}
                                            onClick={() => {
                                                const el = document.getElementById('shop-reviews-section');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            type="button"
                                        >
                                            {shopRatingCount} {shopRatingCount === 1 ? "review" : "reviews"}
                                        </button>
                                    </div>
                                )}

                                {/* Shop Description */}
                                {shop.description && (
                                    <p className={`${isMobile ? 'text-sm' : 'text-base'} leading-relaxed mb-4 max-w-2xl`} style={{ color: '#6b7280' }}>
                                        {shop.description}
                                    </p>
                                )}

                                {/* Contact Button */}
                                <div className={`${isMobile ? 'shop-contact-mobile' : ''}`}>
                                    <ContactSellerButton
                                        sellerId={shop.owner}
                                        sellerName={shop.name}
                                        context={{
                                            type: 'shop',
                                            id: shop.username,
                                            title: shop.name
                                        }}
                                        buttonText="Contact Shop"
                                        buttonStyle="primary"
                                        size="md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conditional Content Display */}
                {(() => {
                    const isOwner = user && shop && user.uid === shop.owner;
                    const hasListings = listings.length > 0;
                    const hasServices = services.length > 0;
                    const hasAnyContent = hasListings || hasServices;

                    // If no content exists
                    if (!hasAnyContent) {
                        return (
                            <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-12' : 'px-6 py-16'}`}>
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center ${isMobile ? 'w-16 h-16 mb-6' : 'w-20 h-20 mb-8'} rounded-2xl`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                        <FiBox className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} style={{ color: '#72b01d' }} />
                                    </div>
                                    {isOwner ? (
                                        <>
                                            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-3`} style={{ color: '#0d0a0b' }}>
                                                Welcome to your shop!
                                            </h2>
                                            <p className={`${isMobile ? 'text-sm' : 'text-base'} mb-8 max-w-md mx-auto`} style={{ color: '#6b7280' }}>
                                                Start by adding your first product or service to showcase what you offer.
                                            </p>
                                            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row gap-4'} justify-center items-center`}>
                                                <Link
                                                    to="/add-listing"
                                                    className={`inline-flex items-center gap-2 ${isMobile ? 'px-6 py-3 text-sm w-full max-w-xs justify-center' : 'px-8 py-3'} rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md`}
                                                    style={{
                                                        backgroundColor: '#72b01d',
                                                        color: '#ffffff'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#5a8f17';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <FiPlus className="w-4 h-4" />
                                                    Add Product
                                                </Link>
                                                <Link
                                                    to="/add-service"
                                                    className={`inline-flex items-center gap-2 ${isMobile ? 'px-6 py-3 text-sm w-full max-w-xs justify-center' : 'px-8 py-3'} rounded-xl font-medium transition-all duration-200 border-2 hover:shadow-md`}
                                                    style={{
                                                        backgroundColor: '#ffffff',
                                                        color: '#72b01d',
                                                        borderColor: '#72b01d'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                                        e.currentTarget.style.color = '#ffffff';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                                        e.currentTarget.style.color = '#72b01d';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <FiTool className="w-4 h-4" />
                                                    Add Service
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-3`} style={{ color: '#0d0a0b' }}>
                                                Nothing here yet
                                            </h2>
                                            <p className={`${isMobile ? 'text-sm' : 'text-base'} max-w-md mx-auto`} style={{ color: '#6b7280' }}>
                                                This shop hasn't added any products or services yet. Check back later!
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Render sections based on what content exists
                    return (
                        <>
                            {/* Listings Section - Only show if has listings OR (is owner and has no services) */}
                            {(hasListings || (isOwner && !hasServices)) && (
                                <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'}`}>
                                    <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} ${isMobile ? 'mb-6' : 'mb-8'}`}>
                                        <div>
                                            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`} style={{ color: '#0d0a0b' }}>
                                                Products
                                            </h2>
                                            <p className={`${isMobile ? 'text-sm' : 'text-base'} mt-1`} style={{ color: '#6b7280' }}>
                                                {totalCount} {totalCount === 1 ? 'product' : 'products'} available
                                            </p>
                                        </div>
                                        {isOwner && (
                                            <Link
                                                to="/add-listing"
                                                className={`inline-flex items-center gap-2 ${isMobile ? 'px-5 py-2.5 text-sm w-full justify-center' : 'px-6 py-3'} rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md`}
                                                style={{
                                                    backgroundColor: '#72b01d',
                                                    color: '#ffffff'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#5a8f17';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <FiPlus className="w-4 h-4" />
                                                Add Product
                                            </Link>
                                        )}
                                    </div>
                                    {listings.length === 0 ? (
                                        <div className={`${isMobile ? 'py-12' : 'py-16'} text-center`}>
                                            <div className={`inline-flex items-center justify-center ${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'} rounded-2xl`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                                <FiBox className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} style={{ color: '#72b01d' }} />
                                            </div>
                                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium mb-2`} style={{ color: '#0d0a0b' }}>
                                                No products yet
                                            </h3>
                                            {isOwner && (
                                                <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#6b7280' }}>
                                                    Create your first product to start selling!
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <WithReviewStats listings={listings}>
                                            {(listingsWithStats) => (
                                                <>
                                                    {isMobile ? (
                                                        <div className="w-full overflow-x-auto pb-2">
                                                            <div className="flex gap-4 min-w-max">
                                                                {listingsWithStats.map((item) => (
                                                                    <div key={item.id} className="w-48 flex-shrink-0">
                                                                        <ResponsiveListingTile 
                                                                            listing={item}
                                                                            onRefresh={refreshListings}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                            {listingsWithStats.map((item) => (
                                                                <ResponsiveListingTile 
                                                                    key={item.id}
                                                                    listing={item}
                                                                    onRefresh={refreshListings}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <Pagination />
                                                </>
                                            )}
                                        </WithReviewStats>
                                    )}
                                </div>
                            )}

                            {/* Services Section - Only show if has services OR (is owner and has no listings) */}
                            {(hasServices || (isOwner && !hasListings)) && (
                                <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'} ${hasListings ? 'border-t pt-12' : ''}`} style={hasListings ? { borderColor: 'rgba(114, 176, 29, 0.1)' } : {}}>
                                    <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} ${isMobile ? 'mb-6' : 'mb-8'}`}>
                                        <div>
                                            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`} style={{ color: '#0d0a0b' }}>
                                                Services
                                            </h2>
                                            <p className={`${isMobile ? 'text-sm' : 'text-base'} mt-1`} style={{ color: '#6b7280' }}>
                                                {servicesTotalCount} {servicesTotalCount === 1 ? 'service' : 'services'} available
                                            </p>
                                        </div>
                                        {isOwner && (
                                            <Link
                                                to="/add-service"
                                                className={`inline-flex items-center gap-2 ${isMobile ? 'px-5 py-2.5 text-sm w-full justify-center' : 'px-6 py-3'} rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md`}
                                                style={{
                                                    backgroundColor: '#72b01d',
                                                    color: '#ffffff'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#5a8f17';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <FiPlus className="w-4 h-4" />
                                                Add Service
                                            </Link>
                                        )}
                                    </div>
                                    {servicesLoading ? (
                                        <div className={`${isMobile ? 'py-12' : 'py-16'} text-center`}>
                                            <LoadingSpinner size="md" />
                                        </div>
                                    ) : services.length === 0 ? (
                                        <div className={`${isMobile ? 'py-12' : 'py-16'} text-center`}>
                                            <div className={`inline-flex items-center justify-center ${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'} rounded-2xl`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                                                <FiTool className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} style={{ color: '#72b01d' }} />
                                            </div>
                                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium mb-2`} style={{ color: '#0d0a0b' }}>
                                                No services yet
                                            </h3>
                                            {isOwner && (
                                                <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#6b7280' }}>
                                                    Create your first service to showcase your expertise!
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveServiceTiles 
                                                services={services} 
                                                onRefresh={refreshServices}
                                                isLoading={servicesLoading}
                                            />
                                            <ServicesPagination />
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>

            {/* Shop Reviews Section */}
            <div className="w-full border-t" id="shop-reviews-section" style={{ backgroundColor: '#f8f9fa', borderColor: 'rgba(114, 176, 29, 0.1)' }}>
                {shop.id && (
                    <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'}`}>
                        <ShopReviews shopId={shop.id} />
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
