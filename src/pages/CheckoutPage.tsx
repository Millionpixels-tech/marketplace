import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { createOrder } from "../utils/orders";
import { saveBuyerInfo, getBuyerInfo, type BuyerInfo } from "../utils/userProfile";
import { checkStockAvailability } from "../utils/stockManagement";
// Payment hash imports - Currently disabled as online payments are not provided
// import { generatePaymentHash } from "../utils/payment/paymentHash";
// import type { PaymentHashParams } from "../utils/payment/paymentHash";
import { PaymentMethod, DeliveryType, PaymentStatus } from "../types/enums";
import type { PaymentMethod as PaymentMethodType, DeliveryType as DeliveryTypeType } from "../types/enums";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { Input } from "../components/UI";
import { useResponsive } from "../hooks/useResponsive";
import { useToast } from "../context/ToastContext";
import { checkBuyerReports, checkBuyerVerification, getBuyerStatusMessage, shouldBlockBuyer, type BuyerReportStatus } from "../utils/buyerVerification";
import BuyerStatusWarning from "../components/UI/BuyerStatusWarning";
import { FiArrowLeft, FiShoppingBag, FiTruck, FiCreditCard, FiDollarSign, FiUser, FiLock } from "react-icons/fi";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  itemType?: string;
  sellerNotes?: string;
  deliveryType?: DeliveryTypeType;
  deliveryPerItem?: number;
  deliveryAdditional?: number;
  cashOnDelivery?: boolean;
  bankTransfer?: boolean;
  owner: string;
  shopId?: string;
  shop?: string;
  quantity?: number;
  hasVariations?: boolean;
  variations?: Array<{
    id: string;
    name: string;
    priceChange: number;
    quantity: number;
  }>;
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
  const { isMobile } = useResponsive();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<{id: string; name: string; priceChange: number; quantity: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Payment processing and script loading states - Currently disabled as online payments are not provided
  // const [paymentProcessing, setPaymentProcessing] = useState(false);
  // const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  
  // Authentication state for guest users
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // Note: Online payments are currently disabled
  // PayHere credentials would be used here when online payments are enabled
  // const MERCHANT_ID = import.meta.env.VITE_PAYHERE_MERCHANT_ID;
  // const MERCHANT_SECRET = import.meta.env.VITE_PAYHERE_MERCHANT_SECRET;
  // const IS_SANDBOX = import.meta.env.VITE_PAYHERE_SANDBOX === 'true';
  
  // Get parameters from URL
  const itemId = searchParams.get("itemId");
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const paymentMethodParam = searchParams.get("paymentMethod") as PaymentMethodType | null;
  const variationId = searchParams.get("variationId");
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(paymentMethodParam || PaymentMethod.CASH_ON_DELIVERY);
  const [buyerNotes, setBuyerNotes] = useState<string>('');
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  
  // Buyer verification state
  const [buyerReportStatus, setBuyerReportStatus] = useState<BuyerReportStatus>({
    hasReports: false,
    reportCount: 0,
    isBlocked: false,
    needsVerification: false
  });
  const [isVerified, setIsVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  
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
          showToast('error', 'Item not found');
          navigate('/');
          return;
        }
        
        const itemData = { id: itemDoc.id, ...itemDoc.data() } as CheckoutItem;
        setItem(itemData);
        
        // Set selected variation if variationId is provided
        if (variationId && itemData.hasVariations && itemData.variations) {
          const variation = itemData.variations.find(v => v.id === variationId);
          if (variation) {
            setSelectedVariation(variation);
          }
        }
        
        // Batch shop fetch if shopId exists
        const shopId = itemData.shopId || itemData.shop;
        if (shopId) {
          // Fetch shop in parallel to improve performance
          const shopDoc = await getDoc(doc(db, "shops", shopId));
          if (shopDoc.exists()) {
            setShop(shopDoc.data() as Shop);
          }
        }
        
        // Set payment method based on item's available payment options
        if (!paymentMethodParam) {
          // If no payment method specified, choose based on what's available
          if (itemData.cashOnDelivery && itemData.bankTransfer) {
            // If both are available, default to COD (customer preference)
            setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
          } else if (itemData.cashOnDelivery) {
            setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
          } else if (itemData.bankTransfer) {
            setPaymentMethod(PaymentMethod.BANK_TRANSFER);
          }
        }
        
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        showToast('error', 'Error loading checkout data');
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
      // Reset auth form when user logs in
      setShowAuth(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthError('');
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

  // Check buyer verification status
  useEffect(() => {
    const checkBuyerStatus = async () => {
      if (!user?.uid) {
        setVerificationLoading(false);
        return;
      }

      try {
        setVerificationLoading(true);
        
        // Check if buyer has reports against them
        const reportStatus = await checkBuyerReports(user.uid);
        setBuyerReportStatus(reportStatus);
        
        // Check if buyer is verified
        const verified = await checkBuyerVerification(user.uid);
        setIsVerified(verified);
        
      } catch (error) {
        console.error('Error checking buyer status:', error);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkBuyerStatus();
  }, [user?.uid]);

  // PayHere script loading - Currently disabled as online payments are not provided
  /*
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
  */

  // Setup PayHere event callbacks - Currently disabled as online payments are not provided
  /*
  const setupPayHereCallbacks = () => {
    if (!window.payhere) return;

    // Payment completed callback
    window.payhere.onCompleted = async function(orderId: string) {
      console.log("Payment completed. OrderID:" + orderId);
      setPaymentProcessing(false);
      setSubmitting(false);
      
      try {
        // Update order status to 'completed' in database
        await updateOrderPaymentStatus(orderId, PaymentStatus.COMPLETED);
        console.log("Order status updated to completed");
        
        // Get the order document to get its database ID for navigation
        const order = await getOrderByPayHereId(orderId);
        if (order && order.id) {
          // Navigate to the order summary page
          navigate(`/order/${order.id}`);
        } else {
          // Fallback to dashboard if we can't find the order
          navigate('/dashboard');
        }
        
      } catch (error) {
        console.error("Error updating order status:", error);
        // Still navigate to dashboard as payment was successful
        navigate('/dashboard');
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
  */

  // Calculate totals
  const calculateTotals = () => {
    if (!item) return { subtotal: 0, shipping: 0, total: 0 };
    
    const basePrice = Number(item.price || 0);
    const variationPriceChange = selectedVariation?.priceChange || 0;
    const price = basePrice + variationPriceChange;
    const subtotal = price * quantity;
    
    let shipping = 0;
    if (item.deliveryType === DeliveryType.PAID) {
      const deliveryPerItem = Number(item.deliveryPerItem || 0);
      const deliveryAdditional = Number(item.deliveryAdditional || 0);
      shipping = deliveryPerItem + (quantity > 1 ? deliveryAdditional * (quantity - 1) : 0);
    }
    
    const total = subtotal + shipping;
    return { subtotal, shipping, total, price };
  };

  const { subtotal, shipping, total, price } = calculateTotals();

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

  // Generate unique order ID - Currently used only for PayHere (disabled)
  /*
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORDER_${timestamp}_${random}`;
  };
  */

  // Handle Bank Transfer order
  const handleBankTransferOrder = async () => {
    if (!item || !shop || !user) {
      setGeneralError("Missing required data. Please refresh the page and try again.");
      return;
    }

    try {
      setSubmitting(true);
      setGeneralError("");

      // Check stock availability before proceeding with order
      const stockCheck = await checkStockAvailability(
        item.id,
        quantity,
        selectedVariation?.id
      );

      if (!stockCheck.available) {
        if (stockCheck.error) {
          setGeneralError(stockCheck.error);
        } else {
          const itemName = selectedVariation ? `${item.name} (${selectedVariation.name})` : item.name;
          setGeneralError(`Insufficient stock for ${itemName}. Available: ${stockCheck.currentStock}, Requested: ${quantity}`);
        }
        return;
      }

      // Save buyer information to user profile first
      await saveBuyerInfo(user.uid, buyerInfo);
      
      // Create order with buyer information and get the order ID
      const orderData: any = {
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: price, // Use calculated price including variation
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PENDING,
        // Include variation information if selected
        ...(selectedVariation && {
          variationId: selectedVariation.id,
          variationName: selectedVariation.name,
          variationPriceChange: selectedVariation.priceChange
        }),
        // Include seller notes if they exist
        ...(item.sellerNotes && { sellerNotes: item.sellerNotes })
      };

      // Only add buyerNotes if it has content
      if (buyerNotes.trim()) {
        orderData.buyerNotes = buyerNotes.trim();
      }

      const orderId = await createOrder(orderData);
      
      // Redirect to order summary page
      navigate('/order/' + orderId);
      
    } catch (error) {
      console.error("Error creating bank transfer order:", error);
      setGeneralError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      
      // Check stock availability before proceeding with order
      const stockCheck = await checkStockAvailability(
        item.id,
        quantity,
        selectedVariation?.id
      );

      if (!stockCheck.available) {
        if (stockCheck.error) {
          setGeneralError(stockCheck.error);
        } else {
          const itemName = selectedVariation ? `${item.name} (${selectedVariation.name})` : item.name;
          setGeneralError(`Insufficient stock for ${itemName}. Available: ${stockCheck.currentStock}, Requested: ${quantity}`);
        }
        return;
      }
      
      // Save buyer information to user profile first
      await saveBuyerInfo(user.uid, buyerInfo);
      
      // Create order with buyer information and get the order ID
      const orderData: any = {
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: price, // Use calculated price including variation
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        // Include variation information if selected
        ...(selectedVariation && {
          variationId: selectedVariation.id,
          variationName: selectedVariation.name,
          variationPriceChange: selectedVariation.priceChange
        }),
        // Include seller notes if they exist
        ...(item.sellerNotes && { sellerNotes: item.sellerNotes })
      };

      // Only add buyerNotes if it has content
      if (buyerNotes.trim()) {
        orderData.buyerNotes = buyerNotes.trim();
      }

      const orderId = await createOrder(orderData);
      
      // Redirect to order summary page
      navigate('/order/' + orderId);
      
    } catch (error) {
      console.error("Error creating COD order:", error);
      setGeneralError("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PayHere payment - Currently disabled as online payments are not provided
  /*
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
      const orderData2: any = {
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo,
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: price, // Use calculated price including variation
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: PaymentMethod.PAY_NOW,
        paymentStatus: PaymentStatus.PENDING,
        orderId: orderId,
        // Include variation information if selected
        ...(selectedVariation && {
          variationId: selectedVariation.id,
          variationName: selectedVariation.name,
          variationPriceChange: selectedVariation.priceChange
        }),
        // Include seller notes if they exist
        ...(item.sellerNotes && { sellerNotes: item.sellerNotes })
      };

      // Only add buyerNotes if it has content
      if (buyerNotes.trim()) {
        orderData2.buyerNotes = buyerNotes.trim();
      }

      const dbOrderId = await createOrder(orderData2);

      console.log(`Order created in database with ID: ${dbOrderId}, PayHere Order ID: ${orderId}`);

      // Prepare PayHere payment object
      const payment: PayHerePayment = {
        sandbox: IS_SANDBOX,
        merchant_id: MERCHANT_ID,
        return_url: undefined,
        cancel_url: undefined,
        notify_url: `${window.location.origin}/api/payhere/notify`, // You'll need to implement this endpoint
        order_id: orderId,
        items: `${item.name}${selectedVariation ? ` - ${selectedVariation.name}` : ''} (Qty: ${quantity})`,
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
  */

  // Authentication functions for guest users
  const handleEmailAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
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
    setAuthLoading(false);
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuth(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setAuthError(errorMessage);
    }
    setAuthLoading(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous general error and cancelled status
    setGeneralError('');
    setPaymentCancelled(false);
    
    // Check if user is authenticated
    if (!user) {
      setGeneralError('Please sign in or create an account to complete your order.');
      //setShowAuth(true);
      // Scroll to top to show the auth form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Check buyer verification status
    if (shouldBlockBuyer(buyerReportStatus, isVerified)) {
      if (!isVerified) {
        setGeneralError('Your account requires verification before placing orders. Go to Settings to submit documents for verification or contact customer support.');
      } else {
        setGeneralError('Your account has too many reports from sellers. Please contact customer support to resolve these issues before placing orders.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setGeneralError('Please correct the errors below and try again.');
      return;
    }

    // Route to appropriate payment method
    if (paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      await handleCODOrder();
    } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
      await handleBankTransferOrder();
    } else {
      // Online payments are currently not available
      setGeneralError('The selected payment method is currently not available. Please choose Cash on Delivery or Bank Transfer.');
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
    <>
      <SEOHead
        title="Checkout - SinaMarketplace"
        description="Complete your purchase securely on SinaMarketplace. Choose from Cash on Delivery or Bank Transfer payment options."
        keywords="checkout, payment, secure purchase, Sri Lanka, online shopping, cash on delivery, bank transfer"
        canonicalUrl="https://sinamarketplace.com/checkout"
        noIndex={true}
      />
      <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
        <ResponsiveHeader />
      
      <div className={`${isMobile ? 'max-w-sm px-3 py-6' : 'max-w-6xl px-4 py-8'} mx-auto`}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 ${isMobile ? 'mb-4 text-xs' : 'mb-6 text-sm'} font-medium transition`}
          style={{ color: '#454955' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#72b01d'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#454955'}
        >
          <FiArrowLeft size={isMobile ? 16 : 18} />
          Back to Product
        </button>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'lg:grid-cols-2 gap-8'}`}>
          {/* Left Column - Buyer Information Form */}
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            <div className={`rounded-2xl border ${isMobile ? 'p-4' : 'p-6'}`} style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${isMobile ? 'mb-3' : 'mb-4'} flex items-center gap-2`} style={{ color: '#0d0a0b' }}>
                <FiShoppingBag size={isMobile ? 18 : 20} />
                Buyer Information
              </h2>
              
              {/* Buyer Status Warning */}
              {user && !verificationLoading && (
                <BuyerStatusWarning
                  {...getBuyerStatusMessage(buyerReportStatus, isVerified)}
                />
              )}
              
              {/* Authentication Section for Guest Users */}
              {!user && (
                <div className={`${isMobile ? 'mb-4 p-3' : 'mb-6 p-4'} rounded-xl border`} style={{ 
                  backgroundColor: 'rgba(114, 176, 29, 0.05)', 
                  borderColor: 'rgba(114, 176, 29, 0.2)' 
                }}>
                  <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                    <FiUser size={isMobile ? 16 : 18} style={{ color: '#72b01d' }} />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: '#454955' }}>
                      Sign in to save your information and track your order
                    </span>
                  </div>
                  
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
                        disabled={authLoading}
                        className={`flex items-center justify-center gap-2 ${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium border transition flex-1`}
                        style={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: 'rgba(114, 176, 29, 0.3)',
                          color: '#454955'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#72b01d'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                      >
                        <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} viewBox="0 0 48 48">
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
                          disabled={authLoading}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition flex-1"
                          style={{ backgroundColor: '#72b01d', color: '#ffffff' }}
                        >
                          {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
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
                    <Input
                      type="text"
                      required
                      value={buyerInfo.lastName}
                      onChange={(e) => {
                        setBuyerInfo(prev => ({ ...prev, lastName: e.target.value }));
                        clearFieldError('lastName');
                      }}
                      className={validationErrors.lastName ? 'border-red-400' : ''}
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
                  <Input
                    type="email"
                    required
                    value={buyerInfo.email}
                    onChange={(e) => {
                      setBuyerInfo(prev => ({ ...prev, email: e.target.value }));
                      clearFieldError('email');
                    }}
                    className={validationErrors.email ? 'border-red-400' : ''}
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
                  <Input
                    type="tel"
                    required
                    value={buyerInfo.phone}
                    onChange={(e) => {
                      setBuyerInfo(prev => ({ ...prev, phone: e.target.value }));
                      clearFieldError('phone');
                    }}
                    placeholder="e.g., 0771234567"
                    className={validationErrors.phone ? 'border-red-400' : ''}
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
                  <p className="mt-2 text-sm" style={{ color: '#72b01d' }}>
                    <FiTruck className="inline-block mr-1" size={14} />
                    The seller will deliver your package to this address for physical items.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
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
                    className={validationErrors.city ? 'border-red-400' : ''}
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

                {/* Buyer Notes Section */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Special Instructions for Seller (Optional)
                  </label>
                  <textarea
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="Any special requests, delivery instructions, or notes for the seller..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 resize-none"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                  />
                  <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
                    Share any specific requirements or instructions with the seller. ({buyerNotes.length}/500 characters)
                  </p>
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
                      backgroundColor: paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'rgba(114, 176, 29, 0.1)' : '#ffffff',
                      borderColor: paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                    }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.CASH_ON_DELIVERY}
                      checked={paymentMethod === PaymentMethod.CASH_ON_DELIVERY}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
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
                
                {item.bankTransfer && (
                  <label className="flex items-center p-4 rounded-xl border cursor-pointer transition"
                    style={{
                      backgroundColor: paymentMethod === PaymentMethod.BANK_TRANSFER ? 'rgba(114, 176, 29, 0.1)' : '#ffffff',
                      borderColor: paymentMethod === PaymentMethod.BANK_TRANSFER ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                    }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.BANK_TRANSFER}
                      checked={paymentMethod === PaymentMethod.BANK_TRANSFER}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <FiCreditCard size={20} style={{ color: '#72b01d' }} />
                      <div>
                        <div className="font-medium" style={{ color: '#0d0a0b' }}>Bank Transfer</div>
                        <div className="text-sm" style={{ color: '#454955' }}>Direct bank transfer payment</div>
                        <div className="text-xs mt-1" style={{ color: '#72b01d' }}>
                          Bank details will be provided after order confirmation
                        </div>
                      </div>
                    </div>
                  </label>
                )}

                {/* No payment methods available warning */}
                {!item.cashOnDelivery && !item.bankTransfer && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5"/>
                        <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <div>
                        <div className="font-medium text-red-800">No Payment Methods Available</div>
                        <div className="text-sm text-red-600">This listing doesn't have any payment methods enabled.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Temporarily disabled online payment - keeping code for future use
                <label className="flex items-center p-4 rounded-xl border cursor-pointer transition"
                  style={{
                    backgroundColor: paymentMethod === PaymentMethod.PAY_NOW ? 'rgba(114, 176, 29, 0.1)' : '#ffffff',
                    borderColor: paymentMethod === PaymentMethod.PAY_NOW ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PaymentMethod.PAY_NOW}
                    checked={paymentMethod === PaymentMethod.PAY_NOW}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-3">
                    <FiCreditCard size={20} style={{ color: '#72b01d' }} />
                    <div>
                      <div className="font-medium" style={{ color: '#0d0a0b' }}>Online Payment</div>
                      <div className="text-sm" style={{ color: '#454955' }}>Secure online payment via PayHere</div>
                      <div className="text-xs mt-1" style={{ color: '#72b01d' }}>
                        Visa • MasterCard • American Express • Local Banks
                      </div>
                    </div>
                  </div>
                </label>
                */}
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
                  {selectedVariation && (
                    <p className="text-sm mb-1 font-medium" style={{ color: '#72b01d' }}>
                      Variation: {selectedVariation.name}
                    </p>
                  )}
                  {shop && (
                    <p className="text-sm mb-1" style={{ color: '#454955' }}>From {shop.name}</p>
                  )}
                  <p className="text-sm" style={{ color: '#454955' }}>Quantity: {quantity}</p>
                  <p className="font-semibold" style={{ color: '#0d0a0b' }}>
                    LKR {(price || 0).toLocaleString()}
                    {selectedVariation && selectedVariation.priceChange !== 0 && (
                      <span className="text-xs ml-1" style={{ color: '#6b7280' }}>
                        (Base: LKR {item.price?.toLocaleString()}{selectedVariation.priceChange > 0 ? ' +' : ' '}LKR {selectedVariation.priceChange.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Seller Notes */}
              {item.sellerNotes && (
                <div className="mb-6 p-4 rounded-xl border" style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.05)', 
                  borderColor: 'rgba(34, 197, 94, 0.2)' 
                }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      
                    </span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm mb-2" style={{ color: '#0d0a0b' }}>
                        Delivery Information
                      </h5>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#454955' }}>
                        {item.sellerNotes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Information */}
              <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(114, 176, 29, 0.05)', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FiTruck size={18} style={{ color: '#72b01d' }} />
                  <span className="font-medium" style={{ color: '#0d0a0b' }}>Delivery</span>
                </div>
                {item.deliveryType === DeliveryType.FREE ? (
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
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#72b01d',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#3f7d20';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#72b01d';
                  }
                }}
              >
                {!user ? 'Sign in to Complete Order' :
                 submitting ? 'Placing Order...' : 
                 paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Place Order (COD)' : 
                 paymentMethod === PaymentMethod.BANK_TRANSFER ? 'Place Order (Bank Transfer)' : 'Place Order'}
              </button>
              
              <p className="text-xs text-center mt-3" style={{ color: '#454955' }}>
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </>
  );
}
