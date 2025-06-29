import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getOrganizationStructuredData, getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiTruck, FiRefreshCw, FiCheckCircle, FiDollarSign, FiAlertCircle, FiShield } from 'react-icons/fi';

export default function ReturnsRefunds() {
  const { isMobile } = useResponsive();

  return (
    <>
      <SEOHead
        title="Returns & Refunds Policy - Sina.lk Marketplace"
        description="Understand return policies for marketplace purchases. Learn about seller return policies, buyer protection, and how to handle returns with individual sellers on Sina.lk."
        keywords={generateKeywords([
          'returns policy',
          'refunds',
          'marketplace returns',
          'seller return policy',
          'buyer protection',
          'Sri Lanka marketplace',
          'custom orders returns'
        ])}
        canonicalUrl={getCanonicalUrl('/returns-refunds')}
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <div className="flex items-center justify-center mb-6">
            <FiShield className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-white`} />
          </div>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4`}>Returns & Refunds</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-green-100 mb-6`}>
            Understand return policies and buyer protection for marketplace purchases from individual sellers.
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
        {/* Quick Overview */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketplace Return Policy Overview</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Notice</h3>
                <p className="text-blue-700 text-sm">
                  Sina.lk is a marketplace connecting buyers with individual sellers across Sri Lanka. Return policies are set by individual sellers, not by Sina.lk directly. We facilitate communication and provide buyer protection guidelines.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Seller Communication</h3>
              <p className="text-gray-600">Contact sellers directly through our messaging system</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Buyer Protection</h3>
              <p className="text-gray-600">Report issues through our support system</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Protection</h3>
              <p className="text-gray-600">COD and bank transfer payment security</p>
            </div>
          </div>
        </div>

        {/* Return Guidelines */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiRefreshCw className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Return Guidelines & Common Practices</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Items Generally Accepted for Return</h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Items significantly different from descriptions or photos</li>
                <li>• Products received damaged during shipping</li>
                <li>• Items with manufacturing defects or quality issues</li>
                <li>• Wrong items sent by seller</li>
                <li>• Items that don't match the agreed specifications in custom orders</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">✗ Items Typically Not Returnable</h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Personalized or custom-made items (unless defective)</li>
                <li>• Food items, traditional sweets, and perishables</li>
                <li>• Items used, worn, or damaged by the buyer</li>
                <li>• Digital products or downloadable content</li>
                <li>• Items sold "as-is" or with disclosed imperfections</li>
                <li>• Custom orders that match the agreed specifications</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Each seller may have their own specific return policy. Always check with the seller before purchasing, especially for handmade or custom items.
              </p>
            </div>
          </div>
        </div>

        {/* How to Handle Returns */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiTruck className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">How to Handle Returns & Issues</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact the Seller First</h3>
                <p className="text-gray-600">Use our messaging system to contact the seller directly. Explain the issue clearly and provide photos if applicable. Most sellers are willing to resolve issues quickly.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Negotiate a Solution</h3>
                <p className="text-gray-600">Work with the seller to find a mutually acceptable solution - this could be a return, exchange, partial refund, or other arrangement.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Arrange Return Shipping</h3>
                <p className="text-gray-600">If a return is agreed upon, coordinate shipping arrangements. The seller will typically provide instructions for returning the item safely.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Resolution</h3>
                <p className="text-gray-600">For COD orders, refunds are typically handled directly. For bank transfer orders, the seller may provide a refund via bank transfer back to your account.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center text-white font-bold text-sm">
                5
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Support if Needed</h3>
                <p className="text-gray-600">If you cannot reach an agreement with the seller, contact our support team at support@sina.lk. We can help mediate disputes and provide guidance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Refund Information */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiDollarSign className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Payment & Refund Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Cash on Delivery (COD) Orders</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Return Process</h4>
                  <p className="text-gray-600 text-sm">Since payment is made directly to the seller upon delivery, refunds are typically handled directly between buyer and seller or via bank transfer.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Refund Method</h4>
                  <p className="text-gray-600 text-sm">Seller may provide bank transfer refund or arrange for item pickup with cash refund.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Bank Transfer Orders</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Return Process</h4>
                  <p className="text-gray-600 text-sm">Since payment is made upfront via bank transfer with payment slip verification, refunds require coordination with the seller.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Refund Method</h4>
                  <p className="text-gray-600 text-sm">Seller typically processes refund via bank transfer back to buyer's account within 3-7 business days.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Custom Orders</h4>
            <p className="text-green-700 text-sm">
              Custom orders have specific return policies set by sellers. Always clarify return terms before placing custom orders, as these items are typically made to your specifications.
            </p>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Guidelines</h3>
              <ul className="space-y-1 text-yellow-700 text-sm">
                <li>• Each seller sets their own return policy - check before purchasing</li>
                <li>• Communicate respectfully with sellers through our messaging system</li>
                <li>• Take photos of any issues to help resolve disputes</li>
                <li>• Keep all order information and communication records</li>
                <li>• For custom orders, clarify return terms before confirming the order</li>
                <li>• Contact support@sina.lk if you need help mediating with a seller</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Buyer Protection */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <FiShield className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Buyer Protection & Support</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">When to Contact Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Seller is unresponsive to messages</li>
                <li>• Item significantly different from description</li>
                <li>• Seller refuses reasonable return request</li>
                <li>• Suspected fraudulent activity</li>
                <li>• Need help with payment disputes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">How We Can Help</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Mediate communication between buyers and sellers</li>
                <li>• Provide guidance on marketplace policies</li>
                <li>• Assist with dispute resolution</li>
                <li>• Take action against problematic sellers</li>
                <li>• Use buyer verification and reporting system</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="mailto:support@sina.lk"
              className="inline-flex items-center px-6 py-3 bg-[#72b01d] text-white font-medium rounded-lg hover:bg-[#5a8f17] transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
