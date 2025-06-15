import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs, limit, startAfter, QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { FiBox } from "react-icons/fi";
import ShopOwnerName from "./ShopOwnerName";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import ContactSellerButton from "../../components/UI/ContactSellerButton";
import ShopReviews from "../../components/UI/ShopReviews";
import ResponsiveListingTile from "../../components/UI/ResponsiveListingTile";
import WithReviewStats from "../../components/HOC/WithReviewStats";
import { LoadingSpinner } from "../../components/UI";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getUserIP } from "../../utils/ipUtils";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { useResponsive } from "../../hooks/useResponsive";
import type { DeliveryType as DeliveryTypeType } from "../../types/enums";

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
        console.log("ShopPage: Shop loaded with ID:", shop.id);
        async function getTotalCount() {
            // FIXED: Use getCountFromServer for efficient counting (if available)
            // Or use aggregation count query instead of fetching all documents
            try {
                // Use getCountFromServer if available (Firebase v9.8+)
                const { getCountFromServer } = await import('firebase/firestore');
                const countQuery = query(collection(db, "listings"), where("shopId", "==", shop?.id));
                const snapshot = await getCountFromServer(countQuery);
                setTotalCount(snapshot.data().count);
            } catch (error) {
                // Fallback to regular query with limit for older Firebase versions
                console.log("Using fallback count method");
                const countQuery = query(
                    collection(db, "listings"), 
                    where("shopId", "==", shop?.id),
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
                const reviewsQuery = query(
                    collection(db, "reviews"),
                    where("shopId", "==", shop!.id) // We know shop is not null here due to the check above
                );
                const reviewsSnap = await getDocs(reviewsQuery);
                const reviews = reviewsSnap.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                })) as any[];
                
                // Calculate average rating and count
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
                    const averageRating = totalRating / reviews.length;
                    setShopRating(Math.round(averageRating * 100) / 100); // Round to 2 decimal places
                    setShopRatingCount(reviews.length);
                } else {
                    setShopRating(null);
                    setShopRatingCount(0);
                }
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
                    limit(PAGE_SIZE)
                );
            } else {
                const cursor = cursors[currentPage - 2]; // previous page's last doc
                if (!cursor) return;
                q = query(
                    collection(db, "listings"),
                    where("shopId", "==", shop.id),
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
        const description = shop.description || `Discover authentic Sri Lankan products from ${shopName}`;
        const rating = shopRating || 0;
        const ratingCount = shopRatingCount || 0;
        
        return {
            title: `${shopName} - Authentic Sri Lankan Products & Crafts`,
            description: description.length > 160 ? description.substring(0, 157) + '...' : description,
            keywords: generateKeywords([
                shopName,
                'Sri Lankan shop',
                'authentic products',
                'local artisan',
                'handmade crafts'
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
            <div className={`mt-12 flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {/* Previous button */}
                <button
                    onClick={() => page > 1 && handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`${isMobile ? 'px-2 py-1.5 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                        backgroundColor: '#ffffff',
                        color: '#454955',
                        border: '1px solid rgba(114, 176, 29, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        if (page !== 1) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (page !== 1) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#454955';
                        }
                    }}
                    aria-label="Previous page"
                >
                    {isMobile ? '←' : '← Previous'}
                </button>

                {/* Page numbers */}
                <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
                    {/* First page */}
                    {page > 3 && !isMobile && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className={`${isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#454955',
                                    border: '1px solid rgba(114, 176, 29, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#454955';
                                }}
                            >
                                1
                            </button>
                            {page > 4 && (
                                <span className="px-2" style={{ color: '#454955' }}>...</span>
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
                                className={`${isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition`}
                                style={{
                                    backgroundColor: isCurrentPage ? '#72b01d' : '#ffffff',
                                    color: isCurrentPage ? '#ffffff' : '#454955',
                                    border: `1px solid ${isCurrentPage ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'}`
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                        e.currentTarget.style.color = '#ffffff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrentPage) {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#454955';
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
                                <span className="px-2" style={{ color: '#454955' }}>...</span>
                            )}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`${isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-lg font-medium transition`}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#454955',
                                    border: '1px solid rgba(114, 176, 29, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#72b01d';
                                    e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#454955';
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
                    className={`${isMobile ? 'px-2 py-1.5 text-sm' : 'px-4 py-2'} rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                        backgroundColor: '#ffffff',
                        color: '#454955',
                        border: '1px solid rgba(114, 176, 29, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        if (page !== totalPages) {
                            e.currentTarget.style.backgroundColor = '#72b01d';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (page !== totalPages) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#454955';
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
            <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
                {/* Cover + Logo */}
                <div className={`relative w-full ${isMobile ? 'h-32' : 'h-44 md:h-60'} flex items-center justify-center`} style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                    {shop.cover ? (
                        <img src={shop.cover} alt="Shop Cover" className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                            <FiBox className={`${isMobile ? 'text-3xl' : 'text-5xl'}`} style={{ color: '#72b01d' }} />
                        </div>
                    )}
                    <div className={`absolute left-1/2 ${isMobile ? 'bottom-[-32px]' : 'bottom-[-48px]'} -translate-x-1/2 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-full border-4 shadow-md flex items-center justify-center`} style={{ borderColor: 'rgba(114, 176, 29, 0.6)', backgroundColor: '#ffffff' }}>
                        {shop.logo ? (
                            <img src={shop.logo} alt="Shop Logo" className="object-cover w-full h-full rounded-full" />
                        ) : (
                            <FiBox className={`${isMobile ? 'text-lg' : 'text-3xl'}`} style={{ color: '#72b01d' }} />
                        )}
                    </div>
                </div>

                {/* Main Info */}
                <div className={`w-full flex flex-col items-center ${isMobile ? 'mt-10 px-4' : 'mt-16 px-4'}`}>
                    <div className="max-w-3xl w-full flex flex-col items-center text-center">
                        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-black mb-1`} style={{ color: '#0d0a0b' }}>{shop.name}</h1>
                        <ShopOwnerName ownerId={shop.owner} username={shop.username} />
                        {/* Shop Rating from Reviews Collection */}
                        {shopRating !== null && shopRatingCount > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-extrabold`} style={{ color: '#0d0a0b' }}>{shopRating.toFixed(1)}</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg
                                            key={i}
                                            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${shopRating && shopRating >= i - 0.25 ? "text-yellow-400" : ""}`}
                                            style={{ color: shopRating && shopRating >= i - 0.25 ? "#fbbf24" : "#454955" }}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                </div>
                                <button
                                    className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ml-2 underline focus:outline-none transition`}
                                    style={{ color: '#454955' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#72b01d';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#454955';
                                    }}
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
                    </div>
                    <div className="max-w-3xl w-full mb-10 flex flex-col items-center">
                        <div className={`${isMobile ? 'text-sm' : 'text-base md:text-lg'} whitespace-pre-line min-h-[64px] rounded-xl ${isMobile ? 'p-4' : 'p-6'} text-center`} style={{ color: '#454955' }}>
                            {shop.description}
                        </div>
                        
                        {/* Contact Seller Button */}
                        <div className="mt-4">
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

                {/* Listings */}
                <section className={`w-full ${isMobile ? 'py-4' : 'py-8'} border-t`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    <div className={`w-full ${isMobile ? 'px-4' : 'px-2 sm:px-6'}`}>
                        <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-between ${isMobile ? 'mb-4' : 'mb-8'} gap-4`}>
                            <h2 className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} font-bold uppercase tracking-wide`} style={{ color: '#0d0a0b' }}>
                                Shop Listings
                            </h2>
                            {user && shop && user.uid === shop.owner && (
                                <a
                                    href="/add-listing"
                                    className={`inline-block ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'} rounded-full font-semibold uppercase tracking-wide transition`}
                                    style={{
                                        backgroundColor: '#72b01d',
                                        color: '#ffffff'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3f7d20';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#72b01d';
                                    }}
                                >
                                    + Create New Listing
                                </a>
                            )}
                        </div>
                        {listings.length === 0 ? (
                            <div className={`${isMobile ? 'py-6' : 'py-8'} text-center`} style={{ color: '#454955', opacity: 0.7 }}>No products yet.</div>
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
                                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
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
                </section>
            </div>

            {/* Shop Reviews Section */}
            <div className="w-full" id="shop-reviews-section" style={{ backgroundColor: '#ffffff' }}>
                {shop.id && (
                    <div className={`${isMobile ? 'mt-6 pt-6 px-4' : 'mt-12 pt-10 px-0'} border-t`} style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                        <ShopReviews shopId={shop.id} />
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
