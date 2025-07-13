import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiSearch, 
  FiPackage, 
  FiTool,
  FiZap,
  FiArrowRight,
  FiUsers,
  FiTrendingUp,
  FiCheck
} from "react-icons/fi";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import ResponsiveListingTile from "../components/UI/ResponsiveListingTile";
import WithReviewStats from "../components/HOC/WithReviewStats";
import { AdvancedSEOHead } from "../components/SEO/AdvancedSEOHead";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { getUserIP } from "../utils/ipUtils";
import { getWebsiteStructuredData, getCanonicalUrl } from "../utils/seo";
import { combineSchemas, generateWebsiteSearchSchema, generateMarketplaceSchema } from "../utils/advancedSchemaMarkup";
import { generateOptimizedKeywords, TITLE_TEMPLATES, META_DESCRIPTION_TEMPLATES } from "../utils/keywordStrategy";
import { useResponsive } from "../hooks/useResponsive";
import { useAuth } from "../context/AuthContext";
import { shuffleArrayWithSeed, generateRandomSeed } from "../utils/randomUtils";
import type { DeliveryType as DeliveryTypeType } from "../types/enums";

// Product Search Component (searches only products)
function ProductSearch() {
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FiPackage className="w-6 h-6 text-[#72b01d]" />
        <h3 className="text-lg font-bold text-[#0d0a0b]">Search Products</h3>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#72b01d] text-[#0d0a0b]"
          type="text"
          placeholder="Find physical & digital products..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#72b01d] text-white rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}

// Service Search Component (searches only services)
function ServiceSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/services?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FiTool className="w-6 h-6 text-[#72b01d]" />
        <h3 className="text-lg font-bold text-[#0d0a0b]">Search Services</h3>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#72b01d] text-[#0d0a0b]"
          type="text"
          placeholder="Find professional services..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#72b01d] text-white rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors"
        >
          Search
        </button>
      </form>
    </div>
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

type Service = {
  id: string;
  title?: string;
  description?: string;
  images?: string[];
  packages?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  category?: string;
  createdAt?: any;
};

const Home = () => {
  const { isMobile } = useResponsive();
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [latestServices, setLatestServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Fetch latest products
  const fetchLatestListings = async () => {
    try {
      const listingsQuery = query(
        collection(db, "listings"),
        orderBy("createdAt", "desc"),
        limit(8)
      );
      const querySnapshot = await getDocs(listingsQuery);
      const listings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Listing[];
      
      setLatestListings(listings);
    } catch (error) {
      console.error("Error fetching latest listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest services  
  const fetchLatestServices = async () => {
    try {
      const servicesQuery = query(
        collection(db, "services"),
        orderBy("createdAt", "desc"),
        limit(8)
      );
      const querySnapshot = await getDocs(servicesQuery);
      const services = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      
      setLatestServices(services);
    } catch (error) {
      console.error("Error fetching latest services:", error);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestListings();
    fetchLatestServices();
  }, []);

  const refreshListings = () => {
    fetchLatestListings();
  };

  return (
    <>
      <AdvancedSEOHead
        title={TITLE_TEMPLATES.home()}
        description={META_DESCRIPTION_TEMPLATES.general('Home')}
        keywords={generateOptimizedKeywords('Sri Lankan marketplace')}
        canonicalUrl={getCanonicalUrl('/')}
        ogImage="https://sina.lk/logo.svg"
        ogType="website"
        structuredData={combineSchemas(
          generateWebsiteSearchSchema(),
          generateMarketplaceSchema(),
          getWebsiteStructuredData()
        )}
        priority="high"
        changeFreq="daily"
        breadcrumbs={[
          { name: 'Home', url: 'https://sina.lk/' }
        ]}
      />
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-[#0d0a0b] mb-6">
              Sri Lankan
              <span className="text-[#72b01d] block">Entrepreneur Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sell Products & Services Online. From physical goods to digital downloads to professional services.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#72b01d] text-white px-6 py-3 rounded-full font-semibold mb-12">
              <FiCheck className="w-5 h-5" />
              100% Free • No Hidden Fees • No Commission
            </div>
            
            {/* Search Section */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <ProductSearch />
              <ServiceSearch />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Link
                to="/search"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#72b01d] text-white rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors"
              >
                <FiPackage className="w-5 h-5" />
                Browse Products
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/services"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#72b01d] text-white rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors"
              >
                <FiTool className="w-5 h-5" />
                Browse Services
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/create-shop"
                className="flex items-center justify-center gap-3 px-8 py-4 border border-[#72b01d] text-[#72b01d] rounded-lg font-semibold hover:bg-[#72b01d] hover:text-white transition-colors"
              >
                <FiZap className="w-5 h-5" />
                Start Selling
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0d0a0b] mb-4">
                Why Choose Sina.lk?
              </h2>
              <p className="text-lg text-gray-600">
                The only platform you need to sell everything online
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">100% Free</h3>
                <p className="text-gray-600">No listing fees, no commission, no hidden charges. Keep all your profits.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPackage className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Sell Everything</h3>
                <p className="text-gray-600">Physical products, digital downloads, and professional services all in one place.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Sri Lankan Focus</h3>
                <p className="text-gray-600">Built specifically for Sri Lankan entrepreneurs and buyers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Products */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#0d0a0b] mb-2">Latest Products</h2>
                <p className="text-gray-600">Discover the newest products from Sri Lankan entrepreneurs</p>
              </div>
              <Link
                to="/search"
                className="flex items-center gap-2 text-[#72b01d] font-semibold hover:text-[#3f7d20] transition-colors"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading latest products...</p>
              </div>
            ) : (
              <WithReviewStats listings={latestListings}>
                {(listingsWithStats) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        </section>

        {/* Latest Services */}
        <section className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#0d0a0b] mb-2">Latest Services</h2>
                <p className="text-gray-600">Connect with skilled professionals offering services across Sri Lanka</p>
              </div>
              <Link
                to="/services"
                className="flex items-center gap-2 text-[#72b01d] font-semibold hover:text-[#3f7d20] transition-colors"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {servicesLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-[#72b01d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading latest services...</p>
              </div>
            ) : latestServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {latestServices.map(service => (
                  <div 
                    key={service.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="mb-4">
                      {service.images && service.images.length > 0 ? (
                        <img 
                          src={service.images[0]} 
                          alt={service.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FiTool className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-[#0d0a0b] mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                      {service.description}
                    </p>
                    {service.packages && service.packages.length > 0 && (
                      <div className="mb-4">
                        <span className="text-[#72b01d] font-semibold">
                          From LKR {Math.min(...service.packages.map(pkg => pkg.price)).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <Link
                      to={`/service/${service.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#72b01d] text-white rounded-lg font-medium hover:bg-[#3f7d20] transition-colors text-sm"
                    >
                      View Service <FiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">No Services Available</h3>
                <p className="text-gray-600">Services will appear here once entrepreneurs start offering them.</p>
              </div>
            )}
          </div>
        </section>

        {/* For Entrepreneurs */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0d0a0b] mb-4">
                For Sri Lankan Entrepreneurs
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Whether you sell handmade crafts, offer professional services, or create digital products, 
                Sina.lk gives you everything you need to grow your business online.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <FiPackage className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Sell Products</h3>
                <p className="text-gray-600">Physical items, handmade goods, electronics, books, and digital downloads.</p>
              </div>
              
              <div className="text-center">
                <FiTool className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Offer Services</h3>
                <p className="text-gray-600">Professional services, consultations, freelance work, and skill-based offerings.</p>
              </div>
              
              <div className="text-center">
                <FiTrendingUp className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Grow Your Business</h3>
                <p className="text-gray-600">Built-in tools for inventory, orders, customer communication, and analytics.</p>
              </div>
            </div>
            
            <div className="text-center">
              <Link
                to="/create-shop"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#72b01d] text-white rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors text-lg"
              >
                <FiZap className="w-6 h-6" />
                Start Your Business Today
                <FiArrowRight className="w-6 h-6" />
              </Link>
              <p className="text-gray-600 mt-4">Join thousands of successful Sri Lankan entrepreneurs</p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;
