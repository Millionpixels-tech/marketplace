import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiCheck, FiChevronDown, FiChevronUp, FiShoppingBag, FiStar } from "react-icons/fi";
import type { Service, ServiceReview } from "../../types/service";
import { getServiceReviews } from "../../utils/serviceReviews";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import ShopOwnerName from "../shop/ShopOwnerName";
import { useResponsive } from "../../hooks/useResponsive";

type Shop = {
  name: string;
  username: string;
  logo?: string;
  owner: string;
};

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [service, setService] = useState<Service | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Reviews state
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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

        // Fetch shop info if available
        if (serviceData.shopId) {
          const shopSnap = await getDoc(doc(db, "shops", serviceData.shopId));
          if (shopSnap.exists()) setShop(shopSnap.data() as Shop);
        }
        
        // Fetch reviews for this service
        await fetchReviews(serviceId);
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

  const fetchReviews = async (serviceId: string) => {
    try {
      setReviewsLoading(true);
      const serviceReviews = await getServiceReviews(serviceId, 20); // Fetch up to 20 reviews
      setReviews(serviceReviews);
    } catch (error) {
      console.error("Error fetching service reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Helper function to sort days from Monday to Sunday
  const sortDaysByWeek = (availability: Record<string, any>) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return dayOrder
      .filter(day => availability[day])
      .map(day => [day, availability[day]]);
  };

  const getSelectedPackageData = () => {
    return service?.packages.find(pkg => pkg.id === selectedPackage);
  };

  const handleRequestInquiry = () => {
    if (!serviceId) return;
    
    const packageParam = selectedPackage ? `?package=${selectedPackage}` : "";
    navigate(`/service/${serviceId}/inquiry${packageParam}`);
  };

  const togglePackageExpansion = (packageId: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) {
        newSet.delete(packageId);
      } else {
        newSet.add(packageId);
      }
      return newSet;
    });
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Service Main Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <button 
                    onClick={() => navigate('/services')}
                    className="hover:text-[#72b01d] transition-colors"
                  >
                    Services
                  </button>
                  <span>›</span>
                  <button 
                    onClick={() => navigate(`/services?cat=${encodeURIComponent(service.category)}`)}
                    className="hover:text-[#72b01d] transition-colors"
                  >
                    {service.category}
                  </button>
                  <span>›</span>
                  <button 
                    onClick={() => navigate(`/services?cat=${encodeURIComponent(service.category)}&sub=${encodeURIComponent(service.subcategory)}`)}
                    className="hover:text-[#72b01d] transition-colors"
                  >
                    {service.subcategory}
                  </button>
                  <span>›</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.deliveryType === 'Online' 
                      ? 'bg-blue-100 text-blue-700'
                      : service.deliveryType === 'Onsite'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {service.deliveryType}
                  </span>
                </nav>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h1>

                {/* Shop Info */}
                {shop && (
                  <div className={`inline-flex items-center ${isMobile ? 'gap-1.5 px-2 py-1.5' : 'gap-2 px-3 py-2'} rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all mb-4`}>
                    {/* Shop Logo */}
                    <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50`}>
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiShoppingBag className={`text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      )}
                    </div>
                    
                    {/* Shop Name (clickable) */}
                    <Link
                      to={`/shop/${shop.username}`}
                      className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 hover:text-green-600 transition-colors`}
                    >
                      {shop.name}
                    </Link>
                    
                    {/* Separator */}
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>•</span>
                    
                    {/* Owner Name (clickable) */}
                    <ShopOwnerName ownerId={shop.owner} username={shop.username} showUsername={false} compact={true} disableLink={false} />
                  </div>
                )}

                {/* Description */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                </div>

                {/* Service Info Grid */}
                <div className="mb-6">

                  {/* Service Locations */}
                  {service.serviceArea && service.serviceArea.length > 0 && service.deliveryType !== 'Online' && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Service Locations</h3>
                      <div className="flex flex-wrap gap-2">
                        {service.serviceArea.map((location, index) => (
                          <span 
                            key={index}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
                          >
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements and Additional Info */}
                  <div>
                    {service.requirements && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                        <p className="text-gray-700 text-sm">{service.requirements}</p>
                      </div>
                    )}

                    {service.additionalInfo && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                        <p className="text-gray-700 text-sm">{service.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Images - Moved Here */}
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

              {/* Availability */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortDaysByWeek(service.availability).map(([day, data]) => (
                    <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">{day}</span>
                      <span className={`text-sm ${data.available ? 'text-green-600' : 'text-gray-400'}`}>
                        {data.available ? data.hours || 'Available' : 'Not Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Reviews Section */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6" id="reviews-section">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Customer Reviews ({reviews.length})
                  </h2>
                  
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border border-gray-100 rounded-lg animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <div key={star} className="w-4 h-4 bg-gray-200 rounded"></div>
                                  ))}
                                </div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            {/* Reviewer Avatar */}
                            <div className="w-10 h-10 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {review.reviewerName.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Review Content */}
                            <div className="flex-1">
                              {/* Reviewer Name and Rating */}
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating 
                                          ? 'text-yellow-400 fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-1 text-sm font-medium text-gray-600">
                                    {review.rating}/5
                                  </span>
                                </div>
                              </div>
                              
                              {/* Review Comment */}
                              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                                {review.comment}
                              </p>
                              
                              {/* Review Date */}
                              <p className="text-xs text-gray-500">
                                Reviewed on {new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Package Selection */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Package</h3>
                  
                  {/* Package Selection */}
                  <div className="space-y-3 mb-6">
                    {service.packages.map((pkg) => {
                      const isExpanded = expandedPackages.has(pkg.id);
                      const isSelected = selectedPackage === pkg.id;
                      
                      return (
                        <div
                          key={pkg.id}
                          className={`border-2 rounded-lg transition-all ${
                            isSelected
                              ? 'border-[#72b01d] bg-[#72b01d]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Package Header - Always Visible */}
                          <div 
                            className="p-4 cursor-pointer"
                            onClick={() => setSelectedPackage(pkg.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                  {pkg.isPopular && (
                                    <span className="px-2 py-1 bg-[#72b01d] text-white text-xs rounded-full">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <div className="text-xl font-bold text-[#72b01d]">
                                  LKR {pkg.price.toLocaleString()}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePackageExpansion(pkg.id);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {isExpanded ? (
                                  <FiChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Package Details - Expandable */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100">
                              <p className="text-gray-600 text-sm mb-3 mt-3">{pkg.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                                <span>Duration: {pkg.durationType === "Project Based" 
                                  ? "Based on project requirements"
                                  : `${pkg.duration} ${pkg.durationType === "Minutely" ? "minute" : pkg.durationType === "Hourly" ? "hour" : pkg.durationType === "Daily" ? "day" : pkg.durationType === "Weekly" ? "week" : "month"}${parseInt(pkg.duration) > 1 ? "s" : ""}`
                                }</span>
                              </div>
                              {pkg.features.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-900 text-sm">Included features:</h5>
                                  <div className="space-y-1">
                                    {pkg.features.map((feature, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiCheck className="w-4 h-4 text-[#72b01d]" />
                                        {feature}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Package Summary */}
                  {selectedPackageData && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Package Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package:</span>
                          <span className="font-medium">{selectedPackageData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span>{selectedPackageData.durationType === "Project Based" 
                            ? "Based on project requirements"
                            : `${selectedPackageData.duration} ${selectedPackageData.durationType === "Minutely" ? "minute" : selectedPackageData.durationType === "Hourly" ? "hour" : selectedPackageData.durationType === "Daily" ? "day" : selectedPackageData.durationType === "Weekly" ? "week" : "month"}${parseInt(selectedPackageData.duration) > 1 ? "s" : ""}`
                          }</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-lg pt-2 mt-3 border-t border-gray-200">
                          <span>Total:</span>
                          <span className="text-[#72b01d]">LKR {selectedPackageData.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send Request to Contact */}
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={handleRequestInquiry}
                      className="w-full bg-[#72b01d] text-white py-3 rounded-lg font-medium hover:bg-[#3f7d20] transition-colors"
                    >
                      Send Request to Contact
                    </button>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-gray-600">
                        No payment required to send request
                      </p>
                      <p className="text-sm text-gray-600">
                        Service provider will contact you after request
                      </p>
                    </div>
                  </div>

                  {/* Service Info Cards */}
                  <div className="space-y-4">
                    {/* Response Time */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Response Time</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCheck className="w-4 h-4 text-[#72b01d]" />
                        <span>{service.responseTime}</span>
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
