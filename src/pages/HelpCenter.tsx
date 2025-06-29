import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { FiShoppingBag, FiTruck, FiCreditCard, FiUser, FiHelpCircle, FiMail } from "react-icons/fi";
import { getFAQStructuredData, getCanonicalUrl, generateKeywords } from "../utils/seo";

export default function HelpCenter() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <FiUser className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click on 'Sign Up' in the top right corner and follow the registration process. You can also sign up using your Google account for faster access."
        },
        {
          question: "Is it free to browse and buy items?",
          answer: "Yes! Browsing and purchasing items on Sina.lk is completely free. Sellers may apply their own shipping fees depending on the item and delivery method."
        },
        {
          question: "How do I contact a seller?",
          answer: "You can contact sellers through their shop pages or send them messages through our integrated messaging system once you're logged in. You can also request custom orders directly through messages."
        },
        {
          question: "What is account verification?",
          answer: "Account verification is our security system where buyers can submit identity documents to get a verification badge. Verified buyers have higher trust ratings and can place orders even if they receive reports from sellers."
        }
      ]
    },
    {
      title: "Buying & Orders",
      icon: <FiShoppingBag className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I make a purchase?",
          answer: "Browse items, click on products you like, add them to your cart, and proceed to checkout. We offer Cash on Delivery (COD) and Bank Transfer payment methods."
        },
        {
          question: "What are custom orders?",
          answer: "Custom orders allow you to request personalized items or bulk orders directly from sellers. Sellers can create custom quotes with specific pricing, shipping costs, and delivery terms for your unique needs."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept Cash on Delivery (COD) where you pay when you receive your order, and Bank Transfer where you transfer money to the seller's bank account and upload a payment slip as proof."
        },
        {
          question: "How do I upload a payment slip?",
          answer: "For bank transfer orders, after making the payment, go to your order page and upload a photo or screenshot of your payment slip. This helps sellers verify your payment quickly."
        },
        {
          question: "Can I cancel my order?",
          answer: "You can cancel orders within 24 hours if they haven't been shipped yet. Contact the seller through our messaging system or contact our support team for assistance."
        }
      ]
    },
    {
      title: "Selling & Shop Management",
      icon: <FiCreditCard className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I start selling?",
          answer: "Create your account, set up your shop profile with photos and description, add your bank account details, and start listing your products. Check our Seller Guide for detailed instructions."
        },
        {
          question: "What can I sell?",
          answer: "You can sell handmade crafts, local products, art, jewelry, clothing, home decor, traditional Sri Lankan items, and more. Items must comply with our community guidelines and Sri Lankan laws."
        },
        {
          question: "How do I handle custom order requests?",
          answer: "When customers message you for custom orders, you can create a custom order quote with specific items, pricing, and shipping costs. Once accepted, it automatically converts to regular orders for tracking."
        },
        {
          question: "How do I get paid?",
          answer: "For COD orders, customers pay you directly upon delivery. For bank transfers, customers transfer money to your bank account first and upload payment slips for verification before you ship."
        },
        {
          question: "Can I add multiple bank accounts?",
          answer: "Yes! You can add multiple bank accounts in your profile settings and set a preferred account. This gives customers more payment options and can increase your sales."
        },
        {
          question: "How do I track my earnings?",
          answer: "Your dashboard includes detailed earnings analytics with date-range filtering, showing completed orders, average order value, and total revenue over time."
        }
      ]
    },
    {
      title: "Shipping, Delivery & Support",
      icon: <FiTruck className="w-6 h-6" />,
      faqs: [
        {
          question: "How long does shipping take?",
          answer: "Shipping times vary by seller and location. Most items within Colombo are delivered within 1-3 days, while island-wide delivery typically takes 3-7 days."
        },
        {
          question: "How much does shipping cost?",
          answer: "Shipping costs are set by individual sellers. Some offer free shipping zones, while others charge based on weight, distance, or item type."
        },
        {
          question: "Can I track my order?",
          answer: "Yes! You'll receive order updates via email and can track your order status in your dashboard. Sellers update order statuses from 'Confirmed' to 'Shipped' to 'Delivered'."
        },
        {
          question: "What if I have issues with a buyer or seller?",
          answer: "Our platform includes a reporting system. Sellers can report problematic buyers, and we have a verification system to ensure secure transactions. Contact support@sina.lk for serious issues."
        },
        {
          question: "How do I contact customer support?",
          answer: "Email us at support@sina.lk for any questions about orders, payments, account issues, or technical problems. We respond within 24 hours."
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
      title: "Seller Guide",
      description: "Complete guide for sellers",
      icon: <FiHelpCircle className="w-8 h-8" />,
      action: "/seller-guide",
      buttonText: "View Guide"
    }
  ];

  // Generate FAQ structured data
  const allFAQs = faqCategories.flatMap(category => 
    category.faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer
    }))
  );

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Help Center - Sina.lk Marketplace"
        description="Find answers to your questions about buying, selling, custom orders, payment slips, account verification, and more. Get comprehensive support for Sina.lk marketplace."
        keywords={generateKeywords([
          'help center',
          'customer support',
          'frequently asked questions',
          'buying guide',
          'selling help',
          'custom orders',
          'payment slips',
          'account verification',
          'Sri Lankan marketplace'
        ])}
        canonicalUrl={getCanonicalUrl('/help')}
        structuredData={getFAQStructuredData(allFAQs)}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl mb-8 text-green-100">
            Find answers to your questions and get the support you need
          </p>
        </div>
      </div>

      {/* Quick Contact Options */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#0d0a0b]">Need Immediate Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  href={option.action.startsWith('/') ? option.action : `mailto:${option.action}`}
                  className="inline-block bg-[#72b01d] text-white px-4 py-2 rounded-lg hover:bg-[#5a8f17] transition-colors"
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
            Can't find what you're looking for? Our support team is here to help with orders, custom requests, payments, and technical issues.
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
