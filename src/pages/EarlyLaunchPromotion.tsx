import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { SEOHead } from "../components/SEO/SEOHead";
import { getCanonicalUrl } from "../utils/seo";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { Link } from "react-router-dom";
import { getPromotionProgress, getPromotionStatusMessage, type EligibilityData } from "../utils/promotionEligibility";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import { 
  FaGift, 
  FaTrophy, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaClock, 
  FaCalendarAlt, 
  FaRocket, 
  FaBolt, 
  FaBullseye,
  FaStar,
  FaFire,
  FaTimes,
  FaUniversity,
  FaSpinner,
  FaCheck
} from "react-icons/fa";
import { MdCelebration } from "react-icons/md";
import { HiSparkles } from "react-icons/hi";

interface Shop {
  id: string;
  name: string;
  createdAt: any;
  isActive: boolean;
  logo?: string;
  description?: string;
}

interface Listing {
  id: string;
  name: string;
  createdAt: any;
  isActive?: boolean;
  shopId: string;
  images?: string[];
  category?: string;
  price?: number;
  quantity?: number;
  description?: string;
  owner?: string;
}

interface PromotionApplication {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName: string;
  appliedAt: any;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  adminNotes?: string;
}

const EarlyLaunchPromotion = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<PromotionApplication | null>(null);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branchName: ''
  });
  const [eligibilityData, setEligibilityData] = useState<EligibilityData>({
    isEligible: false,
    shopsCount: 0,
    listingsCount: 0,
    requirementsShops: 1,
    requirementsListings: 5
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check for existing promotion application
        const applicationQuery = query(
          collection(db, "promotionApplications"),
          where("userId", "==", user.uid)
        );
        const applicationSnapshot = await getDocs(applicationQuery);
        if (!applicationSnapshot.empty) {
          const appData = applicationSnapshot.docs[0].data() as PromotionApplication;
          setApplicationStatus({ ...appData, id: applicationSnapshot.docs[0].id });
        }

        // Fetch user's shops for display (using 'owner' field)
        const shopsQuery = query(
          collection(db, "shops"),
          where("owner", "==", user.uid)
        );
        const shopsSnapshot = await getDocs(shopsQuery);
        const userShops = shopsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Shop[];

        // Fetch user's listings for display (using 'owner' field)
        const listingsQuery = query(
          collection(db, "listings"),
          where("owner", "==", user.uid)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const userListings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Listing[];

        setShops(userShops);
        setListings(userListings);
        
        // Set eligibility data with actual counts (only one update)
        setEligibilityData({
          isEligible: userShops.length >= 1 && userListings.length >= 5,
          shopsCount: userShops.length,
          listingsCount: userListings.length,
          requirementsShops: 1,
          requirementsListings: 5
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const applicationData: Omit<PromotionApplication, 'id'> = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email || '',
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName,
        branchName: bankDetails.branchName,
        appliedAt: new Date(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, "promotionApplications"), applicationData);
      setApplicationStatus({ ...applicationData, id: docRef.id });
      setShowModal(false);
      
      // Reset form
      setBankDetails({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        branchName: ''
      });
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!applicationStatus) return null;

    switch (applicationStatus.status) {
      case 'pending':
        return {
          icon: <FaClock className="text-orange-500" />,
          text: 'Application Submitted - Under Review',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'approved':
        return {
          icon: <FaCheckCircle className="text-blue-500" />,
          text: 'Application Approved - Payment Processing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'paid':
        return {
          icon: <FaCheck className="text-green-500" />,
          text: 'Congratulations! Prize Paid Successfully',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: <FaTimes className="text-red-500" />,
          text: 'Application Not Approved',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <>
        <SEOHead
          title="Early Launch Promotion | Sina.lk"
          description="Join our exclusive early launch promotion for Sri Lankan sellers. Create your shop and listings to qualify for amazing rewards!"
          keywords="early launch, promotion, Sri Lankan sellers, marketplace rewards"
          canonicalUrl={getCanonicalUrl('/early-launch-promotion')}
        />
        <ResponsiveHeader />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <div className="text-center">
              <h1 className={`font-black text-2xl sm:text-3xl lg:text-5xl mb-6`} style={{ color: '#0d0a0b' }}>
                Early Launch Promotion
              </h1>
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-green-100">
                <p className="text-base sm:text-lg mb-6 px-2" style={{ color: '#454955' }}>
                  Please sign in to check your eligibility for our exclusive early launch promotion.
                </p>
                <Link
                  to="/auth"
                  className="inline-block bg-[#72b01d] text-white px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-[#3f7d20] transition text-sm sm:text-base"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Early Launch Promotion | Sina.lk"
        description="Join our exclusive early launch promotion for Sri Lankan sellers. Create your shop and listings to qualify for amazing rewards!"
        keywords="early launch, promotion, Sri Lankan sellers, marketplace rewards"
        canonicalUrl={getCanonicalUrl('/early-launch-promotion')}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-6 sm:py-12 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 w-full">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] flex flex-col justify-center">
              <h1 className={`font-black text-2xl sm:text-3xl lg:text-5xl mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3`} style={{ color: '#0d0a0b' }}>
                <FaGift className="text-yellow-500 animate-pulse text-2xl sm:text-3xl lg:text-4xl" />
                <span className="text-center">Early Launch Promotion</span>
              </h1>
            </div>
            <p className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto px-2 sm:px-0`} style={{ color: '#454955' }}>
              Be among the first sellers to launch your business on Sri Lanka's newest marketplace and win exclusive rewards!
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 sm:py-12 min-h-[300px] sm:min-h-[400px] flex flex-col justify-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#72b01d]"></div>
              <p className="mt-4 text-sm sm:text-base px-4" style={{ color: '#454955' }}>Loading your eligibility status...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:gap-8 min-h-[400px] sm:min-h-[600px]">
              {/* Eligibility Status */}
              <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border-2 ${eligibilityData.isEligible ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'}`}>
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl lg:text-6xl mb-4 flex items-center justify-center gap-2`}>
                    {eligibilityData.isEligible ? (
                      <>
                        <HiSparkles className="text-yellow-400 animate-pulse" />
                        <MdCelebration className="text-green-500" />
                        <HiSparkles className="text-yellow-400 animate-pulse" />
                      </>
                    ) : (
                      <FaFire className="text-orange-500 animate-pulse" />
                    )}
                  </div>
                  <h2 className={`font-bold text-xl sm:text-2xl lg:text-3xl mb-4 px-2`} style={{ color: '#0d0a0b' }}>
                    {eligibilityData.isEligible ? 'Congratulations! You\'re Eligible!' : 'Almost There! Keep Going!'}
                  </h2>
                  <div className="min-h-[40px] sm:min-h-[50px] lg:min-h-[60px] flex items-center justify-center">
                    <p className={`text-base sm:text-lg lg:text-xl mb-6 px-2 text-center max-w-lg mx-auto`} style={{ color: eligibilityData.isEligible ? '#166534' : '#c2410c' }}>
                      {getPromotionStatusMessage(eligibilityData)}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  {!eligibilityData.isEligible && (
                    <div className="mb-6 px-2">
                      <div className="flex justify-between text-xs sm:text-sm mb-2" style={{ color: '#454955' }}>
                        <span className="flex items-center gap-1">
                          <FaFire className="text-orange-500" />
                          Progress
                        </span>
                        <span className="font-bold text-orange-600">{getPromotionProgress(eligibilityData)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-orange-400 via-orange-500 to-[#72b01d] h-3 sm:h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                          style={{ width: `${getPromotionProgress(eligibilityData)}%` }}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs sm:text-sm text-center">
                        <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                          <FaFire className="animate-pulse" />
                          You're {getPromotionProgress(eligibilityData)}% of the way there!
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {eligibilityData.isEligible && !applicationStatus && (
                    <button 
                      onClick={() => setShowModal(true)}
                      className="bg-[#72b01d] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-[#3f7d20] transition transform hover:scale-105 mx-2"
                    >
                      <FaTrophy className="inline-block mr-2" />
                      Apply for Promotion Prize
                    </button>
                  )}

                  {applicationStatus && (
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 mx-2 ${getStatusDisplay()?.bgColor} ${getStatusDisplay()?.borderColor}`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getStatusDisplay()?.icon}
                        <span className={`font-bold text-base sm:text-lg ${getStatusDisplay()?.color} text-center`}>
                          {getStatusDisplay()?.text}
                        </span>
                      </div>
                      {applicationStatus.status === 'paid' && (
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-green-600 mt-2 px-2">
                            Your LKR 500 prize has been transferred to your bank account.
                          </p>
                        </div>
                      )}
                      {applicationStatus.status === 'pending' && (
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-orange-600 mt-2 px-2">
                            We'll review your application and process payment within 7 business days.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements Check */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                <h3 className={`font-bold text-lg sm:text-xl lg:text-2xl mb-4 sm:mb-6 text-center sm:text-left`} style={{ color: '#0d0a0b' }}>
                  Promotion Requirements
                </h3>
                
                <div className="grid gap-3 sm:gap-4">
                  {/* Shop Requirement */}
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${eligibilityData.shopsCount >= eligibilityData.requirementsShops ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className={`text-2xl sm:text-3xl self-center sm:self-auto`}>
                      {eligibilityData.shopsCount >= eligibilityData.requirementsShops ? (
                        <FaCheckCircle className="inline-block text-green-500" />
                      ) : (
                        <FaClock className="inline-block text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-semibold text-base sm:text-lg" style={{ color: '#0d0a0b' }}>
                        Create at least {eligibilityData.requirementsShops} active shop{eligibilityData.requirementsShops !== 1 ? 's' : ''}
                      </h4>
                      <p className="text-sm sm:text-base" style={{ color: '#454955' }}>
                        You have {eligibilityData.shopsCount} active shop{eligibilityData.shopsCount !== 1 ? 's' : ''}
                        {eligibilityData.shopsCount >= eligibilityData.requirementsShops ? ' ✓' : ' - Create your shop to get started!'}
                      </p>
                    </div>
                    {eligibilityData.shopsCount === 0 && (
                      <Link
                        to="/create-shop"
                        className="bg-[#72b01d] text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium hover:bg-[#3f7d20] transition text-sm sm:text-base self-center sm:self-auto"
                      >
                        Create Shop
                      </Link>
                    )}
                  </div>

                  {/* Listing Requirement */}
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${eligibilityData.listingsCount >= eligibilityData.requirementsListings ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className={`text-2xl sm:text-3xl self-center sm:self-auto`}>
                      {eligibilityData.listingsCount >= eligibilityData.requirementsListings ? (
                        <FaCheckCircle className="inline-block text-green-500" />
                      ) : (
                        <FaClock className="inline-block text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-semibold text-base sm:text-lg" style={{ color: '#0d0a0b' }}>
                        Create at least {eligibilityData.requirementsListings} active listings
                      </h4>
                      <p className="text-sm sm:text-base mb-2" style={{ color: '#454955' }}>
                        You have {eligibilityData.listingsCount} active listing{eligibilityData.listingsCount !== 1 ? 's' : ''}
                        {eligibilityData.listingsCount >= eligibilityData.requirementsListings ? ' ✓' : ` - ${eligibilityData.requirementsListings - eligibilityData.listingsCount} more needed!`}
                      </p>
                      {eligibilityData.listingsCount < eligibilityData.requirementsListings && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-[#72b01d] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((eligibilityData.listingsCount / eligibilityData.requirementsListings) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    {eligibilityData.shopsCount > 0 && (
                      <Link
                        to="/add-listing"
                        className="bg-[#72b01d] text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium hover:bg-[#3f7d20] transition text-sm sm:text-base self-center sm:self-auto"
                      >
                        Add Listing
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Your Shops & Listings */}
              {(shops.length > 0 || listings.length > 0) && (
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                  {/* Your Shops */}
                  {shops.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
                      <h3 className="font-bold text-lg sm:text-xl mb-4 text-center sm:text-left" style={{ color: '#0d0a0b' }}>
                        Your Shops ({eligibilityData.shopsCount})
                      </h3>
                      <div className="space-y-3">
                        {shops.slice(0, 3).map((shop) => (
                          <div key={shop.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:shadow-md transition-all duration-300">
                            <div className="flex-shrink-0">
                              {shop.logo ? (
                                <img
                                  src={shop.logo}
                                  alt={shop.name || 'Shop'}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-sm flex-shrink-0">
                                  {shop.name ? shop.name.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-medium truncate text-sm sm:text-base" style={{ color: '#0d0a0b' }}>
                                {shop.name ? (shop.name.length > 20 ? `${shop.name.substring(0, 20)}...` : shop.name) : 'Unnamed Shop'}
                              </p>
                              <p className="text-xs sm:text-sm truncate" style={{ color: '#454955' }}>
                                Created {shop.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                              </p>
                              {shop.description && (
                                <p className="text-xs text-gray-600 truncate mt-1" title={shop.description}>
                                  {shop.description.length > 30 
                                    ? `${shop.description.substring(0, 30)}...` 
                                    : shop.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {shops.length > 3 && (
                          <p className="text-xs sm:text-sm text-center" style={{ color: '#454955' }}>
                            +{shops.length - 3} more shops
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Your Recent Listings */}
                  {listings.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
                      <h3 className="font-bold text-lg sm:text-xl mb-4 text-center sm:text-left" style={{ color: '#0d0a0b' }}>
                        Your Recent Listings ({eligibilityData.listingsCount})
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        {listings.slice(0, 5).map((listing) => (
                          <div key={listing.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100 hover:shadow-md transition-all duration-300">
                            {/* Image Thumbnail */}
                            <div className="flex-shrink-0">
                              {listing.images && listing.images.length > 0 ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.name || 'Product'}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm flex-shrink-0">
                                  {listing.name ? listing.name.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                            </div>
                            
                            {/* Listing Info */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <h4 className="font-semibold text-sm sm:text-base truncate" style={{ color: '#0d0a0b' }}>
                                    {listing.name ? (listing.name.length > 25 ? `${listing.name.substring(0, 25)}...` : listing.name) : 'Untitled Listing'}
                                  </h4>
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mt-1">
                                    <span className="text-xs sm:text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                                      {listing.category ? (listing.category.length > 12 ? `${listing.category.substring(0, 12)}...` : listing.category) : 'Category'}
                                    </span>
                                    {listing.price && (
                                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap" style={{ color: '#72b01d' }}>
                                        LKR {typeof listing.price === 'number' ? listing.price.toLocaleString() : listing.price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-1 sm:gap-0">
                                <p className="text-xs truncate" style={{ color: '#454955' }}>
                                  <FaCalendarAlt className="inline-block mr-1 text-blue-500" />
                                  {listing.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                </p>
                                {listing.quantity && (
                                  <p className="text-xs bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap" style={{ color: '#454955' }}>
                                    Stock: {listing.quantity}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {listings.length > 5 && (
                          <div className="text-center pt-2">
                            <p className="text-xs sm:text-sm" style={{ color: '#454955' }}>
                              +{listings.length - 5} more listings
                            </p>
                            <Link 
                              to="/dashboard"
                              className="inline-block mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View All Listings →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Promotion Details */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                <h3 className={`font-bold text-lg sm:text-xl lg:text-2xl mb-4 sm:mb-6 text-center sm:text-left`} style={{ color: '#0d0a0b' }}>
                  <FaTrophy className="inline-block mr-2 text-yellow-500" />
                  Early Launch Cash Rewards
                </h3>
                
                {/* Main Prize Display */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-block p-4 sm:p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-green-300 relative mx-2">
                    {/* Decorative stars */}
                    <FaStar className="absolute top-1 left-1 sm:top-2 sm:left-2 text-yellow-400 text-sm sm:text-lg animate-pulse" />
                    <FaStar className="absolute top-1 right-1 sm:top-2 sm:right-2 text-yellow-400 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <FaStar className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-yellow-400 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '1s' }} />
                    <FaStar className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-yellow-400 text-sm sm:text-lg animate-pulse" style={{ animationDelay: '1.5s' }} />
                    
                    <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">
                      <FaMoneyBillWave className="inline-block text-green-600" />
                    </div>
                    <h4 className="font-black text-xl sm:text-2xl mb-2" style={{ color: '#0d0a0b' }}>
                      LKR 500 Cash Prize
                    </h4>
                    <p className="font-bold text-base sm:text-lg text-green-700 mb-2">
                      For First 50 Eligible Sellers
                    </p>
                    <p className="text-xs sm:text-sm px-2" style={{ color: '#454955' }}>
                      Meet the requirements and be among the first 50 to qualify!
                    </p>
                  </div>
                </div>

                {/* How it Works */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-4 sm:mb-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl">
                    <div className="text-xl sm:text-2xl mb-2">
                      <FaCheckCircle className="inline-block text-blue-600" />
                    </div>
                    <h5 className="font-semibold text-sm mb-1" style={{ color: '#0d0a0b' }}>
                      Step 1: Qualify
                    </h5>
                    <p className="text-xs" style={{ color: '#454955' }}>
                      Create 1 shop + 5 listings
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-xl sm:rounded-2xl">
                    <div className="text-xl sm:text-2xl mb-2">
                      <FaRocket className="inline-block text-orange-600" />
                    </div>
                    <h5 className="font-semibold text-sm mb-1" style={{ color: '#0d0a0b' }}>
                      Step 2: Apply
                    </h5>
                    <p className="text-xs" style={{ color: '#454955' }}>
                      Click apply when eligible
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl">
                    <div className="text-xl sm:text-2xl mb-2">
                      <FaMoneyBillWave className="inline-block text-green-600" />
                    </div>
                    <h5 className="font-semibold text-sm mb-1" style={{ color: '#0d0a0b' }}>
                      Step 3: Get Paid
                    </h5>
                    <p className="text-xs" style={{ color: '#454955' }}>
                      Receive LKR 500 cash
                    </p>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-xl sm:rounded-2xl border border-yellow-200 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <FaBolt className="inline-block text-yellow-500" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-2" style={{ color: '#d97706' }}>
                        Limited Time Offer - First 50 Sellers Only!
                      </h5>
                      <ul className="text-xs space-y-1" style={{ color: '#454955' }}>
                        <li>• Only the first 50 sellers to meet requirements will receive the cash prize</li>
                        <li>• All shops and listings must remain active during the promotion period</li>
                        <li>• One prize per seller/account</li>
                        <li>• Cash will be transferred within 7 business days of application approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Verification Warning */}
                <div className="p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl border border-green-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <FaCheckCircle className="inline-block text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-2" style={{ color: '#166534' }}>
                        📋 Quality Verification Process
                      </h5>
                      <p className="text-xs leading-relaxed" style={{ color: '#15803d' }}>
                        <strong>All shops and listings will be reviewed</strong> to ensure quality standards. 
                        We verify the authenticity of your business content, product details, and shop information. 
                        <br /><br />
                        <strong>Please ensure:</strong>
                        <br />• All product listings are genuine and accurate
                        <br />• Shop information is legitimate and complete
                        <br />• Product images and descriptions are authentic
                        <br />• No duplicate, fake, or placeholder content
                        <br /><br />
                        <em>This helps maintain marketplace quality for all users.</em>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl">
                  <p className="text-xs sm:text-sm font-medium text-center sm:text-left" style={{ color: '#166534' }}>
                    <FaCalendarAlt className="inline-block mr-1 text-green-600" />
                    Promotion Period: Now until December 31, 2025 or until 50 winners reached | 
                    <FaBullseye className="inline-block ml-1 mr-1 text-green-600" />
                    Applications processed in order received
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              disabled={submitting}
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>

            <div className="text-center mb-4 sm:mb-6 pr-8">
              <FaUniversity className="text-3xl sm:text-4xl text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                Bank Details for Prize Transfer
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: '#454955' }}>
                Please provide your bank details to receive the LKR 500 cash prize
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0d0a0b' }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Commercial Bank of Ceylon"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0d0a0b' }}>
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent text-sm sm:text-base"
                  placeholder="Your account number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0d0a0b' }}>
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent text-sm sm:text-base"
                  placeholder="Full name as per bank account"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0d0a0b' }}>
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.branchName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, branchName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#72b01d] focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Colombo Main Branch"
                  required
                />
              </div>

              <div className="bg-green-50 p-3 rounded-lg sm:rounded-xl border border-green-200 mt-3 sm:mt-4">
                <p className="text-xs text-green-700">
                  <FaCheckCircle className="inline-block mr-1" />
                  Your shops and listings will be reviewed for quality before prize approval.
                </p>
              </div>

              <div className="flex justify-center mt-4 sm:mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 sm:px-6 py-3 bg-[#72b01d] text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-[#3f7d20] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="inline-block mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheck className="inline-block mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EarlyLaunchPromotion;
