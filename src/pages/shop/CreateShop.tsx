import { useState, useRef } from "react";
import { db, auth, storage } from "../../utils/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FiCamera, FiUpload, FiCheck } from "react-icons/fi";
import { Header, Button, Card, Input } from "../../components/UI";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function CreateShop() {
  const [shopName, setShopName] = useState("");
  const [shopUser, setShopUser] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [mobile, setMobile] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Username uniqueness check
  const checkUsername = async (username: string) => {
    if (!username) return;
    const q = query(collection(db, "shops"), where("username", "==", username));
    const docs = await getDocs(q);
    setUserExists(!docs.empty);
  };

  // Image preview logic
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

  // Upload file to Firebase Storage and get URL
  async function uploadImage(file: File, path: string) {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  // Save/Update Shop logic
  const handleSave = async () => {
    setLoading(true);
    let logoUrl = "";
    let coverUrl = "";

    // 1. Upload images if present
    if (logo) {
      logoUrl = await uploadImage(logo, `shop-logos/${shopUser}_${Date.now()}`);
    }
    if (cover) {
      coverUrl = await uploadImage(cover, `shop-covers/${shopUser}_${Date.now()}`);
    }

    // 2. Save shop data
    await addDoc(collection(db, "shops"), {
      owner: auth.currentUser?.uid,
      name: shopName,
      username: shopUser,
      mobile,
      description: desc,
      logo: logoUrl,
      cover: coverUrl,
      createdAt: new Date(),
    });
    setLoading(false);
    setDone(true);
  };

  // --- UI starts here ---
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white flex flex-col items-center py-10 px-2">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm p-0 md:p-12 flex flex-col items-center">
          <div className="w-full flex flex-col items-start mb-8">
            <h1 className="text-3xl md:text-4xl font-black mb-2 text-[#0d0a0b]">Create Your Shop</h1>
            <p className="text-[#454955] text-lg">Set up your shop profile, add a logo, and tell customers what makes your shop unique.</p>
          </div>
          {/* --- Cover + Logo Section --- */}
          <div className="w-full relative flex flex-col items-center mb-12">
            {/* Cover image */}
            <div
              className="w-full h-40 md:h-64 rounded-2xl bg-white flex items-center justify-center overflow-hidden cursor-pointer group transition border border-[#45495522]"
              onClick={() => coverInputRef.current?.click()}
              tabIndex={0}
              title="Click to upload cover image"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-start pt-8 text-[#454955] h-full">
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
            {/* Logo */}
            <div
              className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-sm cursor-pointer group transition"
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

          {/* --- Shop Main Info --- */}
          <div className="w-full flex flex-col md:flex-row gap-10 mt-20 md:mt-16">
            <div className="flex-1 space-y-8">
              {/* Shop Name */}
              <div className="group">
                <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                  Shop Name
                </label>
                <Input
                  maxLength={80}
                  placeholder="Enter your shop name..."
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  required
                />
                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                  {shopName.length}/80 characters • This will be your shop's display name
                </div>
              </div>

              {/* Shop Username */}
              <div className="group">
                <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                  Shop Username <span className="font-normal text-[#6b7280] normal-case">(unique URL)</span>
                </label>
                <Input
                  className={userExists 
                    ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : ""}
                  maxLength={24}
                  placeholder="e.g. crafty_kavi"
                  value={shopUser}
                  onBlur={() => shopUser && checkUsername(shopUser)}
                  onChange={e => {
                    setShopUser(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase());
                    setUserExists(false);
                  }}
                  required
                />
                {shopUser && (
                  <div className="mt-3">
                    {userExists ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="text-sm text-red-700 font-medium flex items-center">
                          ❌ This username is already taken
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          Please choose a different username
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="text-sm text-green-700 font-medium flex items-center">
                          ✅ Username available!
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Your shop URL: https://sina.lk/shop/{shopUser}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                  {shopUser.length}/24 characters • Only letters, numbers, underscores and dashes
                </div>
              </div>

              {/* Shop Mobile */}
              <div className="group">
                <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="flex items-center bg-white border-2 border-[#e5e5e5] focus-within:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl shadow-sm focus-within:shadow-md focus-within:ring-4 focus-within:ring-[#72b01d]/10">
                    <span className="text-lg text-[#6b7280] font-bold mr-3 select-none">+94</span>
                    <Input
                      className="flex-1 bg-transparent outline-none border-0 px-0 py-0 focus:ring-0 shadow-none"
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
            </div>
            {/* Description */}
            <div className="flex-1">
              <div className="group">
                <label className="block text-sm font-bold text-[#0d0a0b] mb-3 tracking-wide uppercase">
                  Shop Description
                </label>
                <textarea
                  className="w-full bg-white border-2 border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-6 py-4 rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[180px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none"
                  maxLength={1500}
                  rows={8}
                  placeholder="Describe your shop - what you sell, what makes it unique, your story..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-[#6b7280] ml-1">
                    Tell customers about your shop and what makes it special
                  </div>
                  <div className={`text-xs font-medium ml-1 ${wordCount(desc) > 300 ? 'text-red-600' : 'text-[#6b7280]'}`}>
                    {wordCount(desc)} / 300 words
                  </div>
                </div>
                {wordCount(desc) > 300 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                    <div className="text-sm text-red-700 font-medium">
                      ⚠️ Description is too long
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Please keep your description under 300 words
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- Save Button --- */}
          <div className="w-full flex justify-end mt-16">
            <Button
              variant="primary"
              size="lg"
              disabled={
                !shopName || !shopUser || userExists || !mobile || !desc || !logo || !cover || loading || wordCount(desc) > 300
              }
              loading={loading}
              onClick={handleSave}
              className="px-12 py-4 rounded-2xl uppercase tracking-wide shadow-lg hover:shadow-xl focus:ring-4 focus:ring-[#72b01d]/20"
            >
              {done
                ? <span className="flex items-center gap-2"><FiCheck /> Shop Created! ✨</span>
                : "Create Shop ✨"}
            </Button>
          </div>
          {done && (
            <div className="w-full flex justify-center mt-8">
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="text-green-700 font-bold text-lg flex items-center justify-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <span>Shop profile created successfully!</span>
                  <FiCheck className="text-green-600" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div></>
  );
}
