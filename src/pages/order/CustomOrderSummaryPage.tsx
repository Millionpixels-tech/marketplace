// src/pages/order/CustomOrderSummaryPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomOrder } from "../../utils/customOrders";
import { query, collection, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../utils/firebase";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { useResponsive } from "../../hooks/useResponsive";
import { FiPackage, FiCreditCard, FiAlertCircle, FiArrowLeft, FiCheckCircle, FiEye, FiUpload, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import type { CustomOrder } from "../../utils/customOrders";

interface BankAccount {
  id: string;
  accountNumber: string;
  branch: string;
  bankName: string;
  fullName: string;
  isDefault: boolean;
  createdAt: Date;
}

interface Order {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerShopName: string;
  price: number;
  quantity: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: any;
  buyerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  buyerNotes?: string;
  paymentSlipUrl?: string;
  paymentSlipUploadedAt?: Date;
}

export default function CustomOrderSummaryPage() {
  const { isMobile } = useResponsive();
  const { customOrderId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [customOrder, setCustomOrder] = useState<CustomOrder | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerBankAccounts, setSellerBankAccounts] = useState<BankAccount[]>([]);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [isPaymentSectionExpanded, setIsPaymentSectionExpanded] = useState(true); // Expanded by default

  useEffect(() => {
    const fetchData = async () => {
      // Wait for authentication to complete
      if (authLoading) {
        return;
      }
      
      if (!customOrderId) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }
      
      if (!user) {
        setError("Please sign in to view this order");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch the custom order
        const customOrderData = await getCustomOrder(customOrderId);
        if (!customOrderData) {
          setError("Custom order not found");
          setLoading(false);
          return;
        }

        // Verify the user has access to this order
        if (customOrderData.buyerId !== user.uid && customOrderData.sellerId !== user.uid) {
          setError("You don't have permission to view this order");
          setLoading(false);
          return;
        }

        setCustomOrder(customOrderData);

        // Fetch seller's bank account information if this is a bank transfer order
        if (customOrderData.paymentMethod === 'BANK_TRANSFER' && customOrderData.sellerId) {
          try {
            const sellerQuery = query(
              collection(db, "users"), 
              where("uid", "==", customOrderData.sellerId)
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

        // Fetch all related orders created from this custom order
        // We'll match orders by buyer, seller, timing, and precise item matching
        const ordersQuery = query(
          collection(db, "orders"),
          where("buyerId", "==", customOrderData.buyerId),
          where("sellerId", "==", customOrderData.sellerId)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const relatedOrders: Order[] = [];
        
        // Create a map of custom order items for precise matching
        const customOrderItemsMap = new Map(
          customOrderData.items.map(item => [
            `${item.name.toLowerCase()}_${item.unitPrice}_${item.quantity}`,
            item
          ])
        );

        for (const orderDoc of ordersSnapshot.docs) {
          const orderData = orderDoc.data();
          
          // Check if this order was created very recently (within 2 minutes) of custom order acceptance
          const orderCreatedAt = orderData.createdAt?.toDate();
          const customOrderAcceptedAt = customOrderData.updatedAt?.toDate() || customOrderData.createdAt?.toDate();
          
          if (orderCreatedAt && customOrderAcceptedAt) {
            const timeDiff = Math.abs(orderCreatedAt.getTime() - customOrderAcceptedAt.getTime());
            
            // Create a key for this order to match against custom order items
            const orderKey = `${orderData.itemName?.toLowerCase() || ''}_${orderData.price || 0}_${orderData.quantity || 0}`;
            const hasMatchingItem = customOrderItemsMap.has(orderKey);
            
            // Only include orders that:
            // 1. Were created within 2 minutes of custom order acceptance
            // 2. Have exactly matching item name, price, and quantity
            // 3. Have the same payment method
            const paymentMethodMatches = 
              (customOrderData.paymentMethod === 'COD' && orderData.paymentMethod === 'cod') ||
              (customOrderData.paymentMethod === 'BANK_TRANSFER' && orderData.paymentMethod === 'bankTransfer');
            
            if (timeDiff <= 2 * 60 * 1000 && hasMatchingItem && paymentMethodMatches) {
              relatedOrders.push({
                id: orderDoc.id,
                ...orderData
              } as Order);
            }
          }
        }

        setOrders(relatedOrders);
        
        // If no orders found, they might still be processing
        if (relatedOrders.length === 0) {
          console.log("No related orders found yet, they might still be processing");
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
        setError("Failed to load order information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customOrderId, user?.uid, authLoading]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalOrderValue = () => {
    return orders.reduce((total, order) => total + order.total, 0);
  };

  const getTotalShipping = () => {
    return orders.reduce((total, order) => total + order.shipping, 0);
  };

  const getTotalItems = () => {
    return orders.reduce((total, order) => total + order.quantity, 0);
  };

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

  // Upload payment slip for all related orders
  const uploadPaymentSlip = async (file: File) => {
    if (!customOrder || !user || orders.length === 0) return;
    setUploadingPayment(true);
    
    try {
      // Upload payment slip to Firebase Storage
      const timestamp = Date.now();
      const fileName = `payment-slips/custom-order-${customOrder.id}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update all related orders with payment slip URL
      const updatePromises = orders.map(order => 
        updateDoc(doc(db, "orders", order.id), {
          paymentSlipUrl: downloadURL,
          paymentSlipUploadedAt: new Date(),
          status: 'pending' // Change from pending_payment to pending
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state for all orders
      const updatedOrders = orders.map(order => ({
        ...order,
        paymentSlipUrl: downloadURL,
        paymentSlipUploadedAt: new Date(),
        status: 'pending'
      }));
      setOrders(updatedOrders);
      
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-xl text-gray-600">
            {authLoading ? "Authenticating..." : "Loading order summary..."}
          </span>
        </div>
      </div>
    );
  }

  if (error || !customOrder) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The order you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c17] transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveHeader />
      
      <div className={`${isMobile ? 'max-w-full px-4 py-4' : 'max-w-6xl px-4 py-6'} mx-auto`}>
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard?tab=orders')}
          className={`flex items-center gap-2 ${isMobile ? 'mb-3 text-xs' : 'mb-4 text-sm'} font-medium text-gray-600 hover:text-[#72b01d] transition-colors`}
        >
          <FiArrowLeft size={isMobile ? 16 : 18} />
          Back to Orders
        </button>

        {/* Success Header */}
        <div className={`rounded-lg border border-green-200 ${isMobile ? 'p-4' : 'p-4'} bg-green-50 mb-4`}>
          <div className="flex items-center gap-3 mb-3">
            <FiCheckCircle className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-900`}>Order Created Successfully!</h1>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700`}>Custom Order ID: {customOrder.id}</p>
            </div>
          </div>
          <div className={`mt-3 ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-lg border border-green-200`}>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-800 mb-2 font-medium`}>
              What happens next?
            </p>
            <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700 space-y-1 leading-relaxed`}>
              <li>• Order split into {orders.length} individual item{orders.length > 1 ? 's' : ''} for processing</li>
              <li>• Email updates for each order status change</li>
              <li>• Payment: {customOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}</li>
              <li>• Total: LKR {formatCurrency(getTotalOrderValue())}</li>
            </ul>
          </div>
        </div>

        {/* Payment Section - Collapsible Bank Transfer Details and Payment Slip Upload */}
        {customOrder.paymentMethod === 'BANK_TRANSFER' && (
          <div className={`rounded-lg border border-blue-200 ${isMobile ? 'p-4 mb-4' : 'p-4 mb-5'} bg-blue-50`}>
            {/* Collapsible Header */}
            <button
              onClick={() => setIsPaymentSectionExpanded(!isPaymentSectionExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none rounded p-1 -m-1"
            >
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold flex items-center gap-2`}>
                <FiCreditCard className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                Payment Instructions & Upload
              </h3>
              <div className="flex items-center gap-2">
                {orders.length > 0 && orders.some(order => order.paymentSlipUrl) && (
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
                  <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-blue-800 mb-2`}>
                    Step 1: Make Bank Transfer
                  </h4>
                  {sellerBankAccounts.length > 0 ? (
                    <div className="space-y-3">
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 mb-2`}>
                        Transfer to one of the seller's bank accounts:
                      </div>
                      
                      {/* Display all available bank accounts */}
                      <div className="space-y-2">
                        {sellerBankAccounts.map((account) => (
                          <div key={account.id} className={`bg-white ${isMobile ? 'p-3' : 'p-3'} rounded border border-blue-300`}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {account.bankName}
                              </h5>
                              {account.isDefault && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  Preferred
                                </span>
                              )}
                            </div>
                            
                            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'} text-xs`}>
                              <div>
                                <span className="text-gray-600">Account:</span>
                                <div className={`text-gray-900 font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-gray-50 px-2 py-1 rounded`}>
                                  {account.accountNumber}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Name:</span>
                                <div className="text-gray-900 font-medium">{account.fullName}</div>
                              </div>
                              {account.branch && (
                                <div className={`${isMobile ? 'col-span-1' : 'col-span-2'}`}>
                                  <span className="text-gray-600">Branch:</span>
                                  <span className="text-gray-900 ml-1">{account.branch}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className={`bg-green-50 ${isMobile ? 'p-3' : 'p-3'} rounded border border-green-200`}>
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-green-800`}>
                          Amount: LKR {formatCurrency(orders.length > 0 ? getTotalOrderValue() : (customOrder.totalAmount + customOrder.shippingCost))}
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          Include order ID in reference: {customOrder.id}
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 space-y-2`}>
                      <div>Contact seller for bank transfer details.</div>
                      <div className="font-medium">
                        Amount: LKR {formatCurrency(orders.length > 0 ? getTotalOrderValue() : (customOrder.totalAmount + customOrder.shippingCost))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Slip Upload - Show only if user is buyer */}
                {customOrder.buyerId === user?.uid && (
                  <div className="border-t border-blue-200 pt-3">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-orange-800 mb-2`}>
                      Step 2: Upload Payment Slip
                    </h4>
                    
                    {/* Check if any order already has a payment slip */}
                    {orders.length > 0 && orders.some(order => order.paymentSlipUrl) ? (
                      <div className={`${isMobile ? 'p-3' : 'p-3'} bg-green-50 border border-green-200 rounded`}>
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-green-800 mb-1`}>
                          Payment Slip Uploaded Successfully!
                        </div>
                        <div className="text-xs text-green-700 mb-2">
                          Your payment slip is being reviewed. All orders will be updated automatically.
                        </div>
                        <a
                          href={orders.find(order => order.paymentSlipUrl)?.paymentSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:underline font-medium"
                        >
                          <FiEye className="w-3 h-3" />
                          View Payment Slip
                        </a>
                      </div>
                    ) : (
                        <div className="space-y-3">
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-orange-700 mb-2`}>
                          Upload your payment slip or screenshot as proof of payment. This will update all your orders automatically.
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
                                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                                disabled={uploadingPayment}
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={confirmPaymentSlipUpload}
                                disabled={uploadingPayment}
                                className="flex-1 py-2 px-3 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                {uploadingPayment ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <FiUpload className="w-3 h-3" />
                                    Upload
                                  </>
                                )}
                              </button>
                              <label className="py-2 px-3 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200 transition cursor-pointer">
                                Change
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={handlePaymentSlipUpload}
                                  className="hidden"
                                  disabled={uploadingPayment}
                                />
                              </label>
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

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-3 gap-5'}`}>
          {/* Left Column - Order Details */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'} space-y-4`}>
            {/* Individual Orders */}
            <div className={`rounded-lg border border-gray-200 ${isMobile ? 'p-4' : 'p-4'} bg-white`}>
              <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-3'}`}>
                <h2 className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900`}>
                  Your Orders ({orders.length})
                </h2>
                {orders.length > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-sm'}`}>LKR {formatCurrency(getTotalOrderValue())}</div>
                  </div>
                )}
              </div>
              
              <div className={`space-y-${isMobile ? '3' : '2'}`}>
                {orders.length > 0 ? (
                  orders.map((order) => (
                  <div key={order.id} className={`border border-gray-100 rounded ${isMobile ? 'p-3' : 'p-3'} bg-gray-50/30`}>
                    <div className={`flex items-start ${isMobile ? 'gap-3' : 'gap-3'}`}>
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        {order.itemImage ? (
                          <img
                            src={order.itemImage}
                            alt={order.itemName}
                            className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} object-cover rounded border border-gray-200`}
                          />
                        ) : (
                          <div className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} bg-gray-100 rounded border border-gray-200 flex items-center justify-center`}>
                            <FiPackage className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-2'} mb-2`}>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : 'text-sm'} line-clamp-2 pr-2`}>{order.itemName}</h3>
                            <div className="text-xs text-gray-500">#{order.id.slice(-8)}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`px-2 py-1 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Order details */}
                        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-2'} text-xs mb-2`}>
                          <div>
                            <span className="text-gray-500">Qty:</span>
                            <span className="ml-1 font-medium">{order.quantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-1 font-medium">LKR {formatCurrency(order.price)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shipping:</span>
                            <span className="ml-1 font-medium">LKR {formatCurrency(order.shipping)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <span className="ml-1 font-semibold">LKR {formatCurrency(order.total)}</span>
                          </div>
                        </div>

                        {/* Payment status */}
                        {customOrder.paymentMethod === 'BANK_TRANSFER' && (
                          <div className={`${isMobile ? 'mb-2' : 'mb-2'}`}>
                            {order.paymentSlipUrl ? (
                              <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                Payment uploaded
                              </div>
                            ) : (
                              <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                                Awaiting payment
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action */}
                        <div className="text-right">
                          <button
                            onClick={() => navigate(`/order/${order.id}`)}
                            className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 hover:text-[#72b01d] transition-colors`}
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className={`text-center ${isMobile ? 'py-6' : 'py-6'} text-gray-500`}>
                    <div className={`${isMobile ? 'mb-1 text-sm' : 'mb-1 text-sm'}`}>Orders Processing</div>
                    <div className="text-xs">Your orders will appear here shortly</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className={`space-y-${isMobile ? '4' : '3'}`}>
            {/* Order Summary */}
            <div className={`rounded-lg border border-gray-200 ${isMobile ? 'p-4' : 'p-4'} bg-white`}>
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-3'} ${isMobile ? 'text-base' : 'text-sm'}`}>Order Summary</h3>
              
              {orders.length > 0 ? (
                <div className={`space-y-${isMobile ? '2' : '2'}`}>
                  <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{getTotalItems()}</span>
                  </div>
                  <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <span className="text-gray-600">Items Subtotal:</span>
                    <span className="font-medium">LKR {formatCurrency(getTotalOrderValue() - getTotalShipping())}</span>
                  </div>
                  <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <span className="text-gray-600">Total Shipping:</span>
                    <span className="font-medium">LKR {formatCurrency(getTotalShipping())}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-sm'}`}>Grand Total:</span>
                      <span className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                        LKR {formatCurrency(getTotalOrderValue())}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center ${isMobile ? 'py-3' : 'py-3'} text-gray-500`}>
                  <div className="text-xs mb-1">Processing order details...</div>
                  <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Expected: LKR {formatCurrency(customOrder.totalAmount + customOrder.shippingCost)}
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Delivery Info */}
            <div className={`rounded-lg border border-gray-200 ${isMobile ? 'p-4' : 'p-4'} bg-white`}>
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-3'} ${isMobile ? 'text-base' : 'text-sm'}`}>Payment & Delivery</h3>
              
              <div className={`space-y-${isMobile ? '2' : '2'} text-xs`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium">
                    {customOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">Standard Delivery</span>
                </div>
                
                {orders[0]?.buyerInfo && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-gray-600 mb-1">Delivery Address:</div>
                    <div className="text-gray-900 text-xs leading-relaxed">
                      {orders[0].buyerInfo.firstName} {orders[0].buyerInfo.lastName}<br />
                      {orders[0].buyerInfo.address}<br />
                      {orders[0].buyerInfo.city} {orders[0].buyerInfo.postalCode}<br />
                      {orders[0].buyerInfo.phone}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div className={`rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-4'} bg-white`}>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Seller Information</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <span className="font-medium">{customOrder.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Created:</span>
                  <span className="font-medium">
                    {new Date(customOrder.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-gray-600 mb-1">Custom Order ID:</div>
                  <div className="font-mono text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded">
                    {customOrder.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
