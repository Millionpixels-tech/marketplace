import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiCheck } from "react-icons/fi";
import { 
  ServiceCategory, 
  serviceCategoryIcons,
  getServiceSubcategories
} from "../../utils/serviceCategories";
import { sriLankanProvinces, getAllDistricts } from "../../utils/sriLankanDistricts";
import type { ServicePackage, Service } from "../../types/service";
import { createDefaultPackage } from "../../types/service";
import { Button } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import ServicePackages from "../../components/service/ServicePackages";
import { processImageForUpload } from "../../utils/imageUtils";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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

const EditService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Multi-step form state
  const [step, setStep] = useState<Step>(1);
  
  // Original service data
  const [originalService, setOriginalService] = useState<Service | null>(null);

  // Shop selection
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  
  // Service details - FIXED: Use serviceAreas like AddService
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryType, setDeliveryType] = useState<'onsite' | 'online' | 'both'>('onsite');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [requirements, setRequirements] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Packages
  const [packages, setPackages] = useState<ServicePackage[]>([createDefaultPackage()]);
  
  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // Availability
  const [availability, setAvailability] = useState({
    monday: { available: false, hours: "" },
    tuesday: { available: false, hours: "" },
    wednesday: { available: false, hours: "" },
    thursday: { available: false, hours: "" },
    friday: { available: false, hours: "" },
    saturday: { available: false, hours: "" },
    sunday: { available: false, hours: "" }
  });
  const [acceptsInstantBooking, setAcceptsInstantBooking] = useState(false);
  const [requiresConsultation, setRequiresConsultation] = useState(false);
  const [responseTime, setResponseTime] = useState("Within 24 hours");
  
  // Settings
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  // Load service data
  useEffect(() => {
    async function loadServiceData() {
      if (!id || !user?.uid) return;
      
      try {
        const serviceDoc = await getDoc(doc(db, "services", id));
        if (!serviceDoc.exists()) {
          showToast("error", "Service not found");
          navigate("/dashboard?tab=services");
          return;
        }
        
        const service = serviceDoc.data() as Service;
        service.id = serviceDoc.id; // Ensure the ID is set
        
        // Check ownership
        if (service.owner !== user.uid) {
          showToast("error", "You don't have permission to edit this service");
          navigate("/dashboard?tab=services");
          return;
        }
        
        console.log('Loaded service:', service); // Debug log
        setOriginalService(service);
        
        // Load shops
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
        
        // Find and set the shop
        const serviceShop = shopsList.find(shop => shop.id === service.shopId);
        setSelectedShop(serviceShop);
        
        // Load service data into form
        setTitle(service.title);
        setDescription(service.description);
        setSelectedCategory(service.category);
        setSelectedSubcategory(service.subcategory);
        setDeliveryType(service.deliveryType.toLowerCase() as 'onsite' | 'online' | 'both');
        setServiceAreas(service.serviceArea || []); // FIXED: Use serviceAreas state
        setRequirements(service.requirements || '');
        setAdditionalInfo(service.additionalInfo || '');
        setPackages(service.packages);
        setImages([]);
        setExistingImages(service.images || []);
        
        // Load availability with proper structure
        const normalizedAvailability = Object.entries(service.availability).reduce((acc, [day, data]) => {
          acc[day as keyof typeof acc] = {
            available: data.available,
            hours: typeof data.hours === 'string' ? data.hours : ''
          };
          return acc;
        }, {} as typeof availability);
        setAvailability(normalizedAvailability);
        
        setAcceptsInstantBooking(service.acceptsInstantBooking || false);
        setRequiresConsultation(service.requiresConsultation || false);
        setResponseTime(service.responseTime || "Within 24 hours");
        setIsActive(service.isActive !== false);
        setIsPaused(service.isPaused || false);
        setKeywords(service.keywords || []);
        
      } catch (error) {
        console.error("Error loading service:", error);
        showToast("error", "Error loading service data");
        navigate("/dashboard?tab=services");
      } finally {
        setLoading(false);
      }
    }

    loadServiceData();
  }, [id, user?.uid, navigate, showToast]);

  // Save updated service
  const handleUpdateService = async () => {
    if (!originalService || !selectedShop) {
      showToast("error", "Missing service or shop data");
      return;
    }
    
    if (!originalService.id) {
      showToast("error", "Service ID is missing");
      return;
    }
    
    setSubmitting(true);
    try {
      let imageUrls = [...existingImages];
      
      // Upload new images if any
      if (images.length > 0) {
        const uploadPromises = images.map(async (file, index) => {
          const timestamp = Date.now();
          const fileName = `service_${originalService.id}_${timestamp}_${index}`;
          const imageRef = ref(storage, `services/${fileName}`);
          
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          return url;
        });
        
        const newImageUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newImageUrls];
      }
      
      // Ensure serviceAreas is properly defined
      const safeServiceAreas = Array.isArray(serviceAreas) ? serviceAreas.filter(area => area != null && area !== undefined && area !== '') : [];
      
      // Clean keywords array
      const safeKeywords = Array.isArray(keywords) ? keywords.filter(kw => kw != null && kw !== undefined && kw !== '') : [];
      
      // Clean images array
      const safeImageUrls = Array.isArray(imageUrls) ? imageUrls.filter(url => url != null && url !== undefined && url !== '') : [];
      
      // Validate and clean packages data
      const safePackages = Array.isArray(packages) ? packages.map(pkg => ({
        ...pkg,
        id: pkg.id || '',
        name: String(pkg.name || ''),
        description: String(pkg.description || ''),
        price: Number(pkg.price) || 0,
        duration: String(pkg.duration || ''),
        deliveryTime: String(pkg.deliveryTime || ''),
        features: Array.isArray(pkg.features) ? pkg.features.filter(f => f != null && f !== undefined && f !== '') : []
      })) : [];
      
      // Clean availability object
      const safeAvailability = availability && typeof availability === 'object' ? availability : {};
      
      // Prepare updated service data with safe values
      const updatedData = {
        shopId: String(selectedShop.id),
        title: String(title).trim(),
        description: String(description).trim(),
        category: selectedCategory,
        subcategory: String(selectedSubcategory),
        deliveryType: String(deliveryType),
        serviceArea: deliveryType === 'online' ? [] : safeServiceAreas,
        packages: safePackages,
        requirements: requirements?.trim() || "",
        additionalInfo: additionalInfo?.trim() || "",
        images: safeImageUrls,
        availability: safeAvailability,
        acceptsInstantBooking: Boolean(acceptsInstantBooking),
        requiresConsultation: Boolean(requiresConsultation),
        responseTime: String(responseTime) || "Within 24 hours",
        isActive: Boolean(isActive),
        isPaused: Boolean(isPaused),
        keywords: safeKeywords,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      console.log('Final updatedData:', JSON.stringify(updatedData, null, 2));
      console.log('originalService.id:', originalService.id);
      
      // Final validation before update
      if (!originalService.id) {
        throw new Error('Service ID is undefined');
      }
      
      try {
        const serviceRef = doc(db, "services", originalService.id);
        console.log('Service reference:', serviceRef);
        
        // Convert complex objects to simple objects to avoid Firebase serialization issues
        const firebaseUpdatedData = {
          ...updatedData,
          packages: JSON.parse(JSON.stringify(safePackages)), // Deep clone to remove any prototypes
          availability: JSON.parse(JSON.stringify(safeAvailability)), // Deep clone
          updatedAt: Timestamp.fromDate(new Date())
        };
        
        console.log('Attempting Firebase update with cleaned data...');
        await updateDoc(serviceRef, firebaseUpdatedData);
        console.log('Service updated successfully in Firebase');
      } catch (updateError) {
        console.error('Firebase updateDoc error:', updateError);
        if (updateError instanceof Error) {
          console.error('Error details:', {
            name: updateError.name,
            message: updateError.message,
            stack: updateError.stack
          });
        }
        throw updateError; // Re-throw to be caught by outer catch
      }
      
      showToast("success", "Service updated successfully!");
      navigate("/dashboard?tab=services");
      
    } catch (error) {
      console.error("Error updating service:", error);
      showToast("error", "Error updating service");
    } finally {
      setSubmitting(false);
    }
  };

  // Image handling
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > 5) {
      showToast("error", "You can only upload up to 5 images total");
      return;
    }

    try {
      // Process each image with compression
      const newFiles = files.slice(0, 5 - images.length);
      const processedFiles: File[] = [];

      for (let index = 0; index < newFiles.length; index++) {
        const file = newFiles[index];
        try {
          if (file.size > 5 * 1024 * 1024) {
            showToast("error", `${file.name} is too large. Please use images under 5MB.`);
            continue;
          }

          const processedFile = await processImageForUpload(
            file,
            title || 'service',
            selectedCategory || 'service',
            selectedSubcategory,
            images.length + index, // current index
            selectedShop?.name
          );
          processedFiles.push(processedFile);
        } catch (error) {
          console.error('Error processing image:', error);
          showToast("error", `Error processing ${file.name}`);
        }
      }

      setImages(prev => [...prev, ...processedFiles]);
      
      // Create previews for the processed images
      processedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Reset the file input to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      showToast("error", "Error uploading images");
    }
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingImages.length;
      setImages(prev => prev.filter((_, i) => i !== newIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== newIndex));
    }
    
    // Reset file input to allow re-selecting files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keywords handling
  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !keywords.includes(keyword) && keywords.length < 10) {
      setKeywords([...keywords, keyword]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

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

  // Validation
  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedShop !== null;
      case 2:
        return selectedCategory !== null;
      case 3:
        return selectedSubcategory !== '';
      case 4:
        return title.trim() !== '' && description.trim() !== '' && 
               (deliveryType === 'online' || serviceAreas.length > 0); // FIXED: Use serviceAreas
      case 5:
        return packages.every(pkg => 
          pkg.name.trim() !== '' && 
          pkg.description.trim() !== '' && 
          pkg.price > 0 && 
          pkg.duration.trim() !== ''
        );
      case 6:
        return existingImages.length + images.length > 0;
      case 7:
        return Object.values(availability).some(day => day.available);
      case 8:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 8) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-white min-h-screen">
        <ResponsiveHeader />
        
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Service</h1>
            <p className="text-gray-600">Update your service information</p>
          </div>

          {/* Progress Stepper - EXACT MATCH with AddService */}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {shops.map((shop) => (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedShop(shop)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedShop?.id === shop.id
                          ? 'border-[#72b01d] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {shop.profileImage && (
                          <img
                            src={shop.profileImage}
                            alt={shop.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                          <p className="text-gray-600">{shop.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canProceed()}
                    onClick={nextStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Category Selection - same as AddService */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">What category does your service belong to?</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {(Object.keys(serviceCategoryIcons) as ServiceCategory[]).map((category) => {
                    const iconEmoji = serviceCategoryIcons[category];
                    return (
                      <div
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all text-center ${
                          selectedCategory === category
                            ? 'border-[#72b01d] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center text-3xl">
                          {iconEmoji}
                        </div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canProceed()}
                    onClick={nextStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Subcategory Selection */}
            {step === 3 && selectedCategory && (
              <div className="animate-fade-in">
                <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Choose a specific subcategory</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getServiceSubcategories(selectedCategory).map((subcategory) => (
                    <div
                      key={subcategory}
                      onClick={() => setSelectedSubcategory(subcategory)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSubcategory === subcategory
                          ? 'border-[#72b01d] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{subcategory}</h3>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canProceed()}
                    onClick={nextStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Service Details - EXACT MATCH with AddService */}
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
                      placeholder="Enter a clear, descriptive title for your service"
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

                  {/* Service Areas (only for onsite services) - EXACT MATCH with AddService */}
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
                                    setServiceAreas(prev => prev.filter(area => !province.districts.includes(area)));
                                  } else {
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
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canProceed()}
                    onClick={nextStep}
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
                <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Service packages</h2>
                
                <ServicePackages
                  packages={packages}
                  onChange={setPackages}
                  maxPackages={3}
                />
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!canProceed()}
                    onClick={nextStep}
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
                <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">Service images</h2>
                
                <p className="text-sm md:text-base text-[#454955] mb-4 md:mb-6 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  📸 <strong>Important:</strong> Upload high-quality images that showcase your service, previous work, or your workspace. Good images help customers trust your service.
                </p>

                <div className="flex flex-wrap gap-3 md:gap-6 mb-4 md:mb-6">
                  {/* Existing Images */}
                  {existingImages.map((src, idx) => (
                    <div
                      key={`existing-${idx}`}
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
                        onClick={() => removeImage(idx, true)}
                        aria-label="Remove image"
                      >
                        <FiX size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New Image Previews */}
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-white border border-[#45495522] shadow-sm flex items-center justify-center"
                    >
                      <img
                        src={src}
                        alt={`New preview ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        className="absolute top-1 md:top-2 right-1 md:right-2 bg-[#72b01d] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition z-10"
                        onClick={() => removeImage(existingImages.length + idx, false)}
                        aria-label="Remove image"
                      >
                        <FiX size={14} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Image Button */}
                  {(existingImages.length + images.length) < 5 && (
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
                <div className="text-sm text-[#454955] mb-2">{existingImages.length + images.length} / 5 images selected</div>
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={nextStep}
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

                  {/* Booking Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#0d0a0b] mb-4">Booking Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl">
                        <input
                          type="checkbox"
                          id="instant-booking"
                          checked={acceptsInstantBooking}
                          onChange={(e) => setAcceptsInstantBooking(e.target.checked)}
                          className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2 mt-1"
                        />
                        <div>
                          <label htmlFor="instant-booking" className="text-sm font-medium text-[#0d0a0b] block">
                            Accept Instant Bookings
                          </label>
                          <p className="text-xs text-[#454955] mt-1">
                            Customers can book your service immediately without waiting for approval
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl">
                        <input
                          type="checkbox"
                          id="requires-consultation"
                          checked={requiresConsultation}
                          onChange={(e) => setRequiresConsultation(e.target.checked)}
                          className="w-4 h-4 text-[#72b01d] border-gray-300 rounded focus:ring-[#72b01d] focus:ring-2 mt-1"
                        />
                        <div>
                          <label htmlFor="requires-consultation" className="text-sm font-medium text-[#0d0a0b] block">
                            Require Consultation Before Booking
                          </label>
                          <p className="text-xs text-[#454955] mt-1">
                            Discuss project details with customers before they can book your service
                          </p>
                        </div>
                      </div>
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
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={nextStep}
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
                                onClick={() => removeKeyword(index)}
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
                    <h4 className="font-semibold text-green-900 mb-2">Ready to Update Your Service!</h4>
                    <p className="text-green-700 text-sm">
                      Review all your settings above, then click "Update Service" to save your changes.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8">
                  <Button
                    variant="secondary"
                    onClick={prevStep}
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full md:w-auto px-6 md:px-7 py-3 rounded-xl md:rounded-2xl uppercase tracking-wide shadow-sm"
                    onClick={handleUpdateService}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5 mr-2" />
                        Update Service
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </ErrorBoundary>
  );
};

export default EditService;
