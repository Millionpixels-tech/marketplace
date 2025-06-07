import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { createOrder, updateOrderPaymentStatus, deleteOrderByPayHereId, getOrderByPayHereId } from "../utils/orders";
import { saveBuyerInfo, getBuyerInfo, type BuyerInfo } from "../utils/userProfile";
import { generatePaymentHash } from "../utils/payment/paymentHash";
import type { PaymentHashParams } from "../utils/payment/paymentHash";
import Header from "../components/UI/Header";
import { Input } from "../components/UI";
import { FiArrowLeft, FiShoppingBag, FiTruck, FiCreditCard, FiDollarSign } from "react-icons/fi";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  deliveryType?: 'free' | 'paid';
  deliveryPerItem?: number;
  deliveryAdditional?: number;
  cashOnDelivery?: boolean;
  owner: string;
  shopId?: string;
  shop?: string;
  quantity?: number;
};

type Shop = {
  name: string;
  username: string;
  logo?: string;
  owner: string;
};

// PayHere payment object interface
interface PayHerePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url?: string;
  cancel_url?: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  custom_1?: string;
  custom_2?: string;
}

// PayHere global object type
declare global {
  interface Window {
    payhere: {
      startPayment: (payment: PayHerePayment) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
    currentPayHereOrderId?: string;
  }
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  
  // PayHere merchant credentials from environment variables
  const MERCHANT_ID = import.meta.env.VITE_PAYHERE_MERCHANT_ID;
  const MERCHANT_SECRET = import.meta.env.VITE_PAYHERE_MERCHANT_SECRET;
  const IS_SANDBOX = import.meta.env.VITE_PAYHERE_SANDBOX === 'true';

  // Validate environment variables
  useEffect(() => {
    if (!MERCHANT_ID || !MERCHANT_SECRET) {
      console.error('PayHere credentials not found in environment variables');
      setGeneralError('Payment system is not properly configured. Please contact support.');
    }
  }, [MERCHANT_ID, MERCHANT_SECRET]);
  
  // Get parameters from URL
  const itemId = searchParams.get("itemId");
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const paymentMethodParam = searchParams.get("paymentMethod") as 'cod' | 'paynow' | null;
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paynow'>(paymentMethodParam || 'paynow');
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  
  // Load item and shop data
  useEffect(() => {
    const fetchData = async () => {
      if (!itemId) {
        navigate('/');
        return;
      }
      
      try {
        // Fetch item
        const itemDoc = await getDoc(doc(db, "listings", itemId));
        if (!itemDoc.exists()) {
          alert("Item not found");
          navigate('/');
          return;
        }
        
        const itemData = { id: itemDoc.id, ...itemDoc.data() } as CheckoutItem;
        setItem(itemData);
        
        // Fetch shop
        const shopId = itemData.shopId || itemData.shop;
        if (shopId) {
          const shopDoc = await getDoc(doc(db, "shops", shopId));
          if (shopDoc.exists()) {
            setShop(shopDoc.data() as Shop);
          }
        }
        
        // Set payment method based on item COD availability
        if (itemData.cashOnDelivery && !paymentMethodParam) {
          setPaymentMethod('cod');
        }
        
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        alert("Error loading checkout data");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [itemId, navigate, paymentMethodParam]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setBuyerInfo(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email]);

  // Load saved buyer information when user is available
  useEffect(() => {
    const loadSavedBuyerInfo = async () => {
      if (user?.uid) {
        try {
          const savedInfo = await getBuyerInfo(user.uid);
          if (savedInfo) {
            setBuyerInfo(savedInfo);
          }
        } catch (error) {
          console.error("Error loading saved buyer info:", error);
        }
      }
    };

    loadSavedBuyerInfo();
  }, [user?.uid]);

  // Load PayHere script and setup callbacks
  useEffect(() => {
    const loadPayHereScript = () => {
      if (window.payhere) {
        setScriptLoaded(true);
        setupPayHereCallbacks();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.type = 'text/javascript';
      script.onload = () => {
        setScriptLoaded(true);
        setupPayHereCallbacks();
      };
      script.onerror = () => {
        console.error('Failed to load PayHere script');
      };
      document.head.appendChild(script);
    };

    loadPayHereScript();

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src="https://www.payhere.lk/lib/payhere.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Setup PayHere event callbacks
  const setupPayHereCallbacks = () => {
    if (!window.payhere) return;

    // Payment completed callback
    window.payhere.onCompleted = async function(orderId: string) {
      console.log("Payment completed. OrderID:" + orderId);
      setPaymentProcessing(false);
      setSubmitting(false);
      
      try {
        // Update order status to 'completed' in database
        await updateOrderPaymentStatus(orderId, 'completed');
        console.log("Order status updated to completed");
        
        // Get the order document to get its database ID for navigation
        const order = await getOrderByPayHereId(orderId);
        if (order && order.id) {
          // Navigate to the order summary page
          navigate(`/order/${order.id}`);
        } else {
          // Fallback to dashboard if we can't find the order
          navigate('/dashboard/' + user?.uid);
        }
        
      } catch (error) {
        console.error("Error updating order status:", error);
        // Still navigate to dashboard as payment was successful
        navigate('/dashboard/' + user?.uid);
      }
    };

    // Payment window closed callback
    window.payhere.onDismissed = async function() {
      console.log("Payment dismissed");
      setPaymentProcessing(false);
      setSubmitting(false);
      setPaymentCancelled(true);
      
      // Delete the pending order from the database since payment was cancelled
      try {
        // We need to get the current order ID that was being processed
        // This should be stored when payment starts
        const currentOrderId = window.currentPayHereOrderId;
        if (currentOrderId) {
          await deleteOrderByPayHereId(currentOrderId);
          console.log("Pending order deleted due to payment cancellation");
        }
      } catch (error) {
        console.error("Error deleting cancelled order:", error);
      }
      
      setGeneralError("Payment was cancelled. Please try again to complete your order.");
    };

    // Error callback
    window.payhere.onError = async function(error: string) {
      console.log("PayHere Error: " + error);
      setPaymentProcessing(false);
      setSubmitting(false);
      setPaymentCancelled(true);
      
      // Delete the pending order from the database since payment failed
      try {
        const currentOrderId = window.currentPayHereOrderId;
        if (currentOrderId) {
          await deleteOrderByPayHereId(currentOrderId);
          console.log("Pending order deleted due to payment failure");
        }
      } catch (error) {
        console.error("Error deleting failed order:", error);
      }
      
      setGeneralError("Payment failed: " + error + ". Please try again or contact support.");
    };
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!item) return { subtotal: 0, shipping: 0, total: 0 };
    
    const price = Number(item.price || 0);
    const subtotal = price * quantity;
    
    let shipping = 0;
    if (item.deliveryType === "paid") {
      const deliveryPerItem = Number(item.deliveryPerItem || 0);
      const deliveryAdditional = Number(item.deliveryAdditional || 0);
      shipping = deliveryPerItem + (quantity > 1 ? deliveryAdditional * (quantity - 1) : 0);
    }
    
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  };

  const { subtotal, shipping, total } = calculateTotals();

  // Validation functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setGeneralError('');

    // Required fields validation
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email Address' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' }
    ];

    requiredFields.forEach(field => {
      const value = buyerInfo[field.key as keyof BuyerInfo];
      if (!value || !value.toString().trim()) {
        errors[field.key] = `${field.label} is required`;
      }
    });

    // Email format validation
    if (buyerInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(buyerInfo.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Phone number validation
    if (buyerInfo.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = buyerInfo.phone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear specific field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Generate unique order ID
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORDER_${timestamp}_${random}`;
  };

  // Handle Cash on Delivery order
  const handleCODOrder = async () => {
    if (!item || !shop || !user) {
      setGeneralError("Missing required data. Please refresh the page and try again.");
      return;
    }
    
    try {
      setSubmitting(true);
      setGeneralError('');
      
      // Save buyer information to user profile first
      await saveBuyerInfo(user.uid, buyerInfo);
      
      // Create order with buyer information
      await createOrder({
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: Number(item.price || 0),
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: 'cod',
      });
      
      alert("Order placed successfully with Cash on Delivery! You'll receive a confirmation shortly.");
      navigate('/dashboard/' + user.uid);
      
    } catch (error) {
      console.error("Error creating COD order:", error);
      setGeneralError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PayHere payment
  const handlePayHerePayment = async () => {
    if (!item || !shop || !user) {
      setGeneralError("Missing required data. Please refresh the page and try again.");
      return;
    }

    if (!scriptLoaded || !window.payhere) {
      setGeneralError('PayHere payment system is not ready. Please try again in a moment.');
      return;
    }

    try {
      setSubmitting(true);
      setPaymentProcessing(true);
      setGeneralError('');

      // Save buyer information first
      await saveBuyerInfo(user.uid, buyerInfo);

      // Generate unique order ID
      const orderId = generateOrderId();

      // Prepare hash parameters
      const hashParams: PaymentHashParams = {
        merchant_id: MERCHANT_ID,
        order_id: orderId,
        amount: total.toFixed(2),
        currency: 'LKR',
        merchant_secret: MERCHANT_SECRET
      };

      // Generate hash using our utility function
      const hashResult = await generatePaymentHash(hashParams);

      if (!hashResult.success) {
        throw new Error(hashResult.error || 'Failed to generate payment hash');
      }

      // Create order in database before payment (with pending status)
      const dbOrderId = await createOrder({
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: Number(item.price || 0),
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: 'paynow',
        paymentStatus: 'pending',
        orderId: orderId
      });

      console.log(`Order created in database with ID: ${dbOrderId}, PayHere Order ID: ${orderId}`);

      // Prepare PayHere payment object
      const payment: PayHerePayment = {
        sandbox: IS_SANDBOX,
        merchant_id: MERCHANT_ID,
        return_url: undefined,
        cancel_url: undefined,
        notify_url: `${window.location.origin}/api/payhere/notify`, // You'll need to implement this endpoint
        order_id: orderId,
        items: `${item.name} (Qty: ${quantity})`,
        amount: total.toFixed(2),
        currency: 'LKR',
        hash: hashResult.hash,
        first_name: buyerInfo.firstName,
        last_name: buyerInfo.lastName,
        email: buyerInfo.email,
        phone: buyerInfo.phone.replace(/\s+/g, ''), // Use cleaned phone number
        address: buyerInfo.address,
        city: buyerInfo.city,
        country: 'Sri Lanka',
        delivery_address: buyerInfo.address,
        delivery_city: buyerInfo.city,
        delivery_country: 'Sri Lanka',
        custom_1: item.id, // Store item ID for reference
        custom_2: user.uid  // Store buyer ID for reference
      };

      console.log('Initiating PayHere payment:', {
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        items: payment.items,
        merchant_id: payment.merchant_id,
        sandbox: payment.sandbox
      });

      // Store the order ID globally for use in callbacks
      window.currentPayHereOrderId = orderId;

      // Start PayHere payment
      window.payhere.startPayment(payment);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('PayHere payment error:', error);
      setGeneralError('Failed to process payment: ' + errorMessage);
      setSubmitting(false);
      setPaymentProcessing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous general error and cancelled status
    setGeneralError('');
    setPaymentCancelled(false);
    
    // Validate form
    if (!validateForm()) {
      setGeneralError('Please correct the errors below and try again.');
      return;
    }

    // Route to appropriate payment method
    if (paymentMethod === 'cod') {
      await handleCODOrder();
    } else {
      await handlePayHerePayment();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <span className="text-xl" style={{ color: '#454955' }}>Loading checkout...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center" style={{ color: '#454955' }}>
          <div className="text-2xl font-bold mb-2">Item Not Found</div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-lg font-medium transition"
            style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-sm font-medium transition"
          style={{ color: '#454955' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#72b01d'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#454955'}
        >
          <FiArrowLeft size={18} />
          Back to Product
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Buyer Information Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#0d0a0b' }}>
                <FiShoppingBag size={20} />
                Buyer Information
              </h2>
              
              {/* General Error Message */}
              {generalError && (
                <div className="mb-4 p-4 rounded-xl border" style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  borderColor: 'rgba(239, 68, 68, 0.3)' 
                }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ef4444' }}>
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#dc2626' }}>
                      {generalError}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Cancelled Status */}
              {paymentCancelled && (
                <div className="mb-4 p-4 rounded-xl border" style={{ 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                  borderColor: 'rgba(251, 191, 36, 0.3)' 
                }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f59e0b' }}>
                      <span className="text-white text-xs font-bold">⚠</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#d97706' }}>
                      Order Cancelled - Payment was not completed. Please retry your order.
                    </span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
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
                      className={validationErrors.firstName ? 'border-red-400' : ''}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: validationErrors.firstName ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      onFocus={(e) => e.target.style.borderColor = validationErrors.firstName ? '#ef4444' : '#72b01d'}
                      onBlur={(e) => e.target.style.borderColor = validationErrors.firstName ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerInfo.lastName}
                      onChange={(e) => {
                        setBuyerInfo(prev => ({ ...prev, lastName: e.target.value }));
                        clearFieldError('lastName');
                      }}
                      className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 ${
                        validationErrors.lastName ? 'border-red-400' : ''
                      }`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: validationErrors.lastName ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      onFocus={(e) => e.target.style.borderColor = validationErrors.lastName ? '#ef4444' : '#72b01d'}
                      onBlur={(e) => e.target.style.borderColor = validationErrors.lastName ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerInfo.email}
                    onChange={(e) => {
                      setBuyerInfo(prev => ({ ...prev, email: e.target.value }));
                      clearFieldError('email');
                    }}
                    className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 ${
                      validationErrors.email ? 'border-red-400' : ''
                    }`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: validationErrors.email ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.email ? '#ef4444' : '#72b01d'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.email ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                      {validationErrors.email}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerInfo.phone}
                    onChange={(e) => {
                      setBuyerInfo(prev => ({ ...prev, phone: e.target.value }));
                      clearFieldError('phone');
                    }}
                    placeholder="e.g., 0771234567"
                    className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 ${
                      validationErrors.phone ? 'border-red-400' : ''
                    }`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: validationErrors.phone ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.phone ? '#ef4444' : '#72b01d'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.phone ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                      {validationErrors.phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
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
                    className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 resize-none ${
                      validationErrors.address ? 'border-red-400' : ''
                    }`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: validationErrors.address ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    onFocus={(e) => e.target.style.borderColor = validationErrors.address ? '#ef4444' : '#72b01d'}
                    onBlur={(e) => e.target.style.borderColor = validationErrors.address ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                  />
                  {validationErrors.address && (
                    <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                      {validationErrors.address}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerInfo.city}
                      onChange={(e) => {
                        setBuyerInfo(prev => ({ ...prev, city: e.target.value }));
                        clearFieldError('city');
                      }}
                      className={`w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 ${
                        validationErrors.city ? 'border-red-400' : ''
                      }`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: validationErrors.city ? '#f87171' : 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      onFocus={(e) => e.target.style.borderColor = validationErrors.city ? '#ef4444' : '#72b01d'}
                      onBlur={(e) => e.target.style.borderColor = validationErrors.city ? '#f87171' : 'rgba(114, 176, 29, 0.3)'}
                    />
                    {validationErrors.city && (
                      <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
                        {validationErrors.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={buyerInfo.postalCode}
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(114, 176, 29, 0.3)',
                        color: '#0d0a0b'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d0a0b' }}>
                <FiCreditCard size={18} />
                Payment Method
              </h3>
              
              <div className="space-y-3">
                {item.cashOnDelivery && (
                  <label className="flex items-center p-4 rounded-xl border cursor-pointer transition"
                    style={{
                      backgroundColor: paymentMethod === 'cod' ? 'rgba(114, 176, 29, 0.1)' : '#ffffff',
                      borderColor: paymentMethod === 'cod' ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                    }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <FiDollarSign size={20} style={{ color: '#72b01d' }} />
                      <div>
                        <div className="font-medium" style={{ color: '#0d0a0b' }}>Cash on Delivery</div>
                        <div className="text-sm" style={{ color: '#454955' }}>Pay when you receive the item</div>
                      </div>
                    </div>
                  </label>
                )}
                
                <label className="flex items-center p-4 rounded-xl border cursor-pointer transition"
                  style={{
                    backgroundColor: paymentMethod === 'paynow' ? 'rgba(114, 176, 29, 0.1)' : '#ffffff',
                    borderColor: paymentMethod === 'paynow' ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paynow"
                    checked={paymentMethod === 'paynow'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'paynow')}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-3">
                    <FiCreditCard size={20} style={{ color: '#72b01d' }} />
                    <div>
                      <div className="font-medium" style={{ color: '#0d0a0b' }}>Pay with PayHere</div>
                      <div className="text-sm" style={{ color: '#454955' }}>Secure online payment via PayHere</div>
                      <div className="text-xs mt-1" style={{ color: '#72b01d' }}>
                        Visa • MasterCard • American Express • Local Banks
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border p-6 sticky top-8" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#0d0a0b' }}>Order Summary</h3>
              
              {/* Product Details */}
              <div className="flex gap-4 mb-6 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: '#454955' }}>
                      🖼️
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg mb-1 leading-tight" style={{ color: '#0d0a0b' }}>{item.name}</h4>
                  {shop && (
                    <p className="text-sm mb-1" style={{ color: '#454955' }}>From {shop.name}</p>
                  )}
                  <p className="text-sm" style={{ color: '#454955' }}>Quantity: {quantity}</p>
                  <p className="font-semibold" style={{ color: '#0d0a0b' }}>LKR {item.price?.toLocaleString()}</p>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FiTruck size={18} style={{ color: '#72b01d' }} />
                  <span className="font-medium" style={{ color: '#0d0a0b' }}>Delivery</span>
                </div>
                {item.deliveryType === 'free' ? (
                  <p className="text-sm font-medium" style={{ color: '#72b01d' }}>Free Delivery</p>
                ) : (
                  <p className="text-sm" style={{ color: '#454955' }}>
                    Delivery charges will apply based on location
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span style={{ color: '#454955' }}>Subtotal ({quantity} items)</span>
                  <span style={{ color: '#0d0a0b' }}>LKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#454955' }}>Shipping</span>
                  <span style={{ color: shipping > 0 ? '#0d0a0b' : '#72b01d' }}>
                    {shipping > 0 ? `LKR ${shipping.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                <hr style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }} />
                <div className="flex justify-between text-lg font-bold">
                  <span style={{ color: '#0d0a0b' }}>Total</span>
                  <span style={{ color: '#0d0a0b' }}>LKR {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || (paymentMethod === 'paynow' && (!scriptLoaded || paymentProcessing))}
                className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#72b01d',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!submitting && !(paymentMethod === 'paynow' && (!scriptLoaded || paymentProcessing))) {
                    e.currentTarget.style.backgroundColor = '#3f7d20';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && !(paymentMethod === 'paynow' && (!scriptLoaded || paymentProcessing))) {
                    e.currentTarget.style.backgroundColor = '#72b01d';
                  }
                }}
              >
                {submitting && paymentProcessing ? 'Processing Payment...' :
                 submitting ? 'Placing Order...' : 
                 paymentMethod === 'cod' ? 'Place Order (COD)' : 
                 !scriptLoaded ? 'Loading Payment...' : 'Pay with PayHere'}
              </button>
              
              {paymentMethod === 'paynow' && !scriptLoaded && (
                <p className="text-xs text-center mt-2" style={{ color: '#454955' }}>
                  Loading PayHere payment system...
                </p>
              )}
              
              {paymentMethod === 'paynow' && scriptLoaded && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCreditCard size={16} style={{ color: '#72b01d' }} />
                    <span className="text-sm font-medium" style={{ color: '#0d0a0b' }}>
                      Secure Payment with PayHere
                    </span>
                  </div>
                  <ul className="text-xs space-y-1" style={{ color: '#454955' }}>
                    <li>• Payment processed securely via PayHere</li>
                    <li>• Supports Visa, MasterCard, and local banks</li>
                    <li>• SSL encrypted transaction</li>
                  </ul>
                </div>
              )}
              
              <p className="text-xs text-center mt-3" style={{ color: '#454955' }}>
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
