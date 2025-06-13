import { useState, useRef, useEffect } from "react";
import { db, auth, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { categories, categoryIcons, subCategoryIcons } from "../../utils/categories";
import { Button, Input, AddBankAccountModal } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { processImageForUpload, generateImageAltText } from "../../utils/imageUtils";

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
  const itemType = "Physical";
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"free" | "paid" | "">("");
  const [deliveryPerItem, setDeliveryPerItem] = useState("");
  const [deliveryAdditional, setDeliveryAdditional] = useState("");
  const [cashOnDelivery, setCashOnDelivery] = useState(false);
  const [bankTransfer, setBankTransfer] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Use AuthContext for user and loading
  const { user, loading } = useAuth();

  // Helper function to change step and scroll to top
  const goToStep = (newStep: number) => {
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Fetch bank accounts when user is ready
  useEffect(() => {
    if (!loading && user?.uid) {
      const fetchBankAccounts = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.bankAccounts) {
              setBankAccounts(userData.bankAccounts);
            }
          }                } catch (error) {
                    console.error("Error fetching bank accounts:", error);
                }
            };
            fetchBankAccounts();
        }
    }, [user, loading]);

    // Auto-enable bank transfer when bank accounts become available
    useEffect(() => {
        // If user previously had bank transfer disabled due to no accounts,
        // and now they have accounts, we could auto-enable it
        // But we'll leave this as manual choice for better UX
    }, [bankAccounts]);

  // Provide default seller notes for physical items
  useEffect(() => {
    if (!sellerNotes) {
      setSellerNotes("We will ship your order within 2-3 business days. Delivery time may vary based on your location. Please provide accurate delivery address.");
    }
  }, []);

  // Handle image preview and selection with compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.slice(0, 5 - images.length);
    if (newFiles.length === 0) return;

    try {
      // Process each image with compression
      const processedFiles = await Promise.all(
        newFiles.map(async (file, index) => {
          try {
            // Get shop name for SEO filename
            const currentShop = shops.find(s => s.id === shopId);
            const shopName = currentShop?.name || '';
            
            return await processImageForUpload(
              file,
              name || 'product', // Use product name or fallback
              cat || 'general', // Use category or fallback
              sub, // subcategory (optional)
              images.length + index, // current index
              shopName
            );
          } catch (error) {
            console.error('Error processing image:', error);
            // Return original file if processing fails
            return file;
          }
        })
      );

      setImages(prev => [...prev, ...processedFiles]);
      
      // Create previews for the processed images
      processedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error('Error handling image upload:', error);
      showToast('error', 'Error processing images. Please try again.');
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!shopId || submitting) return;
    
    // Validate that at least one payment method is selected
    if (!cashOnDelivery && !bankTransfer) {
      showToast('error', 'Please select at least one payment method for this listing.');
      return;
    }
    
    setSubmitting(true);
    
    let imageUrls: string[] = [];
    let imageMetadata: any[] = [];
    
    try {
      // Upload images to Firebase Storage with better organization
      const uploadPromises = images.map(async (file, idx) => {
        const currentShop = shops.find(s => s.id === shopId);
        const shopName = currentShop?.name || 'unknown-shop';
        
        // Create organized storage path: listings/shop-name/year/month/filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const storagePath = `listings/${shopName}/${year}/${month}/${file.name}`;
        
        const storageRef = ref(storage, storagePath);
        
        // Upload with metadata
        const uploadResult = await uploadBytes(storageRef, file, {
          customMetadata: {
            productName: name,
            category: cat,
            subcategory: sub || '',
            shopId: shopId,
            shopName: shopName,
            uploadedAt: now.toISOString(),
            altText: generateImageAltText(name, cat, sub, idx, shopName),
            imageIndex: idx.toString(),
            originalSize: file.size.toString(),
            processedSize: file.size.toString()
          }
        });
        
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        return {
          url: downloadURL,
          metadata: {
            altText: generateImageAltText(name, cat, sub, idx, shopName),
            filename: file.name,
            size: file.size,
            index: idx,
            storagePath: storagePath
          }
        };
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(result => result.url);
      imageMetadata = uploadResults.map(result => result.metadata);
      
    } catch (err) {
      console.error('Image upload error:', err);
      showToast('error', 'Image upload failed. Please try again.');
      setSubmitting(false);
      return;
    }
    
    try {
      await addDoc(collection(db, "listings"), {
        owner: auth.currentUser?.uid,
        shopId,
        itemType,
        category: cat,
        subcategory: sub,
        name,
        description: desc,
        sellerNotes,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        deliveryType,
        deliveryPerItem: deliveryType === "paid" ? parseFloat(deliveryPerItem) : 0,
        deliveryAdditional: deliveryType === "paid" ? parseFloat(deliveryAdditional) : 0,
        images: imageUrls,
        imageMetadata: imageMetadata, // Store image metadata for SEO
        createdAt: (await import("firebase/firestore")).Timestamp.now(),
        cashOnDelivery,
        bankTransfer,
        // SEO fields
        seoTitle: `${name} - ${itemType} ${cat} ${sub ? `- ${sub}` : ''} | ${shops.find(s => s.id === shopId)?.name || 'Shop'}`,
        seoDescription: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
        keywords: [name, itemType, cat, sub, 'Sri Lanka', 'marketplace', shops.find(s => s.id === shopId)?.name].filter(Boolean)
      });
      
      showToast('success', 'Listing added successfully!');
      navigate(`/shop/${shops.find(s => s.id === shopId)?.username}`);
    } catch (err) {
      console.error('Database save error:', err);
      showToast('error', 'Failed to save listing. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <ResponsiveHeader />
      <div className="bg-white min-h-screen flex flex-col items-center py-4 md:py-8 px-2 md:px-4">
        {/* Modern Progress Stepper */}
        <div className="w-full max-w-4xl mx-auto mb-4 md:mb-12 px-4">
          {/* Mobile Progress Bar */}
          <div className="block md:hidden mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#72b01d]">
                Step {step} of {steps.length}
              </span>
              <span className="text-xs text-[#454955] bg-gray-100 px-2 py-1 rounded-full">
                {Math.round((step / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-[#72b01d] to-[#3f7d20] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#72b01d] to-[#3f7d20] rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">{step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#0d0a0b] text-lg">{steps[step - 1]?.label}</h3>
                  <p className="text-xs text-[#454955] mt-0.5">
                    {step === 1 && "Choose which shop to list your item under"}
                    {step === 2 && "Pick a main category"}
                    {step === 3 && "Pick a specific subcategory"}
                    {step === 4 && "Add item details, price, and quantity"}
                    {step === 5 && "Upload photos of your item"}
                    {step === 6 && "Set delivery options and pricing"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0">
                <div 
                  className="h-full bg-gradient-to-r from-[#72b01d] to-[#3f7d20] transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {steps.map((s, idx) => (
                <div key={s.label} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg mb-3
                    ${step === idx + 1
                        ? "bg-gradient-to-br from-[#72b01d] to-[#3f7d20] text-white scale-110 shadow-[#72b01d]/30"
                        : step > idx + 1
                          ? "bg-gradient-to-br from-[#3f7d20] to-[#2d5c17] text-white"
                          : "bg-white border-2 border-gray-200 text-[#454955] hover:border-[#72b01d]/30"}
                  `}
                  >
                    {step > idx + 1 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="text-center max-w-[100px]">
                    <span
                      className={`text-sm font-semibold block leading-tight
                      ${step === idx + 1 ? "text-[#72b01d]" : step > idx + 1 ? "text-[#3f7d20]" : "text-[#454955]"}
                    `}
                    >
                      {s.label}
                    </span>
                    <span className="text-xs text-[#454955]/70 mt-1 block">
                      {idx === 0 && "Shop"}
                      {idx === 1 && "Item Type"}
                      {idx === 2 && "Category"}
                      {idx === 3 && "Subcategory"}
                      {idx === 4 && "Details"}
                      {idx === 5 && "Images"}
                      {idx === 6 && "Delivery"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form
          className="w-full max-w-2xl mx-auto bg-white rounded-xl md:rounded-3xl shadow-lg px-4 md:px-12 py-6 md:py-10 transition-all"
          onSubmit={e => { e.preventDefault(); handleSubmit(); }}
          autoComplete="off"
        >
          {/* Step 1: Shop selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">Select your shop</h2>
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
                  <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6">
                    {shops.map(shop => (
                      <button
                        type="button"
                        key={shop.id}
                        onClick={() => setShopId(shop.id)}
                        className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl border transition text-left
                          ${shopId === shop.id
                            ? "border-[#72b01d] bg-[#72b01d] text-white scale-105 shadow-sm"
                            : "border-[#45495522] bg-white hover:bg-gray-50"}
                        `}
                      >
                        {shop.logo && (
                          <img
                            src={shop.logo}
                            alt={shop.name}
                            className="w-10 md:w-12 h-10 md:h-12 rounded-full object-cover border border-[#45495522] shadow-sm"
                          />
                        )}
                        <div>
                          <div className="font-bold text-base md:text-lg">{shop.name}</div>
                          <div className="text-xs text-[#454955]">@{shop.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center md:justify-end mt-6 md:mt-8">
                    <Button
                      variant="primary"
                      disabled={!shopId}
                      onClick={() => goToStep(2)}
                      className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                    >
                      Next →
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Pick a main category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                {categories
                  .filter(c => c.type === itemType)
                  .map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCat(c.name)}
                    className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl md:rounded-2xl transition
                      ${cat === c.name
                        ? "bg-[#72b01d] text-white shadow-sm scale-105"
                        : "bg-white border border-[#45495522] hover:bg-gray-50 text-[#0d0a0b]"}
                    `}
                  >
                    <span className="text-lg md:text-xl">{categoryIcons[c.name] || "📦"}</span>
                    <span className="font-medium text-xs text-center leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={() => goToStep(1)}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!cat}
                  onClick={() => goToStep(3)}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Subcategory */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Pick a sub category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                {categories.find(c => c.name === cat)?.subcategories.map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSub(sc)}
                    className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl md:rounded-2xl transition
                      ${sub === sc
                        ? "bg-[#72b01d] text-white shadow-sm scale-105"
                        : "bg-white border border-[#45495522] hover:bg-gray-50 text-[#0d0a0b]"}
                    `}
                  >
                    <span className="text-lg md:text-xl">{subCategoryIcons[sc] || "📦"}</span>
                    <span className="font-medium text-xs text-center leading-tight">{sc}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                  onClick={() => goToStep(2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                  disabled={!sub}
                  onClick={() => goToStep(4)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Item details</h2>

              <div className="space-y-4 md:space-y-6">
                {/* Item Title */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-2 text-sm md:text-base">Item Title</label>
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
                  <label className="block font-semibold text-[#0d0a0b] mb-2 text-sm md:text-base">Description</label>
                  <textarea
                    className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-[#0d0a0b] min-h-[100px] md:min-h-[120px] shadow-sm placeholder:text-[#454955]/60 resize-vertical text-sm md:text-base"
                    maxLength={1200}
                    placeholder="Describe your item in detail - materials, dimensions, care instructions, etc."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    required
                  />
                  <div className="text-xs text-[#454955] mt-1">{desc.length}/1200 characters</div>
                </div>

                {/* Seller Notes */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-2 text-sm md:text-base">
Delivery & Important Notes
                  </label>
                  <textarea
                    className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-[#0d0a0b] min-h-[80px] md:min-h-[100px] shadow-sm placeholder:text-[#454955]/60 resize-vertical text-sm md:text-base"
                    maxLength={500}
                    placeholder="Provide important information about delivery, shipping, or handling instructions"
                    value={sellerNotes}
                    onChange={e => setSellerNotes(e.target.value)}
                    required
                  />
                  <div className="text-xs text-[#454955] mt-1">{sellerNotes.length}/500 characters</div>
                  <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      💡 <strong>Tip:</strong> Include handling time, packaging details, and any special delivery instructions.
                    </div>
                </div>

                {/* Price and Quantity Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Item Price */}
                  <div>
                    <label className="block font-semibold text-[#0d0a0b] mb-2 text-sm md:text-base">Item Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-3 md:px-4 py-2 md:py-3 pr-12 md:pr-16 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60 text-sm md:text-base"
                        placeholder="0.00"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required
                      />
                      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[#454955] font-medium select-none pointer-events-none bg-[#f8f9fa] px-1 md:px-2 py-1 rounded text-xs md:text-sm">
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
                    <label className="block font-semibold text-[#0d0a0b] mb-2 text-sm md:text-base">Available Quantity</label>
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

              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                  onClick={() => goToStep(3)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!name || !desc || !sellerNotes || !price || !quantity}
                  onClick={() => goToStep(5)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}


          {/* Step 5: Images */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6 text-[#0d0a0b]">Add images</h2>
              
              {/* Simple message about real images */}
              <p className="text-sm md:text-base text-[#454955] mb-4 md:mb-6 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                📸 <strong>Important:</strong> Please upload only real photos of your actual products. Images from the internet may result in listing removal.
              </p>

              <div className="flex flex-wrap gap-3 md:gap-6 mb-4 md:mb-6">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-white border border-[#45495522] shadow-sm flex items-center justify-center"
                  >
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      className="absolute top-1 md:top-2 right-1 md:right-2 bg-[#72b01d] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition z-10"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                    >
                      <FiX size={14} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    className="w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl flex items-center justify-center bg-white border border-[#45495544] border-dashed shadow-sm text-2xl md:text-3xl text-[#45495577] hover:bg-gray-50 hover:text-[#72b01d] transition"
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
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                  onClick={() => goToStep(4)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                  disabled={images.length === 0}
                  onClick={() => goToStep(6)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Delivery */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">
                Delivery options
              </h2>
              
              <div className="space-y-4 md:space-y-6">
                {/* Delivery Type Selection */}
                <div>
                  <label className="block font-semibold text-[#0d0a0b] mb-3 text-sm md:text-base">Delivery Method</label>
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <button
                      type="button"
                      disabled={false}
                      className={`px-4 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all duration-200 border-2 text-sm md:text-base
                        ${deliveryType === "free"
                          ? "bg-[#72b01d] text-white border-[#72b01d] shadow-md"
                          : "bg-white border-[#45495522] text-[#454955] hover:bg-gray-50 hover:border-[#454955]/30"}`}
                      onClick={() => setDeliveryType("free")}
                    >
                      🚚 Free Delivery
                    </button>
                    <button
                      type="button"
                      disabled={false}
                      className={`px-4 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all duration-200 border-2 text-sm md:text-base
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
                  <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-[#45495522]">
                    <h3 className="font-semibold text-[#0d0a0b] mb-3 md:mb-4 text-sm md:text-base">Delivery Pricing</h3>
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      <div>
                        <label className="block font-medium text-[#0d0a0b] mb-2 text-sm">Per Item (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60 text-sm md:text-base"
                          placeholder="0.00"
                          value={deliveryPerItem}
                          onChange={e => setDeliveryPerItem(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[#0d0a0b] mb-2 text-sm">Each Additional Item (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full bg-white border border-[#45495522] focus:border-[#72b01d] focus:ring-2 focus:ring-[#72b01d]/20 transition-all duration-200 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-[#0d0a0b] shadow-sm placeholder:text-[#454955]/60 text-sm md:text-base"
                          placeholder="0.00"
                          value={deliveryAdditional}
                          onChange={e => setDeliveryAdditional(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#0d0a0b] text-sm md:text-base mb-3">
                    💳 Payment Methods
                  </h3>
                  <div className="space-y-3">
                    {/* Cash on Delivery Option */}
                    <div className="p-4 md:p-6 rounded-xl border bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-2 md:gap-3">
                        <input
                          id="cod"
                          type="checkbox"
                          checked={cashOnDelivery}
                          disabled={false}
                          onChange={e => setCashOnDelivery(e.target.checked)}
                          className="w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm"
                        />
                        <div className="flex-1">
                          <label htmlFor="cod" className="font-semibold cursor-pointer text-sm md:text-base text-[#0d0a0b]">
                            💰 Allow Cash on Delivery (COD)
                          </label>
                          <p className="text-xs md:text-sm mt-1 text-[#454955]">
                            Let customers pay when they receive their order
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transfer Option */}
                    <div className={`p-4 md:p-6 rounded-xl border ${bankAccounts.length === 0 ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-start gap-2 md:gap-3">
                        <input
                          id="bank-transfer"
                          type="checkbox"
                          checked={bankTransfer}
                          onChange={e => {
                            if (e.target.checked && bankAccounts.length === 0) {
                              // Don't allow checking if no bank accounts
                              return;
                            }
                            setBankTransfer(e.target.checked);
                          }}
                          disabled={bankAccounts.length === 0}
                          className="w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <label htmlFor="bank-transfer" className={`font-semibold cursor-pointer text-sm md:text-base ${bankAccounts.length === 0 ? 'text-gray-500' : 'text-[#0d0a0b]'}`}>
                            🏦 Allow Bank Transfer
                          </label>
                          <p className={`text-xs md:text-sm mt-1 ${bankAccounts.length === 0 ? 'text-gray-400' : 'text-[#454955]'}`}>
                            {bankAccounts.length === 0 
                              ? "You need to add at least one bank account to enable bank transfers"
                              : "Customers transfer money directly to your bank account"
                            }
                          </p>
                          {bankAccounts.length === 0 && (
                            <button
                              type="button"
                              onClick={() => setShowBankAccountModal(true)}
                              className="mt-2 px-4 py-2 bg-[#72b01d] hover:bg-[#3f7d20] text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
                            >
                              Add Bank Account
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Validation message */}
                    {!cashOnDelivery && !bankTransfer && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-xs md:text-sm text-red-700">
                          ⚠️ Please select at least one payment method for this listing.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                <button
                  type="button"
                  className="w-full md:w-auto px-6 md:px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                  onClick={() => goToStep(5)}
                >
                  ← Back
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="w-full md:w-auto px-6 md:px-8 py-3"
                  disabled={
                    submitting ||
                    !deliveryType ||
                    (deliveryType === "paid" &&
                      (!deliveryPerItem || !deliveryAdditional)) ||
                    (!cashOnDelivery && !bankTransfer)
                  }
                >
                  Submit →
                </Button>
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

        {/* Add Bank Account Modal */}
        <AddBankAccountModal
          isOpen={showBankAccountModal}
          onClose={() => setShowBankAccountModal(false)}
          onBankAccountAdded={(updatedAccounts) => {
            setBankAccounts(updatedAccounts);
            setShowBankAccountModal(false);
          }}
        />
      </div>
      <Footer />
    </>
  );
}
