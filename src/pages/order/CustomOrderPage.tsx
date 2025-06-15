// src/pages/order/CustomOrderPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomOrder, acceptCustomOrder, isCustomOrderExpired } from "../../utils/customOrders";
import { saveBuyerInfo, getBuyerInfo, type BuyerInfo } from "../../utils/userProfile";
import { createOrder } from "../../utils/orders";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { Input } from "../../components/UI";
import { useResponsive } from "../../hooks/useResponsive";
import { useToast } from "../../context/ToastContext";
import { FiPackage, FiClock, FiUser, FiCreditCard, FiTruck, FiAlertCircle, FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import type { CustomOrder } from "../../utils/customOrders";

export default function CustomOrderPage() {
  const { isMobile } = useResponsive();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  
  // Buyer information form state
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  
  // Additional order fields
  const [buyerNotes, setBuyerNotes] = useState<string>('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not provided");
        setLoading(false);
        return;
      }

      try {
        const customOrder = await getCustomOrder(orderId);
        if (!customOrder) {
          setError("Custom order not found");
        } else {
          setOrder(customOrder);
          
          // Load saved buyer information if user is authenticated
          if (user) {
            try {
              const savedInfo = await getBuyerInfo(user.uid);
              if (savedInfo) {
                setBuyerInfo(savedInfo);
              }
            } catch (error) {
              console.error("Error loading buyer info:", error);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching custom order:", err);
        setError("Failed to load custom order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  // Clear specific field error
  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!buyerInfo.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!buyerInfo.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!buyerInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!buyerInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(buyerInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (!buyerInfo.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!buyerInfo.city.trim()) {
      errors.city = 'City is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    await handleOrderSubmit();
  };

  const handleOrderSubmit = async () => {
    if (!user || !order) {
      setGeneralError('Please sign in to complete your order.');
      return;
    }

    // Clear previous errors
    setGeneralError('');
    
    // Validate form
    if (!validateForm()) {
      setGeneralError('Please correct the errors below and try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Save buyer information to user profile
      await saveBuyerInfo(user.uid, buyerInfo);

      // Create the order using the items from custom order
      // For custom orders with multiple items, we'll create multiple orders
      const promises = order.items.map(item => createOrder({
        itemId: item.id,
        itemName: item.name,
        itemImage: item.imageUrl || '', // Use item image or empty string if not available
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        buyerNotes: buyerNotes,
        sellerId: order.sellerId,
        sellerShopId: order.sellerId, // Use sellerId as shopId for custom orders
        sellerShopName: order.sellerName,
        price: item.unitPrice,
        quantity: item.quantity,
        shipping: order.shippingCost / order.items.length, // Distribute shipping cost
        total: (item.unitPrice * item.quantity) + (order.shippingCost / order.items.length),
        paymentMethod: order.paymentMethod === 'COD' ? 'cod' : 'bankTransfer'
      }));

      const createdOrderIds = await Promise.all(promises);

      // Accept the custom order
      await acceptCustomOrder(order.id, buyerInfo.address, buyerInfo.phone);

      // Show success message
      const orderCount = createdOrderIds.length;
      if (orderCount === 1) {
        showToast('success', 'Order created successfully! You can view your order details below.');
      } else {
        showToast('success', `${orderCount} orders created successfully! You can view all order details below.`);
      }
      
      // Redirect to the custom order summary page
      navigate(`/custom-order-summary/${order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      setGeneralError('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: CustomOrder['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = order ? isCustomOrderExpired(order) : false;
  const canAccept = user && order && order.buyerId === user.uid && order.status === 'PENDING' && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-xl text-gray-600">Loading custom order...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The custom order you're looking for doesn't exist or has been removed."}</p>
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
      
      <div className={`${isMobile ? 'max-w-sm px-3 py-6' : 'max-w-6xl px-4 py-8'} mx-auto`}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 ${isMobile ? 'mb-4 text-xs' : 'mb-6 text-sm'} font-medium text-gray-600 hover:text-[#72b01d] transition-colors`}
        >
          <FiArrowLeft size={isMobile ? 16 : 18} />
          Back
        </button>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-2 gap-8'}`}>
          {/* Left Column - Order Information & Buyer Form */}
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            {/* Header */}
            <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
              <div className="flex items-center gap-2 mb-2">
                <FiPackage className="w-6 h-6 text-[#72b01d]" />
                <h1 className="text-2xl font-bold text-gray-900">Custom Order</h1>
              </div>
              <p className="text-gray-600">Order ID: {order.id}</p>
              
              {/* Status */}
              <div className="flex items-center gap-4 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
                {isExpired && (
                  <div className="flex items-center gap-1 text-red-600">
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm font-medium">Expired</span>
                  </div>
                )}
              </div>
            </div>

            {canAccept && (
              <>
                {/* Buyer Information Form */}
                <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${isMobile ? 'mb-3' : 'mb-4'} flex items-center gap-2 text-gray-900`}>
                    <FiShoppingBag size={isMobile ? 18 : 20} />
                    Buyer Information
                  </h2>
                  
                  {/* General Error Message */}
                  {generalError && (
                    <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="text-sm font-medium text-red-700">
                          {generalError}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          First Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={buyerInfo.firstName}
                          onChange={(e) => {
                            setBuyerInfo(prev => ({ ...prev, firstName: e.target.value }));
                            clearFieldError('firstName');
                          }}
                          className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none ${
                            validationErrors.firstName ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                          }`}
                        />
                        {validationErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Last Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={buyerInfo.lastName}
                          onChange={(e) => {
                            setBuyerInfo(prev => ({ ...prev, lastName: e.target.value }));
                            clearFieldError('lastName');
                          }}
                          className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none ${
                            validationErrors.lastName ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                          }`}
                        />
                        {validationErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        required
                        value={buyerInfo.email}
                        onChange={(e) => {
                          setBuyerInfo(prev => ({ ...prev, email: e.target.value }));
                          clearFieldError('email');
                        }}
                        className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none ${
                          validationErrors.email ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                        }`}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        required
                        value={buyerInfo.phone}
                        onChange={(e) => {
                          setBuyerInfo(prev => ({ ...prev, phone: e.target.value }));
                          clearFieldError('phone');
                        }}
                        placeholder="e.g., 0771234567"
                        className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none ${
                          validationErrors.phone ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                        }`}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Address *
                      </label>
                      <textarea
                        required
                        value={buyerInfo.address}
                        onChange={(e) => {
                          setBuyerInfo(prev => ({ ...prev, address: e.target.value }));
                          clearFieldError('address');
                        }}
                        placeholder="Street address, apartment, suite, etc."
                        rows={3}
                        className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none resize-none ${
                          validationErrors.address ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                        }`}
                      />
                      {validationErrors.address && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.address}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-[#72b01d]">
                        <FiTruck className="inline-block mr-1" size={14} />
                        The seller will deliver your order to this address.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          City *
                        </label>
                        <Input
                          type="text"
                          required
                          value={buyerInfo.city}
                          onChange={(e) => {
                            setBuyerInfo(prev => ({ ...prev, city: e.target.value }));
                            clearFieldError('city');
                          }}
                          className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none ${
                            validationErrors.city ? 'border-red-400' : 'border-gray-300 focus:border-[#72b01d]'
                          }`}
                        />
                        {validationErrors.city && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.city}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Postal Code
                        </label>
                        <Input
                          type="text"
                          value={buyerInfo.postalCode}
                          onChange={(e) => setBuyerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#72b01d] transition focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Order Notes (Optional)
                      </label>
                      <textarea
                        value={buyerNotes}
                        onChange={(e) => setBuyerNotes(e.target.value)}
                        placeholder="Any special instructions or notes for the seller..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#72b01d] transition focus:outline-none resize-none"
                      />
                    </div>
                  </form>
                </div>

                {/* Seller Information */}
                <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-[#72b01d]" />
                    Seller Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Seller:</span>
                      <span className="font-medium">{order.sellerName}</span>
                    </div>
                    {order.createdAt && (
                      <div className="flex items-center gap-2">
                        <FiClock className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">
                          {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Seller Information for non-buyers */}
            {!canAccept && (
              <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-[#72b01d]" />
                  Seller Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Seller:</span>
                    <span className="font-medium">{order.sellerName}</span>
                  </div>
                  {order.createdAt && (
                    <div className="flex items-center gap-2">
                      <FiClock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Status Messages for non-pending orders */}
            {!canAccept && (
              <div className="rounded-2xl border border-gray-200 p-6 bg-white">
                {order.status === 'PENDING' && isExpired && (
                  <div className="text-center">
                    <FiClock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h4 className="font-medium text-red-900 mb-1">Order Expired</h4>
                    <p className="text-sm text-red-700">
                      This custom order has expired and can no longer be accepted.
                    </p>
                  </div>
                )}

                {order.status !== 'PENDING' && (
                  <div className="text-center">
                    <FiPackage className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900 mb-1">Order {order.status}</h4>
                    <p className="text-sm text-blue-700">
                      {order.status === 'ACCEPTED' && "Your order has been accepted and is being processed."}
                      {order.status === 'PAID' && "Payment received. Your order is being prepared."}
                      {order.status === 'SHIPPED' && "Your order has been shipped."}
                      {order.status === 'DELIVERED' && "Your order has been delivered."}
                      {order.status === 'CANCELLED' && "This order has been cancelled."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            {/* Order Items */}
            <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover rounded-lg border border-gray-200`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      {/* Fallback placeholder */}
                      <div className={`${!item.imageUrl ? '' : 'hidden'} ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center`}>
                        <FiPackage className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-medium text-gray-900">
                          LKR {(item.quantity * item.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Shipping Info */}
            <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
              <h3 className="text-lg font-semibold mb-4">Payment & Shipping</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTruck className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Shipping Cost:</span>
                  <span className="font-medium">LKR {order.shippingCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Seller Notes */}
            {order.notes && (
              <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
                <h3 className="text-lg font-semibold mb-4">Seller Notes</h3>
                <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Total:</span>
                  <span>LKR {order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span>LKR {order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-[#72b01d]">
                      LKR {(order.totalAmount + order.shippingCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Place Order Section */}
            {canAccept && (
              <div className={`rounded-2xl border border-gray-200 ${isMobile ? 'p-4' : 'p-6'} bg-white`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-[#72b01d]" />
                  Complete Your Order
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Review your information and click below to place your order:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}</li>
                      <li>• Total: LKR {(order.totalAmount + order.shippingCost).toLocaleString()}</li>
                      <li>• Items: {order.items.length} item{order.items.length > 1 ? 's' : ''}</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#72b01d] text-white rounded-xl font-medium hover:bg-[#5a8c17] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <FiPackage className="w-4 h-4" />
                        Place Order
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    By placing this order, you agree to the custom order terms set by the seller.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
