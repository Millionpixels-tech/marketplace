import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import { FiSearch, FiMessageCircle, FiShoppingBag, FiTruck, FiCreditCard, FiUser, FiHelpCircle, FiMail } from "react-icons/fi";

export default function HelpCenter() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <FiUser className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click on 'Login / Register' in the top right corner and follow the simple registration process. You can also sign up using your Google account for faster access."
        },
        {
          question: "Is it free to browse and buy items?",
          answer: "Yes! Browsing and purchasing items on SinaMarketplace is completely free. Sellers may apply their own shipping fees depending on the item and delivery method."
        },
        {
          question: "How do I contact a seller?",
          answer: "You can contact sellers through their shop pages or send them a message through our messaging system once you're logged in."
        }
      ]
    },
    {
      title: "Buying",
      icon: <FiShoppingBag className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I make a purchase?",
          answer: "Browse items, click on products you like, add them to your cart, and proceed to checkout. We support secure payments through PayHere with multiple payment methods."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept Visa, MasterCard, local bank transfers, and mobile payments through our secure PayHere integration. Cash on delivery is also available for selected items."
        },
        {
          question: "Can I cancel my order?",
          answer: "You can cancel orders within 24 hours if they haven't been shipped yet. Contact the seller or our support team for assistance."
        }
      ]
    },
    {
      title: "Selling",
      icon: <FiCreditCard className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I start selling?",
          answer: "Create your account, set up your shop profile, and start listing your products. Check our Seller Guide for detailed instructions and best practices."
        },
        {
          question: "What can I sell?",
          answer: "You can sell handmade crafts, local products, art, jewelry, clothing, home decor, and more. Items must comply with our community guidelines and Sri Lankan laws."
        },
        {
          question: "How do I get paid?",
          answer: "Payments are processed securely through PayHere and transferred to your account after successful delivery confirmation."
        }
      ]
    },
    {
      title: "Shipping & Delivery",
      icon: <FiTruck className="w-6 h-6" />,
      faqs: [
        {
          question: "How long does shipping take?",
          answer: "Shipping times vary by seller and location. Most items within Colombo are delivered within 1-3 days, while island-wide delivery typically takes 3-7 days."
        },
        {
          question: "How much does shipping cost?",
          answer: "Shipping costs are set by individual sellers. Some offer free shipping, while others charge based on weight, distance, or item type."
        },
        {
          question: "Can I track my order?",
          answer: "Yes! You'll receive order updates via email and can track your order status in your dashboard once logged in."
        }
      ]
    }
  ];

  const contactOptions = [
    {
      title: "Email Support",
      description: "Get help via email within 24 hours",
      icon: <FiMail className="w-8 h-8" />,
      action: "support@sina.lk",
      buttonText: "Send Email"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team",
      icon: <FiMessageCircle className="w-8 h-8" />,
      action: "#",
      buttonText: "Start Chat"
    },
    {
      title: "Seller Guide",
      description: "Complete guide for sellers",
      icon: <FiHelpCircle className="w-8 h-8" />,
      action: "/seller-guide",
      buttonText: "View Guide"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl mb-8 text-green-100">
            Find answers to your questions and get the support you need
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>
      </div>

      {/* Quick Contact Options */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#0d0a0b]">Need Immediate Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="text-[#72b01d] mr-4">{option.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0d0a0b]">{option.title}</h3>
                    <p className="text-gray-600 text-sm">{option.description}</p>
                  </div>
                </div>
                <a
                  href={option.action.startsWith('#') ? option.action : option.action.startsWith('/') ? option.action : `mailto:${option.action}`}
                  className="inline-block bg-[#72b01d] text-white px-4 py-2 rounded-lg hover:bg-[#5a8f17] transition-colors"
                  onClick={option.action === '#' ? (e) => e.preventDefault() : undefined}
                >
                  {option.buttonText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#0d0a0b]">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-[#72b01d] text-white p-6">
                  <div className="flex items-center">
                    <div className="mr-4">{category.icon}</div>
                    <h3 className="text-xl font-bold">{category.title}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => (
                      <details key={faqIndex} className="group">
                        <summary className="flex justify-between items-center cursor-pointer list-none p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="font-medium text-[#0d0a0b]">{faq.question}</span>
                          <span className="text-[#72b01d] transform group-open:rotate-180 transition-transform">
                            ▼
                          </span>
                        </summary>
                        <div className="mt-2 p-4 text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#0d0a0b]">Still Need Help?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Can't find what you're looking for? Our friendly support team is here to help you succeed on SinaMarketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@sina.lk"
              className="bg-[#72b01d] text-white px-8 py-3 rounded-lg hover:bg-[#5a8f17] transition-colors font-medium"
            >
              Contact Support
            </a>
            <a
              href="/seller-guide"
              className="bg-white text-[#72b01d] border-2 border-[#72b01d] px-8 py-3 rounded-lg hover:bg-[#72b01d] hover:text-white transition-colors font-medium"
            >
              Seller Resources
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
