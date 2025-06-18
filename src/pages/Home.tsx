import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiLayers } from "react-icons/fi";
import { categories, categoryIcons } from "../utils/categories";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import ResponsiveListingTile from "../components/UI/ResponsiveListingTile";
import WithReviewStats from "../components/HOC/WithReviewStats";
import { SEOHead } from "../components/SEO/SEOHead";
import { getUserIP } from "../utils/ipUtils";
import { getWebsiteStructuredData, getCanonicalUrl, generateKeywords } from "../utils/seo";
import { useResponsive } from "../hooks/useResponsive";
import type { DeliveryType as DeliveryTypeType } from "../types/enums";

function ProductHeroSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-3xl mx-auto relative group"
    >
      <div className={`relative backdrop-blur-md rounded-2xl shadow-2xl border overflow-hidden group-focus-within:shadow-xl transition-all duration-500 ${
        isMobile ? 'rounded-xl' : 'rounded-2xl'
      }`}
        style={{
          backgroundColor: '#ffffff',
          borderColor: 'rgba(114, 176, 29, 0.3)'
        }}>
        <div className={`flex items-center ${isMobile ? 'px-4 py-4' : 'px-8 py-6'}`}>
          <FiSearch className={`${isMobile ? 'text-xl mr-3' : 'text-3xl mr-4'} group-focus-within:opacity-80 transition-colors`}
            style={{ color: '#72b01d' }} />
          <input
            className={`flex-1 bg-transparent outline-none border-none ${isMobile ? 'text-base px-1 py-1' : 'text-xl px-2 py-1'}`}
            style={{
              color: '#0d0a0b'
            }}
            type="text"
            placeholder={isMobile ? "Search products..." : "Search for unique Sri Lankan creations..."}
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search for products"
          />
          <button
            type="submit"
            className={`${isMobile ? 'ml-2 px-4 py-2 rounded-lg text-sm' : 'ml-4 px-8 py-3 rounded-xl text-lg'} text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105`}
            style={{
              background: `linear-gradient(to right, #72b01d, #3f7d20)`,
            }}
          >
            {isMobile ? "Go" : "Search"}
          </button>
        </div>
      </div>

      {/* Popular searches */}
      <div className={`flex flex-wrap gap-2 ${isMobile ? 'gap-2 mt-4' : 'gap-3 mt-6'} justify-center`}>
        {["Woodcraft", "Jewelry", "Textiles", "Pottery", "Tea"].map(term => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQ(term);
              handleSearch({ preventDefault: () => {} });
            }}
            className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} border rounded-full font-medium transition-all duration-300 hover:shadow-md hover:scale-105`}
            style={{
              backgroundColor: '#ffffff',
              color: '#72b01d',
              borderColor: 'rgba(114, 176, 29, 0.3)'
            }}
          >
            {term}
          </button>
        ))}
      </div>
    </form>
  );
}

type Listing = {
  id: string;
  name?: string;
  price?: number;
  images?: string[];
  description?: string;
  createdAt?: any;
  reviews?: any[];
  deliveryType?: DeliveryTypeType;
  cashOnDelivery?: boolean;
  wishlist?: Array<{ ip?: string; ownerId?: string; }>;
};

const Home = () => {
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState<string | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'buyers' | 'sellers'>('buyers');
  const { isMobile } = useResponsive();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch user IP and latest listings in parallel for better performance
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [snap, userIp] = await Promise.all([
          getDocs(query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(8))),
          getUserIP().catch(() => null) // Handle IP fetch failure gracefully
        ]);
        
        const results: Listing[] = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          __client_ip: userIp 
        }));
        
        setLatestListings(results);
        setIp(userIp);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setLatestListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Function to refresh listings (after wishlist update)
  const refreshListings = async () => {
    try {
      const snap = await getDocs(query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(8)));
      const results: Listing[] = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        __client_ip: ip 
      }));
      setLatestListings(results);
    } catch (error) {
      console.error("Error refreshing listings:", error);
    }
  };

  return (

    <>
      <SEOHead
        title="Sri Lankan Marketplace - Authentic Products & Crafts"
        description="Discover authentic Sri Lankan products, handmade crafts, traditional textiles, Ceylon tea, and unique artisan creations. Connect with local sellers and support Sri Lankan businesses worldwide."
        keywords={generateKeywords([
          'Sri Lankan marketplace',
          'Ceylon crafts',
          'handmade products',
          'traditional Sri Lankan goods',
          'local artisans',
          'authentic Sri Lankan items',
          'woodcraft',
          'jewelry',
          'textiles',
          'pottery',
          'Ceylon tea'
        ])}
        canonicalUrl={getCanonicalUrl('/')}
        ogType="website"
        structuredData={getWebsiteStructuredData()}
      />
      <ResponsiveHeader />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
        {/* Hero Section */}
        <section className="relative pt-8 md:pt-16 pb-16 md:pb-24 overflow-hidden"
          style={{ backgroundColor: '#ffffff' }}>
          {/* Background Pattern - removed for consistent background */}

          {/* Animated Waving Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob1 absolute -top-20 -right-20 w-72 h-72 opacity-30"
              style={{ backgroundColor: '#72b01d' }}></div>
            <div className="blob blob2 absolute -bottom-32 -left-32 w-96 h-80 opacity-20"
              style={{ backgroundColor: '#3f7d20' }}></div>
            <div className="blob blob3 absolute top-1/3 right-1/3 w-64 h-64 opacity-25"
              style={{ backgroundColor: '#72b01d' }}></div>
            <div className="blob blob4 absolute bottom-1/4 left-1/4 w-80 h-72 opacity-15"
              style={{ backgroundColor: '#8bc34a' }}></div>
          </div>

          {/* Main content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Logo/Icon */}
            {/* <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-3 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}></div>
                <div className="relative backdrop-blur-sm rounded-full p-6 border-2 shadow-2xl"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#72b01d'
                  }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: '#72b01d' }}>
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" />
                    <path d="M19 15L19.54 17.26L22 18L19.54 18.74L19 21L18.46 18.74L16 18L18.46 17.26L19 15Z" fill="currentColor" />
                    <path d="M5 7L5.54 9.26L8 10L5.54 10.74L5 13L4.46 10.74L2 10L4.46 9.26L5 7Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div> */}

            {/* Main heading */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-3 md:mb-4 leading-none tracking-tight px-2"
                style={{ color: '#0d0a0b' }}>
                <span>Sri Lankan </span>
                <span className="relative">
                  <span style={{
                    background: `linear-gradient(to right, #72b01d, #3f7d20)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Homemade
                  </span>
                </span>
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-none tracking-tighter px-2"
                style={{ color: '#0d0a0b' }}>
                Marketplace
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mx-auto mb-3 md:mb-4 leading-relaxed font-light px-4 max-w-4xl"
              style={{ color: '#454955' }}>
              Discover Quality & Unique Products From Sri Lankan <span className="font-semibold" style={{ color: '#72b01d' }}>Small Businesses</span>
            </p>
            <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-4 md:mb-6 font-medium px-4"
              style={{ color: '#3f7d20' }}>
              🌱 Shop local • Support dreams • Build community 🌱
            </p>

            {/* Compact Free Badge with Animation */}
            <div className="flex justify-center mb-8 md:mb-12">
              <div className={`inline-flex items-center gap-2 rounded-full border-2 shadow-lg ${isMobile ? 'px-4 py-2' : 'px-6 py-2'}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#72b01d',
                  boxShadow: '0 4px 12px rgba(114, 176, 29, 0.2)',
                  animation: 'glow-pulse 2s ease-in-out infinite alternate, bounce-badge 3s ease-in-out infinite'
                }}>
                <span className={`font-bold uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{ color: '#3f7d20' }}>
                  {isMobile ? '100% Free • No Fees' : '100% Free • No Hidden Fees • No Commission'}
                </span>
                <span className="text-base animate-bounce">✨</span>
              </div>
            </div>
            
            {/* Add custom animation styles */}
            <style>
              {`
                @keyframes glow-pulse {
                  from {
                    box-shadow: 0 4px 12px rgba(114, 176, 29, 0.2);
                  }
                  to {
                    box-shadow: 0 4px 20px rgba(114, 176, 29, 0.4), 0 0 15px rgba(114, 176, 29, 0.3);
                  }
                }
                
                @keyframes bounce-badge {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(-8px);
                  }
                }
              `}
            </style>

            {/* Search bar */}
            <div className="mb-8 md:mb-12 px-4">
              <ProductHeroSearch />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center px-4">
              <Link
                to="/search"
                className="group relative px-8 lg:px-10 py-4 lg:py-5 text-white rounded-full font-bold text-lg lg:text-xl shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden w-full sm:w-auto sm:min-w-[220px]"
                style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #3f7d20, #72b01d)` }}></div>
                <span className="relative flex items-center justify-center gap-3">
                  🌿 Explore Products
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform lg:w-6 lg:h-6">
                    <path d="M13 7L18 12L13 17M6 12H18" />
                  </svg>
                </span>
              </Link>

              <Link
                to="/create-shop"
                className="group px-8 lg:px-10 py-4 lg:py-5 backdrop-blur-sm rounded-full font-bold text-lg lg:text-xl border transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 w-full sm:w-auto sm:min-w-[220px]"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#3f7d20',
                  borderColor: '#3f7d20'
                }}
              >
                <span className="flex items-center justify-center gap-3">
                  🚀 Start Selling
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:rotate-12 transition-transform lg:w-6 lg:h-6">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
            style={{ color: '#72b01d' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5V19M5 12L12 19L19 12" />
            </svg>
          </div>
        </section>

        {/* Why We Give 100% Free Platform Section */}
        <section className={`w-full border-t border-b relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}
          style={{
            borderColor: 'rgba(114, 176, 29, 0.15)',
            backgroundColor: '#ffffff'
          }}>
          
          {/* Background decorative blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob1 absolute top-20 left-10 w-44 h-44 opacity-18"
              style={{ backgroundColor: '#72b01d', animationDelay: '1s' }}></div>
            <div className="blob blob3 absolute bottom-20 right-20 w-52 h-52 opacity-14"
              style={{ backgroundColor: '#3f7d20', animationDelay: '3s' }}></div>
          </div>

          <div className={`relative z-10 max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            {/* Header */}
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}>
              <div className="inline-flex items-center gap-3 mb-6">
                <div className={`rounded-full flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                  style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}>
                  <span className={`${isMobile ? 'text-base' : 'text-xl'}`}>💡</span>
                </div>
                <span className={`font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  OUR MISSION
                </span>
              </div>
              <h2 className={`font-black mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}
                style={{ color: '#0d0a0b' }}>
                Why We Give
                <span className="relative ml-2">
                  <span style={{
                    background: `linear-gradient(to right, #72b01d, #3f7d20)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    100% Free Platform
                  </span>
                </span>
              </h2>
              <p className={`max-w-3xl mx-auto ${isMobile ? 'text-base mb-6' : 'text-lg mb-8'}`} style={{ color: '#454955' }}>
                Our commitment to empowering Sri Lankan entrepreneurs and supporting local communities
              </p>
            </div>

            {/* Reasons grid */}
            <div className={`gap-6 mt-8 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-2 lg:grid-cols-3'}`}>
              {/* Empower Small Businesses */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="relative mb-4">
                  <div className={`rounded-2xl flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{
                      background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                      boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                    }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🚀</span>
                  </div>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Empower Small Businesses
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  We believe every Sri Lankan entrepreneur deserves a chance to succeed without financial barriers blocking their path to success.
                </p>
              </div>

              {/* Support Local Economy */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🇱🇰</span>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Support Local Economy
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  By removing fees, more money stays in sellers' pockets and circulates within our local Sri Lankan economy.
                </p>
              </div>

              {/* Build Community */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🤝</span>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Build Strong Community
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  When there are no fees, buyers get better prices and sellers earn more - creating a win-win for everyone.
                </p>
              </div>

              {/* Preserve Culture */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🎨</span>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Preserve Our Heritage
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  Traditional crafts and homemade products carry our culture forward - they deserve a platform without barriers.
                </p>
              </div>

              {/* Fair Access */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>⚖️</span>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Equal Opportunities
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  Whether you're a student, housewife, or retiree - everyone gets the same opportunity to start their business.
                </p>
              </div>

              {/* Transparency */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-5' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>💎</span>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Complete Transparency
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                  No hidden costs, no surprise fees, no fine print - what you see is what you get, forever.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className={`text-center ${isMobile ? 'mt-10' : 'mt-16'}`}>
              <p className={`max-w-3xl mx-auto mb-6 font-medium ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#454955' }}>
                Join our mission to create a fair, transparent, and thriving marketplace for all Sri Lankans
              </p>
              <Link
                to="/create-shop"
                className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'}`}
                style={{
                  background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                  color: '#ffffff'
                }}
              >
                <span>🌟 Be Part of Our Mission</span>
                <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Payment Methods & Trust Section */}
        <section className={`w-full border-t border-b ${isMobile ? 'py-8' : 'py-10'}`}
          style={{
            borderColor: 'rgba(114, 176, 29, 0.15)',
            backgroundColor: '#ffffff'
          }}>
          <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            <div className="text-center mb-6">
              <h2 className={`font-bold mb-2 ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`} style={{ color: '#0d0a0b' }}>
                Shop With Confidence
              </h2>
              <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                Flexible payment options and trusted seller protection
              </p>
            </div>

            <div className={`grid gap-6 mt-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Cash on Delivery */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-4' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="relative mb-4">
                  <div className={`rounded-2xl flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{
                      background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                      boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                    }}>
                    <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Cash on Delivery
                </h3>
                <p className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                  Pay when you receive your order. No upfront payment required
                </p>
                <span className={`font-medium py-1 px-3 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  Zero risk
                </span>
              </div>

              {/* Bank Transfer */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-4' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8h18l-2 8H5L3 8z"/>
                    <path d="M3 8L1 4h4l2 4"/>
                    <circle cx="9" cy="20" r="1"/>
                    <circle cx="20" cy="20" r="1"/>
                  </svg>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Bank Transfer
                </h3>
                <p className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                  Direct bank transfer with payment slip verification for secure transactions
                </p>
                <span className={`font-medium py-1 px-3 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  Secure & verified
                </span>
              </div>

              {/* Verified Sellers */}
              <div className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md ${isMobile ? 'p-4' : 'p-6'}`}
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className={`rounded-2xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.27 0 4.33.84 5.91 2.24" />
                  </svg>
                </div>
                <h3 className={`font-bold mb-2 ${isMobile ? 'text-base' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                  Verified Sellers
                </h3>
                <p className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                  All sellers go through our verification process to ensure authentic Sri Lankan products
                </p>
                <span className={`font-medium py-1 px-3 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  Quality guaranteed
                </span>
              </div>
            </div>
          </div>
        </section>



        {/* Featured Products */}
        <section className={`w-full relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}>
          {/* Featured Products Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob1 absolute top-20 left-10 w-44 h-44 opacity-18"
              style={{ backgroundColor: '#72b01d', animationDelay: '1s' }}></div>
            <div className="blob blob3 absolute bottom-20 right-20 w-52 h-52 opacity-14"
              style={{ backgroundColor: '#3f7d20', animationDelay: '3s' }}></div>
          </div>

          <div className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            {/* Header with enhanced styling */}
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}>
              <div className="inline-flex items-center gap-3 mb-6">
                <div className={`rounded-full flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
                  style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}>
                  <span className={`${isMobile ? 'text-base' : 'text-xl'}`}>✨</span>
                </div>
                <span className={`font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  FRESH ARRIVALS
                </span>
              </div>
              <h2 className={`font-black mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}
                style={{ color: '#0d0a0b' }}>
                Latest Listings
              </h2>
              <p className={`max-w-2xl mx-auto ${isMobile ? 'text-base mb-6' : 'text-lg mb-8'}`} style={{ color: '#454955' }}>
                Discover the newest handcrafted treasures from talented Sri Lankan artisans
              </p>
              <Link
                to="/search"
                className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                style={{
                  background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                  color: '#ffffff'
                }}
              >
                <span>Explore All Products</span>
                <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            {/* Products grid with enhanced styling */}
            <div className="w-full">
              {loading ? (
                <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
                  <div className="inline-flex items-center gap-3">
                    <div className={`border-2 border-t-transparent rounded-full animate-spin ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
                      style={{ borderColor: '#72b01d', borderTopColor: 'transparent' }}></div>
                    <span className={`${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#454955' }}>
                      Loading latest products…
                    </span>
                  </div>
                </div>
              ) : (
                <WithReviewStats listings={latestListings}>
                  {(listingsWithStats) => (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-7 w-full">
                      {listingsWithStats.map(item => (
                        <ResponsiveListingTile 
                          key={item.id}
                          listing={item}
                          onRefresh={refreshListings}
                        />
                      ))}
                    </div>
                  )}
                </WithReviewStats>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`w-full border-t relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}
          style={{
            borderColor: 'rgba(114, 176, 29, 0.15)',
            backgroundColor: '#ffffff'
          }}>
          {/* Features Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob1 absolute top-20 right-10 w-64 h-64 opacity-12"
              style={{ backgroundColor: '#72b01d', animationDelay: '1s' }}></div>
            <div className="blob blob3 absolute bottom-20 left-20 w-72 h-72 opacity-15"
              style={{ backgroundColor: '#3f7d20', animationDelay: '3s' }}></div>
            <div className="blob blob2 absolute top-1/2 right-1/3 w-48 h-48 opacity-10"
              style={{ backgroundColor: '#8bc34a', animationDelay: '5s' }}></div>
          </div>

          <div className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            {/* Header */}
            <div className={`text-center ${isMobile ? 'mb-10' : 'mb-16'}`}>
              <div className="inline-flex items-center gap-3 mb-6">
                <div className={`rounded-full flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}
                  style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}>
                  <span className={`${isMobile ? 'text-lg' : 'text-2xl'}`}>✨</span>
                </div>
                <span className={`font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  SINA.LK FEATURES
                </span>
              </div>
              <h2 className={`font-black mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}
                style={{ color: '#0d0a0b' }}>
                Everything You Need to 
                <span className="relative ml-2">
                  <span style={{
                    background: `linear-gradient(to right, #72b01d, #3f7d20)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Succeed
                  </span>
                </span>
              </h2>
              <p className={`max-w-3xl mx-auto ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`}
                style={{ color: '#454955' }}>
                Discover powerful features designed for both buyers and sellers in Sri Lanka's premier marketplace
              </p>
            </div>

            {/* Features Tabs */}
            <div className={`flex justify-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <div className={`inline-flex rounded-xl border-2 ${isMobile ? 'p-1' : 'p-2'}`}
                style={{
                  backgroundColor: 'rgba(114, 176, 29, 0.05)',
                  borderColor: 'rgba(114, 176, 29, 0.2)'
                }}>
                <button
                  className={`font-semibold rounded-lg transition-all duration-300 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                  style={{
                    backgroundColor: activeFeatureTab === 'buyers' ? '#72b01d' : 'transparent',
                    color: activeFeatureTab === 'buyers' ? '#ffffff' : '#72b01d'
                  }}
                  onClick={() => setActiveFeatureTab('buyers')}
                >
                  🛍️ For Buyers
                </button>
                <button
                  className={`font-semibold rounded-lg transition-all duration-300 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                  style={{
                    backgroundColor: activeFeatureTab === 'sellers' ? '#72b01d' : 'transparent',
                    color: activeFeatureTab === 'sellers' ? '#ffffff' : '#72b01d'
                  }}
                  onClick={() => setActiveFeatureTab('sellers')}
                >
                  🚀 For Sellers
                </button>
              </div>
            </div>

            {/* Buyers Features */}
            {activeFeatureTab === 'buyers' && (
              <div className={`gap-6 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-2 lg:grid-cols-3'}`}>
                {/* Cash on Delivery */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>💳</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Cash on Delivery (COD)
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Buy items risk-free and pay upon delivery. No upfront payment required for maximum security.
                  </p>
                </div>

                {/* Bank Transfer */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #3f7d20, #72b01d)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🏦</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Bank Transfer
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Upload your payment slip and track order status directly from your account with real-time updates.
                  </p>
                </div>

                {/* Order Management */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>📋</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Easy Order Management
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Say goodbye to WhatsApp orders. Manage and track all your purchases with comprehensive order details.
                  </p>
                </div>

                {/* Wishlist */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #e91e63, #ad1457)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>❤️</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Wishlist System
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Add items to your wishlist for future purchases and never lose track of products you love.
                  </p>
                </div>

                {/* Direct Chat */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #2196f3, #1565c0)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>💬</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Direct Chat with Sellers
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Chat with sellers directly on the platform. No need for external messaging apps.
                  </p>
                </div>

                {/* Custom Orders */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🎨</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Custom Orders
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Request custom orders from sellers to meet your specific needs and preferences.
                  </p>
                </div>

                {/* Reviews & Ratings */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #ffc107, #ff8f00)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>⭐</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Reviews & Ratings
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Browse ratings and reviews for shops and products. Compare sellers to find the best deals.
                  </p>
                </div>

                {/* Email Notifications */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>📧</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Email Notifications
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Receive emails when order statuses change and for other valuable events. Stay updated always.
                  </p>
                </div>

                {/* Verified Buyer */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>✅</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Verified Buyer Status
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Become a verified buyer to build trust with sellers and enjoy a smoother buying experience.
                  </p>
                </div>
              </div>
            )}

            {/* Sellers Features */}
            {activeFeatureTab === 'sellers' && (
              <div className={`gap-6 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-2 lg:grid-cols-3'}`}>
                {/* Free Listings */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🆓</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Free Shop Creation
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Create and manage unlimited shops and product listings—all for free, with no hidden charges.
                  </p>
                </div>

                {/* Real-time Management */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #2196f3, #1565c0)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>⚡</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Real-time Management
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Edit product details and manage stock in real-time from your dashboard. Add product variations easily.
                  </p>
                </div>

                {/* Payment Methods */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #4caf50, #388e3c)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>💰</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Multiple Payment Options
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Offer both COD and bank transfer payment methods. Insert bank details once for automatic instructions.
                  </p>
                </div>

                {/* Unlimited Product Variations */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
                    <FiLayers className={`${isMobile ? 'text-xl' : 'text-2xl'} text-white`} />
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Unlimited Product Variations
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Create unlimited variations for your products - different colors, sizes, materials, and styles in one listing.
                  </p>
                </div>

                {/* Professional Shop */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🏪</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Professional Shop Profile
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Add logo and cover image to create a professional shop profile. Receive verified seller badges.
                  </p>
                </div>

                {/* Analytics */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #e91e63, #ad1457)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>📊</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Detailed Analytics
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Access detailed earnings reports filtered by any date range. View and manage orders with powerful tools.
                  </p>
                </div>

                {/* Customer Communication */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #00bcd4, #0097a7)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>💬</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Customer Communication
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Exchange real-time messages with buyers. Send custom order links even to unregistered users.
                  </p>
                </div>

                {/* Custom Order Management */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🎨</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Custom Order Management
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Send and receive custom order links—even to buyers not yet registered on sina.lk. Handle special requests easily.
                  </p>
                </div>

                {/* Email Notifications for Sellers */}
                <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${isMobile ? 'p-5' : 'p-6'}`}
                  style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                  <div className={`rounded-xl flex items-center justify-center mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                    style={{ background: 'linear-gradient(135deg, #607d8b, #455a64)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>📬</span>
                  </div>
                  <h3 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`} style={{ color: '#0d0a0b' }}>
                    Smart Notifications
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`} style={{ color: '#454955' }}>
                    Receive email notifications for buyer actions. You will never miss buyers or important updates.
                  </p>
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className={`text-center ${isMobile ? 'mt-10' : 'mt-16'}`}>
              <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`} style={{ color: '#454955' }}>
                  Ready to experience all these amazing features?
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/search"
                  className={`group inline-flex items-center gap-3 rounded-full font-semibold border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isMobile ? 'px-5 py-3 text-sm' : 'px-6 py-3'}`}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#3f7d20',
                    borderColor: '#3f7d20'
                  }}
                >
                  <span>🛍️ Start Shopping</span>
                </Link>
                <Link
                  to="/create-shop"
                  className={`group inline-flex items-center gap-3 rounded-full font-semibold shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ${isMobile ? 'px-5 py-3 text-sm' : 'px-6 py-3'}`}
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)`, color: '#ffffff' }}
                >
                  <span>🚀 Start Selling</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20 w-full relative overflow-hidden">
          {/* Background decoration - keeping subtle decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-24 h-24 rounded-full blur-2xl opacity-10"
              style={{ backgroundColor: '#72b01d' }}></div>
            <div className="absolute bottom-10 right-1/4 w-32 h-32 rounded-full blur-3xl opacity-8"
              style={{ backgroundColor: '#3f7d20' }}></div>
          </div>

          <div className="relative z-10 w-full">
            {/* Header */}
            <div className="text-center mb-12 px-4">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}>
                  <span className="text-xl">🏷️</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  DISCOVER
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4"
                style={{ color: '#0d0a0b' }}>
                Browse Categories
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#454955' }}>
                Explore authentic Sri Lankan crafts across diverse categories
              </p>
            </div>

            {/* Horizontal Scrolling Categories */}
            <div className="relative py-4 md:py-6">
              {/* Gradient fade edges */}
              <div className="absolute left-0 top-6 w-20 h-full z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, #ffffff, transparent)`
                }}></div>
              <div className="absolute right-0 top-6 w-20 h-full z-10 pointer-events-none"
                style={{
                  background: `linear-gradient(to left, #ffffff, transparent)`
                }}></div>

              {/* Scrollable container */}
              <div className="flex gap-4 px-6 overflow-x-auto pt-4 pb-8"
                style={{
                  scrollBehavior: 'smooth',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  minHeight: '120px', // Add enough height for hover effects
                  overflowY: 'visible' // Allow hover effects to display properly
                }}>
                {/* Duplicate categories for infinite scroll effect */}
                {[...categories, ...categories].map((cat, index) => (
                  <Link
                    to={`/search?cat=${encodeURIComponent(cat.name)}`}
                    key={`${cat.name}-${index}`}
                    className="group flex-shrink-0 relative"
                  >
                    <div className="px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl border-2 text-center font-semibold transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 min-w-max backdrop-blur-sm overflow-hidden relative"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#454955',
                        borderColor: 'rgba(114, 176, 29, 0.2)',
                        minWidth: '130px',
                        fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(135deg, #72b01d, #3f7d20)`;
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = '#72b01d';
                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(114, 176, 29, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.background = 'rgba(243, 239, 245, 0.9)';
                        e.currentTarget.style.color = '#454955';
                        e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      {/* Background gradient overlay for hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                        style={{
                          background: `radial-gradient(circle at center, #ffffff, transparent)`
                        }}></div>

                      {/* Icon */}
                      <div className="text-3xl mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                        {categoryIcons[cat.name] || "📦"}
                      </div>

                      {/* Category name */}
                      <div className="relative z-10">
                        <span className="block text-sm font-bold leading-tight">
                          {cat.name}
                        </span>

                        {/* Subtitle count */}
                        <span className="block text-xs mt-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                          {cat.subcategories.length} items
                        </span>
                      </div>

                      {/* Animated dot indicator */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ backgroundColor: '#ffffff' }}></div>

                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                        style={{
                          background: `linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)`
                        }}></div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Scroll indicators */}
              <div className="flex justify-center mt-8 gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'rgba(114, 176, 29, 0.4)' }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.6)',
                    animationDelay: '0.2s'
                  }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.8)',
                    animationDelay: '0.4s'
                  }}></div>
              </div>
            </div>

            {/* View All Categories CTA */}
            <div className="text-center mt-12">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, rgba(114, 176, 29, 0.1), rgba(63, 125, 32, 0.1))`,
                  color: '#3f7d20',
                  border: '2px solid rgba(114, 176, 29, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, #72b01d, #3f7d20)`;
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#72b01d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, rgba(114, 176, 29, 0.1), rgba(63, 125, 32, 0.1))`;
                  e.currentTarget.style.color = '#3f7d20';
                  e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                }}
              >
                <span>View All Categories</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Seller Benefits Section */}
        <section className={`w-full border-t relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}
          style={{
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          {/* Seller Benefits Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob2 absolute top-10 left-10 w-60 h-60 opacity-16"
              style={{ backgroundColor: '#72b01d', animationDelay: '0s' }}></div>
            <div className="blob blob4 absolute bottom-10 right-10 w-64 h-64 opacity-13"
              style={{ backgroundColor: '#66bb6a', animationDelay: '5s' }}></div>
          </div>

          <div className={`relative z-10 max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            {/* Header */}
            <div className={`text-center ${isMobile ? 'mb-10' : 'mb-16'}`}>
              <div className="inline-flex items-center gap-3 mb-6">
                <div className={`rounded-full flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}>
                  <span className={`${isMobile ? 'text-lg' : 'text-2xl'}`}>🚀</span>
                </div>
                <span className={`font-bold uppercase tracking-wider px-4 py-2 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  FOR SELLERS
                </span>
              </div>
              <h2 className={`font-black mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}
                style={{ color: '#0d0a0b' }}>
                Simple • Unlimited •
                <span className="relative ml-2">
                  <span style={{
                    background: `linear-gradient(to right, #72b01d, #3f7d20)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Free
                  </span>
                </span>
              </h2>
              <p className={`max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`}
                style={{ color: '#454955' }}>
                Everything you need to start selling online, with zero barriers
              </p>
            </div>

            {/* Benefits Grid */}
            <div className={`gap-8 lg:gap-12 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-3'}`}>
              {/* Zero Cost */}
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}></div>
                <div className={`relative backdrop-blur-sm border rounded-3xl shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3 ${isMobile ? 'p-6' : 'p-8'}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className={`mx-auto rounded-full flex items-center justify-center border-4 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          borderColor: '#72b01d'
                        }}>
                        <span className={`font-black ${isMobile ? 'text-2xl' : 'text-4xl'}`} style={{ color: '#72b01d' }}>0</span>
                      </div>
                      <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                        style={{ backgroundColor: '#72b01d' }}>
                        <span className={`text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>₹</span>
                      </div>
                    </div>
                    <h3 className={`font-bold mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}
                      style={{ color: '#0d0a0b' }}>
                      Zero Listing Fees
                    </h3>
                    <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                      List all your products for free. No hidden charges, no monthly fees.
                      Just pure profit from day one.
                    </p>
                  </div>
                </div>
              </div>

              {/* Unlimited Shops */}
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #3f7d20, #72b01d)` }}></div>
                <div className={`relative backdrop-blur-sm border rounded-3xl shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3 ${isMobile ? 'p-6' : 'p-8'}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(63, 125, 32, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className={`mx-auto rounded-full flex items-center justify-center border-4 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          backgroundColor: 'rgba(63, 125, 32, 0.1)',
                          borderColor: '#3f7d20'
                        }}>
                        <svg className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} fill="none" stroke="#3f7d20" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                        </svg>
                      </div>
                      <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                        style={{ backgroundColor: '#3f7d20' }}>
                        <span className={`text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>∞</span>
                      </div>
                    </div>
                    <h3 className={`font-bold mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}
                      style={{ color: '#0d0a0b' }}>
                      Unlimited Shops
                    </h3>
                    <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                      Create multiple shops for different product categories.
                      Build your empire, one shop at a time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Unlimited Listings */}
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}></div>
                <div className={`relative backdrop-blur-sm border rounded-3xl shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3 ${isMobile ? 'p-6' : 'p-8'}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className={`mx-auto rounded-full flex items-center justify-center border-4 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          borderColor: '#72b01d'
                        }}>
                        <svg className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} fill="none" stroke="#72b01d" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                        style={{ backgroundColor: '#72b01d' }}>
                        <span className={`text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>+</span>
                      </div>
                    </div>
                    <h3 className={`font-bold mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}
                      style={{ color: '#0d0a0b' }}>
                      Unlimited Products
                    </h3>
                    <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                      Showcase your entire inventory without restrictions.
                      The sky's the limit for your creativity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className={`text-center ${isMobile ? 'mt-10' : 'mt-16'}`}>
              <Link
                to="/create-shop"
                className={`group inline-flex items-center gap-3 rounded-full font-bold shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden ${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'}`}
                style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)`, color: '#ffffff' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #3f7d20, #72b01d)` }}></div>
                <span className="relative flex items-center gap-3">
                  🌟 Start Your Shop Today
                  <svg className={`group-hover:translate-x-1 transition-transform ${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M13 7L18 12L13 17M6 12H18" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={`w-full border-t relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}
          style={{
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          {/* Testimonials Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="blob blob2 absolute top-16 left-8 w-48 h-48 opacity-15"
              style={{ backgroundColor: '#72b01d', animationDelay: '2s' }}></div>
            <div className="blob blob4 absolute bottom-20 right-12 w-56 h-56 opacity-12"
              style={{ backgroundColor: '#8bc34a', animationDelay: '4s' }}></div>
            <div className="blob blob3 absolute top-32 right-1/3 w-40 h-40 opacity-10"
              style={{ backgroundColor: '#4caf50', animationDelay: '6s' }}></div>
          </div>
          
          <div className={`relative z-10 max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            <h2 className={`font-bold text-center mb-4 uppercase tracking-wide ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}
              style={{ color: '#0d0a0b' }}>
              What Our Community Says
            </h2>
            <p className={`text-center mb-16 ${isMobile ? 'text-base' : 'text-lg'}`}
              style={{ color: '#454955' }}>
              Real stories from Sri Lankan creators and happy customers
            </p>
            <div className={`gap-8 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-3'}`}>
              {/* Testimonial 1 */}
              <div className={`border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative ${isMobile ? 'p-6' : 'p-8'}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(114, 176, 29, 0.3)'
                }}>
                <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <div className={`rounded-full flex items-center justify-center mr-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>👩‍🎨</span>
                  </div>
                  <div>
                    <h4 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>
                      Priya Jayasinghe
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#3f7d20' }}>
                      Handmade Jewelry Seller
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                  "This platform changed my life! I started selling my traditional Sri Lankan jewelry from home and now I have customers from all over the island. The zero listing fee means I can focus on creating beautiful pieces."
                </p>
                <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                  style={{ backgroundColor: '#72b01d' }}>
                  <span className={`text-white ${isMobile ? 'text-base' : 'text-xl'}`}>"</span>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className={`border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative ${isMobile ? 'p-6' : 'p-8'}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(63, 125, 32, 0.3)'
                }}>
                <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <div className={`rounded-full flex items-center justify-center mr-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{ backgroundColor: 'rgba(63, 125, 32, 0.1)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🛍️</span>
                  </div>
                  <div>
                    <h4 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>
                      Saman Perera
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#3f7d20' }}>
                      Happy Customer
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                  "I love supporting local Sri Lankan businesses through this platform. The quality of handmade items is amazing and the 14-day guarantee gives me confidence in every purchase. Highly recommended!"
                </p>
                <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                  style={{ backgroundColor: '#3f7d20' }}>
                  <span className={`text-white ${isMobile ? 'text-base' : 'text-xl'}`}>"</span>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className={`border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative ${isMobile ? 'p-6' : 'p-8'}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(69, 73, 85, 0.3)'
                }}>
                <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <div className={`rounded-full flex items-center justify-center mr-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
                    style={{ backgroundColor: 'rgba(69, 73, 85, 0.1)' }}>
                    <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>🍛</span>
                  </div>
                  <div>
                    <h4 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#0d0a0b' }}>
                      Kamala Silva
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: '#3f7d20' }}>
                      Traditional Food Seller
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                  "As a home-based food business owner, this marketplace gave me the perfect platform to reach more customers. The unlimited listings feature helps me showcase all my traditional Sri Lankan delicacies!"
                </p>
                <div className={`absolute -top-2 -right-2 rounded-full flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
                  style={{ backgroundColor: '#454955' }}>
                  <span className={`text-white ${isMobile ? 'text-base' : 'text-xl'}`}>"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className={`w-full border-t relative overflow-hidden ${isMobile ? 'py-12' : 'py-20'}`}
          style={{
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          {/* Background decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-1/4 w-24 h-24 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: 'rgba(114, 176, 29, 0.3)' }}></div>
            <div className="absolute bottom-20 right-1/4 w-32 h-32 rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: 'rgba(63, 125, 32, 0.3)' }}></div>
          </div>

          <div className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            {/* Header */}
            <div className={`text-center ${isMobile ? 'mb-12' : 'mb-20'}`}>
              <div className={`inline-flex items-center gap-3 ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <div className={`rounded-full flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>⚡</span>
                </div>
                <span className={`font-bold uppercase tracking-wider px-4 py-2 rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{
                    backgroundColor: 'rgba(69, 73, 85, 0.1)',
                    color: '#454955'
                  }}>
                  SIMPLE PROCESS
                </span>
              </div>
              <h2 className={`font-black mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}
                style={{ color: '#0d0a0b' }}>
                How It
                <span className="relative ml-2">
                  <span style={{
                    background: `linear-gradient(to right, #72b01d, #3f7d20)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Works
                  </span>
                </span>
              </h2>
              <p className={`max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`}
                style={{ color: '#454955' }}>
                Get started in just three simple steps and join our thriving community
              </p>
            </div>

            {/* Steps with connecting lines */}
            <div className="relative">
              {/* Connecting line for desktop */}
              <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 ${isMobile ? 'hidden' : 'hidden md:block'}`}
                style={{
                  background: `linear-gradient(to right, transparent 0%, rgba(114, 176, 29, 0.3) 20%, rgba(114, 176, 29, 0.3) 80%, transparent 100%)`
                }}></div>

              <div className={`relative z-10 gap-8 lg:gap-16 ${isMobile ? 'grid grid-cols-1' : 'grid md:grid-cols-3'}`}>
                {/* Step 1 */}
                <div className="group relative">
                  <div className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700"
                    style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}></div>

                  <div className={`relative backdrop-blur-sm border rounded-3xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4 ${isMobile ? 'p-6' : 'p-8'}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className={`relative flex justify-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
                      <div className={`rounded-full flex items-center justify-center border-4 relative z-10 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className={`font-black text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>1</span>
                      </div>
                      {/* Connecting dot for mobile */}
                      <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full ${isMobile ? '' : 'md:hidden'}`}
                        style={{ backgroundColor: '#72b01d' }}></div>
                    </div>

                    <div className="text-center">
                      <h3 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}
                        style={{ color: '#0d0a0b' }}>
                        Create Your Account
                      </h3>
                      <p className={`leading-relaxed mb-4 ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                        Quick and easy signup with email or Google. Join thousands of Sri Lankan creators and shoppers.
                      </p>
                      <div className={`inline-flex items-center gap-2 font-medium px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          color: '#3f7d20'
                        }}>
                        <span>⏱️ 2 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="group relative">
                  <div className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700"
                    style={{ background: `linear-gradient(135deg, #3f7d20, #72b01d)` }}></div>

                  <div className={`relative backdrop-blur-sm border rounded-3xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4 ${isMobile ? 'p-6' : 'p-8'}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(63, 125, 32, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className={`relative flex justify-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
                      <div className={`rounded-full flex items-center justify-center border-4 relative z-10 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          background: `linear-gradient(135deg, #3f7d20, #72b01d)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className={`font-black text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>2</span>
                      </div>
                      {/* Connecting dot for mobile */}
                      <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full ${isMobile ? '' : 'md:hidden'}`}
                        style={{ backgroundColor: '#3f7d20' }}></div>
                    </div>

                    <div className="text-center">
                      <h3 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}
                        style={{ color: '#0d0a0b' }}>
                        Browse & Discover
                      </h3>
                      <p className={`leading-relaxed mb-4 ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                        Explore amazing handmade products by category, search, or browse featured shops from across Sri Lanka.
                      </p>
                      <div className={`inline-flex items-center gap-2 font-medium px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}
                        style={{
                          backgroundColor: 'rgba(63, 125, 32, 0.1)',
                          color: '#3f7d20'
                        }}>
                        <span>🔍 Discover treasures</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="group relative">
                  <div className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700"
                    style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}></div>

                  <div className={`relative backdrop-blur-sm border rounded-3xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4 ${isMobile ? 'p-6' : 'p-8'}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className={`relative flex justify-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
                      <div className={`rounded-full flex items-center justify-center border-4 relative z-10 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
                        style={{
                          background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className={`font-black text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>3</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className={`font-bold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}
                        style={{ color: '#0d0a0b' }}>
                        Support Local Creators
                      </h3>
                      <p className={`leading-relaxed mb-4 ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ color: '#454955' }}>
                        Purchase unique items directly from talented Sri Lankan artisans. Secure checkout with money-back guarantee.
                      </p>
                      <div className={`inline-flex items-center gap-2 font-medium px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          color: '#3f7d20'
                        }}>
                        <span>❤️ Make a difference</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className={`text-center ${isMobile ? 'mt-12' : 'mt-16'}`}>
              <p className={`mb-6 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ color: '#454955' }}>
                Ready to join our community?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/search"
                  className={`group inline-flex items-center gap-3 rounded-full font-semibold border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${isMobile ? 'px-5 py-3 text-sm' : 'px-6 py-3'}`}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#3f7d20',
                    borderColor: '#3f7d20'
                  }}
                >
                  <span>🛍️ Start Shopping</span>
                </Link>
                <Link
                  to="/create-shop"
                  className={`group inline-flex items-center gap-3 rounded-full font-semibold shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ${isMobile ? 'px-5 py-3 text-sm' : 'px-6 py-3'}`}
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)`, color: '#ffffff' }}
                >
                  <span>🚀 Start Selling</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission or Call to Action */}
        <section className={`w-full border-t text-center ${isMobile ? 'py-12' : 'py-16'}`}
          style={{
            backgroundColor: '#ffffff',
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
            <h3 className={`font-bold mb-4 uppercase tracking-wide ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}
              style={{ color: '#0d0a0b' }}>
              For Sri Lanka, By Sri Lankans
            </h3>
            <p className={`font-medium max-w-2xl mx-auto mb-8 ${isMobile ? 'text-base' : 'text-lg'}`}
              style={{ color: '#454955' }}>
              Every purchase helps a small Sri Lankan business grow.
              Start shopping or open your own shop today.
            </p>
            <div className={`flex gap-6 justify-center items-center ${isMobile ? 'flex-col gap-4' : 'flex-col sm:flex-row'}`}>
              <Link
                to="/search"
                className={`border rounded-full font-bold uppercase transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 w-full sm:w-auto ${isMobile ? 'px-6 py-3 text-sm min-w-[180px]' : 'px-8 py-4 min-w-[200px]'}`}
                style={{
                  backgroundColor: '#72b01d',
                  color: '#ffffff',
                  borderColor: '#72b01d'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3f7d20';
                  e.currentTarget.style.borderColor = '#3f7d20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#72b01d';
                  e.currentTarget.style.borderColor = '#72b01d';
                }}
              >
                Start Shopping
              </Link>
              <Link
                to="/create-shop"
                className={`border rounded-full font-bold uppercase transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 w-full sm:w-auto ${isMobile ? 'px-6 py-3 text-sm min-w-[180px]' : 'px-8 py-4 min-w-[200px]'}`}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#3f7d20',
                  borderColor: '#3f7d20'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3f7d20';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#3f7d20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#3f7d20';
                  e.currentTarget.style.borderColor = '#3f7d20';
                }}
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;
