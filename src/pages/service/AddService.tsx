import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { 
  serviceCategories, 
  ServiceCategory, 
  serviceCategoryIcons,
  serviceSubcategoryIcons,
  getServiceSubcategories
} from "../../utils/serviceCategories";
import { sriLankanProvinces, getAllDistricts } from "../../utils/sriLankanDistricts";
import ServicePackages from "../../components/service/ServicePackages";
import type { ServicePackage } from "../../types/service";
import { createDefaultPackage } from "../../types/service";
import { Button } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { processImageForUpload } from "../../utils/imageUtils";
import { FiX, FiTool } from "react-icons/fi";

const steps = [
  { label: "Shop" },
  { label: "Category" },
  { label: "Subcategory" },
  { label: "Service Details" },
  { label: "Packages" },
  { label: "Images" },
  { label: "Availability" },
  { label: "Settings" }
];

export default function AddService() {
  const [step, setStep] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [shopId, setShopId] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [subcategory, setSubcategory] = useState("");
  
  // Service Details state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryType, setDeliveryType] = useState("online");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [requirements, setRequirements] = useState("");
  
  // Packages state
  const [packages, setPackages] = useState<ServicePackage[]>([createDefaultPackage()]);
  
  // Images state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Availability state
  const [availability, setAvailability] = useState({
    monday: { available: false, hours: "" },
    tuesday: { available: false, hours: "" },
    wednesday: { available: false, hours: "" },
    thursday: { available: false, hours: "" },
    friday: { available: false, hours: "" },
    saturday: { available: false, hours: "" },
    sunday: { available: false, hours: "" }
  });
  const [responseTime, setResponseTime] = useState("Within 24 hours");
  
  // Service Settings state
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Fetch user's shops
  useEffect(() => {
    async function fetchShops() {
      if (!user?.uid) return;
      
      try {
        const shopsQuery = query(
          collection(db, "shops"),
          where("owner", "==", user.uid)
        );
        const shopsSnapshot = await getDocs(shopsQuery);
        const shopsList = shopsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShops(shopsList);
        
        if (shopsList.length === 1) {
          setShopId(shopsList[0].id);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        showToast("error", "Failed to load shops");
      }
    }
    
    fetchShops();
  }, [user, showToast]);

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };

  // Image handling functions
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
              title || 'service', // Use service title or fallback
              category as string || 'general', // Use category or fallback
              subcategory, // subcategory (optional)
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

  const availableSubcategories = category ? getServiceSubcategories(category as ServiceCategory) : [];

  // Availability handling functions
  const updateDayAvailability = (day: string, available: boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], available }
    }));
  };

  const updateDayHours = (day: string, hours: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], hours }
    }));
  };

  const setAllDaysAvailable = (available: boolean) => {
    setAvailability(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(day => {
        updated[day as keyof typeof updated].available = available;
      });
      return updated;
    });
  };

  // Keywords handling functions
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim()) && keywords.length < 10) {
      setKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  // Service creation function
  const handleCreateService = async () => {
    if (!user?.uid || !shopId) {
      showToast('error', 'Please select a shop first');
      return;
    }

    // Validation
    if (!title.trim() || !description.trim() || !category || !subcategory) {
      showToast('error', 'Please fill in all required service details');
      return;
    }

    if (packages.length === 0 || packages.some(pkg => !pkg.name || !pkg.description || pkg.price <= 0)) {
      showToast('error', 'Please complete at least one service package');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls: string[] = [];
      let imageMetadata: any[] = [];

      // Upload images to Firebase Storage if any
      if (images.length > 0) {
        const serviceId = crypto.randomUUID(); // Generate unique ID for the service
        
        const uploadPromises = images.map(async (file, idx) => {
          const imageRef = ref(storage, `services/${serviceId}/image-${idx}-${Date.now()}`);
          const snapshot = await uploadBytes(imageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          
          return {
            url,
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              index: idx
            }
          };
        });

        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(result => result.url);
        imageMetadata = uploadResults.map(result => result.metadata);
      }

      // Prepare service data
      const serviceData = {
        owner: user.uid,
        shopId,
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        deliveryType,
        serviceArea: serviceAreas,
        packages,
        requirements: requirements.trim() || "",
        additionalInfo: additionalInfo.trim() || "",
        images: imageUrls,
        imageMetadata,
        availability,
        responseTime,
        isActive,
        isPaused,
        keywords,
        viewCount: 0,
        bookingCount: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'services'), serviceData);
      
      showToast('success', 'Service created successfully!');
      
      // Navigate to the created service or services list
      navigate(`/service/${docRef.id}`);
      
    } catch (error) {
      console.error('Error creating service:', error);
      showToast('error', 'Failed to create service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Add New Service - Sina.lk"
        description="Create a new service listing on Sina.lk. Set up your service packages, availability, and start offering your professional services to customers across Sri Lanka."
        keywords={generateKeywords([
          'add service',
          'offer services',
          'create service listing',
          'professional services',
          'Sri Lankan service providers',
          'freelance services',
          'business services'
        ])}
        canonicalUrl={getCanonicalUrl('/add-service')}
        noIndex={false}
      />
      <ResponsiveHeader />
      <div className="bg-white min-h-screen flex flex-col items-center py-4 md:py-8 px-2 md:px-4">
        {/* Progress Stepper */}
        <div className="w-full max-w-4xl mx-auto mb-4 md:mb-12 px-4">
          <div className="hidden md:block">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0">
                <div 
                  className="h-full bg-gradient-to-r from-[#72b01d] to-[#3f7d20] transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {steps.map((s, idx) => (
                <div key={s.label} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      idx + 1 <= step
                        ? "bg-gradient-to-br from-[#72b01d] to-[#3f7d20] text-white shadow-lg"
                        : "bg-white border-2 border-gray-300 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      idx + 1 <= step ? "text-[#72b01d]" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-xl md:rounded-3xl border border-[#e5e7eb] p-4 md:p-8 lg:p-12">
          
          {/* Step 1: Shop Selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Which shop will offer this service?</h2>
              
              {shops.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#454955] mb-4">You need to create a shop first to add services.</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/create-shop')}
                    className="px-6 py-3 rounded-xl"
                  >
                    Create Shop
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {shops.map((shop) => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => setShopId(shop.id)}
                        className={`p-4 md:p-6 rounded-xl border-2 transition text-left
                          ${shopId === shop.id
                            ? "border-[#72b01d] bg-[#72b01d]/5 shadow-md"
                            : "border-[#e5e7eb] hover:border-[#72b01d]/30 hover:bg-gray-50"}
                        `}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-[#72b01d] flex items-center justify-center text-white font-bold text-lg md:text-xl">
                              {shop.name[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-base md:text-lg">{shop.name}</div>
                            <div className="text-xs text-[#454955]">@{shop.username}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-center md:justify-end mt-6 md:mt-8">
                    <Button
                      variant="primary"
                      disabled={!shopId}
                      onClick={handleNext}
                      className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                    >
                      Next →
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Category Selection */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">What category is your service?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {serviceCategories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`p-4 md:p-6 rounded-xl border-2 transition text-center
                      ${category === cat.name
                        ? "border-[#72b01d] bg-[#72b01d]/5 shadow-md"
                        : "border-[#e5e7eb] hover:border-[#72b01d]/30 hover:bg-gray-50"}
                    `}
                  >
                    <div className="text-2xl md:text-3xl mb-2">
                      {(() => {
                        const IconComponent = serviceCategoryIcons[cat.name];
                        return IconComponent ? <IconComponent className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#72b01d]" /> : null;
                      })()}
                    </div>
                    <div className="font-semibold text-xs md:text-sm">{cat.name}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!category}
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Subcategory Selection */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Choose a specific subcategory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategory(sub)}
                    className={`p-4 md:p-6 rounded-xl border-2 transition text-center
                      ${subcategory === sub
                        ? "border-[#72b01d] bg-[#72b01d]/5 shadow-md"
                        : "border-[#e5e7eb] hover:border-[#72b01d]/30 hover:bg-gray-50"}
                    `}
                  >
                    <div className="text-2xl md:text-3xl mb-2">
                      {serviceSubcategoryIcons[sub] ? (
                        React.createElement(serviceSubcategoryIcons[sub], { className: "w-6 h-6 md:w-8 md:h-8 mx-auto text-[#72b01d]" })
                      ) : (
                        <FiTool className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#72b01d]" />
                      )}
                    </div>
                    <div className="font-semibold text-xs md:text-sm">{sub}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!subcategory}
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Service Details */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Tell us about your service</h2>
              
              <div className="space-y-6">
                {/* Service Title */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d0a0b] mb-2">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Professional Website Design"
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                  />
                </div>

                {/* Service Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d0a0b] mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your service in detail..."
                    rows={5}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#72b01d] focus:border-transparent resize-none"
                  />
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d0a0b] mb-2">
                    Service Delivery *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("online")}
                      className={`p-4 rounded-xl border-2 transition text-left
                        ${deliveryType === "online"
                          ? "border-[#72b01d] bg-[#72b01d]/5"
                          : "border-[#e5e7eb] hover:border-[#72b01d]/30"}
                      `}
                    >
                      <div className="font-semibold">Online Service</div>
                      <div className="text-sm text-[#454955] mt-1">Delivered remotely via internet</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("onsite")}
                      className={`p-4 rounded-xl border-2 transition text-left
                        ${deliveryType === "onsite"
                          ? "border-[#72b01d] bg-[#72b01d]/5"
                          : "border-[#e5e7eb] hover:border-[#72b01d]/30"}
                      `}
                    >
                      <div className="font-semibold">On-site Service</div>
                      <div className="text-sm text-[#454955] mt-1">Visit customer location</div>
                    </button>
                  </div>
                </div>

                {/* Service Areas (only for onsite services) */}
                {deliveryType === "onsite" && (
                  <div>
                    <label className="block text-sm font-semibold text-[#0d0a0b] mb-2">
                      Service Areas *
                    </label>
                    <p className="text-xs text-[#454955] mb-3">Select the districts where you provide your service</p>
                    
                    {/* Quick Select Options */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          const allDistricts = getAllDistricts().map(d => d.name);
                          setServiceAreas(allDistricts);
                        }}
                        className="px-3 py-1 text-xs bg-[#72b01d] text-white rounded-lg hover:bg-[#5a8c16] transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceAreas([])}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const westernDistricts = sriLankanProvinces.find(p => p.name === "Western Province")?.districts || [];
                          setServiceAreas(westernDistricts);
                        }}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        Western Province
                      </button>
                    </div>

                    {/* Districts by Province */}
                    <div className="space-y-4 max-h-64 overflow-y-auto border border-[#e5e7eb] rounded-xl p-4">
                      {sriLankanProvinces.map((province) => (
                        <div key={province.name}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm text-[#0d0a0b]">{province.name}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const allProvinceDistrictsSelected = province.districts.every(d => 
                                  serviceAreas.includes(d)
                                );
                                
                                if (allProvinceDistrictsSelected) {
                                  // Remove all districts from this province
                                  setServiceAreas(prev => prev.filter(area => !province.districts.includes(area)));
                                } else {
                                  // Add all districts from this province
                                  setServiceAreas(prev => {
                                    const newAreas = [...prev];
                                    province.districts.forEach(district => {
                                      if (!newAreas.includes(district)) {
                                        newAreas.push(district);
                                      }
                                    });
                                    return newAreas;
                                  });
                                }
                              }}
                              className="text-xs text-[#72b01d] hover:text-[#5a8c16] transition"
                            >
                              {province.districts.every(d => serviceAreas.includes(d)) ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {province.districts.map((district) => (
                              <label key={district} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={serviceAreas.includes(district)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setServiceAreas(prev => [...prev, district]);
                                    } else {
                                      setServiceAreas(prev => prev.filter(area => area !== district));
                                    }
                                  }}
                                  className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2"
                                />
                                <span className="text-sm text-[#0d0a0b]">{district}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Areas Summary */}
                    {serviceAreas.length > 0 && (
                      <div className="mt-3 p-3 bg-[#72b01d]/5 rounded-lg">
                        <p className="text-xs font-semibold text-[#0d0a0b] mb-2">
                          Selected Areas ({serviceAreas.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {serviceAreas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center px-2 py-1 text-xs bg-[#72b01d] text-white rounded-lg"
                            >
                              {area}
                              <button
                                type="button"
                                onClick={() => setServiceAreas(prev => prev.filter(a => a !== area))}
                                className="ml-1 text-white hover:text-gray-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d0a0b] mb-2">
                    Requirements from Customer
                  </label>
                  <textarea
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="What do you need from the customer to get started?"
                    rows={3}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#72b01d] focus:border-transparent resize-none"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!title || !description || (deliveryType === "onsite" && serviceAreas.length === 0)}
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Packages */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Create service packages</h2>
              
              <ServicePackages
                packages={packages}
                onChange={setPackages}
                maxPackages={3}
              />
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  disabled={packages.length === 0 || packages.some(pkg => !pkg.name || !pkg.description || pkg.price <= 0 || !pkg.deliveryTime)}
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Images */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Add service images</h2>
              
              {/* Important message about service images */}
              <p className="text-sm md:text-base text-[#454955] mb-4 md:mb-6 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                📸 <strong>Important:</strong> Upload high-quality images that showcase your service, previous work, or your workspace. Good images help customers trust your service.
              </p>

              <div className="flex flex-wrap gap-3 md:gap-6 mb-4 md:mb-6">
                {imagePreviews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-white border border-[#45495522] shadow-sm flex items-center justify-center"
                  >
                    <img
                      src={src}
                      alt={`Service preview ${idx + 1}`}
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
                      aria-label="Upload service images"
                    />
                  </button>
                )}
              </div>
              <div className="text-sm text-[#454955] mb-2">{images.length} / 5 images selected</div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Availability */}
          {step === 7 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Set your availability</h2>
              
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-[#0d0a0b] mb-3">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAllDaysAvailable(true)}
                      className="px-3 py-1 text-sm bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] transition"
                    >
                      Select All Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllDaysAvailable(false)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      Clear All Days
                    </button>
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Weekly Schedule</h3>
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayData = availability[day as keyof typeof availability];
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] rounded-xl">
                          <div className="flex items-center min-w-[120px]">
                            <input
                              type="checkbox"
                              id={`day-${day}`}
                              checked={dayData.available}
                              onChange={(e) => updateDayAvailability(day, e.target.checked)}
                              className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2"
                            />
                            <label htmlFor={`day-${day}`} className="ml-2 text-sm font-medium text-[#0d0a0b] capitalize">
                              {day}
                            </label>
                          </div>
                          
                          {dayData.available && (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={dayData.hours}
                                onChange={(e) => updateDayHours(day, e.target.value)}
                                placeholder="e.g., 9:00 AM - 6:00 PM, 24/7, By appointment"
                                className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                              />
                            </div>
                          )}
                          
                          {!dayData.available && (
                            <div className="flex-1 text-sm text-[#454955] italic">
                              Not available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Response Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Within 1 hour",
                      "Within 4 hours", 
                      "Within 24 hours",
                      "Within 2-3 days"
                    ].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setResponseTime(time)}
                        className={`p-3 text-sm font-medium rounded-xl border-2 transition ${
                          responseTime === time
                            ? 'bg-[#72b01d] text-white border-[#72b01d]'
                            : 'bg-white text-[#454955] border-[#e5e7eb] hover:border-[#72b01d]/30'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#454955] mt-2">
                    How quickly you typically respond to customer inquiries
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 8: Settings */}
          {step === 8 && (
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Service settings</h2>
              
              <div className="space-y-6">
                {/* Service Status */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Service Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2 mt-1"
                      />
                      <div>
                        <label htmlFor="is-active" className="text-sm font-medium text-[#0d0a0b] block">
                          Service is Active
                        </label>
                        <p className="text-xs text-[#454955] mt-1">
                          When active, customers can find and book your service
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl">
                      <input
                        type="checkbox"
                        id="is-paused"
                        checked={isPaused}
                        onChange={(e) => setIsPaused(e.target.checked)}
                        className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2 mt-1"
                      />
                      <div>
                        <label htmlFor="is-paused" className="text-sm font-medium text-[#0d0a0b] block">
                          Temporarily Pause Service
                        </label>
                        <p className="text-xs text-[#454955] mt-1">
                          Pause bookings while keeping your service listing visible
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Additional Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any additional information about your service, special terms, or important notes for customers..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-[#454955] mt-1">
                      This information will be displayed on your service page
                    </p>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Keywords</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#0d0a0b] mb-2">
                      Service Keywords (Optional)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={handleKeywordKeyPress}
                        placeholder="Add keywords related to your service..."
                        className="flex-1 px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addKeyword}
                        disabled={!keywordInput.trim() || keywords.length >= 10}
                        className="px-4 py-2 text-sm font-medium bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Add
                      </button>
                    </div>
                    
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#72b01d]/10 text-[#72b01d] rounded-full"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="hover:text-red-600 transition"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-[#454955]">
                      {keywords.length}/10 keywords - Help customers find your service through search
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Ready to Create Your Service!</h4>
                  <p className="text-green-700 text-sm">
                    Review all your settings above, then click "Create Service" to publish your service listing.
                    You can always edit these settings later from your dashboard.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  onClick={handleCreateService}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span>+ Create Service</span>
                      
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Add more steps here... */}
          
        </div>
      </div>
      <Footer />
    </>
  );
}
