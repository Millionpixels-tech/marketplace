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
    const [initialDeliveryPerItem, setInitialDeliveryPerItem] = useState("");
    const [initialDeliveryAdditional, setInitialDeliveryAdditional] = useState("");
    const [initialCashOnDelivery, setInitialCashOnDelivery] = useState(false);
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
            setInitialDeliveryPerItem(data.deliveryPerItem ? String(data.deliveryPerItem) : "");
            setInitialDeliveryAdditional(data.deliveryAdditional ? String(data.deliveryAdditional) : "");
            setExistingImageUrls(data.images || []);
            setImagePreviews(data.images || []);
            setQuantity(data.quantity ? String(data.quantity) : "");
            setCashOnDelivery(!!data.cashOnDelivery);
            setInitialCashOnDelivery(!!data.cashOnDelivery);
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
                                            ? "bg-black text-white"
                                            : step > idx + 1
                                                ? "bg-black/80 text-white"
                                                : "bg-gray-200 text-black"}
                `}
                                >
                                    {idx + 1}
                                </div>
                                <span
                                    className={`mt-1 text-xs font-medium uppercase tracking-wider
                  ${step === idx + 1 ? "text-black" : "text-gray-400"}
                `}
                                >
                                    {s.label}
                                </span>
                                {idx < steps.length - 1 && (
                                    <div className="absolute top-3 left-1/2 h-[38px] w-px bg-gray-200 md:bg-transparent md:w-full md:h-px md:top-1/2 md:left-0" />
                                )}
                            </li>
                        ))}
                    </ol>
                </div>

                <form
                    className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl px-0 md:px-12 py-10 transition-all"
                    onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                    autoComplete="off"
                >
                    {/* Step 1: Shop selection */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-black mb-8 text-center">Select your shop</h2>
                            {userLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-gray-500 text-lg text-center mb-4">
                                        Loading your shops...
                                    </div>
                                </div>
                            ) : shops.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-gray-500 text-lg text-center mb-4">
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
                                                className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition text-left
                          ${shopId === shop.id
                                                        ? "border-black bg-black/80 text-white scale-105 shadow-lg"
                                                        : "border-gray-200 bg-gray-50 hover:bg-black/5"}
                        `}
                                            >
                                                {shop.logo && (
                                                    <img
                                                        src={shop.logo}
                                                        alt={shop.name}
                                                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-bold text-lg">{shop.name}</div>
                                                    <div className="text-xs text-gray-500">@{shop.username}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-8">
                                        <button
                                            type="button"
                                            className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
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
                            <h2 className="text-2xl font-black mb-8">Pick a main category</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {categories.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setCat(c.name)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg transition
                      ${cat === c.name
                                                ? "bg-black text-white shadow-md scale-105"
                                                : "bg-gray-50 hover:bg-gray-100 text-black"}
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
                                    className="px-7 py-3 bg-gray-100 text-black rounded-full font-bold uppercase tracking-wide shadow hover:bg-gray-200"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
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
                            <h2 className="text-2xl font-black mb-8">Pick a sub category</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {categories.find(c => c.name === cat)?.subcategories.map((sc) => (
                                    <button
                                        key={sc}
                                        type="button"
                                        onClick={() => setSub(sc)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg transition
                      ${sub === sc
                                                ? "bg-black text-white shadow-md scale-105"
                                                : "bg-gray-50 hover:bg-gray-100 text-black"}
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
                                    className="px-7 py-3 bg-gray-100 text-black rounded-full font-bold uppercase tracking-wide shadow hover:bg-gray-200"
                                    onClick={() => setStep(2)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
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
                            <h2 className="text-2xl font-black mb-8">Item details</h2>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1 mb-6">
                                    <label className="font-semibold">Item Title</label>
                                    <input
                                        className="bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold"
                                        maxLength={120}
                                        placeholder="Item Title"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1 mb-6">
                                    <label className="font-semibold">Description</label>
                                    <textarea
                                        className="bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold min-h-[120px]"
                                        maxLength={1200}
                                        placeholder="Description (up to 1200 characters)"
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1 mb-6">
                                    <label className="font-semibold">Item Price</label>
                                    <div className="relative w-full">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold border border-gray-300 pr-16"
                                            placeholder="Item Price"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold select-none pointer-events-none">LKR</span>
                                    </div>
                                    {price && !isNaN(Number(price)) && Number(price) > 0 && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            You will receive: <span className="font-semibold text-black">LKR {(Number(price) * 0.8).toLocaleString()}</span> (after 20% platform fee)
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 mb-6">
                                    <label className="font-semibold">Available Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold border border-gray-300"
                                        placeholder="Available Quantity"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-10">
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-gray-100 text-black rounded-full font-bold uppercase tracking-wide shadow hover:bg-gray-200"
                                    onClick={() => setStep(3)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
                                    disabled={!name || !desc || !price || !quantity}
                                    onClick={() => setStep(5)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}


                    {/* Step 5: Images */}
                    {step === 5 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-black mb-8">Add images</h2>
                            <div className="flex flex-wrap gap-6 mb-6">
                                {imagePreviews.map((src, idx) => (
                                    <div
                                        key={idx}
                                        className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 shadow flex items-center justify-center"
                                    >
                                        <img
                                            src={src}
                                            alt={`Preview ${idx + 1}`}
                                            className="object-cover w-full h-full"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition z-10"
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
                                        className="w-28 h-28 rounded-xl flex items-center justify-center bg-gray-50 shadow text-3xl text-gray-300 hover:bg-gray-100 transition"
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
                            <div className="text-sm text-gray-500 mb-2">{imagePreviews.length} / 5 images selected</div>
                            <div className="flex justify-between mt-10">
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-gray-100 text-black rounded-full font-bold uppercase tracking-wide shadow hover:bg-gray-200"
                                    onClick={() => setStep(4)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
                                    disabled={imagePreviews.length === 0}
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
                            <h2 className="text-2xl font-black mb-8">Delivery options</h2>
                            <div className="flex flex-col md:flex-row gap-7 mb-7">
                                <div className="flex-1 flex gap-4">
                                    <button
                                        type="button"
                                        className={`flex-1 px-0 py-4 rounded-xl font-semibold text-lg transition shadow
                      ${deliveryType === "free"
                                                ? "bg-black text-white"
                                                : "bg-gray-50 text-black hover:bg-gray-100"}`}
                                        onClick={() => setDeliveryType("free")}
                                    >
                                        Free Delivery
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 px-0 py-4 rounded-xl font-semibold text-lg transition shadow
                      ${deliveryType === "paid"
                                                ? "bg-black text-white"
                                                : "bg-gray-50 text-black hover:bg-gray-100"}`}
                                        onClick={() => setDeliveryType("paid")}
                                    >
                                        Buyer Pays Delivery
                                    </button>
                                </div>
                                {deliveryType === "paid" && (
                                    <div className="flex-1 flex flex-col gap-4">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold"
                                            placeholder="Per item (LKR)"
                                            value={deliveryPerItem}
                                            onChange={e => setDeliveryPerItem(e.target.value)}
                                            required
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black transition px-5 py-3 rounded-xl font-semibold"
                                            placeholder="Each additional item (LKR)"
                                            value={deliveryAdditional}
                                            onChange={e => setDeliveryAdditional(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center mb-7">
                                <input
                                    id="cod-checkbox"
                                    type="checkbox"
                                    checked={cashOnDelivery}
                                    onChange={e => setCashOnDelivery(e.target.checked)}
                                    className="mr-2 w-5 h-5 accent-black"
                                />
                                <label htmlFor="cod-checkbox" className="font-semibold text-base select-none">
                                    Allow buyers to pay with <span className="font-bold">Cash on Delivery</span>
                                </label>
                            </div>
                            <div className="flex justify-between mt-10">
                                <button
                                    type="button"
                                    className="px-7 py-3 bg-gray-100 text-black rounded-full font-bold uppercase tracking-wide shadow hover:bg-gray-200"
                                    onClick={() => setStep(5)}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-7 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/80 disabled:opacity-30"
                                    disabled={
                                        !deliveryType ||
                                        (deliveryType === "paid" &&
                                            (!deliveryPerItem || !deliveryAdditional)) ||
                                        (
                                            deliveryType === "paid" &&
                                            deliveryPerItem === initialDeliveryPerItem &&
                                            deliveryAdditional === initialDeliveryAdditional &&
                                            cashOnDelivery === initialCashOnDelivery
                                        ) ||
                                        (
                                            deliveryType === "free" &&
                                            cashOnDelivery === initialCashOnDelivery
                                        )
                                    }
                                >
                                    Update Listing
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
