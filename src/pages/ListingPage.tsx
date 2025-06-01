import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../utils/orders";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getUserIP } from "../utils/ipUtils";
import { db } from "../utils/firebase";
import Header from "../components/UI/Header";
import WishlistButton from "../components/UI/WishlistButton";
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

type Shop = {
  name: string;
  username: string;
  logo?: string;
  // Add more fields as needed
};

export default function ListingSingle() {
  const { user } = useAuth();
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [enlarge, setEnlarge] = useState(false);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

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
    <div className="bg-gray-50 min-h-screen w-full">
      <Header />
      <main className="w-full max-w-4xl mx-auto mt-8 px-2 md:px-0">
        <div className="flex flex-col md:flex-row gap-8 bg-white rounded-3xl shadow-xl p-4 md:p-10">
          {/* Image Gallery */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full max-w-xs sm:max-w-md aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white z-10"
                    onClick={() => setImgIdx((imgIdx - 1 + item.images.length) % item.images.length)}
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white z-10"
                    onClick={() => setImgIdx((imgIdx + 1) % item.images.length)}
                    aria-label="Next image"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </>
              )}
              {item.images && item.images.length > 0 && (
                <button
                  className="absolute bottom-2 right-2 bg-white/90 rounded-full p-2 shadow hover:bg-white z-10"
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
                    className={`w-12 h-12 object-cover rounded-lg border-2 cursor-pointer ${imgIdx === idx ? "border-black" : "border-transparent"}`}
                    onClick={() => setImgIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Item Details */}
          <div className="flex-1 flex flex-col justify-between gap-8 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2 text-gray-900">{item.name}</h1>
              {/* SHOP INFO under title */}
              {shop && (
                <Link
                  to={`/shop/${shop.username}`}
                  className="flex items-center gap-2 mb-4 py-4 rounded transition group w-max"
                >
                  <div className="w-8 h-8 rounded-full border border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg text-gray-300">🛍️</span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:underline">{shop.name}</span>
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                {/* Wishlist icon */}
                <WishlistButton listing={{ ...item, id }} refresh={refreshItem} displayText={true} />
              </div>
              {/* Wishlist count display under the button */}
              {Array.isArray(item.wishlist) && item.wishlist.length > 0 && (
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {item.wishlist.length} {item.wishlist.length === 1 ? "person has" : "people have"} added this item to their wishlist
                </p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-black">LKR {price.toLocaleString()}</span>
                {deliveryType === "paid" && (
                  <span className="text-xs bg-gray-200 rounded-full px-2 py-1 text-gray-700 font-semibold">+ Shipping</span>
                )}
                {deliveryType === "free" && (
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-1 font-semibold">Free Delivery</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="qty" className="text-gray-700 font-medium">Qty:</label>
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
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="text-xs text-gray-500 ml-1">Available: {item.quantity ?? 1}</span>
                <span className="ml-3 text-base font-semibold">Total: LKR {total.toLocaleString()}</span>
              </div>
              {deliveryType === "paid" && (
                <div className="text-sm text-gray-500 mt-1">
                  Shipping: LKR {shipping.toLocaleString()}
                  {qty > 1 && (
                    <span> ({deliveryPerItem} + {deliveryAdditional} x {qty - 1})</span>
                  )}
                </div>
              )}
              <button
                className="mt-4 w-full py-3 bg-black text-white rounded-xl font-bold text-lg uppercase tracking-wide shadow hover:bg-black/90 transition disabled:opacity-50"
                disabled={qty > (item.quantity || 1)}
                onClick={async () => {
                  if (!item || !shop || qty > (item.quantity || 1)) return;
                  const query = new URLSearchParams({
                    itemId: id!,
                    itemName: item.name,
                    price: price.toString(),
                    quantity: qty.toString(),
                    total: total.toString(),
                    shopName: shop.name,
                    image: item.images?.[0] || "",
                  });
                  navigate(`/checkout?${query.toString()}`);
                }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Description at the bottom */}
        <section className="w-full max-w-4xl mx-auto mt-8 mb-12 px-2 md:px-0">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Description</h2>
          <div className="bg-white rounded-2xl shadow p-6 text-gray-700 text-base md:text-lg whitespace-pre-line">
            {item.description}
          </div>
        </section>
      </main>

      {/* Enlarge Modal */}
      {enlarge && item.images && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setEnlarge(false)}>
          <img
            src={item.images[imgIdx]}
            alt="enlarged"
            className="max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
