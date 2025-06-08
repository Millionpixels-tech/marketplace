import Footer from '../components/UI/Footer';
import { FiMail, FiPhone, FiMessageCircle, FiClock, FiHelpCircle } from 'react-icons/fi';

export default function CustomerService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Service</h1>
          <p className="text-gray-600">
            We're here to help! Get in touch with our support team for any questions or assistance.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMail className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email</p>
            <a
              href="mailto:support@sina.lk"
              className="text-[#72b01d] hover:text-[#5a8a16] font-medium"
            >
              support@sina.lk
            </a>
            <p className="text-sm text-gray-500 mt-2">Response within 24 hours</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPhone className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Speak with our team</p>
            <a
              href="tel:+94111234567"
              className="text-[#72b01d] hover:text-[#5a8a16] font-medium"
            >
              +94 11 123 4567
            </a>
            <p className="text-sm text-gray-500 mt-2">Mon-Fri 9AM-6PM</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Instant assistance</p>
            <button className="text-[#72b01d] hover:text-[#5a8a16] font-medium">
              Start Chat
            </button>
            <p className="text-sm text-gray-500 mt-2">Available 9AM-9PM</p>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <FiHelpCircle className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Common Questions</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Order & Payment Issues</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• How to track my order</li>
                <li>• Payment methods and processing</li>
                <li>• Order cancellation and modifications</li>
                <li>• Refund and return policies</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Account & Profile</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Creating and managing your account</li>
                <li>• Password reset and security</li>
                <li>• Profile information updates</li>
                <li>• Account verification process</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Selling on SinaMarketplace</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• How to create your shop</li>
                <li>• Listing products and pricing</li>
                <li>• Managing orders and customers</li>
                <li>• Payment processing for sellers</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Shipping & Delivery</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Delivery times and locations</li>
                <li>• Shipping costs and methods</li>
                <li>• International shipping options</li>
                <li>• Package tracking and updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <FiClock className="text-[#72b01d] mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Support Hours</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Support</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Live Chat</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Sunday</span>
                  <span>9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time</span>
                  <span>Usually within 5 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
