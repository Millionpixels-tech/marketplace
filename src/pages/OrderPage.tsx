import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import Header from "../components/UI/Header";

export default function OrderPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState("");
    const [rating, setRating] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            const docRef = doc(db, "orders", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setOrder({ ...docSnap.data(), id: docSnap.id });
            }
            setLoading(false);
        };
        fetchOrder();
    }, [id]);

    const markAsReceived = async () => {
        if (!order) return;
        setSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { status: "RECEIVED" });
        setOrder({ ...order, status: "RECEIVED" });
        setSubmitting(false);
    };

    // --- Update shop rating and rating count when a new review is added ---
    async function updateShopRating(shopId: string, newRating: number) {
        const shopRef = doc(db, "shops", shopId);
        const snap = await getDoc(shopRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentCount = typeof data.ratingCount === "number" ? data.ratingCount : 0;
        const currentAvg = typeof data.rating === "number" ? data.rating : 0;
        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + newRating) / newCount;
        await updateDoc(shopRef, {
            ratingCount: newCount,
            rating: Math.round(newAvg * 100) / 100,
        });
    }

    const submitReview = async () => {
        if (!order || !review.trim() || !rating) return;
        setSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { review, rating });
        setOrder({ ...order, review, rating });
        setReview("");
        setRating(0);

        // Update shop rating
        if (order.sellerShopId) {
            await updateShopRating(order.sellerShopId, rating);
        }

        // --- Add review to the listing's reviews array ---
        if (order.itemId) {
            const listingRef = doc(db, "listings", order.itemId);
            // Compose review object
            const reviewObj = {
                review,
                rating,
                buyerEmail: order.buyerEmail || null,
                reviewedAt: new Date(),
                itemName: order.itemName || null,
                itemImage: order.itemImage || null,
                price: order.price || null,
                quantity: order.quantity || null,
            };
            // Use arrayUnion to add to reviews array
            const { arrayUnion } = await import("firebase/firestore");
            await updateDoc(listingRef, {
                reviews: arrayUnion(reviewObj),
            });
        }

        setSubmitting(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
    if (!order) return <div className="flex items-center justify-center min-h-screen text-gray-400">Order not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen w-full">
            <Header />
            <main className="w-full max-w-xl mx-auto mt-8 px-2 md:px-0">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 flex flex-col gap-6">
                    <h1 className="text-2xl font-black mb-2 text-gray-900">Order Summary</h1>
                    <div className="flex flex-col gap-2 text-gray-700">
                        <div className="flex items-center gap-3">
                            <img src={order.itemImage} alt="item" className="w-20 h-20 object-cover rounded-xl border" />
                            <div>
                                <div className="font-bold text-lg">{order.itemName}</div>
                                <div className="text-sm text-gray-500">Order ID: {order.id}</div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span>Price:</span>
                            <span>LKR {order.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{order.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>LKR {order.shipping.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                            <span>Total:</span>
                            <span>LKR {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Order Status Steps */}
                    <div className="flex flex-col gap-2 mt-4 w-full">
                        <span className="text-sm font-semibold mb-2">Order Status:</span>
                        <div className="relative flex items-center w-full justify-between px-1 md:px-4">
                            {['PENDING', 'SHIPPED', 'RECEIVED'].map((step, idx, arr) => {
                                const statusOrder = ['PENDING', 'SHIPPED', 'RECEIVED'];
                                const currentIdx = statusOrder.indexOf(order.status || 'PENDING');
                                const isActive = idx <= currentIdx;
                                const isCompleted = idx < currentIdx;

                                return (
                                    <div key={step} className="flex-1 flex flex-col items-center relative min-w-0">
                                        {/* Step Circle */}
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-200 z-10
              ${isActive
                                                    ? "bg-black text-white border-black shadow-md"
                                                    : "bg-gray-100 text-gray-400 border-gray-300"}`}
                                        >
                                            {idx + 1}
                                        </div>
                                        {/* Step Label */}
                                        <span
                                            className={`mt-2 text-xs md:text-sm font-semibold text-center break-words transition-colors
              ${isActive ? "text-black" : "text-gray-400"}`}
                                            style={{ minWidth: 72 }}
                                        >
                                            {step.charAt(0) + step.slice(1).toLowerCase()}
                                        </span>
                                        {/* Connector Line */}
                                        {idx < arr.length - 1 && (
                                            <div
                                                className={`absolute top-1/2 left-1/2 h-1 transition-all duration-200 z-0
                ${isCompleted ? "bg-black" : "bg-gray-200"}`}
                                                style={{
                                                    width: "100%",
                                                    transform: "translateY(-50%)",
                                                    left: "50%",
                                                    right: "-50%",
                                                    zIndex: 0,
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {order.status === "CANCELLED" ? (
                        <div className="mt-4 w-full py-3 bg-red-100 text-red-700 rounded-xl font-bold text-lg text-center uppercase tracking-wide shadow">
                            This order has been cancelled.
                        </div>
                    ) : order.status !== "RECEIVED" && (
                        <button
                            className="mt-2 w-full py-3 bg-black text-white rounded-xl font-bold text-lg uppercase tracking-wide shadow hover:bg-black/90 transition"
                            onClick={markAsReceived}
                            disabled={submitting}
                        >
                            Mark as Received
                        </button>
                    )}
                    <div className="mt-6">
                        <h2 className="font-bold mb-2">Your Review</h2>
                        {order.status === "CANCELLED" ? (
                            <div className="bg-gray-100 rounded-xl p-4 text-gray-500 text-center font-semibold">You cannot leave a review for a cancelled order.</div>
                        ) : order.review ? (
                            <div className="bg-gray-100 rounded-xl p-4 text-gray-700">
                                <div className="flex items-center mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg key={i} className={`h-5 w-5 ${order.rating >= i ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                                    ))}
                                </div>
                                <div>{order.review}</div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <button
                                            key={i}
                                            type="button"
                                            className="focus:outline-none"
                                            onClick={() => setRating(i)}
                                            disabled={submitting}
                                        >
                                            <svg className={`h-7 w-7 ${rating >= i ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="w-full border border-gray-300 rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                                    rows={3}
                                    placeholder="Write a review..."
                                    value={review}
                                    onChange={e => setReview(e.target.value)}
                                    disabled={submitting}
                                />
                                <button
                                    className="w-max px-6 py-2 bg-black text-white rounded-xl font-bold text-base shadow hover:bg-black/90 transition"
                                    onClick={submitReview}
                                    disabled={submitting || !review.trim() || !rating}
                                >
                                    Submit Review
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
