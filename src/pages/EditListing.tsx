import { useState, useRef, useEffect } from "react";
import { db, storage } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc, getDocs, query, where, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { categories, categoryIcons, subCategoryIcons } from "../utils/categories";
import Header from "../components/UI/Header";

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
    const [cat, setCat] = useState("");
    const [sub, setSub] = useState("");
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [deliveryType, setDeliveryType] = useState<"free" | "paid" | "">("");
    const [deliveryPerItem, setDeliveryPerItem] = useState("");
    const [deliveryAdditional, setDeliveryAdditional] = useState("");
    const [cashOnDelivery, setCashOnDelivery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();

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

    // Fetch listing details
    useEffect(() => {
        async function fetchListing() {
            if (!listingId) return;
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            setShopId(data.shopId || "");
            setCat(data.category || "");
            setSub(data.subcategory || "");
            setName(data.name || "");
            setDesc(data.description || "");
            setPrice(data.price ? String(data.price) : "");
            setDeliveryType(data.deliveryType || "");
            setDeliveryPerItem(data.deliveryPerItem ? String(data.deliveryPerItem) : "");
            setDeliveryAdditional(data.deliveryAdditional ? String(data.deliveryAdditional) : "");
            setExistingImageUrls(data.images || []);
            setImagePreviews(data.images || []);
            setQuantity(data.quantity ? String(data.quantity) : "");
            setCashOnDelivery(!!data.cashOnDelivery);
        }
        fetchListing();
    }, [listingId]);

    // Add new image preview on upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const newFiles = files.slice(0, 5 - (images.length + existingImageUrls.length));
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
        let imageUrls: string[] = [...existingImageUrls];
        try {
            // Upload new images
            const uploadedUrls = await Promise.all(
                images.map(async (file, idx) => {
                    const storageRef = ref(storage, `listings/${shopId}/${Date.now()}_${idx}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                })
            );
            imageUrls = [...existingImageUrls, ...uploadedUrls];
        } catch (err) {
            alert("Image upload failed. Please try again.");
            return;
        }
        // Update the listing
        await updateDoc(doc(db, "listings", listingId!), {
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
            cashOnDelivery,
            updatedAt: (await import("firebase/firestore")).Timestamp.now(),
        });
        alert("Listing updated!");
        navigate(`/shop/${shops.find(s => s.id === shopId)?.username}`);
    };

    // Steps rendering (same as AddListing)
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
                            {userLoading ? (
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
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {shops.map(shop => (
                                            <button
                                                type="button"
                                                key={shop.id}
                                                onClick={() => setShopId(shop.id)}
                                                className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition text-left
                          ${shopId === shop.id
                                                        ? "border border-[#72b01d] bg-[#72b01d] text-white scale-105 shadow-sm"
                                                        : "border border-[#45495522] bg-white hover:bg-white"}
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
                                                    <div className="font-bold text-lg text-[#0d0a0b]">{shop.name}</div>
                                                    <div className="text-xs text-[#454955]">@{shop.username}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-8">
                                        <button
                                            type="button"
                                            className="px-7 py-3 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                            disabled={!shopId}
                                            onClick={() => setStep(2)}
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
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
                    `}
                                    >
                                        <span className="text-xl">{categoryIcons[c.name] || "📦"}</span>
                                        <span className="font-medium text-xs text-center">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-white"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={!cat}
                                    onClick={() => setStep(3)}
                                >
                                    Next
                                </button>
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
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
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
                                    className="px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-white"
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
                            <h2 className="text-2xl font-black mb-8 text-center text-[#0d0a0b]">Item details</h2>

                            <div className="space-y-8">
                                {/* Item Title Field */}
                                <div className="group">
                                    <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                                        Item Title
                                    </label>
                                    <input
                                        className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10"
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
                                    <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[140px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none"
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

                                {/* Price and Quantity Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Item Price Field */}
                                    <div className="group">
                                        <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                                            Item Price
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={e => setPrice(e.target.value)}
                                                required
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-sm select-none pointer-events-none">
                                                LKR
                                            </span>
                                        </div>
                                        {price && !isNaN(Number(price)) && Number(price) > 0 && (
                                            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 mt-3">
                                                <div className="text-sm text-[#0369a1] font-medium">
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
                                        <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                                            Available Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10"
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

                            <div className="flex justify-between mt-12 pt-8 border-t border-[#e5e7eb]">
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-white text-[#6b7280] border-2 border-[#e5e5e5] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all duration-200"
                                    onClick={() => setStep(3)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg hover:bg-[#3f7d20] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-4 focus:ring-[#72b01d]/20"
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
                                {imagePreviews.length < 5 && (
                                    <button
                                        type="button"
                                        className="w-28 h-28 rounded-2xl flex items-center justify-center bg-white border border-[#45495522] shadow-sm text-3xl text-[#454955] hover:bg-white transition"
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
                            <div className="flex justify-between mt-12 pt-8 border-t border-[#e5e7eb]">
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-white text-[#6b7280] border-2 border-[#e5e5e5] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all duration-200"
                                    onClick={() => setStep(4)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg hover:bg-[#3f7d20] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-4 focus:ring-[#72b01d]/20"
                                    disabled={imagePreviews.length === 0}
                                    onClick={() => setStep(6)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Delivery */}
                    {step === 6 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-black mb-8 text-center text-[#0d0a0b]">Delivery options</h2>
                            
                            <div className="space-y-8">
                                {/* Delivery Type Selection */}
                                <div className="group">
                                    <label className="block text-sm font-bold text-[#0d0a0b] mb-4 tracking-wide uppercase">
                                        Delivery Type
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-200 font-bold text-lg group/card
                                                ${deliveryType === "free"
                                                    ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                    : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                            onClick={() => setDeliveryType("free")}
                                        >
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl mr-3">🚚</span>
                                                Free Delivery
                                            </div>
                                            <div className={`text-sm font-medium
                                                ${deliveryType === "free" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                You cover delivery costs
                                            </div>
                                            {deliveryType === "free" && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <span className="text-[#72b01d] text-sm font-bold">✓</span>
                                                </div>
                                            )}
                                        </button>
                                        
                                        <button
                                            type="button"
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-200 font-bold text-lg group/card
                                                ${deliveryType === "paid"
                                                    ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                    : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                            onClick={() => setDeliveryType("paid")}
                                        >
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl mr-3">💰</span>
                                                Buyer Pays Delivery
                                            </div>
                                            <div className={`text-sm font-medium
                                                ${deliveryType === "paid" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                Customer covers delivery
                                            </div>
                                            {deliveryType === "paid" && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <span className="text-[#72b01d] text-sm font-bold">✓</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Delivery Pricing (only when paid delivery is selected) */}
                                {deliveryType === "paid" && (
                                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-[#0d0a0b] mb-4 tracking-wide uppercase">
                                            Delivery Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="group">
                                                <label className="block text-sm font-semibold text-[#374151] mb-2">
                                                    Per Item Delivery
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10"
                                                        placeholder="0.00"
                                                        value={deliveryPerItem}
                                                        onChange={e => setDeliveryPerItem(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-sm select-none pointer-events-none">
                                                        LKR
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                                    Delivery cost for first item
                                                </div>
                                            </div>
                                            
                                            <div className="group">
                                                <label className="block text-sm font-semibold text-[#374151] mb-2">
                                                    Additional Items
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10"
                                                        placeholder="0.00"
                                                        value={deliveryAdditional}
                                                        onChange={e => setDeliveryAdditional(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-sm select-none pointer-events-none">
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

                                {/* Cash on Delivery Option */}
                                <div className="bg-[#fefce8] border border-[#fbbf24] rounded-2xl p-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 pt-1">
                                            <input
                                                id="cod-checkbox"
                                                type="checkbox"
                                                checked={cashOnDelivery}
                                                onChange={e => setCashOnDelivery(e.target.checked)}
                                                className="w-5 h-5 text-[#72b01d] bg-white border-2 border-[#d1d5db] rounded focus:ring-[#72b01d] focus:ring-2 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="cod-checkbox" className="block text-sm font-bold text-[#0d0a0b] cursor-pointer">
                                                💳 Cash on Delivery
                                            </label>
                                            <p className="text-sm text-[#6b7280] mt-1">
                                                Allow customers to pay with cash when the item is delivered. This increases buyer confidence and can boost sales.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-12 pt-8 border-t border-[#e5e7eb]">
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-white text-[#6b7280] border-2 border-[#e5e5e5] rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all duration-200"
                                    onClick={() => setStep(5)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-[#72b01d] text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg hover:bg-[#3f7d20] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-4 focus:ring-[#72b01d]/20"
                                    disabled={
                                        !deliveryType ||
                                        (deliveryType === "paid" && (!deliveryPerItem || !deliveryAdditional))
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
        </>
    );
}
