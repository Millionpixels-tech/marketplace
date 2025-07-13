import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { useResponsive } from "../hooks/useResponsive";
import { FiHeart, FiUsers, FiAward, FiTarget } from "react-icons/fi";
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from "../utils/seo";

export default function AboutUs() {
  const { isMobile } = useResponsive();
  const values = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Supporting Small Business",
      description: "We empower small businesses and entrepreneurs by providing them with tools to reach customers online."
    },
    {
      icon: <FiHeart className="w-8 h-8" />,
      title: "Customer-Focused",
      description: "Building a platform that makes it easy for customers to find what they need and connect with sellers."
    },
    {
      icon: <FiTarget className="w-8 h-8" />,
      title: "Custom Solutions",
      description: "Enabling custom orders and personalized service through direct buyer-seller communication."
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: "Trust & Security",
      description: "Providing secure payment options and buyer protection to ensure safe transactions."
    }
  ];

  const stats = [
    { number: "Growing", label: "Active Sellers", icon: <FiUsers className="w-6 h-6" /> },
    { number: "Daily", label: "New Listings", icon: <FiTarget className="w-6 h-6" /> },
    { number: "Secure", label: "Transactions", icon: <FiAward className="w-6 h-6" /> },
    { number: "24/7", label: "Support Available", icon: <FiHeart className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="About Us - Sina.lk"
        description="Learn about Sina.lk's mission to support small businesses across Sri Lanka. Discover how our marketplace connects local sellers with buyers through custom orders, secure payments, and direct communication."
        keywords={generateKeywords([
          'about Sina.lk',
          'our story',
          'supporting small businesses',
          'Sri Lankan marketplace',
          'custom orders',
          'local sellers',
          'online marketplace',
          'small business support'
        ])}
        canonicalUrl={getCanonicalUrl('/about')}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-12' : 'py-20'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
          <div className="text-center">
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'} font-bold ${isMobile ? 'mb-4' : 'mb-6'}`}>About Sina.lk</h1>
            <p className={`${isMobile ? 'text-base' : 'text-xl md:text-2xl'} ${isMobile ? 'mb-6' : 'mb-8'} text-green-100 ${isMobile ? 'max-w-sm' : 'max-w-3xl'} mx-auto`}>
              Empowering entrepreneurs across Sri Lanka through our comprehensive online platform.
            </p>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'h-8' : 'h-16'} bg-white`} style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </div>

      {/* Our Story Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-[#0d0a0b]">Our Story</h2>
              <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                <p>
                  Sina.lk is a comprehensive platform designed to support all types of entrepreneurs across Sri Lanka. Whether you're selling physical products, offering professional services, creating digital content, or providing onsite services, we provide the tools you need to succeed online.
                </p>
                <p>
                  Our platform accommodates diverse business models including traditional product sales, service bookings, digital downloads, and custom order capabilities. With secure payment processing through bank transfers and cash on delivery, plus direct buyer-seller communication, we serve the complete entrepreneurial ecosystem.
                </p>
                <p>
                  We believe in empowering all Sri Lankan entrepreneurs by providing them with professional-grade digital tools - from the village craftsperson to the city consultant, from the digital artist to the service provider. Everyone deserves equal opportunity to build and grow their business online.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-[#72b01d] text-white p-6 rounded-lg shadow-lg inline-block">
                <div className="text-2xl font-bold">2025</div>
                <div className="text-sm">Launched</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#0d0a0b]">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do and shape how we serve our community of sellers and buyers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="text-[#72b01d] mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-[#0d0a0b]">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#0d0a0b]">Our Platform</h2>
            <p className="text-xl text-gray-600">
              Building tools and features that help businesses succeed and customers find what they need.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-[#72b01d] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-[#0d0a0b] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Commitment Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#0d0a0b]">Our Commitment</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're dedicated to providing a reliable, secure, and user-friendly marketplace for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-[#72b01d] mb-4 flex justify-center">
                <FiUsers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#0d0a0b]">Seller Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Providing tools, guidance, and support to help sellers succeed on our platform.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-[#72b01d] mb-4 flex justify-center">
                <FiHeart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#0d0a0b]">Buyer Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Ensuring safe transactions and providing support when buyers need assistance.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-[#72b01d] mb-4 flex justify-center">
                <FiAward className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#0d0a0b]">Platform Reliability</h3>
              <p className="text-gray-600 leading-relaxed">
                Maintaining a stable, secure platform that businesses and customers can depend on.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 text-[#0d0a0b]">Our Mission</h2>
          <p className="text-2xl text-gray-600 leading-relaxed mb-8">
            To provide entrepreneurs across Sri Lanka with a comprehensive platform for selling products, services, and digital content, enabling them to reach customers, process secure payments, and grow their businesses in the digital economy.
          </p>
          <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Join Our Platform</h3>
            <p className="text-lg mb-6">
              Whether you're a business owner looking to sell online or a customer seeking quality products and services, Sina.lk is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/seller-guide"
                className="bg-white text-[#72b01d] px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Start Selling
              </a>
              <a
                href="/search"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-[#72b01d] transition-colors font-medium"
              >
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
