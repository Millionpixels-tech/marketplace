import { useEffect, useState } from "react";
import { getShopReviews } from "../../utils/serviceReviews";
import { useResponsive } from "../../hooks/useResponsive";

type Review = {
    id: string;
    review?: string;
    comment?: string; // Service reviews use 'comment' instead of 'review'
    rating: number;
    buyerEmail?: string;
    reviewedAt?: { seconds: number; nanoseconds: number };
    createdAt?: { seconds: number; nanoseconds: number };
    itemName?: string;
    serviceTitle?: string; // Service reviews have serviceTitle
    itemImage?: string;
    price?: number;
    quantity?: number;
    itemId?: string;
    shopId?: string;
    type?: 'product' | 'service'; // To distinguish between product and service reviews
};

const REVIEWS_PER_PAGE = 8;

export default function ShopReviews({ shopId }: { shopId: string }) {
    const { isMobile } = useResponsive();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        async function fetchReviews() {
            if (!shopId) {
                return;
            }
            setLoading(true);
            try {
                // Use the new combined shop reviews function
                const allReviews = await getShopReviews(shopId);
                setReviews(allReviews as Review[]);
            } catch (error) {
                console.error("Error fetching reviews:", error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, [shopId]);

    // Pagination logic
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
    const pageReviews = reviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

    if (loading)
        return (
            <div className={`w-full ${isMobile ? 'py-8' : 'py-16'}`}>
                <div className={`max-w-5xl mx-auto ${isMobile ? 'px-4' : 'px-2'}`}>
                    <div className={`${isMobile ? 'text-sm' : 'text-base'} text-left`} style={{ color: '#454955', opacity: 0.7 }}>Loading reviews...</div>
                </div>
            </div>
        );

    if (reviews.length === 0)
        return (
            <div className="w-full">
                <div className={`max-w-5xl mx-auto ${isMobile ? 'px-4' : 'px-2'}`}>
                    <div className={`${isMobile ? 'text-sm' : 'text-base'} text-left`} style={{ color: '#454955', opacity: 0.7 }}>
                        No reviews yet.
                    </div>
                </div>
            </div>
        );

    return (
        <section className={`w-full ${isMobile ? 'py-1' : 'py-2'}`} style={{ backgroundColor: '#ffffff' }}>
            <div className={`mx-auto ${isMobile ? 'px-4' : 'px-2 md:px-6'}`}>
                <h3 className={`${isMobile ? 'text-lg' : 'text-2xl md:text-3xl'} font-black ${isMobile ? 'mb-4' : 'mb-8'} text-left`} style={{ color: '#0d0a0b' }}>Shop Reviews ({reviews.length})</h3>
                <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
                    {pageReviews.map(r => (
                        <div
                            key={r.id}
                            className={`rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-sm flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} items-start ${isMobile ? 'gap-3' : 'gap-6'} border`}
                            style={{
                                backgroundColor: '#ffffff',
                                borderColor: 'rgba(114, 176, 29, 0.3)'
                            }}
                        >
                            {/* Item details */}
                            <div className={`flex-shrink-0 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-xl overflow-hidden border flex items-center justify-center`} style={{ borderColor: 'rgba(114, 176, 29, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                                {r.itemImage ? (
                                    <img src={r.itemImage} alt={r.itemName || r.serviceTitle} className="object-cover w-full h-full" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${isMobile ? 'text-xs' : ''}`} style={{ color: '#454955' }}>
                                        {r.type === 'service' ? '🔧' : 'No Image'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className={`font-bold ${isMobile ? 'text-sm' : 'text-base'} mb-1`} style={{ color: '#0d0a0b' }}>
                                    {r.itemName || r.serviceTitle || "Item"}
                                    {r.type === 'service' && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Service</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg
                                            key={i}
                                            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`}
                                            style={{ color: r.rating >= i ? "#fbbf24" : "#454955" }}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                </div>
                                <div className={`font-medium mb-2 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                                    {r.review || r.comment}
                                </div>
                                {(r.reviewedAt || r.createdAt) && (
                                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1`} style={{ color: '#454955', opacity: 0.7 }}>
                                        Reviewed on: {new Date((r.reviewedAt?.seconds || r.createdAt?.seconds || 0) * 1000).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Pagination - centered with Prev/Next */}
                {totalPages > 1 && (
                    <div className={`flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2'} ${isMobile ? 'mt-4' : 'mt-8'} select-none w-full`}>
                        <button
                            className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} rounded-xl border font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{
                                backgroundColor: page === 1 ? '#ffffff' : '#ffffff',
                                color: page === 1 ? '#454955' : '#454955',
                                borderColor: 'rgba(114, 176, 29, 0.3)'
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
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            {isMobile ? '←' : 'Prev'}
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const isCurrentPage = page === i + 1;
                            return (
                                <button
                                    key={i + 1}
                                    className={`${isMobile ? 'w-8 h-8 text-xs' : 'px-4 py-2 text-sm'} rounded-xl border font-bold transition-all`}
                                    style={{
                                        backgroundColor: isCurrentPage ? '#72b01d' : '#ffffff',
                                        color: isCurrentPage ? '#ffffff' : '#454955',
                                        borderColor: isCurrentPage ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
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
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                        <button
                            className="px-4 py-2 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: page === totalPages ? '#ffffff' : '#ffffff',
                                color: page === totalPages ? '#454955' : '#454955',
                                borderColor: 'rgba(114, 176, 29, 0.3)'
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
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            {isMobile ? '→' : 'Next'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
