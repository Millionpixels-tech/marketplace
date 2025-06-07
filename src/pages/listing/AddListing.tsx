import { useState, useRef, useEffect } from "react";
import { db, auth, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { categories, categoryIcons, subCategoryIcons } from "../../utils/categories";
import { Header, Button, Input } from "../../components/UI";

const steps = [
  { label: "Shop" },
  { label: "Category" },
  { label: "Subcategory" },
  { label: "Details" },
  { label: "Images" },
  { label: "Delivery" },
];

export default function AddListing() {
  const [step, setStep] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [shopId, setShopId] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"free" | "paid" | "">("");
  const [deliveryPerItem, setDeliveryPerItem] = useState("");
  const [deliveryAdditional, setDeliveryAdditional] = useState("");
  const [cashOnDelivery, setCashOnDelivery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Use AuthContext for user and loading
  const { user, loading } = useAuth();

  // Fetch shops when user is ready
  useEffect(() => {
    if (!loading && user?.uid) {
      const fetchShops = async () => {
        const q = query(collection(db, "shops"), where("owner", "==", user.uid));
        const docs = await getDocs(q);
        const shopList = docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(shopList);
      };
      fetchShops();
    }
  }, [user, loading]);

  // Handle image preview and selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.slice(0, 5 - images.length);
    if (newFiles.length === 0) return;
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!shopId) return;
    let imageUrls: string[] = [];
    try {
      // Upload images to Firebase Storage
      imageUrls = await Promise.all(
        images.map(async (file, idx) => {
          const storageRef = ref(storage, `listings/${shopId}/${Date.now()}_${idx}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );
    } catch (err) {
      alert("Image upload failed. Please try again.");
      return;
    }
    await addDoc(collection(db, "listings"), {
      owner: auth.currentUser?.uid,
      shopId,
      category: cat,
      subcategory: sub,
      name,
      description: desc,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      deliveryType,
      deliveryPerItem: deliveryType === "paid" ? parseFloat(deliveryPerItem) : 0,
      deliveryAdditional: deliveryType === "paid" ? parseFloat(deliveryAdditional) : 0,
      images: imageUrls,
      createdAt: (await import("firebase/firestore")).Timestamp.now(),
      cashOnDelivery,
    });
    alert("Listing added!");
    navigate(`/shop/${shops.find(s => s.id === shopId)?.username}`);
  };

  return (
    <>
      <Header />
      <div className="bg-white min-h-screen flex flex-col items-center py-8 px-2">
        {/* Stepper */}
        <div className="w-full max-w-3xl flex items-center justify-center mb-12">
          <ol className="flex w-full justify-center gap-0 md:gap-6">
            {steps.map((s, idx) => (
              <li key={s.label} className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base mb-1
                  ${step === idx + 1
                      ? "bg-[#72b01d] text-white"
                      : step > idx + 1
                        ? "bg-[#3f7d20] text-white"
                        : "bg-white border border-[#45495522] text-[#454955]"}
                `}
                >
                  {idx + 1}
                </div>
                <span
                  className={`mt-1 text-xs font-medium uppercase tracking-wider
                  ${step === idx + 1 ? "text-[#0d0a0b]" : "text-[#45495599]"}
                `}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="absolute top-3 left-1/2 h-[38px] w-px bg-[#45495522] md:bg-transparent md:w-full md:h-px md:top-1/2 md:left-0" />
                )}
              </li>
            ))}
          </ol>
        </div>

        <form
          className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-lg px-0 md:px-12 py-10 transition-all"
          onSubmit={e => { e.preventDefault(); handleSubmit(); }}
          autoComplete="off"
        >
          {/* Step 1: Shop selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-center text-[#0d0a0b]">Select your shop</h2>
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-[#454955] text-lg text-center mb-4">
                    Loading your shops...
                  </div>
                </div>
              ) : shops.length === 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-[#454955] text-lg text-center mb-4">
                    You haven't created a shop yet.
                  </div>
                  <button
                    type="button"
                    className="bg-[#72b01d] text-white px-8 py-3 rounded-2xl font-semibold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition"
                    onClick={() => navigate("/create-shop")}
                  >
                    Create Shop
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {shops.map(shop => (
                      <button
                        type="button"
                        key={shop.id}
                        onClick={() => setShopId(shop.id)}
                        className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition text-left
                          ${shopId === shop.id
                            ? "border-[#72b01d] bg-[#72b01d] text-white scale-105 shadow-sm"
                            : "border-[#45495522] bg-white hover:bg-gray-50"}
                        `}
                      >
                        {shop.logo && (
                          <img
                            src={shop.logo}
                            alt={shop.name}
                            className="w-12 h-12 rounded-full object-cover border border-[#45495522] shadow-sm"
                          />
                        )}
                        <div>
                          <div className="font-bold text-lg">{shop.name}</div>
                          <div className="text-xs text-[#454955]">@{shop.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end mt-8">
                    <Button
                      variant="primary"
                      disabled={!shopId}
                      onClick={() => setStep(2)}
                      className="px-7 py-3 rounded-2xl uppercase tracking-wide shadow-sm"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-[#0d0a0b]">Pick a main category</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categories.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCat(c.name)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition
                      ${cat === c.name
                        ? "bg-[#72b01d] text-white shadow-sm scale-105"
                        : "bg-white border border-[#45495522] hover:bg-gray-50 text-[#0d0a0b]"}
                    `}
                  >
                    <span className="text-xl">{categoryIcons[c.name] || "📦"}</span>
                    <span className="font-medium text-xs text-center">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="px-7 py-3 rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!cat}
                  onClick={() => setStep(3)}
                  className="px-7 py-3 rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Subcategory */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-[#0d0a0b]">Pick a sub category</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categories.find(c => c.name === cat)?.subcategories.map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSub(sc)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition
                      ${sub === sc
                        ? "bg-[#72b01d] text-white shadow-sm scale-105"
                        : "bg-white border border-[#45495522] hover:bg-gray-50 text-[#0d0a0b]"}
                    `}
                  >
                    <span className="text-xl">{subCategoryIcons[sc] || "📦"}</span>
                    <span className="font-medium text-xs text-center">{sc}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  className="px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="px-7 py-3 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                  disabled={!sub}
                  onClick={() => setStep(4)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-[#0d0a0b]">Item details</h2>

              <div className="space-y-6">
                {/* Item Title */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-2">Item Title</label>
                  <Input
                    maxLength={120}
                    placeholder="Enter a clear, descriptive title for your item"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  <div className="text-xs text-[#454955] mt-1">{name.length}/120 characters</div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-2">Description</label>
                  <textarea
                    className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-4 py-3 rounded-xl font-medium text-[#0d0a0b] min-h-[120px] shadow-sm placeholder:text-[#454955]/60 resize-vertical"
                    maxLength={1200}
                    placeholder="Describe your item in detail - materials, dimensions, care instructions, etc."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    required
                  />
                  <div className="text-xs text-[#454955] mt-1">{desc.length}/1200 characters</div>
                </div>

                {/* Price and Quantity Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Item Price */}
                  <div>
                    <label className="block font-semibold text-[#0d0a0b] mb-2">Item Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-4 py-3 pr-16 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60"
                        placeholder="0.00"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#454955] font-medium select-none pointer-events-none bg-[#f8f9fa] px-2 py-1 rounded text-sm">
                        LKR
                      </div>
                    </div>
                    {price && !isNaN(Number(price)) && Number(price) > 0 && (
                      <div className="text-sm text-[#454955] mt-1 p-2 bg-green-50 rounded-lg border border-green-200">
                        💰 You will receive: <span className="font-semibold text-[#3f7d20]">LKR {(Number(price) * 0.8).toLocaleString()}</span> (after 20% platform fee)
                      </div>
                    )}
                  </div>

                  {/* Available Quantity */}
                  <div>
                    <label className="block font-semibold text-[#0d0a0b] mb-2">Available Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      required
                    />
                    <div className="text-xs text-[#454955] mt-1">Number of items available for sale</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  className="px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                  onClick={() => setStep(3)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!name || !desc || !price || !quantity}
                  onClick={() => setStep(5)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}


          {/* Step 5: Images */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-[#0d0a0b]">Add images</h2>
              <div className="flex flex-wrap gap-6 mb-6">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white border border-[#45495522] shadow-sm flex items-center justify-center"
                  >
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-[#72b01d] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition z-10"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    className="w-28 h-28 rounded-2xl flex items-center justify-center bg-white border border-[#45495544] border-dashed shadow-sm text-3xl text-[#45495577] hover:bg-gray-50 hover:text-[#72b01d] transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    +
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      aria-label="Upload images"
                    />
                  </button>
                )}
              </div>
              <div className="text-sm text-[#454955] mb-2">{images.length} / 5 images selected</div>
              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  className="px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                  onClick={() => setStep(4)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="px-7 py-3 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                  disabled={images.length === 0}
                  onClick={() => setStep(6)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Delivery */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black mb-8 text-[#0d0a0b]">Delivery options</h2>
              
              <div className="space-y-6">
                {/* Delivery Type Selection */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-3">Delivery Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 border-2
                        ${deliveryType === "free"
                          ? "bg-[#72b01d] text-white border-[#72b01d] shadow-md"
                          : "bg-white border-[#45495522] text-[#454955] hover:bg-gray-50 hover:border-[#454955]/30"}`}
                      onClick={() => setDeliveryType("free")}
                    >
                      🚚 Free Delivery
                    </button>
                    <button
                      type="button"
                      className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 border-2
                        ${deliveryType === "paid"
                          ? "bg-[#72b01d] text-white border-[#72b01d] shadow-md"
                          : "bg-white border-[#45495522] text-[#454955] hover:bg-gray-50 hover:border-[#454955]/30"}`}
                      onClick={() => setDeliveryType("paid")}
                    >
                      📦 Buyer Pays Delivery
                    </button>
                  </div>
                </div>

                {/* Delivery Pricing (only show when paid delivery is selected) */}
                {deliveryType === "paid" && (
                  <div className="bg-gray-50 p-6 rounded-xl border border-[#45495522]">
                    <h3 className="font-semibold text-[#0d0a0b] mb-4">Delivery Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-[#0d0a0b] mb-2">Per Item (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-4 py-3 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60"
                          placeholder="0.00"
                          value={deliveryPerItem}
                          onChange={e => setDeliveryPerItem(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[#0d0a0b] mb-2">Each Additional Item (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-4 py-3 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60"
                          placeholder="0.00"
                          value={deliveryAdditional}
                          onChange={e => setDeliveryAdditional(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Option */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <input
                      id="cod"
                      type="checkbox"
                      checked={cashOnDelivery}
                      onChange={e => setCashOnDelivery(e.target.checked)}
                      className="w-5 h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm"
                    />
                    <div className="flex-1">
                      <label htmlFor="cod" className="font-semibold text-[#0d0a0b] cursor-pointer">
                        💰 Allow Cash on Delivery (COD)
                      </label>
                      <p className="text-sm text-[#454955] mt-1">
                        Let customers pay when they receive their order
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  className="px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                  onClick={() => setStep(5)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !deliveryType ||
                    (deliveryType === "paid" &&
                      (!deliveryPerItem || !deliveryAdditional))
                  }
                >
                  Submit →
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Fade-in animation */}
        <style>{`
          .animate-fade-in {
            animation: fadeIn 0.3s;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    </>
  );
}
