import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { submitServiceRequest } from "../../utils/serviceRequests";
import type { Service } from "../../types/service";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { FiArrowLeft, FiCheck, FiUpload, FiX } from "react-icons/fi";
import { SEOHead } from "../../components/SEO/SEOHead";

export default function ServiceInquiryPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingPackage, setIsSelectingPackage] = useState(false);
  
  // Form state
  const [customerInfo, setCustomerInfo] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchService();
    loadUserPhone();
  }, [id, user, navigate]);

  const fetchService = async () => {
    if (!id) return;
    
    try {
      const docRef = doc(db, "services", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const serviceData = { id: docSnap.id, ...docSnap.data() } as Service;
        setService(serviceData);
        
        // Find the selected package
        if (packageId) {
          const pkg = serviceData.packages.find(p => p.id === packageId);
          setSelectedPackage(pkg);
        } else {
          // Select first package if no package ID provided
          setSelectedPackage(serviceData.packages[0]);
        }
      } else {
        setError("Service not found");
      }
    } catch (err) {
      console.error("Error fetching service:", err);
      setError("Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPhone = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.phone) {
          setCustomerPhone(userData.phone);
        }
      }
    } catch (error) {
      console.error("Error loading user phone:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setAttachedFile(file);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const handleSubmitInquiry = async () => {
    if (!service || !selectedPackage || !user || !id) return;
    
    if (!customerInfo.trim()) {
      alert("Please provide your requirements and information");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Please provide your phone number");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save phone number to user profile if it's not already there
      if (user && customerPhone.trim()) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            phone: customerPhone.trim()
          });
        } catch (error) {
          console.error("Error updating user phone:", error);
          // Don't fail the request submission if profile update fails
        }
      }

      const formData = {
        serviceId: id,
        packageId: selectedPackage.id,
        customerInfo: customerInfo.trim(),
        customerPhone: customerPhone.trim(),
        attachedFile: attachedFile || undefined
      };

      await submitServiceRequest(formData, user, service, selectedPackage);
      
      // Show success message and redirect
      alert("Request sent successfully! The service provider will contact you soon.");
      navigate("/services");
      
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <ResponsiveHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72b01d] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <ResponsiveHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Service not found"}</p>
            <button
              onClick={() => navigate("/services")}
              className="text-[#72b01d] hover:underline"
            >
              Back to Services
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`Send Request - ${service.title} | Sina.lk`}
        description={`Send a request for ${service.title}. Provide your requirements and get contacted by the service provider.`}
      />
      
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/service/${id}`)}
            className="flex items-center gap-2 text-[#72b01d] hover:text-[#3f7d20] mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Service
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Service Review */}
            <div className="space-y-6">
              {/* Service Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Review</h1>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Category:</span> {service.category}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Delivery Type:</span> {service.deliveryType}
                  </div>
                </div>
              </div>

              {/* Selected Package */}
              {selectedPackage && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Selected Package</h2>
                  
                  <div className="border-2 border-[#72b01d] bg-[#72b01d]/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedPackage.name}</h3>
                        {selectedPackage.isPopular && (
                          <span className="inline-block px-2 py-1 bg-[#72b01d] text-white text-xs rounded-full mt-1">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold text-[#72b01d]">
                        LKR {selectedPackage.price.toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{selectedPackage.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span>Duration: {selectedPackage.duration}</span>
                      <span>Delivery: {selectedPackage.deliveryTime}</span>
                    </div>
                    
                    {selectedPackage.features.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm mb-2">Included features:</h4>
                        <div className="space-y-1">
                          {selectedPackage.features.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <FiCheck className="w-4 h-4 text-[#72b01d]" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Change Package Button */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setIsSelectingPackage(!isSelectingPackage)}
                        className="text-[#72b01d] hover:text-[#5a8e17] text-sm font-medium flex items-center gap-2"
                      >
                        {isSelectingPackage ? 'Cancel' : 'Change Package'}
                      </button>
                    </div>
                    
                    {/* Package Selection Dropdown */}
                    {isSelectingPackage && service && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Select a different package:</h4>
                        <div className="space-y-2">
                          {service.packages.map((pkg: any) => (
                            <button
                              key={pkg.id}
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setIsSelectingPackage(false);
                              }}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedPackage.id === pkg.id
                                  ? 'border-[#72b01d] bg-[#72b01d]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{pkg.name}</h5>
                                  <p className="text-sm text-gray-600">{pkg.description}</p>
                                </div>
                                <div className="text-lg font-bold text-[#72b01d]">
                                  LKR {pkg.price.toLocaleString()}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Request Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Send Request</h2>
                
                {/* Service Requirements */}
                {service.requirements && (
                  <div className="mb-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">Service Requirements From Provider:</h3>
                      <p className="text-gray-700 text-sm">{service.requirements}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Customer Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Requirements & Information *
                    </label>
                    <textarea
                      value={customerInfo}
                      onChange={(e) => setCustomerInfo(e.target.value)}
                      placeholder="Please provide detailed information about your requirements, project scope, timeline, and any specific needs..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent resize-none"
                      rows={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Be as detailed as possible to help the provider understand your needs
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number (e.g., +94 77 123 4567)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#72b01d] focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Service provider will contact you directly using this number
                    </p>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach File (Optional)
                    </label>
                    
                    {!attachedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload supporting documents, images, or files
                        </p>
                        <label className="cursor-pointer bg-[#72b01d] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#3f7d20] transition-colors">
                          Choose File
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Max file size: 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FiUpload className="w-5 h-5 text-[#72b01d]" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitInquiry}
                    disabled={isSubmitting || !customerInfo.trim() || !customerPhone.trim()}
                    className="w-full bg-[#72b01d] text-white py-3 rounded-lg font-medium hover:bg-[#3f7d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending Request...
                      </span>
                    ) : (
                      "Send Request to Provider"
                    )}
                  </button>

                  {/* Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-700 space-y-1">
                      <p>✓ No payment required at this stage</p>
                      <p>✓ Provider will review your request and contact you</p>
                      <p>✓ You can discuss pricing and timeline directly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
