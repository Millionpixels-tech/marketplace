import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import Header from "../components/UI/Header";
import { useAuth } from "../context/AuthContext";

export default function OrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Assumes user?.email
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState("");
    const [rating, setRating] = useState<number>(0);
    const [refundSubmitting, setRefundSubmitting] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Role determination
    const [isBuyer, setIsBuyer] = useState(false);
    const [isSeller, setIsSeller] = useState(false);

    // Fetch order and determine role
    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            const docRef = doc(db, "orders", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const orderData: any = { ...docSnap.data(), id: docSnap.id };
                setOrder(orderData);

                // Only after setting order and user, check roles
                if (user && user.email) {
                    setIsBuyer(orderData.buyerEmail === user.email);
                    setIsSeller(orderData.sellerEmail === user.email); // Adjust field name as per your db
                }
            }
            setLoading(false);
        };
        fetchOrder();
    }, [id, user]);

    // Redirect logic
    useEffect(() => {
        if (!loading) {
            // Not logged in or not buyer/seller? Redirect!
            if (!user || !user.email || (!isBuyer && !isSeller)) {
                navigate("/search", { replace: true });
            }
        }
    }, [loading, user, isBuyer, isSeller, navigate]);

    const requestRefund = async () => {
        if (!order) return;
        setRefundSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { status: "REFUND_REQUESTED" });
        setOrder({ ...order, status: "REFUND_REQUESTED" });
        setRefundSubmitting(false);
    };

    const markAsReceived = async () => {
        if (!order) return;
        setSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { status: "RECEIVED" });
        setOrder({ ...order, status: "RECEIVED" });
        setSubmitting(false);
    };

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

        // Add review to listing
        if (order.itemId) {
            const listingRef = doc(db, "listings", order.itemId);
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
            const { arrayUnion } = await import("firebase/firestore");
            await updateDoc(listingRef, {
                reviews: arrayUnion(reviewObj),
            });
        }
        setSubmitting(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-[#454955]">Loading...</div>;
    if (!order) return <div className="flex items-center justify-center min-h-screen text-[#454955]">Order not found.</div>;

    // --- PAGE RENDER ---
    return (
        <div className="bg-[#f3eff5] min-h-screen w-full">
            <Header />
            <main className="w-full max-w-xl mx-auto mt-8 px-2 md:px-0">
                <div className="bg-[#f3eff5] rounded-3xl shadow-lg p-6 md:p-10 flex flex-col gap-6">
                    <h1 className="text-2xl font-black mb-2 text-[#0d0a0b]">Order Summary</h1>
                    <div className="flex flex-col gap-2 text-[#454955]">
                        <div className="flex items-center gap-3">
                            <img src={order.itemImage} alt="item" className="w-20 h-20 object-cover rounded-2xl border border-[#45495522] shadow-sm" />
                            <div>
                                <div className="font-bold text-lg text-[#0d0a0b]">{order.itemName}</div>
                                <div className="text-sm text-[#454955]">Order ID: {order.id}</div>
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
                        <div className="flex justify-between font-bold text-lg mt-2 text-[#0d0a0b]">
                            <span>Total:</span>
                            <span>LKR {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Order Status Steps or Refund Requested */}
                    <div className="flex flex-col gap-2 mt-4 w-full">
                        <span className="text-sm font-semibold mb-2 text-[#0d0a0b]">Order Status:</span>
                        {order.status === "REFUND_REQUESTED" ? (
                            <div className="w-full text-center py-3 bg-[#72b01d20] text-[#3f7d20] rounded-2xl font-bold text-base uppercase tracking-wide shadow-sm">
                                Refund Requested
                            </div>
                        ) : (
                            <div className="relative flex items-center w-full justify-between px-1 md:px-4">
                                {['PENDING', 'SHIPPED', 'RECEIVED'].map((step, idx, arr) => {
                                    const statusOrder = ['PENDING', 'SHIPPED', 'RECEIVED'];
                                    let normalizedStatus = (order.status || 'PENDING').toUpperCase();
                                    const currentIdx = statusOrder.indexOf(normalizedStatus);
                                    const isActive = idx <= currentIdx;
                                    const isCompleted = idx < currentIdx;

                                    return (
                                        <div key={step} className="flex-1 flex flex-col items-center relative min-w-0">
                                            {/* Step Circle */}
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-200 z-10
                                                ${isActive
                                                        ? "bg-[#72b01d] text-white border-[#72b01d] shadow-sm"
                                                        : "bg-white text-[#454955] border-[#45495544]"}`}
                                            >
                                                {idx + 1}
                                            </div>
                                            {/* Step Label */}
                                            <span
                                                className={`mt-2 text-xs md:text-sm font-semibold text-center break-words transition-colors
                                                ${isActive ? "text-[#0d0a0b]" : "text-[#45495588]"}`}
                                                style={{ minWidth: 72 }}
                                            >
                                                {step.charAt(0) + step.slice(1).toLowerCase()}
                                            </span>
                                            {/* Connector Line */}
                                            {idx < arr.length - 1 && (
                                                <div
                                                    className={`absolute top-1/2 left-1/2 h-1 transition-all duration-200 z-0
                                                    ${isCompleted ? "bg-[#72b01d]" : "bg-[#45495522]"}`}
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
                        )}
                    </div>
                    {/* Only buyer can interact (refund, review) */}
                    {isBuyer && order.status !== "CANCELLED" && order.status !== "RECEIVED" && order.status !== "REFUND_REQUESTED" && (
                        <>
                            <button
                                className="mt-2 w-full py-3 bg-[#72b01d] text-white rounded-2xl font-bold text-lg uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition"
                                onClick={markAsReceived}
                                disabled={submitting}
                            >
                                Mark as Received
                            </button>
                            <div className="flex justify-center mt-1 w-full">
                                <button
                                    className="text-xs text-[#454955] hover:text-[#3f7d20] transition disabled:opacity-50"
                                    style={{ padding: 0, background: 'none', border: 'none' }}
                                    onClick={requestRefund}
                                    disabled={refundSubmitting}
                                >
                                    Request Refund
                                </button>
                            </div>
                        </>
                    )}
                    <div className="mt-6">
                        <h2 className="font-bold mb-2 text-[#0d0a0b]">Your Review</h2>
                        {order.status === "CANCELLED" ? (
                            <div className="bg-white border border-[#45495522] rounded-2xl p-4 text-[#454955] text-center font-semibold shadow-sm">You cannot leave a review for a cancelled order.</div>
                        ) : order.review ? (
                            <div className="bg-white border border-[#45495522] rounded-2xl p-4 text-[#454955] shadow-sm">
                                <div className="flex items-center mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg key={i} className={`h-5 w-5 ${order.rating >= i ? 'text-[#72b01d]' : 'text-[#45495533]'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                                    ))}
                                </div>
                                <div>{order.review}</div>
                            </div>
                        ) : (
                            // Only buyer can submit review
                            isBuyer && (
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
                                                <svg className={`h-7 w-7 ${rating >= i ? 'text-[#72b01d]' : 'text-[#45495533]'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="w-full border border-[#45495522] rounded-2xl p-3 text-base focus:outline-none focus:ring-1 focus:ring-[#72b01d] focus:border-[#72b01d] text-[#0d0a0b] shadow-sm"
                                        rows={3}
                                        placeholder="Write a review..."
                                        value={review}
                                        onChange={e => setReview(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <button
                                        className="w-max px-6 py-2 bg-[#72b01d] text-white rounded-2xl font-bold text-base shadow-sm hover:bg-[#3f7d20] transition"
                                        onClick={submitReview}
                                        disabled={submitting || !review.trim() || !rating}
                                    >
                                        Submit Review
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
