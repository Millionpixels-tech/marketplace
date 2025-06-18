import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiHeart, FiUsers, FiGlobe, FiAward } from 'react-icons/fi';

export default function OurStory() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Our Story - SinaMarketplace"
        description="Learn about SinaMarketplace's journey connecting Sri Lankan artisans with global audiences. Discover our mission to showcase authentic handcrafted treasures."
        keywords={generateKeywords([
          'our story',
          'Sri Lankan artisans', 
          'marketplace history',
          'cultural heritage',
          'handcrafted products',
          'authentic crafts'
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
            Connecting Sri Lankan artisans with the world, one handcrafted treasure at a time
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
              SinaMarketplace was born from a simple yet powerful vision: to showcase the incredible craftsmanship 
              and cultural richness of Sri Lanka to the world. Founded in 2023 by a team of passionate locals and 
              diaspora Sri Lankans, we recognized that many of our island's most talented artisans and small 
              businesses lacked a platform to reach global audiences.
            </p>
            
            <p>
              Walking through the bustling markets of Colombo, the ancient streets of Kandy, and the coastal towns 
              of Galle, we witnessed extraordinary talent – master craftsmen creating intricate woodcarvings, 
              talented seamstresses weaving traditional fabrics, skilled potters shaping clay into works of art, 
              and innovative entrepreneurs developing modern products with Sri Lankan soul.
            </p>
            
            <p>
              Yet many of these creators struggled to find customers beyond their local communities. We knew there 
              was a global appetite for authentic, handcrafted products with stories behind them. SinaMarketplace 
              became our answer to bridging this gap.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiGlobe className="text-[#72b01d] text-2xl" />
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Artisans</h3>
              <p className="text-gray-700">
                We provide Sri Lankan creators with the tools, platform, and support they need to showcase their 
                work to a global audience. From traditional craftspeople to modern entrepreneurs, we help them 
                build sustainable businesses and preserve cultural heritage.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Customers</h3>
              <p className="text-gray-700">
                We offer customers worldwide access to authentic Sri Lankan products – each with its own story, 
                cultural significance, and unmatched quality. Every purchase supports local communities and 
                helps preserve traditional crafts.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticity</h3>
              <p className="text-gray-600">
                Every product on our platform represents genuine Sri Lankan craftsmanship and culture.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">
                We believe in building strong relationships between creators, customers, and communities.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sustainability</h3>
              <p className="text-gray-600">
                We promote eco-friendly practices and support sustainable livelihoods for artisans.
              </p>
            </div>
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-gray-600">
                We maintain high standards to ensure every customer receives exceptional products.
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
              <div className="text-3xl font-bold text-[#72b01d] mb-2">500+</div>
              <div className="text-gray-700">Active Sellers</div>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#72b01d] mb-2">25,000+</div>
              <div className="text-gray-700">Products Listed</div>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-[#72b01d] mb-2">60+</div>
              <div className="text-gray-700">Countries Served</div>
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Looking Forward</h2>
          <div className="prose prose-lg text-gray-300 space-y-4">
            <p className="text-center">
              Our vision extends beyond being just a marketplace. We aim to become the global ambassador for 
              Sri Lankan creativity, innovation, and cultural heritage. Through technology, community building, 
              and sustainable practices, we're working to ensure that the rich traditions of our island nation 
              continue to thrive in the modern world.
            </p>
            <p className="text-center">
              Join us in celebrating Sri Lankan craftsmanship and supporting the talented creators who keep 
              our cultural heritage alive.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
    </>
  );
}
