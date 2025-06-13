import { useState, useRef, useEffect } from "react";
import { db, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { doc, getDoc, updateDoc, getDocs, query, where, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { categories, categoryIcons, subCategoryIcons } from "../../utils/categories";
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

export default function EditListing() {
    const { user, loading: userLoading } = useAuth();
    const { listingId } = useParams<{ listingId: string }>();
    const [step, setStep] = useState(1);
    const [shops, setShops] = useState<any[]>([]);
    const [shopId, setShopId] = useState("");
    const [itemType, setItemType] = useState<"Physical">("Physical");
    const [cat, setCat] = useState("");
    const [sub, setSub] = useState("");
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [sellerNotes, setSellerNotes] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [deliveryType, setDeliveryType] = useState<"free" | "paid" | "">("");
    const [deliveryPerItem, setDeliveryPerItem] = useState("");
    const [deliveryAdditional, setDeliveryAdditional] = useState("");
    const [cashOnDelivery, setCashOnDelivery] = useState(false);
    const [bankTransfer, setBankTransfer] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Helper function to change step and scroll to top
    const goToStep = (newStep: number) => {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch user's shops
    useEffect(() => {
        if (!userLoading && user?.uid) {
            const fetchShops = async () => {
                const q = query(collection(db, "shops"), where("owner", "==", user.uid));
                const docs = await getDocs(q);
                setShops(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            };
            fetchShops();
        }
    }, [user, userLoading]);

    // Provide default seller notes for physical items
    useEffect(() => {
        // Only provide default seller notes if empty AND not loaded from database yet
        if (!sellerNotes && listingId) {
            // Don't auto-populate for existing listings being edited
            return;
        }
        if (!sellerNotes) {
            setSellerNotes("We will ship your order within 2-3 business days. Delivery time may vary based on your location. Please provide accurate delivery address.");
        }
    }, [listingId]);

    // Fetch listing details
    useEffect(() => {
        async function fetchListing() {
            if (!listingId) return;
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            setShopId(data.shopId || "");
            const loadedItemType = data.itemType || "Physical"; // Default to Physical for backward compatibility
            setItemType(loadedItemType);
            
            const loadedCategory = data.category || "";
            const loadedSubcategory = data.subcategory || "";
            
            // Validate that the loaded category matches the item type
            const validCategories = categories.filter(c => c.type === loadedItemType);
            const categoryExists = validCategories.find(c => c.name === loadedCategory);
            
            if (categoryExists) {
                setCat(loadedCategory);
                // Check if subcategory exists in the loaded category
                const subcategoryExists = categoryExists.subcategories.some((sc: string) => sc === loadedSubcategory);
                if (subcategoryExists) {
                    setSub(loadedSubcategory);
                } else {
                    setSub(""); // Reset subcategory if it doesn't exist in the category
                }
            } else {
                setCat(""); // Reset category if it doesn't match the item type
                setSub(""); // Reset subcategory as well
            }
            
            setName(data.name || "");
            setDesc(data.description || "");
            setSellerNotes(data.sellerNotes || "");
            setPrice(data.price ? String(data.price) : "");
            setDeliveryType(data.deliveryType || "");
            setDeliveryPerItem(data.deliveryPerItem ? String(data.deliveryPerItem) : "");
            setDeliveryAdditional(data.deliveryAdditional ? String(data.deliveryAdditional) : "");
            setExistingImageUrls(data.images || []);
            setImagePreviews(data.images || []);
            setQuantity(data.quantity ? String(data.quantity) : "");
            setCashOnDelivery(!!data.cashOnDelivery);
            setBankTransfer(!!data.bankTransfer);
        }
        fetchListing();
    }, [listingId]);


    // Add new image preview on upload with compression
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const newFiles = files.slice(0, 5 - (images.length + existingImageUrls.length));
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
                            images.length + existingImageUrls.length + index, // current index
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

    // Remove images: index starts with existingImageUrls then new images
    const removeImage = (idx: number) => {
        if (idx < existingImageUrls.length) {
            setExistingImageUrls(prev => prev.filter((_, i) => i !== idx));
            setImagePreviews(prev => prev.filter((_, i) => i !== idx));
        } else {
            // Remove new uploaded image
            const relativeIdx = idx - existingImageUrls.length;
            setImages(prev => prev.filter((_, i) => i !== relativeIdx));
            setImagePreviews(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const handleSubmit = async () => {
        if (!shopId) return;
        
        // Validate that at least one payment method is selected
        if (!cashOnDelivery && !bankTransfer) {
            showToast('error', 'Please select at least one payment method for this listing.');
            return;
        }
        
        let imageUrls: string[] = [...existingImageUrls];
        let newImageMetadata: any[] = [];
        
        try {
            // Upload new images with better organization and metadata
            const uploadPromises = images.map(async (file, idx) => {
                const currentShop = shops.find(s => s.id === shopId);
                const shopName = currentShop?.name || 'unknown-shop';
                
                // Create organized storage path
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
                        altText: generateImageAltText(name, cat, sub, existingImageUrls.length + idx, shopName),
                        imageIndex: (existingImageUrls.length + idx).toString(),
                        originalSize: file.size.toString(),
                        processedSize: file.size.toString(),
                        listingUpdate: 'true'
                    }
                });
                
                const downloadURL = await getDownloadURL(uploadResult.ref);
                
                return {
                    url: downloadURL,
                    metadata: {
                        altText: generateImageAltText(name, cat, sub, existingImageUrls.length + idx, shopName),
                        filename: file.name,
                        size: file.size,
                        index: existingImageUrls.length + idx,
                        storagePath: storagePath
                    }
                };
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            const newUrls = uploadResults.map(result => result.url);
            newImageMetadata = uploadResults.map(result => result.metadata);
            imageUrls = [...existingImageUrls, ...newUrls];
            
        } catch (err) {
            console.error('Image upload error:', err);
            showToast('error', 'Image upload failed. Please try again.');
            return;
        }
        
        try {
            // Update the listing with enhanced metadata
            await updateDoc(doc(db, "listings", listingId!), {
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
                newImageMetadata: newImageMetadata, // Store metadata for new images
                cashOnDelivery,
                bankTransfer,
                updatedAt: (await import("firebase/firestore")).Timestamp.now(),
                // Update SEO fields
                seoTitle: `${name} - ${cat} ${sub ? `- ${sub}` : ''} | ${shops.find(s => s.id === shopId)?.name || 'Shop'}`,
                seoDescription: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
                keywords: [name, cat, sub, 'Sri Lanka', 'marketplace', shops.find(s => s.id === shopId)?.name].filter(Boolean)
            });
            
            showToast('success', 'Listing updated successfully!');
            navigate(`/shop/${shops.find(s => s.id === shopId)?.username}`);
        } catch (err) {
            console.error('Database update error:', err);
            showToast('error', 'Failed to update listing. Please try again.');
        }
    };

    // Steps rendering (same as AddListing)
    return (
        <>
            <ResponsiveHeader />
            <div className="bg-white min-h-screen flex flex-col items-center py-2 md:py-8 px-2 md:px-4">
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
                                        {step === 2 && "Pick the main category for your item"}
                                        {step === 3 && "Choose a specific subcategory"}
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
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Select your shop</h2>
                            {userLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-[#454955] text-base md:text-lg text-center mb-4">
                                        Loading your shops...
                                    </div>
                                </div>
                            ) : shops.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-[#454955] text-base md:text-lg text-center mb-4">
                                        You haven't created a shop yet.
                                    </div>
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
                                        <button
                                            type="button"
                                            className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                            disabled={!shopId}
                                            onClick={() => goToStep(2)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 2: Category */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Pick a main category</h2>
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
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
                    `}
                                    >
                                        <span className="text-lg md:text-xl">{categoryIcons[c.name] || "📦"}</span>
                                        <span className="font-medium text-xs text-center">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={!cat}
                                    onClick={() => goToStep(3)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Subcategory */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Pick a sub category</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                {categories.find(c => c.name === cat)?.subcategories.map((sc) => (
                                    <button
                                        key={sc}
                                        type="button"
                                        onClick={() => setSub(sc)}
                                        className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl md:rounded-2xl transition
                      ${sub === sc
                                                ? "bg-[#72b01d] text-white shadow-sm scale-105"
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
                    `}
                                    >
                                        <span className="text-lg md:text-xl">{subCategoryIcons[sc] || "📦"}</span>
                                        <span className="font-medium text-xs text-center">{sc}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(2)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={!sub}
                                    onClick={() => goToStep(4)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Details */}
                    {step === 4 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">Item details</h2>

                            <div className="space-y-6 md:space-y-8">
                                {/* Item Title Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Item Title
                                    </label>
                                    <input
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                        maxLength={120}
                                        placeholder="Enter item title..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {name.length}/120 characters
                                    </div>
                                </div>

                                {/* Description Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[120px] md:min-h-[140px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none text-sm md:text-base"
                                        maxLength={1200}
                                        placeholder="Describe your item in detail..."
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {desc.length}/1200 characters
                                    </div>
                                </div>

                                {/* Seller Notes Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Delivery & Important Notes
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[100px] md:min-h-[120px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none text-sm md:text-base"
                                        maxLength={500}
                                        placeholder="Provide important information about delivery, shipping, or handling instructions"
                                        value={sellerNotes}
                                        onChange={e => setSellerNotes(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {sellerNotes.length}/500 characters
                                    </div>
                                    <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                        💡 <strong>Tip:</strong> Include handling time, packaging details, and any special delivery instructions.
                                    </div>
                                </div>

                                {/* Price and Quantity Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Item Price Field */}
                                    <div className="group">
                                        <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                            Item Price
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={e => setPrice(e.target.value)}
                                                required
                                            />
                                            <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                LKR
                                            </span>
                                        </div>
                                        {price && !isNaN(Number(price)) && Number(price) > 0 && (
                                            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 mt-3">
                                                <div className="text-xs md:text-sm text-[#0369a1] font-medium">
                                                    💰 You will receive: <span className="font-bold text-[#3f7d20]">LKR {(Number(price) * 0.8).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-1">
                                                    After 20% platform fee
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Available Quantity Field */}
                                    <div className="group">
                                        <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                            Available Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                            placeholder="Enter quantity..."
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            required
                                        />
                                        <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                            How many items do you have in stock?
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#e5e7eb]">
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
                                {imagePreviews.length < 5 && (
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
                            <div className="text-sm text-[#454955] mb-2">{imagePreviews.length} / 5 images selected</div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(4)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={imagePreviews.length === 0}
                                    onClick={() => goToStep(6)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Delivery */}
                    {step === 6 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">
                                Delivery options
                            </h2>
                            
                            <div className="space-y-6 md:space-y-8">
                                {/* Delivery Type Selection */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-3 md:mb-4 tracking-wide uppercase">
                                        Delivery Type
                                    </label>
                                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                                        <button
                                            type="button"
                                            className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-bold text-base md:text-lg group/card
                                                ${deliveryType === "free"
                                                    ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                    : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                            onClick={() => setDeliveryType("free")}
                                        >
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-xl md:text-2xl mr-3">🚚</span>
                                                Free Delivery
                                            </div>
                                            <div className={`text-xs md:text-sm font-medium
                                                ${deliveryType === "free" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                You cover delivery costs
                                            </div>
                                            {deliveryType === "free" && (
                                                <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                                                    <span className="text-[#72b01d] text-xs md:text-sm font-bold">✓</span>
                                                </div>
                                            )}
                                        </button>
                                        
                                        <button
                                            type="button"
                                            className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-bold text-base md:text-lg group/card
                                                ${deliveryType === "paid"
                                                    ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                    : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                            onClick={() => setDeliveryType("paid")}
                                        >
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-xl md:text-2xl mr-3">💰</span>
                                                Buyer Pays Delivery
                                            </div>
                                            <div className={`text-xs md:text-sm font-medium
                                                ${deliveryType === "paid" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                Customer covers delivery
                                            </div>
                                            {deliveryType === "paid" && (
                                                <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                                                    <span className="text-[#72b01d] text-xs md:text-sm font-bold">✓</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Delivery Pricing (only when paid delivery is selected) */}
                                {deliveryType === "paid" && (
                                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl md:rounded-2xl p-4 md:p-6">
                                        <h3 className="text-xs md:text-sm font-bold text-[#0d0a0b] mb-3 md:mb-4 tracking-wide uppercase">
                                            Delivery Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div className="group">
                                                <label className="block text-xs md:text-sm font-semibold text-[#374151] mb-2">
                                                    Per Item Delivery
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                        placeholder="0.00"
                                                        value={deliveryPerItem}
                                                        onChange={e => setDeliveryPerItem(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                        LKR
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                                    Delivery cost for first item
                                                </div>
                                            </div>
                                            
                                            <div className="group">
                                                <label className="block text-xs md:text-sm font-semibold text-[#374151] mb-2">
                                                    Additional Items
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                        placeholder="0.00"
                                                        value={deliveryAdditional}
                                                        onChange={e => setDeliveryAdditional(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                        LKR
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                                    Cost per additional item
                                                </div>
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
                                                    id="cod-checkbox"
                                                    type="checkbox"
                                                    checked={cashOnDelivery}
                                                    onChange={e => setCashOnDelivery(e.target.checked)}
                                                    className="w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="cod-checkbox" className="font-semibold cursor-pointer text-sm md:text-base text-[#0d0a0b]">
                                                        💰 Allow Cash on Delivery (COD)
                                                    </label>
                                                    <p className="text-xs md:text-sm mt-1 text-[#454955]">
                                                        Let customers pay when they receive their order
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bank Transfer Option */}
                                        <div className="p-4 md:p-6 rounded-xl border bg-green-50 border-green-200">
                                            <div className="flex items-start gap-2 md:gap-3">
                                                <input
                                                    id="bank-transfer-checkbox"
                                                    type="checkbox"
                                                    checked={bankTransfer}
                                                    onChange={e => setBankTransfer(e.target.checked)}
                                                    className="w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="bank-transfer-checkbox" className="font-semibold text-[#0d0a0b] cursor-pointer text-sm md:text-base">
                                                        🏦 Allow Bank Transfer
                                                    </label>
                                                    <p className="text-xs md:text-sm text-[#454955] mt-1">
                                                        Customers transfer money directly to your bank account
                                                    </p>
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
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={
                                        !deliveryType ||
                                        (deliveryType === "paid" && (!deliveryPerItem || !deliveryAdditional)) ||
                                        (!cashOnDelivery && !bankTransfer)
                                    }
                                >
                                    Update Listing ✨
                                </button>
                            </div>
                        </div>
                    )}
                </form>

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
            <Footer />
        </>
    );
}
