import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, startAfter } from "firebase/firestore";
import { getUserIP } from "../../utils/ipUtils";
import { db } from "../../utils/firebase";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import WishlistButton from "../../components/UI/WishlistButton";
import ContactSellerButton from "../../components/UI/ContactSellerButton";
import ResponsiveListingTile from "../../components/UI/ResponsiveListingTile";
import WithReviewStats from "../../components/HOC/WithReviewStats";
import { LoadingSpinner, Pagination } from "../../components/UI";
import { SEOHead } from "../../components/SEO/SEOHead";
import ShopOwnerName from "../shop/ShopOwnerName";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiStar, FiShoppingBag, FiPackage, FiDownload } from "react-icons/fi";
import { PaymentMethod } from "../../types/enums";
import { getProductStructuredData, getBreadcrumbStructuredData, getCanonicalUrl, generateKeywords } from "../../utils/seo";
import type { PaymentMethod as PaymentMethodType } from "../../types/enums";
import { useResponsive } from "../../hooks/useResponsive";
import type { UserProfile } from "../../utils/userProfile";
import { ItemType } from "../../utils/categories";

// Simple variation interface (matching AddListing)
interface SimpleVariation {
  id: string;
  name: string;
  priceChange: number;
  quantity: number;
}

type Shop = {
  name: string;
  username: string;
  logo?: string;
  owner: string;
  // Add more fields as needed
};

export default function ListingSingle() {
  const { isMobile } = useResponsive();
  // Payment method state - will be set based on available options
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.CASH_ON_DELIVERY);
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [enlarge, setEnlarge] = useState(false);
  const [qty, setQty] = useState(1);
  const [qtyInput, setQtyInput] = useState('1'); // Separate state for input display
  const [selectedVariation, setSelectedVariation] = useState<SimpleVariation | null>(null);
  const [latestItems, setLatestItems] = useState<any[]>([]);
  
  // Reviews state - fetch from reviews collection for optimal performance
  const [listingReviewCount, setListingReviewCount] = useState(0);
  const [listingAvgRating, setListingAvgRating] = useState<number | null>(null);
  
  // Paginated reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [reviewsCursors, setReviewsCursors] = useState<any[]>([null]); // Array of cursors for each page
  const reviewsPerPage = 10;

  // Function to fetch latest items with improved performance
  const fetchLatestItems = async () => {
    if (!id) return;
    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, orderBy("createdAt", "desc"), limit(8)); // Fetch a few extra to exclude current
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.id !== id) // Exclude current item
        .slice(0, 5); // Show only 5 items
      setLatestItems(items);
    } catch (error) {
      console.error("Error fetching latest items:", error);
      setLatestItems([]);
    }
  };

  // Function to refresh listings (for wishlist button)
  const refreshListings = () => {
    // Re-fetch latest items if needed
    fetchLatestItems();
  };

  // Set body background color for this page
  useEffect(() => {
    const originalBodyStyle = document.body.style.backgroundColor;
    const originalHtmlStyle = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';

    return () => {
      document.body.style.backgroundColor = originalBodyStyle;
      document.documentElement.style.backgroundColor = originalHtmlStyle;
    };
  }, []);

  // Reset quantity when variation changes
  useEffect(() => {
    setQty(1);
    setQtyInput('1');
  }, [selectedVariation]);

  // Keep qtyInput in sync with qty when changed by buttons
  useEffect(() => {
    setQtyInput(qty.toString());
  }, [qty]);

  // Auto-select first available variation when item loads
  useEffect(() => {
    if (item?.hasVariations && item?.variations && item.variations.length > 0 && !selectedVariation) {
      // Find the first variation that has stock
      const firstAvailableVariation = item.variations.find((v: SimpleVariation) => 
        v.name && v.name.trim() && v.quantity > 0
      );
      
      if (firstAvailableVariation) {
        setSelectedVariation(firstAvailableVariation);
      }
    }
  }, [item, selectedVariation]);

  useEffect(() => {
    // Set default payment method based on what's available for this listing
    // For digital products, never default to COD
    if (item?.itemType === ItemType.DIGITAL) {
      if (item?.bankTransfer) {
        setPaymentMethod(PaymentMethod.BANK_TRANSFER);
      } else {
        setPaymentMethod(PaymentMethod.PAY_NOW);
      }
    } else if (item?.cashOnDelivery && item?.bankTransfer) {
      // If both are available, default to COD (customer preference)
      setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
    } else if (item?.cashOnDelivery) {
      setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
    } else if (item?.bankTransfer) {
      setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    }
    // If neither is available, keep the current selection
  }, [item?.cashOnDelivery, item?.bankTransfer, item?.itemType]);

  // Fetch listing and shop info with batched IP and data loading
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        // Batch IP fetch and listing fetch
        const [docSnap, ip] = await Promise.all([
          getDoc(doc(db, "listings", id)),
          getUserIP().catch(() => null) // Handle IP fetch failure gracefully
        ]);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Attach client IP and document ID for wishlist logic
          setItem({ ...data, id, __client_ip: ip });

          // Fetch shop info if available
          if (data.shop || data.shopId) {
            const shopSnap = await getDoc(doc(db, "shops", data.shop || data.shopId));
            if (shopSnap.exists()) setShop(shopSnap.data() as Shop);
          }
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // Fetch latest items when id changes
  useEffect(() => {
    if (id) {
      fetchLatestItems();
    }
  }, [id]);

  // Simplified reviews fetch with pagination
  const fetchReviews = async () => {
    if (!id) return;
    

    
    try {
      setReviewsLoading(true);
      
      // First, get total count for pagination calculations
      const countQuery = query(
        collection(db, "reviews"),
        where("itemId", "==", id)
      );
      const countSnapshot = await getDocs(countQuery);
      const totalReviews = countSnapshot.size;

      setListingReviewCount(totalReviews);
      
      if (totalReviews > 0) {
        // Calculate average rating from all reviews
        const allReviews = countSnapshot.docs.map(doc => doc.data());
        const totalRating = allReviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
        const averageRating = totalRating / totalReviews;
        setListingAvgRating(Math.round(averageRating * 100) / 100);
        
        // Calculate total pages
        const totalPages = Math.ceil(totalReviews / reviewsPerPage);
        setTotalReviewPages(totalPages);
        
        // Get paginated reviews for display
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("itemId", "==", id),
          orderBy("createdAt", "desc"),
          limit(reviewsPerPage)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        
        // Set up cursor for pagination
        if (reviewsSnapshot.docs.length > 0) {
          const newCursors: any[] = [null]; // First page has no cursor
          newCursors[1] = reviewsSnapshot.docs[reviewsSnapshot.docs.length - 1];
          setReviewsCursors(newCursors);
        }
        
        // Enrich reviews with user names
        const enrichedReviews = await Promise.all(
          reviewsData.map(async (review: any) => {
            if (review.buyerId) {
              const userName = await getUserDisplayName(review.buyerId);
              return { ...review, reviewerName: userName };
            }
            return { ...review, reviewerName: review.reviewerName || 'Anonymous User' };
          })
        );
        

        setReviews(enrichedReviews);
        setCurrentReviewPage(1);
        
        // Reviews fetched successfully
      } else {
        setListingAvgRating(null);
        setTotalReviewPages(1);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setListingAvgRating(null);
      setListingReviewCount(0);
      setTotalReviewPages(1);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Function to fetch specific page of reviews
  const fetchReviewPage = async (page: number) => {
    if (!id || page === currentReviewPage) return;
    
    try {
      setReviewsLoading(true);
      
      let reviewsQuery;
      
      if (page === 1) {
        // First page - no cursor needed
        reviewsQuery = query(
          collection(db, "reviews"),
          where("itemId", "==", id),
          orderBy("createdAt", "desc"),
          limit(reviewsPerPage)
        );
      } else {
        // Subsequent pages - use cursor from previous page
        const cursor = reviewsCursors[page - 2]; // previous page's last doc
        if (!cursor) {
          console.error("No cursor available for page", page);
          return;
        }
        
        reviewsQuery = query(
          collection(db, "reviews"),
          where("itemId", "==", id),
          orderBy("createdAt", "desc"),
          startAfter(cursor),
          limit(reviewsPerPage)
        );
      }
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Update cursors for pagination
      if (reviewsSnapshot.docs.length > 0) {
        const newCursors = [...reviewsCursors];
        newCursors[page - 1] = reviewsSnapshot.docs[reviewsSnapshot.docs.length - 1];
        setReviewsCursors(newCursors);
      }
      
      // Enrich reviews with user names
      const enrichedReviews = await Promise.all(
        reviewsData.map(async (review: any) => {
          if (review.buyerId) {
            const userName = await getUserDisplayName(review.buyerId);
            return { ...review, reviewerName: userName };
          }
          return { ...review, reviewerName: review.reviewerName || 'Anonymous User' };
        })
      );
      
      setReviews(enrichedReviews);
      setCurrentReviewPage(page);
    } catch (error) {
      console.error("Error fetching review page:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Handle review page changes
  const handleReviewPageChange = async (page: number) => {
    await fetchReviewPage(page);
    // Scroll to reviews section
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to get user display name
  const getUserDisplayName = async (userId: string): Promise<string> => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        // Try different name fields in order of preference
        if (userData.displayName) {
          return userData.displayName;
        }
        if (userData.buyerInfo?.firstName && userData.buyerInfo?.lastName) {
          return `${userData.buyerInfo.firstName} ${userData.buyerInfo.lastName}`;
        }
        if (userData.buyerInfo?.firstName) {
          return userData.buyerInfo.firstName;
        }
        if (userData.email) {
          // Use email username as fallback
          return userData.email.split('@')[0];
        }
      }
      return 'Anonymous User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Anonymous User';
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!item) {
    return (
      <>
        <SEOHead
          title="Product Not Found - Sina.lk"
          description="The product you're looking for doesn't exist. Browse our marketplace for amazing products from local sellers."
          noIndex={true}
        />
        <ResponsiveHeader />
        <div className="min-h-screen bg-white flex flex-col">
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <div className="max-w-lg w-full text-center">
              {/* 404 Illustration */}
              <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
                <div className="relative">
                  <h1 className={`${isMobile ? 'text-8xl' : 'text-9xl'} font-bold text-gray-100 select-none`}>
                    404
                  </h1>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiShoppingBag className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} text-[#72b01d]`} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4`}>
                    Product Not Found
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    The product you're looking for doesn't exist or has been removed. 
                    Don't worry, there are plenty of amazing products waiting for you!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'} mt-8`}>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#72b01d] text-white font-semibold rounded-xl hover:bg-[#5a8c17] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <FiShoppingBag className="w-5 h-5" />
                    Browse Products
                  </Link>
                  
                  <Link
                    to="/search"
                    className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#72b01d] font-semibold rounded-xl border-2 border-[#72b01d] hover:bg-[#72b01d] hover:text-white transition-all duration-200"
                  >
                    <FiPackage className="w-5 h-5" />
                    Search Products
                  </Link>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center gap-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // Calculate review summary for this listing (after item is loaded)
  // Reviews are now fetched separately from the reviews collection via state

  // Calculate price including any selected variation
  const basePrice = Number(item?.price || 0);
  const variationPriceChange = selectedVariation?.priceChange || 0;
  const price = basePrice + variationPriceChange;
  
  // Calculate available quantity based on selected variation or total quantity
  const availableQuantity = selectedVariation ? selectedVariation.quantity : (item?.quantity || 1);
  
  const deliveryType = item.deliveryType;
  const deliveryPerItem = Number(item.deliveryPerItem || 0);
  const deliveryAdditional = Number(item.deliveryAdditional || 0);
  let shipping = 0;
  // Digital products have no shipping costs
  if (item?.itemType !== ItemType.DIGITAL && deliveryType === "paid") {
    shipping = deliveryPerItem + (qty > 1 ? deliveryAdditional * (qty - 1) : 0);
  }
  const total = price * qty + shipping;

  // Refresh function to reload item after wishlist change
  const refreshItem = async () => {
    if (!id) return;
    const docRef = doc(db, "listings", id);
    const docSnap = await getDoc(docRef);
    let ip = null;
    try {
      ip = await getUserIP();
    } catch { }
    if (docSnap.exists()) setItem({ ...docSnap.data(), id, __client_ip: ip });
  };

  // Generate SEO data
  const generateProductSEO = () => {
    const productName = item.name || 'Product';
    const description = item.description || 'Quality product or service from Sri Lankan entrepreneur';
    const price = item.price || 0;
    const image = item.images?.[0] || '/default-product.jpg';
    
    return {
      title: `${productName} - Buy from Sri Lankan Entrepreneurs`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      keywords: generateKeywords([
        productName,
        item.category || '',
        item.subcategory || '',
        'quality product',
        'Sri Lankan entrepreneur',
        'online business'
      ]),
      structuredData: getProductStructuredData({
        name: productName,
        description,
        price,
        currency: 'LKR',
        image,
        category: item.category,
        brand: shop?.name || 'Sri Lankan Marketplace',
        seller: shop?.name || 'Local Entrepreneur',
        rating: listingAvgRating || undefined,
        reviewCount: listingReviewCount || undefined
      }),
      breadcrumbData: getBreadcrumbStructuredData([
        { name: 'Home', url: getCanonicalUrl('/') },
        ...(item.category ? [{ name: item.category, url: getCanonicalUrl(`/search?cat=${item.category}`) }] : []),
        { name: productName, url: getCanonicalUrl(`/listing/${id}`) }
      ])
    };
  };

  const seoData = generateProductSEO();

  return (
    <div className="min-h-screen w-full pb-8" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl={getCanonicalUrl(`/listing/${id}`)}
        ogType="product"
        ogImage={item.images?.[0] || '/default-product.jpg'}
        structuredData={[seoData.structuredData, seoData.breadcrumbData]}
      />
      <ResponsiveHeader />

      {/* Breadcrumb - Enhanced mobile UI */}
      <nav className={`max-w-6xl mx-auto mt-4 mb-2 px-4`} aria-label="Breadcrumb">
        <div className={`${isMobile ? 'bg-gray-50 rounded-lg p-3' : ''}`}>
          <ol className={`flex items-center ${isMobile ? 'gap-1 text-xs overflow-x-auto scrollbar-hide' : 'gap-2 text-sm'} text-gray-500`}>
            {item?.category && (
              <li className="flex-shrink-0">
                <Link
                  to={`/search?cat=${encodeURIComponent(item.category)}`}
                  className={`hover:text-green-600 font-medium transition-colors ${
                    isMobile 
                      ? 'inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md text-xs shadow-sm hover:shadow-md' 
                      : ''
                  }`}
                >
                  {item.category}
                </Link>
              </li>
            )}
            {item?.subcategory && (
              <>
                <span className={`flex-shrink-0 ${isMobile ? 'text-gray-400 mx-1' : 'mx-1 text-gray-400'}`}>
                  {isMobile ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    '/'
                  )}
                </span>
                <li className="flex-shrink-0">
                  <Link
                    to={`/search?cat=${encodeURIComponent(item.category)}&sub=${encodeURIComponent(item.subcategory)}`}
                    className={`hover:text-green-600 font-medium transition-colors ${
                      isMobile 
                        ? 'inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md text-xs shadow-sm hover:shadow-md' 
                        : ''
                    }`}
                  >
                    {item.subcategory}
                  </Link>
                </li>
              </>
            )}
            <span className={`flex-shrink-0 ${isMobile ? 'text-gray-400 mx-1' : 'mx-1 text-gray-400'}`}>
              {isMobile ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                '/'
              )}
            </span>
            <li className={`font-semibold text-gray-900 truncate ${
              isMobile 
                ? 'max-w-[100px] text-xs px-2 py-1 bg-green-100 border border-green-200 rounded-md' 
                : 'max-w-[200px]'
            }`} title={item.name}>
              {item.name}
            </li>
          </ol>
        </div>
      </nav>

      <main className={`w-full max-w-6xl mx-auto mt-6 ${isMobile ? 'px-4' : 'px-4'}`}>
        {/* Main Product Section */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-0`}>
            
            {/* Left: Image Gallery */}
            <div className={`${isMobile ? 'p-4' : 'p-8'} border-r border-gray-100`}>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {item.images && item.images.length > 0 && (
                  <img
                    src={item.images[imgIdx]}
                    alt={`${item.name} - Image ${imgIdx + 1}`}
                    className="object-contain w-full h-full cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setEnlarge(true)}
                  />
                )}
                
                {/* Navigation Arrows */}
                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-green-600 transition-all"
                      onClick={() => setImgIdx((imgIdx - 1 + item.images.length) % item.images.length)}
                      aria-label="Previous image"
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-green-600 transition-all"
                      onClick={() => setImgIdx((imgIdx + 1) % item.images.length)}
                      aria-label="Next image"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Enlarge Button */}
                <button
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-green-600 transition-all"
                  onClick={() => setEnlarge(true)}
                  aria-label="Enlarge image"
                >
                  <FiMaximize2 size={16} />
                </button>
              </div>
              
              {/* Thumbnails */}
              {item.images && item.images.length > 1 && (
                <div className={`flex gap-2 mt-4 ${isMobile ? 'overflow-x-auto pb-2' : 'justify-center'}`}>
                  {item.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setImgIdx(idx)}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        imgIdx === idx ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details */}
            <div className={`${isMobile ? 'p-4' : 'p-8'} flex flex-col`}>
              
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-gray-900 leading-tight flex-1`}>
                    {item.name}
                  </h1>
                  {item?.itemType === ItemType.DIGITAL && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                      <FiDownload className="w-3 h-3" />
                      Digital
                    </div>
                  )}
                </div>
                
                {/* Reviews */}
                {listingReviewCount > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center text-yellow-500">
                      <FiStar className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-900">
                        {listingAvgRating?.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({listingReviewCount} review{listingReviewCount > 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Shop Info */}
                {shop && (
                  <div className={`inline-flex items-center ${isMobile ? 'gap-1.5 px-2 py-1.5' : 'gap-2 px-3 py-2'} rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all`}>
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

                {/* Action Buttons - Left aligned */}
                {item && shop && (
                  <div className={`${isMobile ? 'mt-3' : 'mt-4'} flex gap-3 justify-start`}>
                    <WishlistButton 
                      listing={item} 
                      refresh={refreshItem}
                      displayText={true}
                    />
                    <ContactSellerButton
                      sellerId={shop.owner}
                      sellerName={shop.name}
                      context={{
                        type: 'listing',
                        id: item.id,
                        title: item.name,
                        listingDetails: {
                          id: item.id,
                          name: item.name,
                          price: basePrice,
                          image: item.images?.[0],
                          shopName: shop.name
                        }
                      }}
                      buttonText="Contact Seller"
                      buttonStyle="outline"
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* Variations Section */}
              {item?.hasVariations && item?.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Variation
                  </label>
                  <select
                    value={selectedVariation?.id || ''}
                    onChange={(e) => {
                      if (e.target.value !== '') {
                        const variation = item.variations?.find((v: SimpleVariation) => v.id === e.target.value);
                        if (variation && variation.quantity > 0) {
                          setSelectedVariation(variation);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    {item.variations.filter((v: SimpleVariation) => v.name && v.name.trim()).map((variation: SimpleVariation) => {
                      const variationPrice = basePrice + variation.priceChange;
                      const isOutOfStock = variation.quantity <= 0;
                      
                      return (
                        <option 
                          key={variation.id} 
                          value={variation.id}
                          disabled={isOutOfStock}
                        >
                          {variation.name} - LKR {variationPrice.toLocaleString()}
                          {isOutOfStock ? ' (Out of Stock)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  
                  {/* Selected Variation Info */}
                  {selectedVariation && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {selectedVariation.name}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          LKR {(basePrice + selectedVariation.priceChange).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedVariation.quantity} available
                        {selectedVariation.priceChange !== 0 && (
                          <span className="ml-2">
                            ({selectedVariation.priceChange > 0 ? '+' : ''}LKR {selectedVariation.priceChange.toFixed(2)} from base)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity and Purchase Section */}
              <div className="space-y-6">
                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = Math.max(1, qty - 1);
                          setQty(newQty);
                        }}
                        disabled={qty <= 1}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={availableQuantity}
                        value={qtyInput}
                        onChange={e => {
                          const inputValue = e.target.value;
                          setQtyInput(inputValue);
                          
                          // Only update qty if it's a valid number
                          if (inputValue !== '') {
                            const numValue = parseInt(inputValue, 10);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= availableQuantity) {
                              setQty(numValue);
                            }
                          }
                        }}
                        onBlur={e => {
                          const value = parseInt(e.target.value, 10);
                          let finalValue;
                          
                          if (isNaN(value) || value < 1) {
                            finalValue = 1;
                          } else if (value > availableQuantity) {
                            finalValue = availableQuantity;
                          } else {
                            finalValue = value;
                          }
                          
                          setQty(finalValue);
                          setQtyInput(finalValue.toString());
                        }}
                        className="w-16 px-2 py-2 text-center border-0 focus:ring-0 focus:outline-none bg-white"
                        style={{
                          MozAppearance: 'textfield' // Firefox
                        }}
                        onWheel={(e) => e.currentTarget.blur()} // Prevent scroll wheel changes
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = Math.min(availableQuantity, qty + 1);
                          setQty(newQty);
                        }}
                        disabled={qty >= availableQuantity}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      of {availableQuantity} available
                    </span>
                  </div>
                </div>

                {/* Price Breakdown Section */}
                <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} space-y-3`}>
                  {/* Item Price */}
                  <div className="flex items-center justify-between">
                    <span className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
                      Item price {qty > 1 ? `(${qty} × LKR ${price.toLocaleString()})` : ''}
                    </span>
                    <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                      LKR {(price * qty).toLocaleString()}
                    </span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex items-center justify-between">
                    <span className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
                      {item?.itemType === ItemType.DIGITAL 
                        ? "Delivery" 
                        : deliveryType === "free" ? "Delivery" : "Delivery fee"}
                      {item?.itemType !== ItemType.DIGITAL && deliveryType === "paid" && qty > 1 && (
                        <span className={`block ${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-0.5`}>
                          LKR {deliveryPerItem} + LKR {deliveryAdditional} × {qty - 1}
                        </span>
                      )}
                    </span>
                    <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium ${deliveryType === "free" || item?.itemType === ItemType.DIGITAL ? "text-green-600" : "text-gray-900"}`}>
                      {item?.itemType === ItemType.DIGITAL 
                        ? "Digital - No shipping" 
                        : deliveryType === "free" ? "Free" : `LKR ${shipping.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Total */}
                  <div className={`flex items-center justify-between ${isMobile ? 'pt-2' : 'pt-2'} border-t border-gray-300`}>
                    <span className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900`}>Total</span>
                    <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                      LKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                {((item.cashOnDelivery && item?.itemType !== ItemType.DIGITAL) || item.bankTransfer) ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Payment Method:</div>
                    <div className="space-y-2">
                      {item.cashOnDelivery && item?.itemType !== ItemType.DIGITAL && (
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === PaymentMethod.CASH_ON_DELIVERY}
                            onChange={() => setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY)}
                            className="accent-[#72b01d]"
                          />
                          <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                        </label>
                      )}
                      {item.bankTransfer && (
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bankTransfer"
                            checked={paymentMethod === PaymentMethod.BANK_TRANSFER}
                            onChange={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                            className="accent-[#72b01d]"
                          />
                          <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                        </label>
                      )}
                    </div>

                    {/* Order Button */}
                    <button
                      className="w-full py-4 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm"
                      style={{
                        backgroundColor: qty > availableQuantity || (item?.hasVariations && !selectedVariation) 
                          ? undefined 
                          : '#72b01d'
                      }}
                      onMouseEnter={(e) => {
                        if (!(qty > availableQuantity || (item?.hasVariations && !selectedVariation))) {
                          e.currentTarget.style.backgroundColor = '#5a8f17';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(qty > availableQuantity || (item?.hasVariations && !selectedVariation))) {
                          e.currentTarget.style.backgroundColor = '#72b01d';
                        }
                      }}
                      disabled={qty > availableQuantity || (item?.hasVariations && !selectedVariation)}
                      onClick={() => {
                        if (!item || !shop || qty > availableQuantity) return;
                        if (item?.hasVariations && !selectedVariation) return;
                        
                        const params = new URLSearchParams({
                          itemId: id || '',
                          quantity: qty.toString(),
                          paymentMethod: paymentMethod
                        });
                        
                        if (selectedVariation) {
                          params.append('variationId', selectedVariation.id);
                          params.append('variationName', selectedVariation.name);
                        }
                        
                        navigate(`/checkout?${params.toString()}`);
                      }}
                    >
                      {paymentMethod === PaymentMethod.CASH_ON_DELIVERY 
                        ? 'Order with Cash on Delivery' 
                        : item?.itemType === ItemType.DIGITAL 
                          ? 'Purchase Digital Product'
                          : 'Order with Bank Transfer'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 text-center">
                      ⚠️ No payment methods are currently available for this listing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {item.description}
              </div>
            </div>

            {/* Delivery Information */}
            {item.sellerNotes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {item?.itemType === ItemType.DIGITAL ? 'Product Information' : 'Delivery Information'}
                </h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    {item?.itemType === ItemType.DIGITAL ? (
                      <FiDownload className="text-green-600 w-6 h-6" />
                    ) : (
                      <FiPackage className="text-green-600 w-6 h-6" />
                    )}
                    <div className="flex-1 text-gray-700 leading-relaxed whitespace-pre-line">
                      {item.sellerNotes}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-blue-900">Payment Options</span>
                </div>
                <div className="text-sm text-blue-800">
                  {item?.itemType === ItemType.DIGITAL ? (
                    // Digital products - no COD
                    item.bankTransfer ? (
                      "Bank Transfer available for digital products"
                    ) : (
                      "Contact seller for payment options"
                    )
                  ) : (
                    // Physical products - normal flow
                    item.cashOnDelivery && item.bankTransfer ? (
                      "Cash on Delivery & Bank Transfer available"
                    ) : item.cashOnDelivery ? (
                      "Cash on Delivery available"
                    ) : item.bankTransfer ? (
                      "Bank Transfer available"
                    ) : (
                      "Contact seller for payment options"
                    )
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {item?.itemType === ItemType.DIGITAL ? (
                    <FiDownload className="w-5 h-5 text-green-600" />
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM3 10a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H3zM3 16a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H3zM6 4a1 1 0 000 2h8a1 1 0 100-2H6zM6 10a1 1 0 000 2h8a1 1 0 100-2H6zM6 16a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                  )}
                  <span className="font-semibold text-green-900">
                    {item?.itemType === ItemType.DIGITAL ? 'Digital Delivery' : 'Delivery'}
                  </span>
                </div>
                <div className="text-sm text-green-800">
                  {item?.itemType === ItemType.DIGITAL 
                    ? "Instant download after payment" 
                    : deliveryType === "free" ? "Free delivery included" : "Delivery charges apply"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Customer Reviews
                {listingReviewCount > 0 && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    ({listingReviewCount})
                  </span>
                )}
              </h2>
              {listingAvgRating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(listingAvgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {listingAvgRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {listingReviewCount === 0 ? (
              <div className="text-center py-8">
                <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-500 mb-1">No reviews yet</p>
                <p className="text-gray-400">Be the first to review this product!</p>
              </div>
            ) : (
              <>
                {/* Reviews List */}
                <div className="space-y-4 mb-6">
                  {reviewsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 border border-gray-100 rounded-lg animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div key={star} className="w-3 h-3 bg-gray-200 rounded"></div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
                            {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {review.reviewerName || 'Anonymous User'}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.createdAt && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {review.review && (
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {review.review}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination for Reviews */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      currentPage={currentReviewPage}
                      totalPages={totalReviewPages}
                      onPageChange={handleReviewPageChange}
                      totalItems={listingReviewCount}
                      showInfo={false}
                      showJumpTo={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </main>

      {/* Latest Items Section - Full Width */}
      {latestItems.length > 0 && (
        <div className={`w-full ${isMobile ? 'px-4 mb-8' : 'px-6 mb-12'}`}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">You Might Also Like</h2>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 transition-colors"
                >
                  See all products
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <WithReviewStats listings={latestItems}>
                {(listingsWithStats) => (
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6'}`}>
                    {listingsWithStats.map((item) => (
                      <ResponsiveListingTile 
                        key={item.id}
                        listing={item}
                        onRefresh={refreshListings}
                      />
                    ))}
                  </div>
                )}
              </WithReviewStats>
            </div>
          </div>
        </div>
      )}

      {/* Enlarge Modal */}
      {enlarge && item.images && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(13, 10, 11, 0.85)' }} onClick={() => setEnlarge(false)}>
          <img
            src={item.images[imgIdx]}
            alt="enlarged"
            className={`${isMobile ? 'max-w-full max-h-full' : 'max-w-3xl max-h-[80vh]'} rounded-2xl shadow-2xl border-4 object-contain`}
            style={{ borderColor: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      <Footer />
    </div>
  );
}
