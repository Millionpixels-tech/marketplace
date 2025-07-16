import { useState, useRef, useEffect } from "react";
import { db, storage } from "../../utils/firebase";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiCamera, FiCheck } from "react-icons/fi";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import Input from "../../components/UI/Input";
import { useParams } from "react-router-dom";
import { compressImage, generateSEOFilename } from "../../utils/imageUtils";

export default function EditShop() {
    const { shopId } = useParams(); // shopId passed from route params
    const [shopName, setShopName] = useState("");
    const [shopUser, setShopUser] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [userExists, setUserExists] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);

    // 1. Load shop data on mount
    useEffect(() => {
        const fetchShop = async () => {
            setLoading(true);
            const shopRef = doc(db, "shops", shopId as string);
            const snap = await getDoc(shopRef);
            if (snap.exists()) {
                const d = snap.data();
                setShopName(d.name);
                setShopUser(d.username);
                setMobile(d.mobile);
                setAddress(d.address || "");
                setLogoPreview(d.logo);
                setDesc(d.description);
            }
            setLoading(false);
        };
        if (shopId) fetchShop();
    }, [shopId]);

    // Only check username if user changes username (optional: you can disable username editing)
    const checkUsername = async (username: string) => {
        if (!username) return;
        const q = query(collection(db, "shops"), where("username", "==", username));
        const docs = await getDocs(q);
        // exclude current shop from check
        const exists = docs.docs.some(doc => doc.id !== shopId);
        setUserExists(exists);
    };

    // --- Image change/preview logic with compression
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressedLogo = await compressImage(e.target.files[0], 400, 400, 0.8);
                setLogo(compressedLogo);
                setLogoPreview(URL.createObjectURL(compressedLogo));
            } catch (error) {
                console.error('Logo compression error:', error);
                setLogo(e.target.files[0]);
                setLogoPreview(URL.createObjectURL(e.target.files[0]));
            }
        }
    };

    // Upload file to Firebase Storage with SEO filename
    async function uploadImage(file: File, type: 'logo', shopUsername: string) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        // Generate SEO-friendly filename
        const seoFilename = generateSEOFilename(
            shopName,
            'shop',
            type,
            0,
            shopUsername
        );
        
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${seoFilename}.${extension}`;
        
        // Organized storage path
        const storagePath = `shops/${shopUsername}/${year}/${month}/${type}/${filename}`;
        const fileRef = ref(storage, storagePath);
        
        // Upload with metadata
        await uploadBytes(fileRef, file, {
            customMetadata: {
                shopName: shopName,
                shopUsername: shopUsername,
                imageType: type,
                uploadedAt: now.toISOString(),
                originalSize: file.size.toString(),
                seoFilename: filename,
                altText: `${shopName} - Sri Lankan Shop Logo`
            }
        });
        
        return await getDownloadURL(fileRef);
    }

    // --- Update Shop logic
    const handleUpdate = async () => {
        setLoading(true);
        let logoUrl = logoPreview;

        // Upload only if changed
        if (logo) {
            logoUrl = await uploadImage(logo, 'logo', shopUser);
        }

        // Update the shop doc
        const shopRef = doc(db, "shops", shopId as string);
        await updateDoc(shopRef, {
            name: shopName,
            username: shopUser,
            mobile,
            address,
            description: desc,
            logo: logoUrl,
            updatedAt: new Date(),
        });
        setLoading(false);
        setDone(true);
    };

    // --- UI is almost the same as CreateShop ---
    return (
        <>
            <ResponsiveHeader />
            <div className="min-h-screen bg-white flex flex-col items-center py-4 md:py-10 px-2 md:px-4">
                <div className="w-full max-w-5xl bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-12 flex flex-col items-center">
                    <div className="w-full flex flex-col items-start mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 text-[#0d0a0b]">Edit Shop</h1>
                        <p className="text-[#454955] text-base md:text-lg">Update your shop details and images.</p>
                    </div>
                    {/* Logo Section */}
                    <div className="w-full relative flex flex-col items-center mb-8 md:mb-12">
                        <div
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-200 bg-white flex items-center justify-center shadow-lg cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-[#72b01d]"
                            onClick={() => logoInputRef.current?.click()}
                            title="Click to upload logo"
                            tabIndex={0}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="object-cover w-full h-full rounded-full" />
                            ) : (
                                <span className="flex flex-col items-center text-[#6b7280] group-hover:text-[#72b01d] transition-colors">
                                    <FiCamera className="text-3xl md:text-4xl mb-2" />
                                    <span className="font-medium text-sm">Add Logo</span>
                                </span>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                ref={logoInputRef}
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                        </div>
                    </div>
                    {/* Main Info & Description */}
                    <div className="w-full flex flex-col md:flex-row gap-6 md:gap-10">
                        <div className="flex-1 space-y-6 md:space-y-8">
                            {/* Shop Name */}
                            <Input
                                label="Shop Name"
                                placeholder="Enter your shop name..."
                                value={shopName}
                                onChange={e => setShopName(e.target.value)}
                                maxLength={80}
                                required
                                helperText={`${shopName.length}/80 characters • This will be your shop's display name`}
                            />

                            {/* Shop Username */}
                            <div className="group">
                                <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                    Shop Username <span className="font-normal text-[#6b7280] normal-case">(unique URL)</span>
                                </label>
                                <input
                                    className={`w-full border transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-medium placeholder-[#9ca3af] shadow-sm text-base md:text-lg
                                        ${userExists 
                                            ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/10 text-red-700" 
                                            : "bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"}`}
                                    maxLength={24}
                                    placeholder="username"
                                    value={shopUser}
                                    onChange={e => {
                                        setShopUser(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase());
                                        setUserExists(false);
                                    }}
                                    onBlur={() => shopUser && checkUsername(shopUser)}
                                    required
                                    disabled // Username changes disabled for shops
                                />
                                {shopUser && !userExists && (
                                    <div className="mt-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                            <div className="text-sm text-blue-700 font-medium flex items-center">
                                                🔗 Your shop URL
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1 font-mono">
                                                https://sina.lk/shop/{shopUser}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {userExists && (
                                    <div className="mt-3">
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                            <div className="text-sm text-red-700 font-medium flex items-center">
                                                ❌ This username is already taken
                                            </div>
                                            <div className="text-xs text-red-600 mt-1">
                                                Please choose a different username
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                    Username is disabled to maintain existing links and bookmarks
                                </div>
                            </div>

                            {/* Shop Mobile */}
                            <div className="group">
                                <label className="block text-xs md:text-sm font-bold text-[#2d3748] mb-2 md:mb-3 tracking-wide uppercase">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <div 
                                        className="flex items-center bg-white border rounded-xl transition-all duration-200 focus-within:border-[#72b01d] hover:border-[rgba(114,176,29,0.5)] focus-within:shadow-lg focus-within:ring-4 focus-within:ring-[#72b01d]/10"
                                        style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
                                    >
                                        <span className="text-base md:text-lg text-[#6b7280] font-bold pl-3 md:pl-4 pr-1 md:pr-2 select-none">+94</span>
                                        <input
                                            className="flex-1 bg-transparent outline-none border-0 px-1 md:px-2 py-2 md:py-3 font-medium placeholder-[#9ca3af] text-[#0d0a0b] text-base md:text-base"
                                            maxLength={9}
                                            pattern="[0-9]{9}"
                                            placeholder="7xxxxxxxx"
                                            value={mobile}
                                            onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                    Your Sri Lankan contact number for customers to reach you
                                </div>
                            </div>

                            {/* Shop Address */}
                            <Input
                                label="Shop Address"
                                placeholder="Enter your complete shop address..."
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                maxLength={150}
                                required
                                helperText={`Your shop's physical address for delivery purposes (${address.length}/150 characters)`}
                            />
                        </div>
                        {/* Description */}
                        <div className="flex-1">
                            <div className="group">
                                <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                    Shop Description
                                </label>
                                <textarea
                                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[140px] md:min-h-[180px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none text-sm md:text-base"
                                    maxLength={200}
                                    rows={6}
                                    placeholder="Describe your shop - what you sell, what makes it unique, your story..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                    required
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs md:text-sm text-[#6b7280]">
                                        Tell customers what makes your shop special
                                    </div>
                                    <div className={`text-xs md:text-sm font-medium ${desc.length > 200 ? 'text-red-600' : 'text-[#6b7280]'}`}>
                                        {desc.length}/200
                                    </div>
                                </div>
                                {desc.length > 200 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                                        <div className="text-sm text-red-700 font-medium">
                                            ⚠️ Description is too long
                                        </div>
                                        <div className="text-xs text-red-600 mt-1">
                                            Please keep your description under 200 characters
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex justify-center md:justify-end mt-8 md:mt-16">
                        <button
                            className="w-full md:w-auto bg-[#72b01d] text-white px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-lg hover:bg-[#3f7d20] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-[#72b01d]/20"
                            disabled={
                                !shopName || !shopUser || userExists || !mobile || !address || !desc || loading || desc.length > 200
                            }
                            onClick={handleUpdate}
                            type="button"
                        >
                            {done
                                ? <span className="flex items-center gap-2"><FiCheck /> Shop Updated! ✨</span>
                                : loading
                                    ? "Updating Shop..."
                                    : "Save Changes ✨"}
                        </button>
                    </div>
                    {done && (
                        <div className="w-full flex justify-center mt-6 md:mt-8">
                            <div className="bg-green-50 border border-green-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex items-center justify-center">
                                <div className="text-green-700 font-bold text-base md:text-lg flex items-center gap-2 md:gap-3">
                                    <span className="text-xl md:text-2xl">🎉</span>
                                    <span>Shop updated successfully!</span>
                                    <FiCheck className="text-green-600" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
