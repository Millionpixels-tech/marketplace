import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiFileText, FiMail } from 'react-icons/fi';

export default function Press() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Press & Media - Sina.lk"
        description="Media information about Sina.lk marketplace. Contact us for information about our platform supporting Sri Lankan businesses."
        keywords={generateKeywords([
          'press',
          'media',
          'Sina.lk marketplace',
          'Sri Lankan business platform',
          'media inquiries'
        ])}
        canonicalUrl={getCanonicalUrl('/press')}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <div className="flex items-center justify-center mb-6">
            <FiFileText className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-white`} />
          </div>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4`}>Press & Media</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-green-100 mb-6`}>
            Information about Sina.lk for media professionals and journalists.
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-8'}`}>
        
        {/* Company Information */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About Sina.lk</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  Sina.lk is an online marketplace platform designed to support small businesses 
                  across Sri Lanka. We provide digital tools for sellers to manage their online 
                  presence and reach customers effectively.
                </p>
                <p>
                  Our platform features secure payment processing, custom order management, 
                  direct buyer-seller communication, and inventory tracking capabilities.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Launched:</span>
                  <span className="text-gray-900 font-medium">2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Type:</span>
                  <span className="text-gray-900 font-medium">Online Marketplace</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Market:</span>
                  <span className="text-gray-900 font-medium">Sri Lanka</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Focus:</span>
                  <span className="text-gray-900 font-medium">Small Business Support</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Methods:</span>
                  <span className="text-gray-900 font-medium">Bank Transfer, COD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Key Features:</span>
                  <span className="text-gray-900 font-medium">Custom Orders, Messaging</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* News & Updates */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">News & Updates</h2>
          
          <div className="text-center py-12">
            <FiFileText className="mx-auto text-6xl text-gray-300 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Limited Press Coverage</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              As a growing platform, we don't have extensive press coverage at this time. 
              We're focused on building our platform and supporting our seller community.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Media Inquiries Welcome</h4>
              <p className="text-gray-600 text-sm">
                Interested in learning more about our platform or interviewing our team? 
                We're happy to provide information and insights about our marketplace.
              </p>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Makes Sina.lk Different</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Custom Orders
                </h4>
                <p className="text-sm text-gray-600">
                  Buyers can request personalized products directly from sellers, enabling unique 
                  business opportunities beyond standard catalog items.
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Direct Communication
                </h4>
                <p className="text-sm text-gray-600">
                  Built-in messaging system allows buyers and sellers to communicate directly, 
                  building relationships and clarifying requirements.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Local Payment Methods
                </h4>
                <p className="text-sm text-gray-600">
                  Supports Sri Lankan banking systems and cash on delivery, making it accessible 
                  for both sellers and buyers across the country.
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Seller-Controlled Policies
                </h4>
                <p className="text-sm text-gray-600">
                  Individual sellers set their own shipping rates, return policies, and business 
                  terms, maintaining control over their operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
          <p className="text-gray-300 mb-6">
            For press inquiries, interview requests, or information about our platform, please contact us directly.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">contact@sina.lk</p>
            <p className="text-gray-400 text-sm">
              We'll respond to media inquiries as quickly as possible
            </p>
          </div>
        </section>
      </div>

      <Footer />
      </div>
    </>
  );
}
