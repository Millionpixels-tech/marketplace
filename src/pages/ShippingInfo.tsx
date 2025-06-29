import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiTruck, FiClock, FiMapPin, FiPackage } from 'react-icons/fi';

export default function ShippingInfo() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Shipping Information - Sina.lk"
        description="Learn how shipping works on Sina.lk marketplace. Each seller sets their own shipping rates, delivery times, and service areas across Sri Lanka."
        keywords={generateKeywords([
          'shipping information',
          'delivery',
          'Sri Lanka shipping',
          'seller shipping',
          'delivery times',
          'shipping costs',
          'marketplace shipping'
        ])}
        canonicalUrl={getCanonicalUrl('/shipping-info')}
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <div className="flex items-center justify-center mb-6">
            <FiTruck className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-white`} />
          </div>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4`}>Shipping Information</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-green-100 mb-6`}>
            How shipping works on our marketplace - set by individual sellers.
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* How Shipping Works */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiTruck className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">How Shipping Works on Sina.lk</h2>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Sina.lk is a marketplace where individual sellers manage their own shipping. Each seller sets their own shipping rates, delivery times, and service areas.
              </p>
              <p className="text-gray-700">
                You'll see shipping costs and delivery estimates for each product on the product page, or you can view a seller's shipping policy on their shop page.
              </p>
            </div>
          </section>

          {/* Viewing Shipping Information */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiMapPin className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">Finding Shipping Information</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">On Product Pages</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Shipping cost is shown before checkout</li>
                  <li>• Estimated delivery time is displayed</li>
                  <li>• Service areas covered by the seller</li>
                  <li>• Special shipping notes from the seller</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">On Shop Pages</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Complete shipping policy</li>
                  <li>• Available delivery methods</li>
                  <li>• Processing times</li>
                  <li>• Geographic coverage areas</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Common Shipping Practices */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiClock className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">Common Shipping Practices</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                While each seller sets their own shipping terms, here are common practices you'll find on Sina.lk:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Areas</h4>
                  <p className="text-gray-600 mb-2">Most sellers ship within Sri Lanka</p>
                  <p className="text-gray-600">Some sellers offer islandwide delivery</p>
                  <p className="text-gray-600">Urban areas typically have more options</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Times</h4>
                  <p className="text-gray-600 mb-2">Usually 1-7 business days</p>
                  <p className="text-gray-600">Depends on seller location and yours</p>
                  <p className="text-gray-600">Processing time varies by seller</p>
                </div>
              </div>
            </div>
          </section>

          {/* Communicating with Sellers */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiPackage className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">Communicating with Sellers</h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Have questions about shipping for a specific product? You can contact sellers directly through our messaging system.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Before Ordering</h3>
                  <p className="text-sm text-gray-600">
                    Ask about shipping costs, delivery times, or special requirements for your area. Sellers are usually happy to help!
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">After Ordering</h3>
                  <p className="text-sm text-gray-600">
                    Get updates on processing, tracking information, or any shipping delays directly from your seller.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Shipping Notes</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Each seller sets their own shipping rates and policies</li>
              <li>• Shipping costs are shown before you complete your order</li>
              <li>• Delivery times may vary based on seller location and processing time</li>
              <li>• Some sellers offer free shipping for larger orders</li>
              <li>• Contact sellers directly for special shipping requests</li>
              <li>• Check seller reviews for shipping experience feedback</li>
              <li>• Multiple items from the same seller may qualify for combined shipping</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="text-center bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help with Shipping?</h3>
            <p className="text-gray-600 mb-4">
              For general shipping questions or if you're having issues with a seller's shipping policy, we're here to help.
            </p>
            <p className="text-[#72b01d] font-medium">
              Email: support@sina.lk
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
