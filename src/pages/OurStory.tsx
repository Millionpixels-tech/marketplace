import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiHeart, FiUsers, FiAward } from 'react-icons/fi';

export default function OurStory() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Our Story - Sina.lk"
        description="Learn about Sina.lk's journey to create a reliable online marketplace for small businesses across Sri Lanka. Discover how we're supporting local entrepreneurship through digital platforms."
        keywords={generateKeywords([
          'our story',
          'Sina.lk marketplace', 
          'Sri Lankan businesses',
          'online marketplace',
          'small business support',
          'digital platform'
        ])}
        canonicalUrl={getCanonicalUrl('/our-story')}
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8d17] text-white">
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-4 py-16'} text-center`}>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-6`}>Our Story</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} text-green-100`}>
            Building a digital marketplace to support small businesses across Sri Lanka
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
        
        {/* Origin Story */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiHeart className="text-[#72b01d] text-2xl" />
            <h2 className="text-3xl font-bold text-gray-900">How It All Began</h2>
          </div>
          
          <div className="prose prose-lg text-gray-700 space-y-6">
            <p>
              Sina.lk was created to address a simple challenge: helping small businesses across Sri Lanka 
              establish their online presence and reach customers through digital channels. We recognized 
              that many talented entrepreneurs and business owners needed a reliable platform to showcase 
              their products and services.
            </p>
            
            <p>
              Our marketplace provides businesses with essential tools including secure payment processing, 
              direct customer communication, custom order management, and inventory tracking. Whether you're 
              a startup, a family business, or an established enterprise looking to expand online, Sina.lk 
              offers the infrastructure you need.
            </p>
            
            <p>
              We focus on practical solutions that work for Sri Lankan businesses - supporting local payment 
              methods like bank transfers and cash on delivery, enabling sellers to set their own shipping 
              policies, and providing customer support in a way that makes sense for our market.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiUsers className="text-[#72b01d] text-2xl" />
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Sellers</h3>
              <p className="text-gray-700">
                We provide businesses with a comprehensive platform to manage their online operations. From 
                product listings and inventory management to secure payment processing and customer communication, 
                sellers have everything they need to run their business effectively.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Buyers</h3>
              <p className="text-gray-700">
                We offer customers a convenient way to discover products from various sellers across Sri Lanka. 
                With secure payment options, direct seller communication, and buyer protection measures, 
                customers can shop with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiUsers className="text-[#72b01d] text-2xl" />
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reliability</h3>
              <p className="text-gray-600">
                We maintain a stable, secure platform that businesses and customers can depend on.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Focus</h3>
              <p className="text-gray-600">
                We understand the Sri Lankan market and build features that work for local businesses.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600">
                We believe in clear communication, honest policies, and transparent business practices.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-gray-600">
                We provide ongoing support to help sellers succeed and resolve any customer issues.
              </p>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiAward className="text-[#72b01d] text-2xl" />
            <h2 className="text-3xl font-bold text-gray-900">Our Journey So Far</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#72b01d] mb-2">Growing</div>
              <div className="text-gray-700">Seller Community</div>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#72b01d] mb-2">Secure</div>
              <div className="text-gray-700">Payment Processing</div>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#72b01d] mb-2">24/7</div>
              <div className="text-gray-700">Platform Availability</div>
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Looking Forward</h2>
          <div className="prose prose-lg text-gray-300 space-y-4">
            <p className="text-center">
              Our goal is to continue improving our platform to better serve Sri Lankan businesses and 
              customers. We're constantly working on new features, enhancing security, and expanding 
              our support capabilities to help more businesses succeed online.
            </p>
            <p className="text-center">
              Join us in supporting local businesses and contributing to Sri Lanka's growing digital economy.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
    </>
  );
}
