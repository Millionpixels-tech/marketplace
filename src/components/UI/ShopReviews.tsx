import { useEffect, useState } from "react";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type Review = {
    id: string;
    review: string;
    rating: number;
    buyerEmail?: string;
    reviewedAt?: { seconds: number; nanoseconds: number };
    createdAt?: { seconds: number; nanoseconds: number };
    itemName?: string;
    itemImage?: string;
    price?: number;
    quantity?: number;
};

const REVIEWS_PER_PAGE = 8;

export default function ShopReviews({ shopId }: { shopId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        async function fetchReviews() {
            setLoading(true);
            let q = query(
                collection(db, "orders"),
                where("sellerShopId", "==", shopId),
                where("review", ">", "")
            );

            const snap = await getDocs(q);
            setReviews(
                snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Review[]
            );
            setLoading(false);
        }
        if (shopId) fetchReviews();
    }, [shopId]);

    // Pagination logic
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
    const pageReviews = reviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

    if (loading)
        return (
            <div className="w-full py-16">
                <div className="max-w-5xl mx-auto px-2">
                    <div className="text-base text-left" style={{ color: '#454955', opacity: 0.7 }}>Loading reviews...</div>
                </div>
            </div>
        );

    if (reviews.length === 0)
        return (
            <div className="w-full">
                <div className="max-w-5xl mx-auto px-2">
                    <div className="text-base text-left" style={{ color: '#454955', opacity: 0.7 }}>No reviews yet.</div>
                </div>
            </div>
        );

    return (
        <section className="w-full py-2" style={{ backgroundColor: '#ffffff' }}>
            <div className="mx-auto px-2 md:px-6">
                <h3 className="text-2xl md:text-3xl font-black mb-8 text-left" style={{ color: '#0d0a0b' }}>Shop Reviews ({reviews.length})</h3>
                <div className="flex flex-col gap-6">
                    {pageReviews.map(r => (
                        <div
                            key={r.id}
                            className="rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start gap-6 border"
                            style={{
                                backgroundColor: '#ffffff',
                                borderColor: 'rgba(114, 176, 29, 0.3)'
                            }}
                        >
                            {/* Item details */}
                            <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border flex items-center justify-center" style={{ borderColor: 'rgba(114, 176, 29, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                                {r.itemImage ? (
                                    <img src={r.itemImage} alt={r.itemName} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#454955' }}>No Image</div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="font-bold text-base mb-1" style={{ color: '#0d0a0b' }}>{r.itemName || "Item"}</div>
                                <div className="flex items-center gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg
                                            key={i}
                                            className={`h-5 w-5`}
                                            style={{ color: r.rating >= i ? "#fbbf24" : "#454955" }}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                </div>
                                <div className="font-medium mb-2 text-base" style={{ color: '#454955' }}>{r.review}</div>
                                {r.createdAt && (
                                    <div className="text-xs mt-1" style={{ color: '#454955', opacity: 0.7 }}>
                                        Order date: {new Date(r.createdAt.seconds * 1000).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Pagination - centered with Prev/Next */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 select-none w-full">
                        <button
                            className="px-4 py-2 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                            Prev
                        </button>
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const isCurrentPage = page === i + 1;
                            return (
                                <button
                                    key={i + 1}
                                    className="px-4 py-2 rounded-xl border text-sm font-bold transition-all"
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
                            Next
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
