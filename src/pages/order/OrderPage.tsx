import { useEffect, useState, useRef } from "react";
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
    const { user, loading: authLoading } = useAuth(); // Get both user and loading state
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
    
    // Role determination loading state
    const [rolesDetermined, setRolesDetermined] = useState(false);
    
    // Ref to prevent multiple redirects
    const authorizationChecked = useRef(false);

    // Custom Order Detection - Simple approach using customOrderId field
    const [customOrderId, setCustomOrderId] = useState<string | null>(null);
    const [customOrderData, setCustomOrderData] = useState<any>(null);
    const [customOrderLoading, setCustomOrderLoading] = useState(false);

    // Custom confirmation dialog hook
    const { isOpen, confirmDialog, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();

    // Get the correct transfer amount (custom order total if from custom order, otherwise single order total)
    const getTransferAmount = () => {
        if (customOrderData && customOrderData.totalAmount) {
            return customOrderData.totalAmount;
        }
        return order?.total || 0;
    };

    // Get transfer amount description
    const getTransferAmountDescription = () => {
        if (customOrderData && customOrderData.totalAmount) {
            return `Total amount for complete custom order (${customOrderData.items?.length || 1} items)`;
        }
        return `Amount for this single item order`;
    };

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

    // Function to fetch custom order data
    const fetchCustomOrderData = async (customOrderId: string) => {
        setCustomOrderLoading(true);
        try {
            const customOrderRef = doc(db, "customOrders", customOrderId);
            const customOrderSnap = await getDoc(customOrderRef);
            
            if (customOrderSnap.exists()) {
                const customOrder = { ...customOrderSnap.data(), id: customOrderSnap.id };
                setCustomOrderData(customOrder);
            }
        } catch (error) {
            console.error("Error fetching custom order data:", error);
        } finally {
            setCustomOrderLoading(false);
        }
    };

    // Single useEffect to handle order fetching, role determination, and authorization
    useEffect(() => {
        const fetchOrderAndDetermineAccess = async () => {
            // Wait for authentication to load before proceeding
            if (authLoading) {
                console.log('🔄 Waiting for authentication to load...');
                return;
            }
            
            // Reset states
            setLoading(true);
            setRolesDetermined(false);
            authorizationChecked.current = false;
            setIsBuyer(false);
            setIsSeller(false);
            
            if (!id) {
                setLoading(false);
                setRolesDetermined(true);
                return;
            }
            
            try {
                // Fetch order data
                const docRef = doc(db, "orders", id);
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    setOrder(null);
                    setLoading(false);
                    setRolesDetermined(true);
                    return;
                }
                
                const orderData: any = { ...docSnap.data(), id: docSnap.id };
                setOrder(orderData);

                // Set custom order ID if this order came from a custom order
                if (orderData.customOrderId) {
                    setCustomOrderId(orderData.customOrderId);
                    // Fetch the custom order data to get the full order details
                    await fetchCustomOrderData(orderData.customOrderId);
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
                
                // Determine user roles if user is logged in
                if (user && user.email) {
                    console.log('🔍 Determining user roles for order:', orderData.id);
                    
                    // Check if user is the buyer
                    const buyerMatch = orderData.buyerEmail === user.email;
                    console.log('👤 Buyer check:', { orderBuyerEmail: orderData.buyerEmail, userEmail: user.email, isBuyer: buyerMatch });
                    
                    // Check if user is the seller - need to fetch seller email from sellerId
                    let sellerMatch = false;
                    if (orderData.sellerId) {
                        try {
                            console.log('🔍 Fetching seller data for sellerId:', orderData.sellerId);
                            const sellerQuery = query(
                                collection(db, "users"), 
                                where("uid", "==", orderData.sellerId)
                            );
                            const sellerSnap = await getDocs(sellerQuery);
                            
                            if (!sellerSnap.empty) {
                                const sellerData = sellerSnap.docs[0].data();
                                const sellerEmail = sellerData.email;
                                sellerMatch = sellerEmail === user.email;
                                
                                console.log('👤 Role determination complete:', {
                                    userEmail: user.email,
                                    buyerEmail: orderData.buyerEmail,
                                    sellerEmail: sellerEmail,
                                    isBuyer: buyerMatch,
                                    isSeller: sellerMatch
                                });
                            } else {
                                console.log('❌ Seller not found for sellerId:', orderData.sellerId);
                            }
                        } catch (error) {
                            console.error("❌ Error fetching seller data for role determination:", error);
                        }
                    } else {
                        console.log('❌ No sellerId found in order');
                    }
                    
                    // Set roles
                    setIsBuyer(buyerMatch);
                    setIsSeller(sellerMatch);
                    
                    // Check authorization and redirect if necessary
                    if (!buyerMatch && !sellerMatch) {
                        console.log('❌ Redirecting to search: User is neither buyer nor seller', { 
                            orderBuyerEmail: orderData.buyerEmail, 
                            orderSellerId: orderData.sellerId, 
                            userEmail: user.email,
                            isBuyer: buyerMatch,
                            isSeller: sellerMatch
                        });
                        navigate("/search", { replace: true });
                        return;
                    }
                    
                    console.log('✅ Access granted: User is authorized for this order', {
                        isBuyer: buyerMatch,
                        isSeller: sellerMatch,
                        userEmail: user.email
                    });
                } else {
                    // User not logged in
                    console.log('❌ Redirecting to auth: User not logged in');
                    navigate("/auth", { replace: true });
                    return;
                }
                
            } catch (error) {
                console.error("Error in fetchOrderAndDetermineAccess:", error);
                setOrder(null);
            } finally {
                setLoading(false);
                setRolesDetermined(true);
                authorizationChecked.current = true;
            }
        };
        
        fetchOrderAndDetermineAccess();
    }, [id, user, navigate, authLoading]);

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
        
        // Send email notification to buyer
        try {
            const { sendOrderStatusChangeNotification } = await import('../../utils/emailService');
            await sendOrderStatusChangeNotification(
                { ...order, id: order.id }, 
                OrderStatus.REFUND_REQUESTED,
                'Your refund request has been submitted successfully. The seller will review your request and process it accordingly.'
            );
        } catch (emailError) {
            console.error('❌ Error sending refund request notification email:', emailError);
            // Don't fail the status update if email fails
        }
        
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
                const { sendPaymentSlipNotification } = await import('../../utils/emailService');
                const { getSellerEmailById } = await import('../../utils/orders');
                
                const sellerEmail = await getSellerEmailById(order.sellerId);
                if (sellerEmail) {
                    const orderWithId = { ...order, id: order.id };
                    await sendPaymentSlipNotification(orderWithId, sellerEmail);
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

    // Show loading while authentication is loading, fetching data or determining roles
    if (authLoading || loading || !rolesDetermined) {
        return <div className="flex items-center justify-center min-h-screen text-[#454955]">Loading...</div>;
    }

    // At this point, loading is complete and roles are determined
    // The redirect logic in useEffect will handle unauthorized access
    // Only show "Order not found" if we're sure the order doesn't exist and user should see this message
    if (!order) {
        return <div className="flex items-center justify-center min-h-screen text-[#454955]">Order not found.</div>;
    }

    // Only render the order details if user is authorized (either buyer or seller)
    if (!isBuyer && !isSeller) {
        return <div className="flex items-center justify-center min-h-screen text-[#454955]">Loading...</div>;
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
            case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-800';
            case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
            case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
            case OrderStatus.REFUND_REQUESTED: return 'bg-orange-100 text-orange-800';
            case OrderStatus.REFUNDED: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status text
    const getStatusText = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'Pending';
            case OrderStatus.CONFIRMED: return 'Confirmed';
            case OrderStatus.SHIPPED: return 'Shipped';
            case OrderStatus.DELIVERED: return 'Delivered';
            case OrderStatus.CANCELLED: return 'Cancelled';
            case OrderStatus.REFUND_REQUESTED: return 'Refund Requested';
            case OrderStatus.REFUNDED: return 'Refunded';
            default: return 'Unknown';
        }
    };

    // --- PAGE RENDER ---
    return (
        <div className="bg-gray-50 min-h-screen w-full">
            <Header />
            <main className="max-w-4xl mx-auto py-8 px-4 md:px-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                            <p className="text-gray-600 mt-1">Order #{order.id}</p>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">
                                {order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.toDate() : order.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Main Order Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                <img 
                                    src={order.itemImage} 
                                    alt={order.itemName}
                                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border border-gray-200" 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                                    {order.itemName}
                                </h2>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shop:</span>
                                        <span className="font-medium text-gray-900">{order.sellerShopName || 'N/A'}</span>
                                    </div>
                                    {order.variationName && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Variation:</span>
                                            <span className="font-medium text-blue-600">{order.variationName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Quantity:</span>
                                        <span className="font-medium text-gray-900">{order.quantity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Order Notes */}
                        {(order.sellerNotes || order.buyerNotes) && (
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                {order.sellerNotes && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="text-sm font-medium text-amber-800 mb-1">Seller Notes:</div>
                                        <div className="text-sm text-amber-700">{order.sellerNotes}</div>
                                    </div>
                                )}
                                {order.buyerNotes && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="text-sm font-medium text-blue-800 mb-1">{isBuyer ? 'Your Notes:' : 'Buyer Notes:'}</div>
                                        <div className="text-sm text-blue-700">{order.buyerNotes}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Price Breakdown Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Item Price */}
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Item Price</span>
                                    {order.quantity > 1 && (
                                        <span className="text-sm text-gray-500">
                                            ({order.quantity} × LKR {formatCurrency(order.price / order.quantity)})
                                        </span>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-900">LKR {formatCurrency(order.price)}</span>
                            </div>
                            
                            {/* Shipping */}
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-gray-600">Shipping & Handling</span>
                                </div>
                                <span className={`font-semibold ${order.shipping === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {order.shipping > 0 ? `LKR ${formatCurrency(order.shipping)}` : 'Free'}
                                </span>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t border-gray-200"></div>
                            
                            {/* Total */}
                            <div className="flex justify-between items-center py-3">
                                <span className="text-xl font-bold text-gray-900">Order Total</span>
                                <span className="text-2xl font-bold text-green-600">LKR {formatCurrency(order.total)}</span>
                            </div>
                            
                            {/* Free Shipping Badge */}
                            {order.shipping === 0 && (
                                <div className="flex justify-center pt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        You saved on shipping!
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Order Information */}
                    {customOrderId && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">Custom Order</h3>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                            Multi-item
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-4">
                                        {customOrderData ? (
                                            <>
                                                This order is part of a custom order with <span className="font-semibold">{customOrderData.items?.length || 1} items</span>. 
                                                Total value: <span className="font-semibold text-green-600">LKR {formatCurrency(customOrderData.totalAmount || 0)}</span>
                                            </>
                                        ) : customOrderLoading ? (
                                            "Loading custom order details..."
                                        ) : (
                                            "This order originated from a custom order request. View the full details for complete information."
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate(`/custom-order-summary/${customOrderId}`)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                                        disabled={customOrderLoading}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        {customOrderLoading ? 'Loading...' : 'View Full Custom Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                                <FiCreditCard className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                     order.paymentMethod === 'bankTransfer' ? 'Bank Transfer' :
                                     order.paymentMethod === 'paynow' ? 'Online Payment' :
                                     'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {order.paymentMethod === 'cod' ? 'Pay when you receive the item' :
                                     order.paymentMethod === 'bankTransfer' ? 'Transfer to seller\'s account' :
                                     order.paymentMethod === 'paynow' ? 'Paid online' :
                                     'Payment method not specified'}
                                </div>
                            </div>
                        </div>

                        {/* Bank Transfer Section */}
                        {order.paymentMethod === 'bankTransfer' && (
                            <div className="border-t border-gray-200 pt-4">
                                <button
                                    onClick={() => setIsPaymentSectionExpanded(!isPaymentSectionExpanded)}
                                    className="w-full flex items-center justify-between text-left focus:outline-none group mb-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <FiCreditCard className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Payment Instructions</h3>
                                            <p className="text-sm text-gray-500">Bank transfer details & upload</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {order.paymentSlipUrl && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                ✓ Uploaded
                                            </span>
                                        )}
                                        {isPaymentSectionExpanded ? (
                                            <FiChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <FiChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        )}
                                    </div>
                                </button>

                                {/* Collapsible Content */}
                                {isPaymentSectionExpanded && (
                                    <div className="mt-6 space-y-6">
                                        {/* Step 1: Bank Transfer */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                                <h4 className="font-semibold text-gray-900">Make Bank Transfer</h4>
                                            </div>
                                {sellerBankAccounts.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <div className="text-sm text-blue-800 font-medium mb-2">
                                                💰 Transfer Amount: <span className="text-lg font-bold">LKR {formatCurrency(getTransferAmount())}</span>
                                            </div>
                                            <div className="text-xs text-blue-700">
                                                Include order ID ({order.id}) in transfer reference
                                            </div>
                                            {customOrderData && (
                                                <div className="text-xs text-blue-700 mt-1 font-medium">
                                                    💡 {getTransferAmountDescription()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 mb-4">
                                            Choose the most convenient bank account for your transfer:
                                        </div>
                                        
                                        {/* Bank Accounts Grid */}
                                        <div className="grid gap-4">
                                            {sellerBankAccounts.map((account, index) => (
                                                <div key={account.id} className="relative p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                                                    {account.isDefault && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                                                                ⭐ Preferred
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 text-base">
                                                            {account.bankName}
                                                        </h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Account Number</span>
                                                            <div className="font-mono text-base font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                                                {account.accountNumber}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Account Holder</span>
                                                            <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                                                {account.fullName}
                                                            </div>
                                                        </div>
                                                        {account.branch && (
                                                            <div className="sm:col-span-2">
                                                                <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Branch</span>
                                                                <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                                                    {account.branch}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                                                    <span className="text-amber-600 text-xs">💡</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-amber-800 mb-2">Transfer Tips:</div>
                                                    <ul className="text-sm text-amber-700 space-y-1">
                                                        <li>• Choose a bank account that matches your own bank for faster transfers</li>
                                                        <li>• Always include the order ID ({order.id}) as reference</li>
                                                        <li>• Contact the seller after transfer to confirm payment</li>
                                                        <li>• Keep your transfer receipt for records</li>
                                                        {customOrderData && (
                                                            <li className="font-medium">• This transfer covers your entire custom order</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="text-sm text-gray-600 space-y-2">
                                            <p>Please contact the seller for bank transfer details.</p>
                                            <p>The seller will provide bank account information via email or phone.</p>
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="font-medium text-blue-900">Total to transfer: LKR {formatCurrency(getTransferAmount())}</div>
                                                {customOrderData && (
                                                    <div className="text-xs text-blue-700 mt-1 font-medium">
                                                        {getTransferAmountDescription()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                        </div>

                                        {/* Step 2: Payment Slip Upload */}
                                        {isBuyer && order.status === OrderStatus.PENDING_PAYMENT && (
                                            <div className="border-t border-gray-200 pt-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                                    <h4 className="font-semibold text-gray-900">Upload Payment Slip</h4>
                                                </div>
                                                
                                                {order.paymentSlipUrl ? (
                                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="font-medium text-green-800">Payment Slip Uploaded Successfully!</span>
                                                        </div>
                                                        <p className="text-sm text-green-700">
                                                            Your payment slip is being reviewed by the seller.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-gray-600">
                                                            Upload your payment slip or screenshot as proof of payment.
                                                        </p>
                                                        
                                                        {!paymentSlip ? (
                                                            <div className="space-y-3">
                                                                <label className="block">
                                                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                                                                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                        </svg>
                                                                        <p className="text-sm font-medium text-gray-700 mb-1">Click to upload payment slip</p>
                                                                        <p className="text-xs text-gray-500">JPG, PNG, PDF (max 10MB)</p>
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        onChange={handlePaymentSlipUpload}
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {paymentSlip.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {(paymentSlip.size / 1024 / 1024).toFixed(2)} MB
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setPaymentSlip(null)}
                                                                        className="text-red-500 hover:text-red-700 text-sm transition p-1"
                                                                        disabled={uploadingPayment}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                
                                                                <button
                                                                    onClick={confirmPaymentSlipUpload}
                                                                    disabled={uploadingPayment}
                                                                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {uploadingPayment ? (
                                                                        <span className="flex items-center justify-center gap-2">
                                                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Uploading...
                                                                        </span>
                                                                    ) : (
                                                                        'Upload Payment Slip'
                                                                    )}
                                                                </button>
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
                        {/* Order Status */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                            
                            {order.status === OrderStatus.REFUND_REQUESTED ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-yellow-800 mb-1">Refund Requested</h4>
                                    <p className="text-sm text-yellow-700">Your refund request is being reviewed</p>
                                </div>
                            ) : order.status === OrderStatus.REFUNDED ? (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-red-800 mb-1">Order Refunded</h4>
                                    <p className="text-sm text-red-700">This order has been refunded</p>
                                </div>
                            ) : order.status === OrderStatus.CANCELLED ? (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1">Order Cancelled</h4>
                                    <p className="text-sm text-gray-600">This order has been cancelled</p>
                                </div>
                            ) : order.paymentMethod === 'bankTransfer' && order.status === OrderStatus.PENDING_PAYMENT ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-amber-800 mb-1">Awaiting Payment</h4>
                                    <p className="text-sm text-amber-700">Complete bank transfer and upload payment slip</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(() => {
                                        const statusSteps = [OrderStatus.PENDING, OrderStatus.SHIPPED, OrderStatus.RECEIVED];
                                        const currentIdx = statusSteps.indexOf(order.status || OrderStatus.PENDING);
                                        
                                        return statusSteps.map((step, idx) => {
                                            const isActive = idx <= currentIdx;
                                            const isCompleted = idx < currentIdx;
                                            const isCurrent = idx === currentIdx;

                                            return (
                                                <div key={step} className="flex items-center gap-4">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                                                        isCompleted 
                                                            ? "bg-green-600 text-white" 
                                                            : isCurrent 
                                                                ? (step === OrderStatus.SHIPPED || step === OrderStatus.RECEIVED) ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                                                                : "bg-gray-200 text-gray-400"
                                                    }`}>
                                                        {isCompleted || (isCurrent && (step === OrderStatus.SHIPPED || step === OrderStatus.RECEIVED)) ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            idx + 1
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                                                            {step.charAt(0) + step.slice(1).toLowerCase()}
                                                        </div>
                                                        <div className={`text-sm ${isActive ? "text-gray-600" : "text-gray-400"}`}>
                                                            {step === OrderStatus.PENDING && "Order confirmed, preparing for shipment"}
                                                            {step === OrderStatus.SHIPPED && "Order is on its way to you"}
                                                            {step === OrderStatus.RECEIVED && "Order delivered and confirmed"}
                                                        </div>
                                                    </div>
                                                    {isCurrent && order.status === OrderStatus.PENDING && (
                                                        <div className="flex-shrink-0">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                Current
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Payment Slip Display */}
                {order.paymentSlipUrl && (order.status !== OrderStatus.PENDING_PAYMENT || !isBuyer) && (
                    <div className="max-w-4xl mx-auto mt-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Slip Uploaded</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {isBuyer ? 'Your payment slip has been uploaded successfully.' : 'The buyer has uploaded their payment slip.'}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <a
                                            href={order.paymentSlipUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Payment Slip
                                        </a>
                                        {order.paymentSlipUploadedAt && (
                                            <span className="text-xs text-gray-500">
                                                Uploaded: {new Date(order.paymentSlipUploadedAt.seconds ? order.paymentSlipUploadedAt.toDate() : order.paymentSlipUploadedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {isBuyer && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RECEIVED && order.status !== OrderStatus.REFUND_REQUESTED && order.status !== OrderStatus.REFUNDED && order.status !== OrderStatus.PENDING_PAYMENT && (
                    <div className="max-w-4xl mx-auto mt-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    onClick={markAsReceived}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Mark as Received
                                        </span>
                                    )}
                                </button>
                                <button
                                    className="px-6 py-3 text-gray-600 hover:text-red-600 transition focus:outline-none text-sm font-medium"
                                    onClick={requestRefund}
                                    disabled={refundSubmitting}
                                >
                                    {refundSubmitting ? 'Processing...' : 'Request Refund'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Section */}
                <div className="max-w-4xl mx-auto mt-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Rating</h3>
                        
                        {order.status === OrderStatus.CANCELLED ? (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                <p className="text-gray-600 font-medium">Cannot review cancelled orders</p>
                            </div>
                        ) : order.review ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg key={i} className={`h-5 w-5 ${order.rating >= i ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">({order.rating}/5)</span>
                                </div>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <p className="text-gray-800">{order.review}</p>
                                </div>
                            </div>
                        ) : (
                            isBuyer && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="focus:outline-none hover:scale-110 transition-transform"
                                                    onClick={() => setRating(i)}
                                                    disabled={submitting}
                                                >
                                                    <svg className={`h-8 w-8 ${rating >= i ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-300 transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Write a review</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                            rows={4}
                                            placeholder="Share your experience with this product..."
                                            value={review}
                                            onChange={e => setReview(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                    
                                    <button
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={submitReview}
                                        disabled={submitting || !review.trim() || !rating}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
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
