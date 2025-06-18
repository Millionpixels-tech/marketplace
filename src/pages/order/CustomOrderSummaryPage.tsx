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
  customOrderId?: string;
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
  const [isPaymentSectionExpanded, setIsPaymentSectionExpanded] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        
        const customOrderData = await getCustomOrder(customOrderId);
        if (!customOrderData) {
          setError("Custom order not found");
          setLoading(false);
          return;
        }

        if (customOrderData.buyerId !== user.uid && customOrderData.sellerId !== user.uid) {
          setError("You don't have permission to view this order");
          setLoading(false);
          return;
        }

        setCustomOrder(customOrderData);

        if (customOrderData.paymentMethod === 'BANK_TRANSFER' && customOrderData.sellerId) {
          try {
            const sellerQuery = query(
              collection(db, "users"), 
              where("uid", "==", customOrderData.sellerId)
            );
            const sellerSnap = await getDocs(sellerQuery);
            
            if (!sellerSnap.empty) {
              const sellerData = sellerSnap.docs[0].data();
              
              if (sellerData.bankAccounts && Array.isArray(sellerData.bankAccounts)) {
                setSellerBankAccounts(sellerData.bankAccounts);
              } 
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

        const ordersQuery = query(
          collection(db, "orders"),
          where("customOrderId", "==", customOrderId)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const relatedOrders: Order[] = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));

        setOrders(relatedOrders);
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
    if (amount % 1 === 0) {
      return amount.toLocaleString();
    } else {
      const formatted = amount.toFixed(2);
      const withoutTrailingZeros = formatted.replace(/\.?0+$/, '');
      const parts = withoutTrailingZeros.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
  };

  const uploadPaymentSlip = async (file: File) => {
    if (!customOrder || !user || orders.length === 0) return;
    setUploadingPayment(true);
    
    try {
      const timestamp = Date.now();
      const fileName = `payment-slips/custom-order-${customOrder.id}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const updatePromises = orders.map(order => 
        updateDoc(doc(db, "orders", order.id), {
          paymentSlipUrl: downloadURL,
          paymentSlipUploadedAt: new Date(),
          status: 'pending'
        })
      );
      
      await Promise.all(updatePromises);
      
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="bg-gray-50 min-h-screen w-full">
      <ResponsiveHeader />
      
      <main className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/dashboard?tab=orders')}
            className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-600 hover:text-[#72b01d] transition-colors"
          >
            <FiArrowLeft size={18} />
            Back to Orders
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Custom Order Summary</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Order #{customOrder.id}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Order Created
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(customOrder.createdAt.seconds * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Order Created Successfully!</h2>
                <p className="text-sm text-gray-600">Your custom order has been split into {orders.length} individual item{orders.length !== 1 ? 's' : ''} for processing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Items</div>
                <div className="text-lg font-semibold text-gray-900">{getTotalItems()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="text-lg font-semibold text-gray-900">
                  {customOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                </div>
              </div>
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-lg font-semibold text-green-600">
                  LKR {formatCurrency(getTotalOrderValue() || (customOrder.totalAmount + customOrder.shippingCost))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          {customOrder.paymentMethod === 'BANK_TRANSFER' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Instructions</h3>
              </div>

              <button
                onClick={() => setIsPaymentSectionExpanded(!isPaymentSectionExpanded)}
                className="w-full flex items-center justify-between text-left focus:outline-none group mb-4 p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <span className="text-sm font-medium text-gray-700">
                  {isPaymentSectionExpanded ? 'Hide' : 'Show'} Payment Details
                </span>
                <div className="flex items-center gap-2">
                  {orders.length > 0 && orders.some(order => order.paymentSlipUrl) && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Payment Uploaded
                    </span>
                  )}
                  {isPaymentSectionExpanded ? (
                    <FiChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
              </button>

              {isPaymentSectionExpanded && (
                <div className="space-y-6">
                  {/* Bank Transfer Details */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Step 1: Make Bank Transfer
                    </h4>
                    {sellerBankAccounts.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Transfer to one of the seller's bank accounts:
                        </p>
                        
                        <div className="space-y-3">
                          {sellerBankAccounts.map((account) => (
                            <div key={account.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-gray-900">{account.bankName}</h5>
                                {account.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Preferred
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Account Number:</span>
                                  <div className="text-gray-900 font-mono bg-white px-3 py-2 rounded mt-1 text-sm break-all">
                                    {account.accountNumber}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Account Name:</span>
                                  <div className="text-gray-900 font-medium mt-1 break-words">{account.fullName}</div>
                                </div>
                                {account.branch && (
                                  <div className="sm:col-span-2">
                                    <span className="text-gray-600">Branch:</span>
                                    <span className="text-gray-900 ml-2 break-words">{account.branch}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-lg md:text-xl font-bold text-green-800 break-all">
                            Amount: LKR {formatCurrency(orders.length > 0 ? getTotalOrderValue() : (customOrder.totalAmount + customOrder.shippingCost))}
                          </div>
                          <div className="text-sm text-green-700 mt-1 break-all">
                            Include order ID in reference: {customOrder.id}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 space-y-2">
                        <div>Contact seller for bank transfer details.</div>
                        <div className="font-medium text-lg">
                          Amount: LKR {formatCurrency(orders.length > 0 ? getTotalOrderValue() : (customOrder.totalAmount + customOrder.shippingCost))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Slip Upload - Show only if user is buyer */}
                  {customOrder.buyerId === user?.uid && (
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">
                        Step 2: Upload Payment Slip
                      </h4>
                      
                      {orders.length > 0 && orders.some(order => order.paymentSlipUrl) ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-bold text-green-800 mb-2">
                            Payment Slip Uploaded Successfully!
                          </div>
                          <div className="text-sm text-green-700 mb-3">
                            Your payment slip is being reviewed. All orders will be updated automatically.
                          </div>
                          <a
                            href={orders.find(order => order.paymentSlipUrl)?.paymentSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-800 hover:underline font-medium"
                          >
                            <FiEye className="w-4 h-4" />
                            View Payment Slip
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Upload your payment slip or screenshot as proof of payment. This will update all your orders automatically.
                          </p>
                          
                          {!paymentSlip ? (
                            <div className="space-y-3">
                              <label className="block">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={handlePaymentSlipUpload}
                                  className="block w-full text-sm text-gray-500 file:mr-2 sm:file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                                />
                              </label>
                              <p className="text-xs text-gray-500">
                                Supported formats: JPG, PNG, PDF (max 10MB)
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-blue-600 text-lg">📄</div>
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
                                  className="text-red-500 hover:text-red-700 p-1"
                                  disabled={uploadingPayment}
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={confirmPaymentSlipUpload}
                                  disabled={uploadingPayment}
                                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {uploadingPayment ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <FiUpload className="w-4 h-4" />
                                      Upload Payment Slip
                                    </>
                                  )}
                                </button>
                                <label className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition cursor-pointer text-center">
                                  Change File
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

          {/* Main Order Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Order Items ({orders.length})</h3>
            </div>
            
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Item Image */}
                      <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                        {order.itemImage ? (
                          <img
                            src={order.itemImage}
                            alt={order.itemName}
                            className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <FiPackage className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base leading-tight">
                              {order.itemName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">Order #{order.id.slice(-8)}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <div className="font-medium text-gray-900">{order.quantity}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Unit Price:</span>
                            <div className="font-medium text-gray-900">LKR {formatCurrency(order.price / order.quantity)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Shipping:</span>
                            <div className="font-medium text-gray-900">
                              {order.shipping === 0 ? 'Free' : `LKR ${formatCurrency(order.shipping)}`}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <div className="font-semibold text-gray-900">LKR {formatCurrency(order.total)}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Payment status */}
                          {customOrder.paymentMethod === 'BANK_TRANSFER' && (
                            <div>
                              {order.paymentSlipUrl ? (
                                <div className="inline-flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Payment uploaded
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  Awaiting payment
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-right">
                            <button
                              onClick={() => navigate(`/order/${order.id}`)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-base font-medium mb-1">Orders Processing</div>
                  <div className="text-sm">Your orders will appear here shortly</div>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
            </div>
            
            {orders.length > 0 ? (
              <div className="space-y-4">
                {/* Items Total */}
                <div className="flex justify-between items-center py-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-gray-600">Items Subtotal</span>
                    <span className="text-sm text-gray-500">({getTotalItems()} items)</span>
                  </div>
                  <span className="font-semibold text-gray-900 break-all">LKR {formatCurrency(getTotalOrderValue() - getTotalShipping())}</span>
                </div>
                
                {/* Shipping */}
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Shipping</span>
                  </div>
                  <span className={`font-semibold break-all ${getTotalShipping() === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {getTotalShipping() > 0 ? `LKR ${formatCurrency(getTotalShipping())}` : 'Free'}
                  </span>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-200"></div>
                
                {/* Total */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">Order Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600 break-all">LKR {formatCurrency(getTotalOrderValue())}</span>
                </div>
                
                {/* Free Shipping Badge */}
                {getTotalShipping() === 0 && (
                  <div className="flex justify-center pt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Free Shipping
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="text-sm mb-2">Processing order details...</div>
                <div className="text-lg font-semibold text-gray-900">
                  Expected Total: LKR {formatCurrency(customOrder.totalAmount + customOrder.shippingCost)}
                </div>
              </div>
            )}
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            
            <div className="space-y-3 sm:space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{orders.length > 0 ? getTotalItems() : customOrder.items?.length || 0}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">
                  {customOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Delivery Method:</span>
                <span className="font-medium">Standard Delivery</span>
              </div>
              
              {orders[0]?.buyerInfo && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-gray-600 mb-2">Delivery Address:</div>
                  <div className="text-gray-900 leading-relaxed break-words">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Seller:</span>
                <span className="font-medium break-words">{customOrder.sellerName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600">Order Created:</span>
                <span className="font-medium">
                  {new Date(customOrder.createdAt.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="text-gray-600 mb-2">Custom Order ID:</div>
                <div className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border break-all">
                  {customOrder.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
