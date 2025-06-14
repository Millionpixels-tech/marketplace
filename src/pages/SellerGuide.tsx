import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { FiUser, FiShoppingBag, FiCamera, FiDollarSign, FiTruck, FiStar, FiCheckCircle, FiArrowRight, FiPhone, FiMapPin, FiCreditCard, FiPackage, FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { getArticleStructuredData, getCanonicalUrl, generateKeywords } from '../utils/seo';

export default function SellerGuide() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Create Your Account",
      icon: <FiUser className="w-8 h-8" />,
      description: "Start your selling journey by creating a free account",
      details: [
        "Click the 'Sign Up' button at the top right of the page",
        "Enter your email address and create a strong password",
        "Verify your email address by clicking the link sent to your inbox",
        "Complete your profile with your name and contact details"
      ],
      tips: "💡 Use a business email if you have one - it looks more professional to customers!",
      action: user ? null : { text: "Sign Up Now", link: "/auth?mode=signup" }
    },
    {
      id: 2,
      title: "Set Up Your Shop",
      icon: <FiShoppingBag className="w-8 h-8" />,
      description: "Create your online shop to showcase your products",
      details: [
        "Go to your Dashboard and click 'Create Shop'",
        "Choose a unique shop name (this becomes your shop URL: sina.lk/shop/yourname)",
        "Write a compelling shop description - tell customers what makes you special",
        "Upload a professional shop logo (square image works best)",
        "Add a cover image to make your shop attractive",
        "Enter your complete shop address for delivery purposes",
        "Provide your mobile number for customer contact"
      ],
      tips: "🎨 Good images attract more customers! Use clear, high-quality photos for your shop.",
      action: user ? { text: "Create Shop", link: "/create-shop" } : null
    },
    {
      id: 3,
      title: "Add Your Products",
      icon: <FiCamera className="w-8 h-8" />,
      description: "List your products with attractive photos and descriptions",
      details: [
        "Click 'Add New Listing' from your shop or dashboard",
        "Select the correct category for your product",
        "Write a clear, descriptive product name",
        "Add detailed description including materials, size, features",
        "Upload 3-5 high-quality product photos from different angles",
        "Set your selling price (research similar products for competitive pricing)",
        "Choose delivery options: free delivery or charge for shipping",
        "Enable 'Cash on Delivery' if you want to accept cash payments"
      ],
      tips: "📸 Take photos in good lighting! Show your product from multiple angles and include size references.",
      action: user ? { text: "Add Product", link: "/add-listing" } : null
    },
    {
      id: 4,
      title: "Set Up Payments",
      icon: <FiCreditCard className="w-8 h-8" />,
      description: "Choose how you want to receive payments from customers",
      details: [
        "Cash on Delivery (COD): Customer pays when they receive the product",
        "Bank Transfer: Customer transfers money to your bank account before shipping",
        "You can offer both options to give customers flexibility",
        "For COD orders, you collect money directly from the customer",
        "For bank transfer orders, customers upload payment slips for verification before you ship"
      ],
      tips: "💰 Offering both payment methods increases your sales! COD is popular for immediate orders, bank transfer for higher-value items.",
      action: null
    },
    {
      id: 5,
      title: "Manage Orders",
      icon: <FiPackage className="w-8 h-8" />,
      description: "Handle customer orders efficiently",
      details: [
        "Check your Dashboard regularly for new orders",
        "You'll see customer contact details including phone and address",
        "Print delivery labels for easy shipping",
        "Contact customers to confirm orders and delivery details",
        "Mark orders as 'Shipped' when you send them",
        "Keep customers updated about delivery status"
      ],
      tips: "📞 Quick communication builds trust! Contact customers promptly about their orders.",
      action: user ? { text: "View Dashboard", link: `/dashboard/${user.uid}` } : null
    },
    {
      id: 6,
      title: "Get Paid",
      icon: <FiDollarSign className="w-8 h-8" />,
      description: "Understand how and when you receive your money",
      details: [
        "COD orders: You collect cash directly from customers upon delivery",
        "Bank transfer orders: Customers transfer money to your account before shipping",
        "For bank transfers, customers upload payment slips for verification",
        "You receive payments immediately after customers complete bank transfers",
        "Track your earnings and order status in the Dashboard",
        "Clear payment tracking protects both buyers and sellers"
      ],
      tips: "� Bank transfers work great for higher-value items, while COD is perfect for quick local sales!",
      action: null
    }
  ];

  const faqs = [
    {
      question: "Is it free to sell on sina.lk?",
      answer: "Yes! Creating an account, setting up your shop, and listing products is completely free. We only succeed when you succeed."
    },
    {
      question: "What can I sell on sina.lk?",
      answer: "You can sell authentic Sri Lankan crafts, handmade items, local foods, traditional items, and other legal products. We focus on promoting Sri Lankan culture and craftsmanship."
    },
    {
      question: "How do I get more customers?",
      answer: "Use high-quality photos, write detailed descriptions, price competitively, respond quickly to customers, and maintain good reviews. Active sellers get more visibility!"
    },
    {
      question: "What if a customer wants to return a product?",
      answer: "Handle returns professionally. For legitimate issues, offer refunds or exchanges. Good customer service leads to positive reviews and repeat customers."
    },
    {
      question: "How do I handle shipping?",
      answer: "You're responsible for shipping products to customers. Use reliable courier services, pack items securely, and provide tracking information when possible."
    },
    {
      question: "Can I sell internationally?",
      answer: "Currently, we focus on the Sri Lankan market. You can ship within Sri Lanka to reach customers across the island."
    }
  ];

  const benefits = [
    {
      icon: <FiEye className="w-6 h-6" />,
      title: "Reach More Customers",
      description: "Access customers across Sri Lanka who are looking for authentic local products"
    },
    {
      icon: <FiHeart className="w-6 h-6" />,
      title: "Build Your Brand",
      description: "Create a professional online presence with your own shop page and branding"
    },
    {
      icon: <FiTruck className="w-6 h-6" />,
      title: "Flexible Delivery",
      description: "Choose your own shipping methods and delivery charges"
    },
    {
      icon: <FiMessageCircle className="w-6 h-6" />,
      title: "Direct Customer Contact",
      description: "Get customer phone numbers and addresses for direct communication"
    },
    {
      icon: <FiStar className="w-6 h-6" />,
      title: "Build Reputation",
      description: "Earn reviews and ratings to build trust with future customers"
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Flexible Payments",
      description: "Multiple payment options: Cash on Delivery and secure Bank Transfer with payment verification"
    }
  ];

  return (
    <>
      <SEOHead
        title="Seller Guide - How to Start Selling on Sri Lankan Marketplace"
        description="Complete guide for selling authentic Sri Lankan products online. Learn how to create your shop, list products, manage orders, and grow your business on our marketplace."
        keywords={generateKeywords([
          'seller guide',
          'how to sell online',
          'Sri Lankan marketplace selling',
          'start online business',
          'sell crafts online',
          'artisan business guide',
          'online selling tips'
        ])}
        canonicalUrl={getCanonicalUrl('/seller-guide')}
        structuredData={getArticleStructuredData({
          title: 'Complete Seller Guide for Sri Lankan Marketplace',
          description: 'Step-by-step guide to start selling authentic Sri Lankan products online',
          author: 'Sri Lankan Marketplace Team',
          datePublished: '2025-01-01',
          url: getCanonicalUrl('/seller-guide')
        })}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        {/* Hero Section */}
        <div className={`bg-gradient-to-r from-[#72b01d] to-[#3f7d20] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
          <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-6`}>
              Start Selling on SinaMarketplace
            </h1>
            <p className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} mb-8 opacity-90`}>
              Turn your Sri Lankan crafts and products into a thriving online business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link
                  to="/auth?mode=signup"
                  className="bg-white text-[#72b01d] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                >
                  Get Started Free
                </Link>
              )}
              {user && (
                <Link
                  to="/create-shop"
                  className="bg-white text-[#72b01d] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                >
                  Create Your Shop
                </Link>
              )}
              <a
                href="#benefits"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#72b01d] transition"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div id="benefits" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#0d0a0b] mb-12">
              Why Sell on sina.lk?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
                  <div className="text-[#72b01d] mb-4 flex justify-center">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0d0a0b] mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-[#454955]">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#0d0a0b] mb-12">
              How to Start Selling - Step by Step
            </h2>
            
            {/* Step Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    activeStep === step.id
                      ? 'bg-[#72b01d] text-white'
                      : 'bg-white text-[#454955] hover:bg-gray-100'
                  }`}
                >
                  Step {step.id}
                </button>
              ))}
            </div>

            {/* Active Step Content */}
            {steps.map((step) => (
              <div
                key={step.id}
                className={`${activeStep === step.id ? 'block' : 'hidden'}`}
              >
                <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-[#72b01d] text-white rounded-2xl flex items-center justify-center mb-4">
                        {step.icon}
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-[#72b01d]">
                          Step {step.id} of {steps.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold text-[#0d0a0b] mb-4">
                        {step.title}
                      </h3>
                      <p className="text-lg text-[#454955] mb-6">
                        {step.description}
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-[#0d0a0b] mb-4">
                          Detailed Steps:
                        </h4>
                        <ul className="space-y-3">
                          {step.details.map((detail, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <FiCheckCircle className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                              <span className="text-[#454955]">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <p className="text-[#0d0a0b] font-medium">
                          {step.tips}
                        </p>
                      </div>
                      
                      {step.action && (
                        <Link
                          to={step.action.link}
                          className="inline-flex items-center gap-2 bg-[#72b01d] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3f7d20] transition"
                        >
                          {step.action.text}
                          <FiArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                disabled={activeStep === 1}
                className="px-6 py-3 rounded-xl font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Step
              </button>
              <button
                onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
                disabled={activeStep === steps.length}
                className="px-6 py-3 rounded-xl font-medium bg-[#72b01d] text-white hover:bg-[#3f7d20] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#0d0a0b] mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-[#0d0a0b] mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-[#454955] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-[#72b01d] to-[#3f7d20] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Selling Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of Sri Lankan sellers who are building successful businesses on sina.lk
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/auth?mode=signup"
                    className="bg-white text-[#72b01d] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    to="/auth?mode=signin"
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#72b01d] transition"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/create-shop"
                    className="bg-white text-[#72b01d] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
                  >
                    Create Your Shop
                  </Link>
                  <Link
                    to={user ? `/dashboard/${user.uid}` : "/auth"}
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#72b01d] transition"
                  >
                    Go to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="py-8 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-[#454955] mb-4">
              Need help getting started? We're here to support you!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-[#454955]">
                <FiPhone className="w-4 h-4" />
                <span>Call us: +94 11 123 4567</span>
              </div>
              <div className="flex items-center gap-2 text-[#454955]">
                <FiMapPin className="w-4 h-4" />
                <span>Visit our office in Colombo</span>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
