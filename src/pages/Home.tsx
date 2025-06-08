import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { categories, categoryIcons } from "../utils/categories";
import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import ListingTile from "../components/UI/ListingTile";
import { getUserIP } from "../utils/ipUtils";
import type { DeliveryType as DeliveryTypeType } from "../types/enums";

function ProductHeroSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

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
      <div className="relative backdrop-blur-md rounded-2xl shadow-2xl border overflow-hidden group-focus-within:shadow-xl transition-all duration-500"
        style={{
          backgroundColor: '#ffffff',
          borderColor: 'rgba(114, 176, 29, 0.3)'
        }}>
        <div className="flex items-center px-8 py-6">
          <FiSearch className="text-3xl mr-4 group-focus-within:opacity-80 transition-colors"
            style={{ color: '#72b01d' }} />
          <input
            className="flex-1 bg-transparent outline-none border-none text-xl px-2 py-1"
            style={{
              color: '#0d0a0b'
            }}
            type="text"
            placeholder="Search for unique Sri Lankan creations..."
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search for products"
          />
          <button
            type="submit"
            className="ml-4 px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
            style={{
              background: `linear-gradient(to right, #72b01d, #3f7d20)`,
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Popular searches */}
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        {["Woodcraft", "Jewelry", "Textiles", "Pottery", "Tea"].map(term => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQ(term);
              handleSearch({ preventDefault: () => {} });
            }}
            className="px-4 py-2 border rounded-full text-sm font-medium transition-all duration-300 hover:shadow-md hover:scale-105"
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
      <Header />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#ffffff' }}>
          {/* Background Pattern - removed for consistent background */}

          {/* Organic shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
              style={{ backgroundColor: 'rgba(114, 176, 29, 0.2)' }}></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000"
              style={{ backgroundColor: 'rgba(63, 125, 32, 0.15)' }}></div>
            <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-2000"
              style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}></div>
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
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-none tracking-tight"
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
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tighter"
                style={{ color: '#0d0a0b' }}>
                Marketplace
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl mx-auto mb-4 leading-relaxed font-light px-4 max-w-4xl"
              style={{ color: '#454955' }}>
              Discover Quality & Unique Products From Sri Lankan <span className="font-semibold" style={{ color: '#72b01d' }}>Small Businesses</span>
            </p>
            <p className="text-base sm:text-lg max-w-2xl mx-auto mb-12 font-medium px-4"
              style={{ color: '#3f7d20' }}>
              🌱 Shop local • Support dreams • Build community 🌱
            </p>

            {/* Search bar */}
            <div className="mb-12 px-4">
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

        {/* 14 Days Money Back Guarantee Section */}
        <section className="w-full py-10 border-t border-b"
          style={{
            borderColor: 'rgba(114, 176, 29, 0.15)',
            backgroundColor: '#ffffff'
          }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                Shop With Confidence
              </h2>
              <p className="text-base" style={{ color: '#454955' }}>
                We've got you covered with our buyer protection policies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Money Back Guarantee */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md"
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                      boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                    }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path d="M8 12.5l2.5 2.5L16 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: '#3f7d20',
                      color: '#ffffff',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                    }}>
                    14
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                  Money Back Guarantee
                </h3>
                <p className="text-base mb-3" style={{ color: '#454955' }}>
                  Full refund if your order isn't delivered within 14 days of purchase
                </p>
                <span className="text-sm font-medium py-1 px-3 rounded-full"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  Hassle-free returns
                </span>
              </div>

              {/* Secure Payment */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md"
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <svg width="32" height="32" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                  Secure Payment
                </h3>
                <p className="text-base mb-3" style={{ color: '#454955' }}>
                  All transactions are encrypted and processed securely through trusted payment gateways
                </p>
                <span className="text-sm font-medium py-1 px-3 rounded-full"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  PCI DSS compliant
                </span>
              </div>

              {/* Verified Sellers */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center text-center transform transition-transform hover:scale-105 hover:shadow-md"
                style={{ borderColor: 'rgba(114, 176, 29, 0.2)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #72b01d, #3f7d20)',
                    boxShadow: '0 4px 10px rgba(63, 125, 32, 0.2)'
                  }}>
                  <svg width="32" height="32" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.27 0 4.33.84 5.91 2.24" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0d0a0b' }}>
                  Verified Sellers
                </h3>
                <p className="text-base mb-3" style={{ color: '#454955' }}>
                  All sellers go through our verification process to ensure authentic Sri Lankan products
                </p>
                <span className="text-sm font-medium py-1 px-3 rounded-full"
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
        <section className="py-20 w-full relative overflow-hidden">
          {/* Background decoration - keeping subtle decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-20 h-20 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: '#72b01d' }}></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full blur-3xl opacity-15"
              style={{ backgroundColor: '#3f7d20' }}></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            {/* Header with enhanced styling */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}>
                  <span className="text-xl">✨</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  FRESH ARRIVALS
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4"
                style={{ color: '#0d0a0b' }}>
                Latest Listings
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#454955' }}>
                Discover the newest handcrafted treasures from talented Sri Lankan artisans
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                  color: '#ffffff'
                }}
              >
                <span>Explore All Products</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            {/* Products grid with enhanced styling */}
            <div className="w-full">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#72b01d', borderTopColor: 'transparent' }}></div>
                    <span className="text-lg" style={{ color: '#454955' }}>
                      Loading latest products…
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 w-full">
                  {latestListings.map(item => (
                    <ListingTile 
                      key={item.id}
                      listing={item}
                      onRefresh={refreshListings}
                    />
                  ))}
                </div>
              )}
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4"
                style={{ color: '#0d0a0b' }}>
                Browse Categories
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#454955' }}>
                Explore authentic Sri Lankan crafts across diverse categories
              </p>
            </div>

            {/* Horizontal Scrolling Categories */}
            <div className="relative py-6">
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
                    <div className="px-6 py-5 rounded-2xl border-2 text-center font-semibold transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 min-w-max backdrop-blur-sm overflow-hidden relative"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#454955',
                        borderColor: 'rgba(114, 176, 29, 0.2)',
                        minWidth: '160px'
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
        <section className="py-20 w-full border-t relative overflow-hidden"
          style={{
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          {/* Background decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: 'rgba(114, 176, 29, 0.2)' }}></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: 'rgba(63, 125, 32, 0.2)' }}></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}>
                  <span className="text-2xl">🚀</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(114, 176, 29, 0.1)',
                    color: '#3f7d20'
                  }}>
                  FOR SELLERS
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4"
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
              <p className="text-lg md:text-xl max-w-2xl mx-auto"
                style={{ color: '#454955' }}>
                Everything you need to start selling online, with zero barriers
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Zero Cost */}
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}></div>
                <div className="relative backdrop-blur-sm border rounded-3xl p-8 shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4"
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          borderColor: '#72b01d'
                        }}>
                        <span className="text-4xl font-black" style={{ color: '#72b01d' }}>0</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#72b01d' }}>
                        <span className="text-white text-lg">₹</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3"
                      style={{ color: '#0d0a0b' }}>
                      Zero Listing Fees
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
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
                <div className="relative backdrop-blur-sm border rounded-3xl p-8 shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(63, 125, 32, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4"
                        style={{
                          backgroundColor: 'rgba(63, 125, 32, 0.1)',
                          borderColor: '#3f7d20'
                        }}>
                        <svg className="w-10 h-10" fill="none" stroke="#3f7d20" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                        </svg>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#3f7d20' }}>
                        <span className="text-white text-lg">∞</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3"
                      style={{ color: '#0d0a0b' }}>
                      Unlimited Shops
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
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
                <div className="relative backdrop-blur-sm border rounded-3xl p-8 shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(114, 176, 29, 0.3)'
                  }}>
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4"
                        style={{
                          backgroundColor: 'rgba(114, 176, 29, 0.1)',
                          borderColor: '#72b01d'
                        }}>
                        <svg className="w-10 h-10" fill="none" stroke="#72b01d" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#72b01d' }}>
                        <span className="text-white text-lg">+</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3"
                      style={{ color: '#0d0a0b' }}>
                      Unlimited Products
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
                      Showcase your entire inventory without restrictions.
                      The sky's the limit for your creativity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Link
                to="/create-shop"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden"
                style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)`, color: '#ffffff' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, #3f7d20, #72b01d)` }}></div>
                <span className="relative flex items-center gap-3">
                  🌟 Start Your Shop Today
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform">
                    <path d="M13 7L18 12L13 17M6 12H18" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 w-full border-t"
          style={{
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 uppercase tracking-wide"
              style={{ color: '#0d0a0b' }}>
              What Our Community Says
            </h2>
            <p className="text-center mb-16 text-lg"
              style={{ color: '#454955' }}>
              Real stories from Sri Lankan creators and happy customers
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="border rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(114, 176, 29, 0.3)'
                }}>
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                    <span className="text-2xl">👩‍🎨</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0d0a0b' }}>
                      Priya Jayasinghe
                    </h4>
                    <p className="text-sm" style={{ color: '#3f7d20' }}>
                      Handmade Jewelry Seller
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-2xl" style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
                  "This platform changed my life! I started selling my traditional Sri Lankan jewelry from home and now I have customers from all over the island. The zero listing fee means I can focus on creating beautiful pieces."
                </p>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#72b01d' }}>
                  <span className="text-white text-xl">"</span>
                </div>
              </div>

              {/* Testimonial 2 */}              <div className="border rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(63, 125, 32, 0.3)'
                }}>
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: 'rgba(63, 125, 32, 0.1)' }}>
                    <span className="text-2xl">🛍️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0d0a0b' }}>
                      Saman Perera
                    </h4>
                    <p className="text-sm" style={{ color: '#3f7d20' }}>
                      Happy Customer
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-2xl" style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
                  "I love supporting local Sri Lankan businesses through this platform. The quality of handmade items is amazing and the 14-day guarantee gives me confidence in every purchase. Highly recommended!"
                </p>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#3f7d20' }}>
                  <span className="text-white text-xl">"</span>
                </div>
              </div>

              {/* Testimonial 3 */}              <div className="border rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 relative"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'rgba(69, 73, 85, 0.3)'
                }}>
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: 'rgba(69, 73, 85, 0.1)' }}>
                    <span className="text-2xl">🍛</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#0d0a0b' }}>
                      Kamala Silva
                    </h4>
                    <p className="text-sm" style={{ color: '#3f7d20' }}>
                      Traditional Food Seller
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-2xl" style={{ color: '#72b01d' }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#454955' }}>
                  "As a home-based food business owner, this marketplace gave me the perfect platform to reach more customers. The unlimited listings feature helps me showcase all my traditional Sri Lankan delicacies!"
                </p>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#454955' }}>
                  <span className="text-white text-xl">"</span>
                </div>
              </div>
            </div>

            {/* Statistics Row */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="px-4">
                <div className="text-3xl md:text-4xl font-black mb-2"
                  style={{ color: '#72b01d' }}>
                  500+
                </div>
                <p className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: '#454955' }}>
                  Happy Sellers
                </p>
              </div>
              <div className="px-4">
                <div className="text-3xl md:text-4xl font-black mb-2"
                  style={{ color: '#3f7d20' }}>
                  2,000+
                </div>
                <p className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: '#454955' }}>
                  Products Listed
                </p>
              </div>
              <div className="px-4">
                <div className="text-3xl md:text-4xl font-black mb-2"
                  style={{ color: '#72b01d' }}>
                  10,000+
                </div>
                <p className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: '#454955' }}>
                  Satisfied Customers
                </p>
              </div>
              <div className="px-4">
                <div className="text-3xl md:text-4xl font-black mb-2"
                  style={{ color: '#3f7d20' }}>
                  4.9/5
                </div>
                <p className="text-sm font-medium uppercase tracking-wide"
                  style={{ color: '#454955' }}>
                  Average Rating
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 w-full border-t relative overflow-hidden"
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

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)` }}>
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(69, 73, 85, 0.1)',
                    color: '#454955'
                  }}>
                  SIMPLE PROCESS
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4"
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
              <p className="text-lg md:text-xl max-w-2xl mx-auto"
                style={{ color: '#454955' }}>
                Get started in just three simple steps and join our thriving community
              </p>
            </div>

            {/* Steps with connecting lines */}
            <div className="relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0"
                style={{
                  background: `linear-gradient(to right, transparent 0%, rgba(114, 176, 29, 0.3) 20%, rgba(114, 176, 29, 0.3) 80%, transparent 100%)`
                }}></div>

              <div className="relative z-10 grid md:grid-cols-3 gap-8 lg:gap-16">
                {/* Step 1 */}
                <div className="group relative">
                  <div className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700"
                    style={{ background: `linear-gradient(135deg, #72b01d, #3f7d20)` }}></div>

                  <div className="relative backdrop-blur-sm border rounded-3xl p-8 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className="relative mb-8 flex justify-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 relative z-10"
                        style={{
                          background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className="text-2xl font-black text-white">1</span>
                      </div>
                      {/* Connecting dot for mobile */}
                      <div className="md:hidden absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#72b01d' }}></div>
                    </div>

                    {/* Icon */}
                    {/* <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                        <svg className="w-8 h-8" fill="none" stroke="#72b01d" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div> */}

                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4"
                        style={{ color: '#0d0a0b' }}>
                        Create Your Account
                      </h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#454955' }}>
                        Quick and easy signup with email or Google. Join thousands of Sri Lankan creators and shoppers.
                      </p>
                      <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
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

                  <div className="relative backdrop-blur-sm border rounded-3xl p-8 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(63, 125, 32, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className="relative mb-8 flex justify-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 relative z-10"
                        style={{
                          background: `linear-gradient(135deg, #3f7d20, #72b01d)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className="text-2xl font-black text-white">2</span>
                      </div>
                      {/* Connecting dot for mobile */}
                      <div className="md:hidden absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#3f7d20' }}></div>
                    </div>

                    {/* Icon */}
                    {/* <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(63, 125, 32, 0.1)' }}>
                        <svg className="w-8 h-8" fill="none" stroke="#3f7d20" strokeWidth="2.5" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35" />
                        </svg>
                      </div>
                    </div> */}

                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4"
                        style={{ color: '#0d0a0b' }}>
                        Browse & Discover
                      </h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#454955' }}>
                        Explore amazing handmade products by category, search, or browse featured shops from across Sri Lanka.
                      </p>
                      <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
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

                  <div className="relative backdrop-blur-sm border rounded-3xl p-8 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-4"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: 'rgba(114, 176, 29, 0.3)'
                    }}>
                    {/* Step number circle */}
                    <div className="relative mb-8 flex justify-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 relative z-10"
                        style={{
                          background: `linear-gradient(135deg, #72b01d, #3f7d20)`,
                          borderColor: '#ffffff'
                        }}>
                        <span className="text-2xl font-black text-white">3</span>
                      </div>
                    </div>

                    {/* Icon */}
                    {/* <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)' }}>
                        <svg className="w-8 h-8" fill="none" stroke="#72b01d" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                    </div> */}

                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4"
                        style={{ color: '#0d0a0b' }}>
                        Support Local Creators
                      </h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#454955' }}>
                        Purchase unique items directly from talented Sri Lankan artisans. Secure checkout with money-back guarantee.
                      </p>
                      <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
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
            <div className="text-center mt-16">
              <p className="text-lg mb-6" style={{ color: '#454955' }}>
                Ready to join our community?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/search"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
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
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300"
                  style={{ background: `linear-gradient(to right, #72b01d, #3f7d20)`, color: '#ffffff' }}
                >
                  <span>🚀 Start Selling</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission or Call to Action */}
        <section className="w-full py-16 border-t text-center"
          style={{
            backgroundColor: '#ffffff',
            borderColor: 'rgba(69, 73, 85, 0.2)'
          }}>
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wide"
              style={{ color: '#0d0a0b' }}>
              For Sri Lanka, By Sri Lankans
            </h3>
            <p className="text-lg font-medium max-w-2xl mx-auto mb-8"
              style={{ color: '#454955' }}>
              Every purchase helps a small Sri Lankan business grow.
              Start shopping or open your own shop today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/search"
                className="border px-8 py-4 rounded-full font-bold uppercase transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 w-full sm:w-auto min-w-[200px]"
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
                className="border px-8 py-4 rounded-full font-bold uppercase transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 w-full sm:w-auto min-w-[200px]"
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
