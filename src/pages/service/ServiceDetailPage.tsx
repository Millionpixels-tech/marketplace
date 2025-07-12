import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiMapPin, FiClock, FiStar, FiCheck, FiArrowLeft } from "react-icons/fi";
import { serviceCategoryIcons } from "../../utils/serviceCategories";
import type { Service } from "../../types/service";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const fetchService = async () => {
    if (!serviceId) return;

    try {
      const serviceDoc = await getDoc(doc(db, "services", serviceId));
      
      if (serviceDoc.exists()) {
        const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
        setService(serviceData);
        
        // Auto-select first package
        if (serviceData.packages.length > 0) {
          setSelectedPackage(serviceData.packages[0].id);
        }
      } else {
        navigate('/services');
      }
    } catch (error) {
      console.error("Error fetching service:", error);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPackageData = () => {
    return service?.packages.find(pkg => pkg.id === selectedPackage);
  };

  if (loading) {
    return (
      <>
        <ResponsiveHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#72b01d]"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <ResponsiveHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
            <button
              onClick={() => navigate('/services')}
              className="bg-[#72b01d] text-white px-6 py-3 rounded-lg hover:bg-[#3f7d20] transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const selectedPackageData = getSelectedPackageData();

  return (
    <>
      <SEOHead
        title={`${service.title} - ${service.category} Service | Sina.lk`}
        description={service.description}
        keywords={generateKeywords([
          service.title,
          service.category,
          service.subcategory,
          'service',
          'professional service',
          'Sri Lanka'
        ])}
        canonicalUrl={getCanonicalUrl(`/service/${service.id}`)}
      />
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/services')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#72b01d] transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Services
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Service Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#72b01d] to-[#3f7d20] rounded-xl flex items-center justify-center text-white text-2xl">
                    {serviceCategoryIcons[service.category] || "🔧"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {service.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {service.subcategory}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.deliveryType === 'Online' 
                          ? 'bg-blue-100 text-blue-700'
                          : service.deliveryType === 'Onsite'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {service.deliveryType}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {service.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {service.location && (
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{service.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        <span>{service.responseTime}</span>
                      </div>
                      {service.rating && (
                        <div className="flex items-center gap-1">
                          <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{service.rating.toFixed(1)}</span>
                          {service.reviewCount && (
                            <span>({service.reviewCount} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Images */}
              {service.images && service.images.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Service Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {service.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${service.title} - Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Service Description */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Service</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                </div>
              </div>

              {/* Requirements */}
              {service.requirements && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                  <p className="text-gray-700">{service.requirements}</p>
                </div>
              )}

              {/* Additional Information */}
              {service.additionalInfo && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
                  <p className="text-gray-700">{service.additionalInfo}</p>
                </div>
              )}

              {/* Availability */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(service.availability).map(([day, data]) => (
                    <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">{day}</span>
                      <span className={`text-sm ${data.available ? 'text-green-600' : 'text-gray-400'}`}>
                        {data.available ? data.hours || 'Available' : 'Not Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Package Selection */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Package</h3>
                  
                  {/* Package Selection */}
                  <div className="space-y-3 mb-6">
                    {service.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPackage === pkg.id
                            ? 'border-[#72b01d] bg-[#72b01d]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPackage(pkg.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                          {pkg.isPopular && (
                            <span className="px-2 py-1 bg-[#72b01d] text-white text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-bold text-[#72b01d]">
                            Rs. {pkg.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {pkg.duration} • {pkg.deliveryTime}
                          </span>
                        </div>
                        {pkg.features.length > 0 && (
                          <div className="space-y-1">
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <FiCheck className="w-4 h-4 text-[#72b01d]" />
                                {feature}
                              </div>
                            ))}
                            {pkg.features.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{pkg.features.length - 3} more features
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Selected Package Summary */}
                  {selectedPackageData && (
                    <div className="border-t pt-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Package Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Package:</span>
                          <span className="font-medium">{selectedPackageData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{selectedPackageData.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery:</span>
                          <span>{selectedPackageData.deliveryTime}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span className="text-[#72b01d]">Rs. {selectedPackageData.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-[#72b01d] text-white py-3 rounded-lg font-medium hover:bg-[#3f7d20] transition-colors">
                      Book Now
                    </button>
                    <button className="w-full border-2 border-[#72b01d] text-[#72b01d] py-3 rounded-lg font-medium hover:bg-[#72b01d] hover:text-white transition-colors">
                      Contact Provider
                    </button>
                  </div>

                  {/* Service Features */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Service Features</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {service.acceptsInstantBooking && (
                        <div className="flex items-center gap-2">
                          <FiCheck className="w-4 h-4 text-[#72b01d]" />
                          Instant Booking Available
                        </div>
                      )}
                      {service.requiresConsultation && (
                        <div className="flex items-center gap-2">
                          <FiCheck className="w-4 h-4 text-[#72b01d]" />
                          Free Consultation
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FiCheck className="w-4 h-4 text-[#72b01d]" />
                        Professional Service Provider
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCheck className="w-4 h-4 text-[#72b01d]" />
                        Secure Payment
                      </div>
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
