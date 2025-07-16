// src/pages/order/CustomOrderPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomOrder, acceptCustomOrder, isCustomOrderExpired, updateCustomOrderBuyer } from "../../utils/customOrders";
import { saveBuyerInfo, getBuyerInfo, type BuyerInfo } from "../../utils/userProfile";
import { createOrder } from "../../utils/orders";
import { sendCustomOrderAcceptanceEmails } from "../../utils/emailService";
import { auth } from "../../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { Input } from "../../components/UI";
import { useResponsive } from "../../hooks/useResponsive";
import { useToast } from "../../context/ToastContext";
import { FiPackage, FiClock, FiUser, FiCreditCard, FiTruck, FiAlertCircle, FiArrowLeft, FiShoppingBag, FiLock } from "react-icons/fi";
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
  
  // Authentication state for guest users
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoadingState, setAuthLoadingState] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
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

  // Update buyer info email when user signs in
  useEffect(() => {
    if (user?.email && !buyerInfo.email) {
      setBuyerInfo(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email, buyerInfo.email]);

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

  // Authentication functions for guest users
  const handleEmailAuth = async () => {
    setAuthError('');
    setAuthLoadingState(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
      // User will be automatically updated through useAuth hook
      setShowAuth(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
    }
    setAuthLoadingState(false);
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthLoadingState(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuth(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setAuthError(errorMessage);
    }
    setAuthLoadingState(false);
  };

  const handlePlaceOrder = async () => {
    await handleOrderSubmit();
  };

  const handleOrderSubmit = async () => {
    if (!user || !order) {
      setGeneralError('Please sign in to complete your order.');
      setShowAuth(true);
      return;
    }

    // Clear previous errors
    setGeneralError('');
    setShowAuth(false);
    
    // Validate form
    if (!validateForm()) {
      setGeneralError('Please correct the errors below and try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Check if current user is different from original buyer and update if needed
      if (order.buyerId !== user.uid) {
        // Get user's display name or construct one from buyer info
        const buyerName = buyerInfo.firstName && buyerInfo.lastName 
          ? `${buyerInfo.firstName} ${buyerInfo.lastName}`
          : user.displayName || buyerInfo.email;
        
        // Update the custom order to reflect the new buyer
        await updateCustomOrderBuyer(order.id, user.uid, buyerName);
        
        // Update the local order state to reflect the change
        setOrder(prev => prev ? { ...prev, buyerId: user.uid, buyerName } : null);
      }

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
        paymentMethod: order.paymentMethod === 'COD' ? 'cod' : 'bankTransfer',
        customOrderId: order.id // Add reference to the custom order
      }));

      const createdOrderIds = await Promise.all(promises);

      // Accept the custom order
      await acceptCustomOrder(order.id, buyerInfo.address, buyerInfo.phone);

      // Send consolidated custom order acceptance emails
      try {
        const { getSellerEmailById } = await import('../../utils/orders');
        const sellerEmail = await getSellerEmailById(order.sellerId);
        
        if (sellerEmail) {
          // Prepare order data for email templates
          const emailOrders = createdOrderIds.map((orderId, index) => ({
            id: orderId,
            itemName: order.items[index].name,
            quantity: order.items[index].quantity,
            total: (order.items[index].unitPrice * order.items[index].quantity) + (order.shippingCost / order.items.length)
          }));

          // Prepare custom order data for email templates
          const customOrderForEmail = {
            ...order,
            buyerEmail: buyerInfo.email,
            buyerAddress: buyerInfo.address,
            buyerPhone: buyerInfo.phone
          };

          await sendCustomOrderAcceptanceEmails(
            customOrderForEmail,
            emailOrders,
            sellerEmail
          );
        } else {
          //console.warn('❌ Could not find seller email for custom order acceptance notifications');
        }
      } catch (emailError) {
        //console.error('❌ Error sending custom order acceptance emails:', emailError);
        // Don't fail the order creation if email fails
      }

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
  const canView = order && order.status === 'PENDING' && !isExpired; // Allow anyone to view pending, non-expired orders

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
      <div className="min-h-screen bg-white flex flex-col">
        <ResponsiveHeader />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-lg w-full text-center">
            {/* 404 Illustration */}
            <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
              <div className="relative">
                <h1 className={`${isMobile ? 'text-8xl' : 'text-9xl'} font-bold text-gray-100 select-none`}>
                  404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiPackage className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} text-[#72b01d]`} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4`}>
                  Order Not Found
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {error || "The custom order you're looking for doesn't exist or has been removed."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'} mt-8`}>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#72b01d] text-white font-semibold rounded-xl hover:bg-[#5a8c17] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FiShoppingBag className="w-5 h-5" />
                  Browse Marketplace
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveHeader />
      
      <div className={`${isMobile ? 'max-w-sm px-3 py-6' : 'max-w-6xl px-4 py-8'} mx-auto`}>
        {/* Authentication Section for Guest Users */}
        {!user && (
          <div className={`${isMobile ? 'mb-4 p-3' : 'mb-6 p-4'} rounded-xl border`} style={{ 
            backgroundColor: 'rgba(114, 176, 29, 0.05)', 
            borderColor: 'rgba(114, 176, 29, 0.2)' 
          }}>
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <FiUser size={isMobile ? 16 : 18} style={{ color: '#72b01d' }} />
              <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`} style={{ color: '#454955' }}>
                Sign in to accept this custom order
              </span>
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-3`}>
              To accept and place this custom order, please sign in to your account or create a new one.
            </p>
            
            {!showAuth ? (
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col sm:flex-row gap-2'}`}>
                <button
                  type="button"
                  onClick={() => setShowAuth(true)}
                  className={`flex items-center justify-center gap-2 ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition flex-1`}
                  style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3f7d20'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#72b01d'}
                >
                  <FiLock size={16} />
                  Sign in / Create Account
                </button>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={authLoadingState}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition flex-1"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: 'rgba(114, 176, 29, 0.3)',
                    color: '#454955'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#72b01d'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.6 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6.5-6.5C34.4 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 18.7-7.2 19.8-17H44.5z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {authError && (
                  <div className="text-red-500 text-sm font-medium">{authError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleEmailAuth}
                    disabled={authLoadingState}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition flex-1"
                    style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                  >
                    {authLoadingState ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="px-4 py-2 text-sm font-medium transition"
                    style={{ color: '#72b01d' }}
                  >
                    {authMode === 'login' ? 'Create account instead' : 'Sign in instead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuth(false)}
                    className="px-4 py-2 text-sm font-medium transition"
                    style={{ color: '#454955' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

            {canView && (
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
            {!canView && (
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
            {!canView && (
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
            {canView && (
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
                        {user ? 'Place Order' : 'Sign In & Place Order'}
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    {user 
                      ? 'By placing this order, you agree to the custom order terms set by the seller.'
                      : 'You will be prompted to sign in before placing the order.'
                    }
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
