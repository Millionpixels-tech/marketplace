import { useState, useRef, useEffect, useCallback } from "react";
import { db, auth, storage } from "../../utils/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiUpload, FiCheck, FiLoader } from "react-icons/fi";
import { Button, Card, Input } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { compressImage, generateSEOFilename } from "../../utils/imageUtils";

export default function CreateShop() {
  const [shopName, setShopName] = useState("");
  const [shopUser, setShopUser] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Username uniqueness check with debouncing
  const checkUsername = useCallback(async (username: string) => {
    if (!username.trim()) {
      setUserExists(false);
      setUsernameError("");
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameError("");
    
    try {
      const q = query(collection(db, "shops"), where("username", "==", username.toLowerCase()));
      const docs = await getDocs(q);
      const exists = !docs.empty;
      
      setUserExists(exists);
      if (exists) {
        setUsernameError("This username is already taken. Please choose a different one.");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username. Please try again.");
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounced username change handler
  const handleUsernameChange = useCallback((value: string) => {
    const cleanValue = value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    setShopUser(cleanValue);
    setUserExists(false);
    setUsernameError("");
    
    // Clear existing timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    
    // Set new timeout for checking username
    if (cleanValue.trim()) {
      usernameTimeoutRef.current = setTimeout(() => {
        checkUsername(cleanValue);
      }, 500); // Check username after 500ms of no typing
    }
  }, [checkUsername]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  // Image preview logic with compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedLogo = await compressImage(e.target.files[0], 400, 400, 0.8);
        setLogo(compressedLogo);
        setLogoPreview(URL.createObjectURL(compressedLogo));
      } catch (error) {
        console.error('Logo compression error:', error);
        // Fallback to original file
        setLogo(e.target.files[0]);
        setLogoPreview(URL.createObjectURL(e.target.files[0]));
      }
    }
  };
  
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedCover = await compressImage(e.target.files[0], 1200, 600, 0.8);
        setCover(compressedCover);
        setCoverPreview(URL.createObjectURL(compressedCover));
      } catch (error) {
        console.error('Cover compression error:', error);
        // Fallback to original file
        setCover(e.target.files[0]);
        setCoverPreview(URL.createObjectURL(e.target.files[0]));
      }
    }
  };

  // Upload file to Firebase Storage with SEO filename
  async function uploadImage(file: File, type: 'logo' | 'cover', shopUsername: string) {
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
        altText: type === 'logo' 
          ? `${shopName} - Sri Lankan Shop Logo` 
          : `${shopName} - Sri Lankan Shop Cover Image`
      }
    });
    
    return await getDownloadURL(fileRef);
  }

  // Save/Update Shop logic
  const handleSave = async () => {
    // Double-check username availability before saving
    if (userExists || checkingUsername) {
      setUsernameError("Please choose a different username or wait for validation to complete.");
      return;
    }

    if (!shopUser.trim()) {
      setUsernameError("Username is required.");
      return;
    }

    setLoading(true);
    setUsernameError("");

    try {
      // Final check for username availability
      const q = query(collection(db, "shops"), where("username", "==", shopUser.toLowerCase()));
      const docs = await getDocs(q);
      
      if (!docs.empty) {
        setUserExists(true);
        setUsernameError("This username is already taken. Please choose a different one.");
        setLoading(false);
        return;
      }

      let logoUrl = "";
      let coverUrl = "";

      // 1. Upload images if present
      if (logo) {
        logoUrl = await uploadImage(logo, 'logo', shopUser.toLowerCase());
      }
      if (cover) {
        coverUrl = await uploadImage(cover, 'cover', shopUser.toLowerCase());
      }

      // 2. Save shop data
      await addDoc(collection(db, "shops"), {
        owner: auth.currentUser?.uid,
        name: shopName,
        username: shopUser.toLowerCase(),
        mobile,
        address,
        description: desc,
        logo: logoUrl,
        cover: coverUrl,
        createdAt: new Date(),
      });
      
      setLoading(false);
      setDone(true);
      
      // Redirect to the newly created shop page
      setTimeout(() => {
        navigate(`/shop/${shopUser.toLowerCase()}`);
      }, 1000); // Small delay to show success message
    } catch (error) {
      console.error("Error creating shop:", error);
      setUsernameError("Error creating shop. Please try again.");
      setLoading(false);
    }
  };

  // --- UI starts here ---
  return (
    <>
      <ResponsiveHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center py-4 md:py-10 px-2 md:px-4">
        <div className="w-full max-w-5xl bg-white rounded-xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-12 flex flex-col items-center">
          <div className="w-full flex flex-col items-start mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 text-[#0d0a0b]">Create Your Shop</h1>
            <p className="text-[#454955] text-base md:text-lg">Set up your shop profile, add a logo, and tell customers what makes your shop unique.</p>
          </div>
          {/* --- Cover + Logo Section --- */}
          <div className="w-full relative flex flex-col items-center mb-8 md:mb-12">
            {/* Cover image */}
            <div
              className="w-full h-32 md:h-40 lg:h-64 rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg border-2 border-dashed border-gray-300 hover:border-[#72b01d]"
              onClick={() => coverInputRef.current?.click()}
              tabIndex={0}
              title="Click to upload cover image"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-start pt-4 md:pt-8 text-[#6b7280] group-hover:text-[#72b01d] transition-colors h-full">
                  <FiUpload className="text-2xl md:text-3xl mb-1 md:mb-2" />
                  <span className="font-medium text-xs md:text-sm">Click to add cover image</span>
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
              className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 w-20 h-20 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-white bg-white flex items-center justify-center shadow-lg cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-105"
              onClick={() => logoInputRef.current?.click()}
              title="Click to upload logo"
              tabIndex={0}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="object-cover w-full h-full rounded-full" />
              ) : (
                <span className="flex flex-col items-center text-[#6b7280] group-hover:text-[#72b01d] transition-colors">
                  <FiCamera className="text-2xl md:text-4xl mb-1" />
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
          <div className="w-full flex flex-col md:flex-row gap-6 md:gap-10 mt-12 md:mt-20 lg:mt-16">
            <div className="flex-1 space-y-6 md:space-y-8">
              {/* Shop Name */}
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-[#2d3748] mb-2 md:mb-3 tracking-wide uppercase">
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
                <label className="block text-xs md:text-sm font-bold text-[#2d3748] mb-2 md:mb-3 tracking-wide uppercase">
                  Shop Username <span className="font-normal text-[#6b7280] normal-case">(unique URL)</span>
                </label>
                <Input
                  className={userExists 
                    ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                    : ""}
                  maxLength={24}
                  placeholder="e.g. crafty_kavi"
                  value={shopUser}
                  onChange={e => handleUsernameChange(e.target.value)}
                  required
                />
                {/* Username validation status */}
                {shopUser && (
                  <div className="mt-3">
                    {checkingUsername ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="text-sm text-blue-700 font-medium flex items-center">
                          <FiLoader className="animate-spin mr-2" />
                          Checking username availability...
                        </div>
                      </div>
                    ) : usernameError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="text-sm text-red-700 font-medium flex items-center">
                          ❌ {usernameError}
                        </div>
                      </div>
                    ) : !userExists ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="text-sm text-green-700 font-medium flex items-center">
                          ✅ Username available!
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Your shop URL: https://sina.lk/shop/{shopUser}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                  {shopUser.length}/24 characters • Only letters, numbers, underscores and dashes
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
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-[#2d3748] mb-2 md:mb-3 tracking-wide uppercase">
                  Shop Address
                </label>
                <Input
                  maxLength={150}
                  placeholder="Enter your complete shop address..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                />
                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                  Your shop's physical address for delivery purposes ({address.length}/150 characters)
                </div>
              </div>
            </div>
            {/* Description */}
            <div className="flex-1">
              <div className="group">
                <label className="block text-xs md:text-sm font-bold text-[#2d3748] mb-2 md:mb-3 tracking-wide uppercase">
                  Shop Description
                </label>
                <textarea
                  className="w-full bg-white border rounded-xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[140px] md:min-h-[180px] px-3 md:px-4 py-2 md:py-3 transition-all duration-200 focus:outline-none resize-none focus:border-[#72b01d] hover:border-[rgba(114,176,29,0.5)] focus:shadow-lg focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                  style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
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

          {/* --- Save Button --- */}
          <div className="w-full flex justify-center md:justify-end mt-8 md:mt-16">
            <Button
              variant="primary"
              size="lg"
              disabled={
                !shopName || 
                !shopUser || 
                userExists || 
                checkingUsername || 
                usernameError !== "" ||
                !mobile || 
                !address ||
                !desc || 
                !logo || 
                !cover || 
                loading || 
                desc.length > 200
              }
              loading={loading}
              onClick={handleSave}
              className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-lg hover:shadow-xl focus:ring-4 focus:ring-[#72b01d]/20 bg-gradient-to-r from-[#72b01d] to-[#5a8a17] hover:from-[#5a8a17] hover:to-[#4a7314] transform hover:scale-105 transition-all duration-200"
            >
              {done
                ? <span className="flex items-center gap-2"><FiCheck /> Shop Created! ✨</span>
                : "Create Shop ✨"}
            </Button>
          </div>
          {done && (
            <div className="w-full flex justify-center mt-6 md:mt-8">
              <Card className="p-4 md:p-6 bg-green-50 border-green-200">
                <div className="text-green-700 font-bold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3">
                  <span className="text-xl md:text-2xl">🎉</span>
                  <span>Shop created successfully! Redirecting to your shop...</span>
                  <FiCheck className="text-green-600" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />
      </>
  );
}
