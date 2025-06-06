import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../utils/orders";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getUserIP } from "../utils/ipUtils";
import { db } from "../utils/firebase";
import Header from "../components/UI/Header";
import WishlistButton from "../components/UI/WishlistButton";
import ShopOwnerName from "./ShopOwnerName";
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";

type Shop = {
  name: string;
  username: string;
  logo?: string;
  owner: string;
  // Add more fields as needed
};

export default function ListingSingle() {
  // Payment method state for COD
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paynow'>('paynow');
  const { user } = useAuth();
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [enlarge, setEnlarge] = useState(false);
  const [qty, setQty] = useState(1);
  const [latestItems, setLatestItems] = useState<any[]>([]);

  // Function to get review statistics for an item
  function getReviewStats(listing: any) {
    const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
    if (!reviews.length) return { avg: null, count: 0 };
    const avg = reviews.reduce((sum: any, r: any) => sum + (r.rating || 0), 0) / reviews.length;
    return { avg, count: reviews.length };
  }

  // Function to fetch latest items
  const fetchLatestItems = async () => {
    if (!id) return;
    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, orderBy("createdAt", "desc"), limit(6));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.id !== id); // Exclude current item
      setLatestItems(items.slice(0, 5)); // Show only 5 items
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
    // If item allows COD, default to 'cod', else 'paynow'
    if (item?.cashOnDelivery) {
      setPaymentMethod('cod');
    } else {
      setPaymentMethod('paynow');
    }
  }, [item?.cashOnDelivery]);

  // Fetch listing and shop info
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      const docRef = doc(db, "listings", id);
      const docSnap = await getDoc(docRef);
      let ip = null;
      try {
        ip = await getUserIP();
      } catch { }
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Attach client IP for wishlist logic
        setItem({ ...data, __client_ip: ip });

        // Fetch shop info
        if (data.shop || data.shopId) {
          const shopRef = doc(db, "shops", data.shop || data.shopId);
          const shopSnap = await getDoc(shopRef);
          if (shopSnap.exists()) setShop(shopSnap.data() as Shop);
        }
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  // Fetch latest items
  useEffect(() => {
    if (id) {
      fetchLatestItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading...
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
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
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
                      checked={paymentMethod === 'paynow'}
                      onChange={() => setPaymentMethod('paynow')}
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
                    onClick={async () => {
                      if (!item || !shop || qty > (item.quantity || 1)) return;
                      await createOrder({
                        itemId: id,
                        itemName: item.name,
                        itemImage: item.images?.[0] || "",
                        buyerId: user?.uid || null,
                        buyerEmail: user?.email || null,
                        sellerId: item.owner,
                        sellerShopId: item.shopId,
                        sellerShopName: shop.name,
                        price,
                        quantity: qty,
                        shipping,
                        total,
                        paymentMethod,
                      });
                      alert(paymentMethod === 'cod' ? "Order placed with Cash on Delivery!" : "Order placed! (No payment gateway yet)");
                    }}
                  >
                    {paymentMethod === 'cod' ? 'Order with Cash on Delivery' : 'Pay Now'}
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
                  onClick={async () => {
                    if (!item || !shop || qty > (item.quantity || 1)) return;
                    await createOrder({
                      itemId: id,
                      itemName: item.name,
                      itemImage: item.images?.[0] || "",
                      buyerId: user?.uid || null,
                      buyerEmail: user?.email || null,
                      sellerId: item.owner,
                      sellerShopId: item.shopId,
                      sellerShopName: shop.name,
                      price,
                      quantity: qty,
                      shipping,
                      total,
                    });
                    alert("Order placed! (No payment gateway yet)");
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
                <Link
                  key={item.id}
                  to={`/listing/${item.id}`}
                  className="group flex flex-col rounded-2xl shadow-lg transition-all duration-300 p-4 relative cursor-pointer border hover:shadow-xl hover:-translate-y-1"
                  style={{
                    textDecoration: 'none',
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}
                >
                  {/* Image */}
                  <div className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center overflow-hidden border transition-all duration-300 group-hover:shadow-md"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.2)'
                    }}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl" style={{ color: '#454955' }}>🖼️</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-lg mb-1 truncate transition-colors duration-300"
                    style={{ color: '#0d0a0b' }}>
                    {item.name}
                  </h3>
                  {/* Show product average rating and count */}
                  {(() => {
                    const stats = getReviewStats(item);
                    return (
                      <div className="flex items-center gap-2 mb-1 min-h-[22px]">
                        {stats.avg ? (
                          <>
                            <span className="flex items-center text-yellow-500">
                              {[1, 2, 3, 4, 5].map(i => (
                                <svg
                                  key={i}
                                  width="16"
                                  height="16"
                                  className="inline-block"
                                  fill={i <= Math.round(stats.avg) ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                              <span className="ml-1 text-xs font-bold text-yellow-700">
                                {stats.avg.toFixed(1)}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">({stats.count})</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No reviews yet</span>
                        )}
                      </div>
                    );
                  })()}
                  {/* Delivery & Payment badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.deliveryType === "free" ? (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-green-700 text-xs font-semibold">
                        <span className="text-base">🚚</span>
                        Free Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-gray-500 text-xs font-medium">
                        <span className="text-base">📦</span>
                        Delivery Fee will apply
                      </span>
                    )}
                    {item.cashOnDelivery && (
                      <span className="inline-flex items-center gap-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold ml-2 px-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        COD
                      </span>
                    )}
                  </div>
                  {/* Price & Wishlist bottom row */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="font-bold text-lg text-black group-hover:text-black tracking-tight">
                      LKR {item.price?.toLocaleString()}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex items-end">
                      <WishlistButton listing={item} refresh={refreshListings} />
                    </div>
                  </div>
                </Link>
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
