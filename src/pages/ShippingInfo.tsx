import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { getOrganizationStructuredData } from '../utils/seo';
import { FiTruck, FiClock, FiMapPin, FiPackage, FiGlobe } from 'react-icons/fi';

export default function ShippingInfo() {
  return (
    <>
      <SEOHead
        title="Shipping Information - SinaMarketplace"
        description="Learn about shipping options, delivery times, and policies for Sri Lanka and international orders. Standard and express delivery available."
        keywords="shipping information, delivery, Sri Lanka shipping, international shipping, delivery times, shipping costs"
        canonicalUrl="https://sinamarketplace.com/shipping"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <FiTruck className="text-[#72b01d] text-3xl" />
            <h1 className="text-3xl font-bold text-gray-900">Shipping Information</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Learn about our shipping options, delivery times, and policies for both local and international orders.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Domestic Shipping */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiMapPin className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">Domestic Shipping (Within Sri Lanka)</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Delivery</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center"><FiClock className="mr-2 text-[#72b01d]" /> 3-5 business days</li>
                  <li>Colombo & suburbs: LKR 300</li>
                  <li>Other major cities: LKR 400</li>
                  <li>Rural areas: LKR 500</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Express Delivery</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center"><FiClock className="mr-2 text-[#72b01d]" /> 1-2 business days</li>
                  <li>Colombo & suburbs: LKR 600</li>
                  <li>Other major cities: LKR 800</li>
                  <li>Available for selected areas only</li>
                </ul>
              </div>
            </div>
          </section>

          {/* International Shipping */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiGlobe className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">International Shipping</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                We proudly ship Sri Lankan products worldwide. International shipping costs are calculated based on destination, weight, and dimensions.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Regional (Asia)</h4>
                  <p className="text-gray-600">7-14 business days</p>
                  <p className="text-gray-600">Starting from USD 15</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Europe/Americas</h4>
                  <p className="text-gray-600">10-21 business days</p>
                  <p className="text-gray-600">Starting from USD 25</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Australia/Oceania</h4>
                  <p className="text-gray-600">12-18 business days</p>
                  <p className="text-gray-600">Starting from USD 20</p>
                </div>
              </div>
            </div>
          </section>

          {/* Packaging */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <FiPackage className="text-[#72b01d] text-xl" />
              <h2 className="text-2xl font-semibold text-gray-900">Packaging & Handling</h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>
                All items are carefully packaged to ensure they arrive in perfect condition. We use eco-friendly packaging materials whenever possible.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Fragile Items</h3>
                  <p className="text-sm text-gray-600">
                    Ceramics, glass items, and artwork receive extra protective packaging with bubble wrap and cushioning materials.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Textiles & Clothing</h3>
                  <p className="text-sm text-gray-600">
                    Garments and fabrics are carefully folded and packaged to prevent wrinkles and damage during transit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Shipping Notes</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Free shipping on orders over LKR 5,000 within Colombo</li>
              <li>• International customers are responsible for customs duties and import taxes</li>
              <li>• Some items may have shipping restrictions to certain countries</li>
              <li>• Tracking information will be provided once your order ships</li>
              <li>• For expedited shipping options, please contact customer service</li>
              <li>• Shipping costs are non-refundable</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="text-center bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions about Shipping?</h3>
            <p className="text-gray-600 mb-4">
              Our customer service team is here to help with any shipping inquiries.
            </p>
            <p className="text-[#72b01d] font-medium">
              Email: shipping@sina.lk | Phone: +94 11 123 4567
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
