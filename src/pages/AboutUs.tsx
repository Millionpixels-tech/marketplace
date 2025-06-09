import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { useResponsive } from "../hooks/useResponsive";
import { FiHeart, FiUsers, FiAward, FiGlobe, FiTarget, FiTrendingUp } from "react-icons/fi";
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from "../utils/seo";

export default function AboutUs() {
  const { isMobile } = useResponsive();
  const values = [
    {
      icon: <FiHeart className="w-8 h-8" />,
      title: "Supporting Local Artisans",
      description: "We believe in empowering Sri Lankan craftspeople and helping them reach customers worldwide."
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Community First",
      description: "Building a strong, supportive community where buyers and sellers can connect authentically."
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: "Quality & Authenticity",
      description: "Promoting genuine, high-quality Sri Lankan products and traditional craftsmanship."
    },
    {
      icon: <FiGlobe className="w-8 h-8" />,
      title: "Global Reach",
      description: "Connecting Sri Lankan culture and products with customers around the world."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Sellers", icon: <FiUsers className="w-6 h-6" /> },
    { number: "50,000+", label: "Products Listed", icon: <FiTarget className="w-6 h-6" /> },
    { number: "25,000+", label: "Happy Customers", icon: <FiHeart className="w-6 h-6" /> },
    { number: "95%", label: "Satisfaction Rate", icon: <FiTrendingUp className="w-6 h-6" /> }
  ];

  const teamMembers = [
    {
      name: "Priya Wickramasinghe",
      role: "Founder & CEO",
      bio: "Passionate about promoting Sri Lankan culture through authentic crafts and supporting local communities.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b4c0?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Rohan Fernando",
      role: "Head of Technology",
      bio: "Building technology solutions that make it easy for artisans to showcase their work to the world.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Manjula Perera",
      role: "Community Manager",
      bio: "Connecting with our sellers and ensuring they have the support needed to succeed on our platform.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="About Us - Sri Lankan Marketplace"
        description="Learn about our mission to celebrate Sri Lankan craftsmanship and connect authentic artisans with customers worldwide. Discover our story, values, and commitment to supporting local communities."
        keywords={generateKeywords([
          'about Sri Lankan marketplace',
          'our story',
          'supporting artisans',
          'Sri Lankan culture',
          'authentic crafts',
          'local community',
          'handmade products'
        ])}
        canonicalUrl={getCanonicalUrl('/about')}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-12' : 'py-20'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
          <div className="text-center">
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'} font-bold ${isMobile ? 'mb-4' : 'mb-6'}`}>About SinaMarketplace</h1>
            <p className={`${isMobile ? 'text-base' : 'text-xl md:text-2xl'} ${isMobile ? 'mb-6' : 'mb-8'} text-green-100 ${isMobile ? 'max-w-sm' : 'max-w-3xl'} mx-auto`}>
              Celebrating Sri Lankan craftsmanship and connecting artisans with customers who appreciate authentic, handmade products.
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
                  SinaMarketplace was born from a simple yet powerful vision: to create a platform where Sri Lankan artisans and creators could showcase their incredible work to the world while preserving our rich cultural heritage.
                </p>
                <p>
                  Founded in 2024, we started as a small team passionate about supporting local communities and promoting authentic Sri Lankan craftsmanship. We noticed that many talented artisans lacked access to broader markets, while customers worldwide were seeking genuine, handmade products with real stories behind them.
                </p>
                <p>
                  Today, we're proud to be Sri Lanka's leading marketplace for authentic local products, connecting thousands of sellers with customers who value quality, authenticity, and the human touch in everything they purchase.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1539794830467-1f1755804d13?w=600&h=400&fit=crop" 
                alt="Sri Lankan artisan at work" 
                className="rounded-lg shadow-lg w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-[#72b01d] text-white p-6 rounded-lg shadow-lg">
                <div className="text-3xl font-bold">2024</div>
                <div className="text-sm">Founded</div>
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
            <h2 className="text-4xl font-bold mb-4 text-[#0d0a0b]">Growing Together</h2>
            <p className="text-xl text-gray-600">
              Our community continues to grow, and we're proud of what we've achieved together.
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

      {/* Team Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#0d0a0b]">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people behind SinaMarketplace, working every day to support our amazing community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#0d0a0b]">{member.name}</h3>
                  <div className="text-[#72b01d] font-medium mb-4">{member.role}</div>
                  <p className="text-gray-600 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 text-[#0d0a0b]">Our Mission</h2>
          <p className="text-2xl text-gray-600 leading-relaxed mb-8">
            To empower Sri Lankan artisans and creators by providing them with a platform to showcase their authentic products to a global audience, while preserving and celebrating our rich cultural heritage.
          </p>
          <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Join Our Journey</h3>
            <p className="text-lg mb-6">
              Whether you're a creator looking to share your craft or a customer seeking authentic products, you're part of our story.
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
