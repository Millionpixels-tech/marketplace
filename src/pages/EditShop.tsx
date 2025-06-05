import { useState, useRef, useEffect } from "react";
import { db, storage } from "../utils/firebase";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiCamera, FiUpload, FiCheck } from "react-icons/fi";
import Header from "../components/UI/Header";
import { useParams } from "react-router-dom";

function wordCount(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EditShop() {
    const { shopId } = useParams(); // shopId passed from route params
    const [shopName, setShopName] = useState("");
    const [shopUser, setShopUser] = useState("");
    const [mobile, setMobile] = useState("");
    const [logo, setLogo] = useState<File | null>(null);
    const [cover, setCover] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [userExists, setUserExists] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

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
                setLogoPreview(d.logo);
                setCoverPreview(d.cover);
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

    // --- Image change/preview logic
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogo(e.target.files[0]);
            setLogoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCover(e.target.files[0]);
            setCoverPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    async function uploadImage(file: File, path: string) {
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    }

    // --- Update Shop logic
    const handleUpdate = async () => {
        setLoading(true);
        let logoUrl = logoPreview;
        let coverUrl = coverPreview;

        // Upload only if changed
        if (logo) {
            logoUrl = await uploadImage(logo, `shop-logos/${shopUser}_${Date.now()}`);
        }
        if (cover) {
            coverUrl = await uploadImage(cover, `shop-covers/${shopUser}_${Date.now()}`);
        }

        // Update the shop doc
        const shopRef = doc(db, "shops", shopId as string);
        await updateDoc(shopRef, {
            name: shopName,
            username: shopUser,
            mobile,
            description: desc,
            logo: logoUrl,
            cover: coverUrl,
            updatedAt: new Date(),
        });
        setLoading(false);
        setDone(true);
    };

    // --- UI is almost the same as CreateShop ---
    return (
        <>
            <Header />
            <div className="min-h-screen bg-[#f3eff5] flex flex-col items-center py-10 px-2">
                <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm p-0 md:p-12 flex flex-col items-center">
                    <div className="w-full flex flex-col items-start mb-8">
                        <h1 className="text-3xl md:text-4xl font-black mb-2 text-[#0d0a0b]">Edit Shop</h1>
                        <p className="text-[#454955] text-lg">Update your shop details and images.</p>
                    </div>
                    {/* Cover + Logo Section */}
                    <div className="w-full relative flex flex-col items-center mb-12">
                        <div
                            className="w-full h-40 md:h-64 rounded-2xl bg-[#f3eff5] flex items-center justify-center overflow-hidden cursor-pointer group transition border border-[#45495522]"
                            onClick={() => coverInputRef.current?.click()}
                            tabIndex={0}
                            title="Click to upload cover image"
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="object-cover w-full h-full" />
                            ) : (
                                <div className="flex flex-col items-center text-[#454955]">
                                    <FiUpload className="text-3xl mb-2" />
                                    <span className="font-medium text-sm">Click to add cover image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                ref={coverInputRef}
                                className="hidden"
                                onChange={handleCoverChange}
                            />
                        </div>
                        <div
                            className="absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-white bg-[#f3eff5] flex items-center justify-center shadow-sm cursor-pointer group transition"
                            onClick={() => logoInputRef.current?.click()}
                            title="Click to upload logo"
                            tabIndex={0}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="object-cover w-full h-full rounded-full" />
                            ) : (
                                <span className="flex flex-col items-center text-[#454955]">
                                    <FiCamera className="text-4xl mb-1" />
                                    <span className="font-medium text-xs">Add Logo</span>
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
                    {/* Main Info & Description (almost same as CreateShop) */}
                    <div className="w-full flex flex-col md:flex-row gap-10 mt-14 md:mt-8">
                        <div className="flex-1 flex flex-col gap-6">
                            <div>
                                <label className="block font-semibold mb-1 text-[#0d0a0b]">Shop Name</label>
                                <input
                                    className="w-full bg-[#f3eff5] focus:bg-white focus:ring-1 focus:ring-[#72b01d] border border-[#45495522] transition px-5 py-3 rounded-2xl font-semibold text-lg text-[#0d0a0b] shadow-sm"
                                    maxLength={80}
                                    value={shopName}
                                    onChange={e => setShopName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1 text-[#0d0a0b]">Shop Username <span className="font-normal text-[#45495599]">(unique URL)</span></label>
                                <input
                                    className="w-full bg-[#f3eff5] focus:bg-white focus:ring-1 focus:ring-[#72b01d] border border-[#45495522] transition px-5 py-3 rounded-2xl font-semibold text-lg text-[#0d0a0b] shadow-sm opacity-75"
                                    maxLength={24}
                                    value={shopUser}
                                    onChange={e => {
                                        setShopUser(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase());
                                        setUserExists(false);
                                    }}
                                    onBlur={() => shopUser && checkUsername(shopUser)}
                                    required
                                    disabled // Disable if you don't want it to change, remove if you want to allow
                                />
                                {shopUser && (
                                    <div className="mt-1 text-xs">
                                        <span className={userExists ? "text-red-600 font-bold" : "text-[#3f7d20] font-medium"}>
                                            {userExists
                                                ? "This username is already taken."
                                                : `Your shop URL: https://mydomain.com/shop/${shopUser}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block font-semibold mb-1 text-[#0d0a0b]">Mobile Number</label>
                                <div className="flex items-center gap-2 bg-[#f3eff5] border border-[#45495522] px-5 py-3 rounded-2xl shadow-sm">
                                    <span className="text-lg text-[#454955]">+94</span>
                                    <input
                                        className="flex-1 bg-transparent outline-none focus:ring-0 font-semibold text-lg text-[#0d0a0b]"
                                        maxLength={9}
                                        pattern="[0-9]{9}"
                                        value={mobile}
                                        onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                                        required
                                    />
                                </div>
                                <span className="text-xs text-[#454955] mt-1 block">Your Sri Lankan contact number</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <label className="font-semibold mb-1 text-[#0d0a0b]">Shop Description</label>
                            <textarea
                                className="w-full bg-[#f3eff5] focus:bg-white focus:ring-1 focus:ring-[#72b01d] border border-[#45495522] rounded-2xl px-4 py-3 text-[#0d0a0b] font-medium transition min-h-[160px] text-base shadow-sm"
                                maxLength={1500}
                                rows={8}
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                required
                            />
                            <div className="text-right text-xs mt-1 text-[#454955]">
                                {wordCount(desc)} / 300 words
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex justify-end mt-14">
                        <button
                            className="bg-[#72b01d] text-white px-10 py-3 rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] transition disabled:opacity-40"
                            disabled={
                                !shopName || !shopUser || userExists || !mobile || !desc || loading || wordCount(desc) > 300
                            }
                            onClick={handleUpdate}
                            type="button"
                        >
                            {done
                                ? <span className="flex items-center gap-2"><FiCheck /> Saved!</span>
                                : loading
                                    ? "Saving..."
                                    : "Save Changes"}
                        </button>
                    </div>
                    {done && (
                        <div className="w-full flex justify-center mt-8">
                            <div className="text-[#3f7d20] font-bold text-lg flex items-center gap-2">
                                <FiCheck /> Shop profile updated!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
