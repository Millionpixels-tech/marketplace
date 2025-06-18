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
      description: "Start your selling journey by creating a free account - it takes less than 2 minutes!",
      details: [
        "Click the 'Sign Up' button at the top right of the page",
        "Enter your email address and create a strong password (use at least 8 characters)",
        "Verify your email address by clicking the link sent to your inbox",
        "Complete your profile with your full name and mobile number",
        "Add a profile picture to build trust with customers"
      ],
      tips: "💡 Pro Tip: Use a business email if you have one - it looks more professional and builds customer confidence!",
      action: user ? null : { text: "Sign Up Now", link: "/auth?mode=signup" }
    },
    {
      id: 2,
      title: "Set Up Your Shop",
      icon: <FiShoppingBag className="w-8 h-8" />,
      description: "Create your online storefront that represents your brand and attracts customers",
      details: [
        "Go to your Dashboard and click 'Create Shop' to get started",
        "Choose a unique shop username (this becomes your shop URL: sina.lk/shop/yourname)",
        "Pick a memorable shop name that reflects your business",
        "Write a compelling shop description - tell your story and what makes you special",
        "Upload a professional shop logo (square image, at least 400x400px works best)",
        "Add an attractive cover image that showcases your products or brand",
        "Enter your complete business address for accurate delivery calculations",
        "Provide your mobile number for direct customer communication"
      ],
      tips: "🎨 Visual Appeal Matters: High-quality shop images can increase customer trust by up to 70%! Use clear, professional photos.",
      action: user ? { text: "Create Shop", link: "/create-shop" } : null
    },
    {
      id: 3,
      title: "Add Your Products",
      icon: <FiCamera className="w-8 h-8" />,
      description: "Create compelling product listings that showcase your items and drive sales",
      details: [
        "Click 'Add New Listing' from your shop dashboard",
        "Select the most appropriate category for better discoverability",
        "Write a clear, searchable product name (include key features)",
        "Create detailed descriptions: materials, dimensions, care instructions, and unique features",
        "Upload 3-5 high-quality photos from different angles and lighting",
        "Include lifestyle photos showing your product in use",
        "Research competitor prices and set competitive but profitable pricing",
        "Configure shipping options: free delivery zones or shipping charges",
        "Enable payment methods: Cash on Delivery and/or Bank Transfer"
      ],
      tips: "📸 Photography Success: Natural lighting, clean backgrounds, and multiple angles boost sales by 40%! Show size with everyday objects for reference.",
      action: user ? { text: "Add Product", link: "/add-listing" } : null
    },
    {
      id: 4,
      title: "Configure Payment Options",
      icon: <FiCreditCard className="w-8 h-8" />,
      description: "Set up secure payment methods that work best for your business and customers",
      details: [
        "Cash on Delivery (COD): Perfect for local customers, they pay when receiving the product",
        "Bank Transfer: Secure for higher-value items, customers transfer before shipping",
        "Offer both options to maximize sales opportunities and customer convenience",
        "For COD orders: Collect exact payment amount upon delivery",
        "For bank transfers: Customers upload payment confirmation slips for your verification",
        "Set up automatic order confirmations and payment tracking",
        "Consider offering small discounts for advance payments to encourage bank transfers"
      ],
      tips: "💰 Smart Strategy: Sellers offering both payment methods see 60% more orders! COD works great for items under LKR 5,000, bank transfer for premium products.",
      action: null
    },
    {
      id: 5,
      title: "Manage Orders Like a Pro",
      icon: <FiPackage className="w-8 h-8" />,
      description: "Efficiently handle customer orders to build reputation and increase repeat business",
      details: [
        "Check your Dashboard notifications daily for new orders",
        "Access complete customer details: name, phone, delivery address",
        "Call customers within 24 hours to confirm orders and delivery preferences",
        "Print shipping labels and pack items securely with protective materials",
        "Use reliable courier services and provide tracking numbers when available",
        "Update order status to 'Shipped' immediately after dispatch",
        "Follow up with customers to ensure successful delivery and satisfaction",
        "Respond promptly to customer inquiries and concerns"
      ],
      tips: "📞 Customer Service Excellence: Quick response times (under 2 hours) lead to 5-star reviews and repeat customers!",
      action: user ? { text: "View Dashboard", link: `/dashboard/${user.uid}` } : null
    },
    {
      id: 6,
      title: "Receive Payments & Grow",
      icon: <FiDollarSign className="w-8 h-8" />,
      description: "Understand payment processing and strategies to scale your business",
      details: [
        "COD orders: Collect exact cash amount from customers upon delivery",
        "Bank transfer orders: Money goes directly to your account after customer payment",
        "Verify bank transfer payment slips before shipping to avoid fraud",
        "Track all earnings and order history in your seller dashboard",
        "Use payment tracking to understand your most profitable products",
        "Reinvest profits into better photography, more inventory, or marketing",
        "Consider offering bundle deals or discounts to increase average order value",
        "Build a customer email list for repeat business and new product announcements"
      ],
      tips: "🚀 Growth Hack: Successful sellers reinvest 20-30% of profits back into their business for photography, inventory, and marketing!",
      action: null
    }
  ];

  const faqs = [
    {
      question: "Is it free to sell on sina.lk?",
      answer: "Yes! Creating an account, setting up your shop, and listing products is completely free. There are no monthly fees or setup costs. We only succeed when you succeed."
    },
    {
      question: "What can I sell on sina.lk?",
      answer: "You can sell authentic Sri Lankan crafts, handmade items, traditional foods, clothing, jewelry, home decor, and other unique products. We focus on promoting Sri Lankan culture and craftsmanship. All products must be legal and comply with our community guidelines."
    },
    {
      question: "How do I get more customers and increase sales?",
      answer: "Success comes from great photos, detailed descriptions, competitive pricing, quick customer responses, and excellent service. Active sellers who update listings regularly and maintain good reviews get more visibility in search results."
    },
    {
      question: "What should I do if a customer wants to return a product?",
      answer: "Handle returns professionally and promptly. For legitimate quality issues or damage during shipping, offer refunds or exchanges. Clear return policies and good customer service lead to positive reviews and repeat customers."
    },
    {
      question: "How do I handle shipping and delivery?",
      answer: "You're responsible for safely delivering products to customers. Use reliable courier services, pack items securely with protective materials, and provide tracking information when available. Consider offering both pickup and delivery options."
    },
    {
      question: "Can I sell to customers outside Sri Lanka?",
      answer: "Currently, sina.lk focuses on the Sri Lankan market. You can ship anywhere within Sri Lanka to reach customers from Colombo to Jaffna, giving you access to the entire island's market."
    },
    {
      question: "How long does it take to receive payments?",
      answer: "For Cash on Delivery orders, you receive payment immediately upon delivery. For bank transfer orders, customers transfer money directly to your account before you ship, so you get paid upfront."
    },
    {
      question: "What makes a successful seller on sina.lk?",
      answer: "Successful sellers focus on quality products, professional photography, detailed descriptions, prompt communication, reliable shipping, and excellent customer service. They also stay active by adding new products and engaging with customers."
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
