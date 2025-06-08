import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { getOrganizationStructuredData } from '../utils/seo';
import { FiTruck, FiRefreshCw, FiCheckCircle, FiClock, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

export default function ReturnsRefunds() {
  return (
    <>
      <SEOHead
        title="Returns & Refunds Policy - SinaMarketplace"
        description="Learn about our comprehensive returns and refunds policy. 30-day return window, easy process, and full refunds for eligible items in Sri Lanka."
        keywords="returns policy, refunds, return items, 30 day returns, Sri Lanka marketplace, customer protection"
        canonicalUrl="https://sinamarketplace.com/returns"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds</h1>
          <p className="text-gray-600">
            Learn about our return policy and how to get refunds for your purchases.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Overview */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Policy Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">30-Day Window</h3>
              <p className="text-gray-600">Return items within 30 days of delivery</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Process</h3>
              <p className="text-gray-600">Simple online return request system</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Full Refunds</h3>
              <p className="text-gray-600">Get your money back for eligible returns</p>
            </div>
          </div>
        </div>

        {/* Return Conditions */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiRefreshCw className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Return Conditions</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Items We Accept for Return</h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Items in original, unused condition</li>
                <li>• Products with original packaging and tags</li>
                <li>• Items returned within 30 days of delivery</li>
                <li>• Handmade items (subject to seller approval)</li>
                <li>• Electronics in working condition with all accessories</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">✗ Items We Cannot Accept</h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Personalized or custom-made items</li>
                <li>• Food items and perishables</li>
                <li>• Items damaged by normal wear and tear</li>
                <li>• Digital products and downloads</li>
                <li>• Items returned after 30 days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Return */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiTruck className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">How to Return an Item</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Start Return Request</h3>
                <p className="text-gray-600">Go to your order history and click "Return Item" next to the product you want to return.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Return Reason</h3>
                <p className="text-gray-600">Choose the reason for your return from the dropdown menu and provide additional details if needed.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Print Return Label</h3>
                <p className="text-gray-600">We'll email you a prepaid return shipping label. Print it and attach it to your package.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ship the Item</h3>
                <p className="text-gray-600">Package the item securely and drop it off at any authorized shipping location or schedule a pickup.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                5
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Get Your Refund</h3>
                <p className="text-gray-600">Once we receive and process your return, we'll issue a refund to your original payment method within 3-5 business days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiDollarSign className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Refund Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Refund Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Processing Time</span>
                  <span className="font-medium">1-2 business days</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Credit Card</span>
                  <span className="font-medium">3-5 business days</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Bank Transfer</span>
                  <span className="font-medium">5-7 business days</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Digital Wallet</span>
                  <span className="font-medium">1-3 business days</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Refund Amount</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Item Price</span>
                  <span className="font-medium text-green-600">Full Refund</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Shipping Cost</span>
                  <span className="font-medium text-green-600">Refunded*</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Return Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  *Original shipping is refunded if the return is due to our error or defective product.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
              <ul className="space-y-1 text-yellow-700 text-sm">
                <li>• For handmade items, please contact the seller before initiating a return</li>
                <li>• International returns may take longer to process</li>
                <li>• Keep your return tracking number until the refund is processed</li>
                <li>• Contact customer service if you don't receive your refund within the expected timeframe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
