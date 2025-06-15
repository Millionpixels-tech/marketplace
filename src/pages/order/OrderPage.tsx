import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, query, collection, where, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../utils/firebase";
import Header from "../../components/UI/Header";
import Footer from "../../components/UI/Footer";
import { useAuth } from "../../context/AuthContext";
import { OrderStatus } from "../../types/enums";
import { ConfirmDialog } from "../../components/UI";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { FiChevronDown, FiChevronUp, FiCreditCard } from "react-icons/fi";

interface BankAccount {
    id: string;
    accountNumber: string;
    branch: string;
    bankName: string;
    fullName: string;
    isDefault: boolean;
    createdAt: Date;
}

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
    const [sellerBankAccounts, setSellerBankAccounts] = useState<BankAccount[]>([]);
    const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
    const [uploadingPayment, setUploadingPayment] = useState(false);
    const [isPaymentSectionExpanded, setIsPaymentSectionExpanded] = useState(true); // Expanded by default

    // Role determination
    const [isBuyer, setIsBuyer] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    
    // Custom Order Detection - Simple approach using customOrderId field
    const [customOrderId, setCustomOrderId] = useState<string | null>(null);

    // Custom confirmation dialog hook
    const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();

    // Format currency with proper decimal places
    const formatCurrency = (amount: number) => {
        // Show 2 decimal places if the amount has decimals, otherwise show whole number
        if (amount % 1 === 0) {
            return amount.toLocaleString();
        } else {
            // Format with 2 decimal places, then remove trailing zeros
            const formatted = amount.toFixed(2);
            const withoutTrailingZeros = formatted.replace(/\.?0+$/, '');
            // Add thousand separators
            const parts = withoutTrailingZeros.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
    };

    // Fetch order and determine role
    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            const docRef = doc(db, "orders", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const orderData: any = { ...docSnap.data(), id: docSnap.id };
                setOrder(orderData);

                // Set custom order ID if this order came from a custom order
                if (orderData.customOrderId) {
                    setCustomOrderId(orderData.customOrderId);
                }

                // Only after setting order and user, check roles
                if (user && user.email) {
                    setIsBuyer(orderData.buyerEmail === user.email);
                    setIsSeller(orderData.sellerEmail === user.email); // Adjust field name as per your db
                }

                // Fetch seller's bank account information if this is a bank transfer order
                if (orderData.paymentMethod === 'bankTransfer' && orderData.sellerId) {
                    try {
                        const sellerQuery = query(
                            collection(db, "users"), 
                            where("uid", "==", orderData.sellerId)
                        );
                        const sellerSnap = await getDocs(sellerQuery);
                        
                        if (!sellerSnap.empty) {
                            const sellerData = sellerSnap.docs[0].data();
                            
                            // Get all bank accounts from new format
                            if (sellerData.bankAccounts && Array.isArray(sellerData.bankAccounts)) {
                                setSellerBankAccounts(sellerData.bankAccounts);
                            } 
                            // Fallback to legacy single bank account format
                            else if (sellerData.bankDetails) {
                                const legacyAccount: BankAccount = {
                                    id: 'legacy',
                                    accountNumber: sellerData.bankDetails.accountNumber || '',
                                    branch: sellerData.bankDetails.branch || '',
                                    bankName: sellerData.bankDetails.bankName || '',
                                    fullName: sellerData.bankDetails.fullName || '',
                                    isDefault: true,
                                    createdAt: new Date()
                                };
                                setSellerBankAccounts([legacyAccount]);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching seller bank account:", error);
                    }
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
        
        const confirmed = await showConfirmDialog({
            title: "Request Refund",
            message: "Are you sure you want to request a refund for this order? This will notify the seller and they will review your request.",
            confirmText: "Request Refund",
            cancelText: "Cancel",
            type: "warning"
        });
        if (!confirmed) return;
        
        setRefundSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { status: OrderStatus.REFUND_REQUESTED });
        setOrder({ ...order, status: OrderStatus.REFUND_REQUESTED });
        setRefundSubmitting(false);
    };

    const markAsReceived = async () => {
        if (!order) return;
        
        const confirmed = await showConfirmDialog({
            title: "Mark as Received",
            message: "Are you sure you want to mark this order as received? This will complete the order and finalize the transaction.",
            confirmText: "Mark as Received",
            cancelText: "Cancel",
            type: "info"
        });
        if (!confirmed) return;
        
        setSubmitting(true);
        await updateDoc(doc(db, "orders", order.id), { status: OrderStatus.RECEIVED });
        setOrder({ ...order, status: OrderStatus.RECEIVED });
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
        
        try {
            // Update the order with review and rating
            await updateDoc(doc(db, "orders", order.id), { review, rating });
            setOrder({ ...order, review, rating });

            // Update shop rating
            if (order.sellerShopId) {
                await updateShopRating(order.sellerShopId, rating);
            }

            // Save review to separate reviews collection
            const reviewData = {
                review,
                rating,
                buyerEmail: order.buyerEmail || null,
                buyerId: order.buyerId || null,
                sellerId: order.sellerId || null,
                shopId: order.sellerShopId || null,
                itemId: order.itemId || null,
                orderId: order.id,
                itemName: order.itemName || null,
                itemImage: order.itemImage || null,
                price: order.price || null,
                quantity: order.quantity || null,
                reviewedAt: new Date(),
                createdAt: new Date(),
                role: "buyer", // This review is from a buyer about a seller/item
                reviewedUserId: order.sellerId, // The seller being reviewed
            };

            // Add to reviews collection
            await addDoc(collection(db, "reviews"), reviewData);

            // Add review to listing (keeping existing functionality for backwards compatibility)
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

            setReview("");
            setRating(0);
        } catch (error) {
            console.error("Error submitting review:", error);
            // You might want to show an error message to the user here
        } finally {
            setSubmitting(false);
        }
    };

    // Upload payment slip and mark order as paid
    const uploadPaymentSlip = async (file: File) => {
        if (!order || !user) return;
        setUploadingPayment(true);
        
        try {
            // Upload payment slip to Firebase Storage
            const timestamp = Date.now();
            const fileName = `payment-slips/${order.id}/${timestamp}-${file.name}`;
            const storageRef = ref(storage, fileName);
            
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            // Update order with payment slip URL and change status to PENDING
            await updateDoc(doc(db, "orders", order.id), {
                paymentSlipUrl: downloadURL,
                paymentSlipUploadedAt: new Date(),
                status: OrderStatus.PENDING
            });
            
            // Update local state
            setOrder({
                ...order,
                paymentSlipUrl: downloadURL,
                paymentSlipUploadedAt: new Date(),
                status: OrderStatus.PENDING
            });
            
            // Send notification to seller
            try {
                // Import the email function dynamically to avoid import issues
                const { sendPaymentSlipNotification } = await import('../../utils/emailServiceFrontend');
                const { getSellerEmailById } = await import('../../utils/orders');
                
                const sellerEmail = await getSellerEmailById(order.sellerId);
                if (sellerEmail) {
                    const orderWithId = { ...order, id: order.id };
                    await sendPaymentSlipNotification(orderWithId, sellerEmail);
                    console.log('📧 Payment slip notification sent to seller');
                } else {
                    console.warn('⚠️ Could not find seller email for payment slip notification');
                }
            } catch (emailError) {
                console.error('❌ Error sending payment slip notification:', emailError);
                // Don't fail the upload if email fails
            }
            
            setPaymentSlip(null);
        } catch (error) {
            console.error("Error uploading payment slip:", error);
        } finally {
            setUploadingPayment(false);
        }
    };

    const handlePaymentSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentSlip(file);
        }
    };

    const confirmPaymentSlipUpload = () => {
        if (paymentSlip) {
            uploadPaymentSlip(paymentSlip);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-[#454955]">Loading...</div>;
    if (!order) return <div className="flex items-center justify-center min-h-screen text-[#454955]">Order not found.</div>;

    // --- PAGE RENDER ---
    return (
        <div className="bg-white min-h-screen w-full">
            <Header />
            <main className="w-full max-w-xl mx-auto mt-8 px-2 md:px-0">
                <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 flex flex-col gap-6">
                    <h1 className="text-2xl font-black mb-2 text-[#0d0a0b]">Order Summary</h1>
                    <div className="flex flex-col gap-2 text-[#454955]">
                        <div className="flex items-center gap-3">
                            <img src={order.itemImage} alt="item" className="w-20 h-20 object-cover rounded-2xl border border-[#45495522] shadow-sm" />
                            <div>
                                <div className="font-bold text-lg text-[#0d0a0b]">{order.itemName}</div>
                                {order.variationName && (
                                    <div className="text-sm font-medium text-[#72b01d] mt-1">
                                        Variation: {order.variationName}
                                    </div>
                                )}
                                {order.sellerNotes && (
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="text-sm font-semibold text-yellow-800 mb-1">Seller Notes:</div>
                                        <div className="text-sm text-yellow-700">{order.sellerNotes}</div>
                                    </div>
                                )}
                                <div className="text-sm text-[#454955]">Order ID: {order.id}</div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span>Price:</span>
                            <span>LKR {formatCurrency(order.price)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{order.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>LKR {formatCurrency(order.shipping)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2 text-[#0d0a0b]">
                            <span>Total:</span>
                            <span>LKR {formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                            <span>Payment Method:</span>
                            <span className="font-medium text-[#72b01d]">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                 order.paymentMethod === 'bankTransfer' ? 'Bank Transfer' :
                                 order.paymentMethod === 'paynow' ? 'Online Payment' :
                                 'Unknown'}
                            </span>
                        </div>
                        {order.paymentMethod === 'bankTransfer' && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                {/* Collapsible Header */}
                                <button
                                    onClick={() => setIsPaymentSectionExpanded(!isPaymentSectionExpanded)}
                                    className="w-full flex items-center justify-between text-left focus:outline-none rounded p-1 -m-1"
                                >
                                    <h3 className="text-base font-bold flex items-center gap-2">
                                        <FiCreditCard className="w-4 h-4 text-blue-600" />
                                        Payment Instructions & Upload
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {order.paymentSlipUrl && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                Payment Uploaded
                                            </span>
                                        )}
                                        {isPaymentSectionExpanded ? (
                                            <FiChevronUp className="w-4 h-4 text-blue-600" />
                                        ) : (
                                            <FiChevronDown className="w-4 h-4 text-blue-600" />
                                        )}
                                    </div>
                                </button>

                                {/* Collapsible Content */}
                                {isPaymentSectionExpanded && (
                                    <div className="mt-3 space-y-4">
                                        {/* Bank Transfer Details */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-800 mb-2">
                                                Step 1: Make Bank Transfer
                                            </h4>
                                {sellerBankAccounts.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="text-sm text-blue-700 mb-3">
                                            Please transfer the total amount to one of the seller's bank accounts below. Choose the bank that's most convenient for you:
                                        </div>
                                        
                                        {/* Display all available bank accounts */}
                                        <div className="space-y-3">
                                            {sellerBankAccounts.map((account, index) => (
                                                <div key={account.id} className="bg-white p-4 rounded-lg border border-blue-300">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-900 text-base">
                                                            Option {index + 1}: {account.bankName}
                                                        </h4>
                                                        {account.isDefault && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                Preferred
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Bank Name:</span>
                                                            <div className="text-gray-900 font-medium">{account.bankName}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Account Number:</span>
                                                            <div className="text-gray-900 font-medium font-mono text-lg">{account.accountNumber}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Account Holder:</span>
                                                            <div className="text-gray-900 font-medium">{account.fullName}</div>
                                                        </div>
                                                        {account.branch && (
                                                            <div>
                                                                <span className="font-semibold text-gray-700">Branch:</span>
                                                                <div className="text-gray-900 font-medium">{account.branch}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="text-sm font-semibold text-green-800 mb-1">
                                                Amount to Transfer: <span className="text-lg">LKR {formatCurrency(order.total)}</span>
                                            </div>
                                            <div className="text-xs text-green-700">
                                                Please include your order ID ({order.id}) in the transfer reference.
                                            </div>
                                        </div>
                                        
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                            <div className="text-sm text-yellow-800">
                                                <div className="font-semibold mb-1">💡 Transfer Tips:</div>
                                                <ul className="text-xs space-y-1 ml-4 list-disc">
                                                    <li>Choose the bank account that matches your own bank for faster transfers</li>
                                                    <li>Always include the order ID ({order.id}) as reference</li>
                                                    <li>Contact the seller after making the transfer to confirm payment</li>
                                                    <li>Keep your transfer receipt for your records</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <div>Please contact the seller for bank transfer details.</div>
                                        <div>The seller will provide bank account information via email or phone.</div>
                                        <div className="font-medium mt-2">Total to transfer: LKR {formatCurrency(order.total)}</div>
                                    </div>
                                )}
                                        </div>

                                        {/* Payment Slip Upload - Show only if user is buyer */}
                                        {isBuyer && order.status === OrderStatus.PENDING_PAYMENT && (
                                            <div className="border-t border-blue-200 pt-3">
                                                <h4 className="text-sm font-semibold text-orange-800 mb-2">
                                                    Step 2: Upload Payment Slip
                                                </h4>
                                                
                                                {order.paymentSlipUrl ? (
                                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                                        <div className="text-sm font-bold text-green-800 mb-1">
                                                            Payment Slip Uploaded Successfully!
                                                        </div>
                                                        <div className="text-xs text-green-700 mb-2">
                                                            Your payment slip is being reviewed by the seller.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="text-xs text-orange-700 mb-2">
                                                            Upload your payment slip or screenshot as proof of payment.
                                                        </div>
                                                        
                                                        {!paymentSlip ? (
                                                            <div className="space-y-2">
                                                                <label className="block">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        onChange={handlePaymentSlipUpload}
                                                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 file:cursor-pointer cursor-pointer"
                                                                    />
                                                                </label>
                                                                <div className="text-xs text-orange-600">
                                                                    JPG, PNG, PDF (max 10MB)
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-orange-300">
                                                                    <div className="text-orange-600 text-sm">📄</div>
                                                                    <div className="flex-1">
                                                                        <div className="text-xs font-medium text-gray-900">
                                                                            {paymentSlip.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {(paymentSlip.size / 1024 / 1024).toFixed(2)} MB
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setPaymentSlip(null)}
                                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                                        disabled={uploadingPayment}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                                
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={confirmPaymentSlipUpload}
                                                                        disabled={uploadingPayment}
                                                                        className="flex-1 py-2 px-3 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {uploadingPayment ? 'Uploading...' : 'Upload'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Custom Order Link */}
                    {customOrderId && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-purple-800 mb-1">
                                        📋 Custom Order Detected
                                    </div>
                                    <div className="text-sm text-purple-700 mb-2">
                                        This order originated from a custom order request. View the full custom order details for more information.
                                    </div>
                                    <button
                                        onClick={() => navigate(`/custom-order-summary/${customOrderId}`)}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View Custom Order Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Buyer Notes - Show to both buyers and sellers */}
                    {order.buyerNotes && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm font-semibold text-blue-800 mb-1">
                                {isBuyer ? 'Your Notes:' : 'Buyer Notes:'}
                            </div>
                            <div className="text-sm text-blue-700">
                                {order.buyerNotes}
                            </div>
                        </div>
                    )}

                    {/* Order Status Steps or Refund Requested */}
                    <div className="flex flex-col gap-2 mt-4 w-full">
                        <span className="text-sm font-semibold mb-2 text-[#0d0a0b]">Order Status:</span>
                        {order.status === OrderStatus.REFUND_REQUESTED ? (
                            <div className="w-full text-center py-3 bg-[#72b01d20] text-[#3f7d20] rounded-2xl font-bold text-base uppercase tracking-wide shadow-sm">
                                Refund Requested
                            </div>
                        ) : order.status === OrderStatus.REFUNDED ? (
                            <div className="w-full text-center py-3 bg-[#ff4444aa] text-[#cc0000] rounded-2xl font-bold text-base uppercase tracking-wide shadow-sm">
                                Order Refunded
                            </div>
                        ) : order.status === OrderStatus.CANCELLED ? (
                            <div className="w-full text-center py-3 bg-[#45495522] text-[#454955] rounded-2xl font-bold text-base uppercase tracking-wide shadow-sm">
                                Order Cancelled
                            </div>
                        ) : (
                            <div className="relative flex items-center w-full justify-between px-1 md:px-4">
                                {/* Handle different status flows based on payment method */}
                                {order.paymentMethod === 'bankTransfer' && order.status === OrderStatus.PENDING_PAYMENT ? (
                                    // Special display for bank transfer orders awaiting payment
                                    <div className="w-full text-center py-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="text-orange-800 font-bold text-lg mb-2">
                                            💰 Awaiting Payment
                                        </div>
                                        <div className="text-orange-700 text-sm">
                                            Please complete the bank transfer and upload your payment slip to proceed.
                                        </div>
                                    </div>
                                ) : (
                                    // Normal status progression
                                    (() => {
                                        const statusSteps = [OrderStatus.PENDING, OrderStatus.SHIPPED, OrderStatus.RECEIVED];
                                        return statusSteps.map((step, idx, arr) => {
                                            let normalizedStatus = (order.status || OrderStatus.PENDING);
                                            const currentIdx = statusSteps.indexOf(normalizedStatus);
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
                                        });
                                    })()
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Show payment slip if already uploaded (for sellers and completed orders) */}
                    {order.paymentSlipUrl && (order.status !== OrderStatus.PENDING_PAYMENT || !isBuyer) && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm font-semibold text-green-800 mb-2">
                                ✅ Payment Slip Uploaded
                            </div>
                            <div className="text-sm text-green-700 mb-3">
                                {isBuyer ? 'Your payment slip has been uploaded successfully.' : 'The buyer has uploaded their payment slip.'}
                            </div>
                            <a
                                href={order.paymentSlipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                            >
                                📄 View Payment Slip
                            </a>
                            {order.paymentSlipUploadedAt && (
                                <div className="text-xs text-green-600 mt-2">
                                    Uploaded: {new Date(order.paymentSlipUploadedAt.seconds ? order.paymentSlipUploadedAt.toDate() : order.paymentSlipUploadedAt).toLocaleString()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Only buyer can interact (refund, review) */}
                    {isBuyer && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RECEIVED && order.status !== OrderStatus.REFUND_REQUESTED && order.status !== OrderStatus.REFUNDED && order.status !== OrderStatus.PENDING_PAYMENT && (
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
                        {order.status === OrderStatus.CANCELLED ? (
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
            <Footer />
            <ConfirmDialog
                isOpen={isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                type={confirmDialog.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
}
