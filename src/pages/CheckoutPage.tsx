import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { createOrder } from "../utils/orders";
import { saveBuyerInfo, getBuyerInfo, type BuyerInfo } from "../utils/userProfile";
import Header from "../components/UI/Header";
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

export default function CheckoutPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item || !shop || !user) {
      alert("Missing required data");
      return;
    }
    
    // Validate form
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
    const missingFields = requiredFields.filter(field => !buyerInfo[field as keyof BuyerInfo].trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Save buyer information to user profile first
      await saveBuyerInfo(user.uid, buyerInfo);
      
      // Create order with buyer information
      await createOrder({
        itemId: item.id,
        itemName: item.name,
        itemImage: item.images?.[0] || "",
        buyerId: user.uid,
        buyerEmail: buyerInfo.email,
        buyerInfo: buyerInfo, // Store complete buyer info
        sellerId: item.owner,
        sellerShopId: item.shopId || item.shop || "",
        sellerShopName: shop.name,
        price: Number(item.price || 0),
        quantity: quantity,
        shipping: shipping,
        total: total,
        paymentMethod: paymentMethod,
      });
      
      // Show success message and redirect
      const message = paymentMethod === 'cod' 
        ? "Order placed successfully with Cash on Delivery! You'll receive a confirmation shortly."
        : "Order placed successfully! You'll receive a confirmation shortly.";
      
      alert(message);
      navigate('/dashboard'); // Redirect to dashboard or orders page
      
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerInfo.firstName}
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, firstName: e.target.value }))}
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
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerInfo.lastName}
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, lastName: e.target.value }))}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerInfo.email}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={buyerInfo.phone}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g., 0771234567"
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
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#454955' }}>
                    Address *
                  </label>
                  <textarea
                    required
                    value={buyerInfo.address}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address, apartment, suite, etc."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:border-opacity-100 resize-none"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)',
                      color: '#0d0a0b'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#72b01d'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)'}
                  />
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
                      onChange={(e) => setBuyerInfo(prev => ({ ...prev, city: e.target.value }))}
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
                      <div className="font-medium" style={{ color: '#0d0a0b' }}>Pay Now</div>
                      <div className="text-sm" style={{ color: '#454955' }}>Complete payment online</div>
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
                {submitting ? 'Placing Order...' : 
                 paymentMethod === 'cod' ? 'Place Order (COD)' : 'Place Order'}
              </button>
              
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
