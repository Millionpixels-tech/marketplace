import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getUserIP } from "../../utils/ipUtils";
import { db } from "../../utils/firebase";
import Header from "../../components/UI/Header";
import WishlistButton from "../../components/UI/WishlistButton";
import ListingTile from "../../components/UI/ListingTile";
import { LoadingSpinner } from "../../components/UI";
import ShopOwnerName from "../shop/ShopOwnerName";
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { PaymentMethod } from "../../types/enums";
import type { PaymentMethod as PaymentMethodType } from "../../types/enums";

type Shop = {
  name: string;
  username: string;
  logo?: string;
  owner: string;
  // Add more fields as needed
};

export default function ListingSingle() {
  // Payment method state for COD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.PAY_NOW);
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [enlarge, setEnlarge] = useState(false);
  const [qty, setQty] = useState(1);
  const [latestItems, setLatestItems] = useState<any[]>([]);

  // Function to fetch latest items with improved performance
  const fetchLatestItems = async () => {
    if (!id) return;
    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, orderBy("createdAt", "desc"), limit(8)); // Fetch a few extra to exclude current
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.id !== id) // Exclude current item
        .slice(0, 5); // Show only 5 items
      setLatestItems(items);
    } catch (error) {
      console.error("Error fetching latest items:", error);
      setLatestItems([]);
    }
  };

  // Function to refresh listings (for wishlist button)
  const refreshListings = () => {
    // Re-fetch latest items if needed
    fetchLatestItems();
  };

  // Set body background color for this page
  useEffect(() => {
    const originalBodyStyle = document.body.style.backgroundColor;
    const originalHtmlStyle = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';

    return () => {
      document.body.style.backgroundColor = originalBodyStyle;
      document.documentElement.style.backgroundColor = originalHtmlStyle;
    };
  }, []);

  useEffect(() => {
    // If item allows COD, default to COD, else Pay Now
    if (item?.cashOnDelivery) {
      setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
    } else {
      setPaymentMethod(PaymentMethod.PAY_NOW);
    }
  }, [item?.cashOnDelivery]);

  // Fetch listing and shop info with batched IP and data loading
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        // Batch IP fetch and listing fetch
        const [docSnap, ip] = await Promise.all([
          getDoc(doc(db, "listings", id)),
          getUserIP().catch(() => null) // Handle IP fetch failure gracefully
        ]);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Attach client IP for wishlist logic
          setItem({ ...data, __client_ip: ip });

          // Fetch shop info if available
          if (data.shop || data.shopId) {
            const shopSnap = await getDoc(doc(db, "shops", data.shop || data.shopId));
            if (shopSnap.exists()) setShop(shopSnap.data() as Shop);
          }
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // Fetch latest items when id changes
  useEffect(() => {
    if (id) {
      fetchLatestItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Item not found.
      </div>
    );
  }

  // Calculate review summary for this listing (after item is loaded)
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount)
      : null;

  const price = Number(item.price || 0);
  const deliveryType = item.deliveryType;
  const deliveryPerItem = Number(item.deliveryPerItem || 0);
  const deliveryAdditional = Number(item.deliveryAdditional || 0);
  let shipping = 0;
  if (deliveryType === "paid") {
    shipping = deliveryPerItem + (qty > 1 ? deliveryAdditional * (qty - 1) : 0);
  }
  const total = price * qty + shipping;

  // Refresh function to reload item after wishlist change
  const refreshItem = async () => {
    if (!id) return;
    const docRef = doc(db, "listings", id);
    const docSnap = await getDoc(docRef);
    let ip = null;
    try {
      ip = await getUserIP();
    } catch { }
    if (docSnap.exists()) setItem({ ...docSnap.data(), __client_ip: ip });
  };

  return (
    <div className="min-h-screen w-full pb-8" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Header />

      {/* Breadcrumb */}
      <nav className="w-full max-w-4xl mx-auto mt-4 px-2 md:px-0 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2" style={{ color: '#454955' }}>
          {item?.category && (
            <li>
              <Link
                to={`/search?cat=${encodeURIComponent(item.category)}`}
                className="hover:underline font-semibold transition-colors duration-300"
                style={{ color: '#72b01d' }}
              >
                {item.category}
              </Link>
            </li>
          )}
          {item?.subcategory && (
            <>
              <span className="mx-1">/</span>
              <li>
                <Link
                  to={`/search?cat=${encodeURIComponent(item.category)}&sub=${encodeURIComponent(item.subcategory)}`}
                  className="hover:underline font-semibold transition-colors duration-300"
                  style={{ color: '#72b01d' }}
                >
                  {item.subcategory}
                </Link>
              </li>
            </>
          )}
          <span className="mx-1">/</span>
          <li className="font-bold truncate max-w-[180px] md:max-w-xs" title={item.name} style={{ color: '#0d0a0b' }}>{item.name}</li>
        </ol>
      </nav>

      <main className="w-full max-w-4xl mx-auto mt-8 px-2 md:px-0">
        <div className="flex flex-col md:flex-row gap-8 rounded-3xl shadow-xl p-4 md:p-10 border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
          {/* Image Gallery */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full max-w-xs sm:max-w-md aspect-square rounded-2xl flex items-center justify-center overflow-hidden border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.2)' }}>
              {item.images && item.images.length > 0 && (
                <img
                  src={item.images[imgIdx]}
                  alt={`Item image ${imgIdx + 1}`}
                  className="object-contain w-full h-full cursor-pointer transition-transform duration-200 hover:scale-105"
                  onClick={() => setEnlarge(true)}
                />
              )}
              {item.images && item.images.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow z-10 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#72b01d' }}
                    onClick={() => setImgIdx((imgIdx - 1 + item.images.length) % item.images.length)}
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow z-10 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#72b01d' }}
                    onClick={() => setImgIdx((imgIdx + 1) % item.images.length)}
                    aria-label="Next image"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </>
              )}
              {item.images && item.images.length > 0 && (
                <button
                  className="absolute bottom-2 right-2 rounded-full p-2 shadow z-10 transition-all duration-300"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#72b01d' }}
                  onClick={() => setEnlarge(true)}
                  aria-label="Enlarge image"
                >
                  <FiMaximize2 size={18} />
                </button>
              )}
            </div>
            {/* Thumbnails */}
            {item.images && item.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {item.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`thumb-${idx + 1}`}
                    className={`w-12 h-12 object-cover rounded-lg border-2 cursor-pointer transition-all duration-300 ${imgIdx === idx ? "shadow-lg" : ""}`}
                    style={{
                      borderColor: imgIdx === idx ? '#72b01d' : 'rgba(114, 176, 29, 0.3)'
                    }}
                    onClick={() => setImgIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Item Details */}
          <div className="flex-1 flex flex-col justify-between gap-8 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: '#0d0a0b' }}>{item.name}</h1>
              {/* Listing review summary */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-1 mb-2 text-sm font-semibold" style={{ color: '#72b01d' }}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                    {avgRating?.toFixed(1)}
                  </span>
                  <span className="font-normal" style={{ color: '#454955' }}>({reviewCount} Review{reviewCount > 1 ? 's' : ''})</span>
                </div>
              )}
              {/* SHOP INFO under title */}
              {shop && (
                <div className="mb-4 py-4">
                  <Link
                    to={`/shop/${shop.username}`}
                    className="flex items-center gap-2 rounded-xl transition group w-max px-3 py-2 -mx-3 border"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <div className="w-8 h-8 rounded-full border overflow-hidden flex items-center justify-center" style={{ borderColor: 'rgba(114, 176, 29, 0.4)', backgroundColor: '#ffffff' }}>
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg" style={{ color: '#72b01d' }}>🛍️</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold group-hover:underline text-lg" style={{ color: '#0d0a0b' }}>{shop.name}</span>
                        <ShopOwnerName ownerId={shop.owner} username={shop.username} showUsername={false} compact={true} />
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                {/* Wishlist icon */}
                <WishlistButton listing={{ ...item, id }} refresh={refreshItem} displayText={true} />
              </div>
              {/* Wishlist count display under the button */}
              {Array.isArray(item.wishlist) && item.wishlist.length > 0 && (
                <p className="text-sm font-medium mt-1" style={{ color: '#454955' }}>
                  {item.wishlist.length} {item.wishlist.length === 1 ? "person has" : "people have"} added this item to their wishlist
                </p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold" style={{ color: '#0d0a0b' }}>LKR {price.toLocaleString()}</span>
                {deliveryType === "paid" && (
                  <span className="text-xs rounded-full px-2 py-1 font-semibold border" style={{ backgroundColor: '#ffffff', color: '#454955', borderColor: 'rgba(69, 73, 85, 0.2)' }}>+ Shipping</span>
                )}
                {deliveryType === "free" && (
                  <span className="text-xs rounded-full px-2 py-1 font-semibold border" style={{ backgroundColor: '#ffffff', color: '#3f7d20', borderColor: 'rgba(114, 176, 29, 0.3)' }}>Free Delivery</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="qty" className="font-medium" style={{ color: '#454955' }}>Qty:</label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={item.quantity || 1}
                  value={qty}
                  onChange={e => {
                    let val = Math.max(1, Number(e.target.value));
                    if (item.quantity && val > item.quantity) val = item.quantity;
                    setQty(val);
                  }}
                  className="w-20 px-3 py-2 border rounded-lg text-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    borderColor: 'rgba(114, 176, 29, 0.3)',
                    backgroundColor: '#ffffff',
                    color: '#0d0a0b'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#72b01d';
                    e.target.style.boxShadow = '0 0 0 2px rgba(114, 176, 29, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <span className="text-xs ml-1" style={{ color: '#454955' }}>Available: {item.quantity ?? 1}</span>
                <span className="ml-3 text-base font-semibold" style={{ color: '#0d0a0b' }}>Total: LKR {total.toLocaleString()}</span>
              </div>
              {deliveryType === "paid" && (
                <div className="text-sm mt-1" style={{ color: '#454955' }}>
                  Shipping: LKR {shipping.toLocaleString()}
                  {qty > 1 && (
                    <span> ({deliveryPerItem} + {deliveryAdditional} x {qty - 1})</span>
                  )}
                </div>
              )}
              {/* Payment method selection if COD is available */}
              {item.cashOnDelivery ? (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex items-center gap-3">
                    <input
                      id="pay-cod"
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === PaymentMethod.CASH_ON_DELIVERY}
                      onChange={() => setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY)}
                      className="w-5 h-5"
                      style={{ accentColor: '#72b01d' }}
                    />
                    <label htmlFor="pay-cod" className="text-base font-semibold select-none cursor-pointer" style={{ color: '#454955' }}>
                      Cash on Delivery
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="pay-now"
                      type="radio"
                      name="paymentMethod"
                      value="paynow"
                      checked={paymentMethod === PaymentMethod.PAY_NOW}
                      onChange={() => setPaymentMethod(PaymentMethod.PAY_NOW)}
                      className="w-5 h-5"
                      style={{ accentColor: '#72b01d' }}
                    />
                    <label htmlFor="pay-now" className="text-base font-semibold select-none cursor-pointer" style={{ color: '#454955' }}>
                      Pay Now
                    </label>
                  </div>
                  <button
                    className="mt-2 w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wide shadow transition disabled:opacity-50"
                    style={{
                      backgroundColor: '#72b01d',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3f7d20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#72b01d';
                    }}
                    disabled={qty > (item.quantity || 1)}
                    onClick={() => {
                      if (!item || !shop || qty > (item.quantity || 1)) return;
                      if (!user) {
                        alert("Please log in to place an order");
                        return;
                      }
                      
                      // Navigate to checkout page with parameters
                      const params = new URLSearchParams({
                        itemId: id || '',
                        quantity: qty.toString(),
                        paymentMethod: paymentMethod
                      });
                      navigate(`/checkout?${params.toString()}`);
                    }}
                  >
                    {paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Order with Cash on Delivery' : 'Pay Now'}
                  </button>
                </div>
              ) : (
                <button
                  className="mt-4 w-full py-3 rounded-xl font-bold text-lg uppercase tracking-wide shadow transition disabled:opacity-50"
                  style={{
                    backgroundColor: '#72b01d',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3f7d20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#72b01d';
                  }}
                  disabled={qty > (item.quantity || 1)}
                  onClick={() => {
                    if (!item || !shop || qty > (item.quantity || 1)) return;
                    if (!user) {
                      alert("Please log in to place an order");
                      return;
                    }
                    
                    // Navigate to checkout page with parameters
                    const params = new URLSearchParams({
                      itemId: id || '',
                      quantity: qty.toString()
                    });
                    navigate(`/checkout?${params.toString()}`);
                  }}
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Money Back Guarantee & Buyer Protection */}
        <section className="w-full max-w-4xl mx-auto mt-8 mb-8 px-2 md:px-0">
          <div className="rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
            <div className="flex-shrink-0 flex items-center justify-center mb-2 md:mb-0">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#72b01d" /><path d="M8 12.5l2.5 2.5L16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <div className="text-lg md:text-xl font-bold mb-1" style={{ color: '#3f7d20' }}>14 Days Money Back Guarantee</div>
              <div className="font-medium mb-1" style={{ color: '#0d0a0b' }}>If your item does not arrive within 14 days of the expected delivery date, you can request a full refund.</div>
              <div className="text-sm" style={{ color: '#454955' }}>We guarantee your money back if you do not receive your order. Shop with peace of mind.</div>
              <div className="mt-2 font-semibold flex items-center gap-2 justify-center md:justify-start" style={{ color: '#0d0a0b' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#72b01d" /><path d="M7 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Buyer Protection: Your payment is held securely until you confirm delivery.
              </div>
            </div>
          </div>
        </section>

        {/* Description at the bottom */}
        <section className="w-full max-w-4xl mx-auto mb-8 px-2 md:px-0">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0d0a0b' }}>Description</h2>
          <div className="rounded-2xl shadow-lg p-6 text-base md:text-lg whitespace-pre-line border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)', color: '#454955' }}>
            {item.description}
          </div>
        </section>

        
      </main>

      {/* Latest Items Section */}
        {latestItems.length > 0 && (
          <section className="w-full mb-12 px-6 md:px-12 lg:px-16 xl:px-20">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#0d0a0b' }}>Latest Items You Might Like</h2>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {latestItems.map((item) => (
                <ListingTile 
                  key={item.id}
                  listing={item}
                  onRefresh={refreshListings}
                />
              ))}
            </div>
          </section>
        )}

      {/* Enlarge Modal */}
      {enlarge && item.images && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(13, 10, 11, 0.85)' }} onClick={() => setEnlarge(false)}>
          <img
            src={item.images[imgIdx]}
            alt="enlarged"
            className="max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl border-4 object-contain"
            style={{ borderColor: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
