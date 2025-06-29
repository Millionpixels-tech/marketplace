import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { FiUser, FiShoppingBag, FiCamera, FiDollarSign, FiTruck, FiStar, FiCheckCircle, FiArrowRight, FiMapPin, FiCreditCard, FiPackage, FiEye, FiHeart, FiMessageCircle } from 'react-icons/fi';
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
      title: "Configure Payment & Banking",
      icon: <FiCreditCard className="w-8 h-8" />,
      description: "Set up secure payment methods and bank accounts for seamless transactions",
      details: [
        "Cash on Delivery (COD): Perfect for local customers, they pay when receiving the product",
        "Bank Transfer: Secure for higher-value items, customers transfer money before shipping",
        "Add multiple bank accounts in your profile settings for customer convenience",
        "Set a preferred bank account that will be shown first to customers",
        "Include account number, bank name, branch, and full account holder name",
        "For COD orders: Collect exact payment amount upon delivery",
        "For bank transfers: Customers upload payment slips for your verification",
        "Payment verification system helps prevent fraud and ensures secure transactions"
      ],
      tips: "🏦 Banking Pro Tip: Sellers with multiple bank account options see 60% more orders! Offer both payment methods to maximize sales opportunities.",
      action: null
    },
    {
      id: 5,
      title: "Master Order Management",
      icon: <FiPackage className="w-8 h-8" />,
      description: "Efficiently handle orders, from confirmation to delivery, building strong customer relationships",
      details: [
        "Monitor your Dashboard daily for new order notifications and customer messages",
        "Review order details: customer information, delivery address, and payment method",
        "For bank transfer orders: Verify payment slips uploaded by customers before shipping",
        "Call customers within 24 hours to confirm orders and discuss delivery preferences",
        "Use professional packaging with protective materials and branded touches",
        "Update order status promptly: 'Confirmed' → 'Shipped' → 'Delivered'",
        "Provide tracking information when available from courier services",
        "Follow up with customers to ensure satisfaction and encourage reviews",
        "Handle customer inquiries professionally through our messaging system"
      ],
      tips: "📞 Customer Service Excellence: Quick response times (under 2 hours) and proactive communication lead to 5-star reviews and repeat customers!",
      action: user ? { text: "View Dashboard", link: "/dashboard" } : null
    },
    {
      id: 6,
      title: "Leverage Advanced Features",
      icon: <FiStar className="w-8 h-8" />,
      description: "Use advanced tools like custom orders and buyer insights to grow your business",
      details: [
        "Create Custom Orders for special requests or bulk orders directly from customer messages",
        "Set custom pricing, shipping costs, and delivery terms for unique customer needs",
        "Custom orders can be split into multiple regular orders for easier tracking",
        "Use the buyer reporting system responsibly if you encounter problematic customers",
        "Monitor customer verification status - verified buyers are typically more reliable",
        "Track your earnings with detailed analytics and date-range filtering",
        "Manage stock levels efficiently to avoid overselling popular items",
        "Use the messaging system to build relationships and understand customer preferences",
        "Participate in seasonal promotions and marketing campaigns for increased visibility"
      ],
      tips: "⚡ Growth Hack: Sellers who actively use custom orders and maintain good customer relationships see 40% higher average order values!",
      action: null
    },
    {
      id: 7,
      title: "Track Earnings & Scale Your Business",
      icon: <FiDollarSign className="w-8 h-8" />,
      description: "Understand your financial performance and implement growth strategies",
      details: [
        "Access detailed earnings reports filtered by date ranges in your dashboard",
        "Track completed orders, average order value, and total revenue over time",
        "COD orders: Collect cash payment directly from customers upon delivery",
        "Bank transfer orders: Receive money directly in your account before shipping",
        "All earnings calculations include confirmed, shipped, and delivered orders",
        "Use earnings data to identify your best-selling products and peak sales periods",
        "Reinvest 20-30% of profits into better product photography and inventory expansion",
        "Consider offering bundle deals or volume discounts to increase order values",
        "Build customer email lists for repeat business announcements",
        "Maintain detailed records for business planning and tax purposes"
      ],
      tips: "📊 Success Metrics: Top sellers track their performance weekly and adjust strategies based on customer feedback and sales patterns!",
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
      question: "How do custom orders work?",
      answer: "Custom orders allow you to create personalized quotes for customers with special requests. You can set custom pricing, shipping costs, and delivery terms. Once accepted, custom orders are automatically converted into regular orders for easy tracking."
    },
    {
      question: "What payment methods do customers use?",
      answer: "Customers can pay via Cash on Delivery (COD) or Bank Transfer. For bank transfers, customers upload payment slips as proof of payment, which you can verify before shipping. You can add multiple bank accounts to give customers payment options."
    },
    {
      question: "How do I handle customer reports or verification issues?",
      answer: "Our platform includes a buyer verification system to ensure secure transactions. If you encounter problematic buyers, you can report them through the order management system. Verified buyers display verification badges, indicating they've completed our security verification process."
    },
    {
      question: "How do I track my earnings and performance?",
      answer: "Your dashboard includes detailed earnings analytics with date-range filtering, showing completed orders, average order value, and total revenue. You can track performance over time and identify your best-selling products and peak sales periods."
    },
    {
      question: "What shipping and delivery options do I offer?",
      answer: "You set your own shipping rates and delivery methods. You can offer free shipping zones, charge shipping fees, or combine both. Use reliable courier services and provide tracking information when available to build customer trust."
    },
    {
      question: "How long does it take to receive payments?",
      answer: "For Cash on Delivery orders, you receive payment immediately upon delivery. For bank transfer orders, customers transfer money directly to your account before you ship, so you get paid upfront with payment slip verification."
    },
    {
      question: "Can I sell to customers outside Sri Lanka?",
      answer: "Currently, sina.lk focuses on the Sri Lankan market. You can ship anywhere within Sri Lanka to reach customers from Colombo to Jaffna, giving you access to the entire island's marketplace."
    },
    {
      question: "What makes a successful seller on sina.lk?",
      answer: "Successful sellers focus on quality products, professional photography, detailed descriptions, prompt communication, reliable shipping, and excellent customer service. They actively use features like custom orders, maintain multiple bank accounts for customer convenience, and stay engaged with the messaging system."
    }
  ];

  const benefits = [
    {
      icon: <FiEye className="w-6 h-6" />,
      title: "Reach More Customers",
      description: "Access customers across Sri Lanka who are looking for authentic local products and connect through our messaging system"
    },
    {
      icon: <FiHeart className="w-6 h-6" />,
      title: "Build Your Brand",
      description: "Create a professional online presence with your own shop page, branding, and customer reviews"
    },
    {
      icon: <FiTruck className="w-6 h-6" />,
      title: "Flexible Delivery & Payment",
      description: "Choose your own shipping methods, delivery charges, and offer multiple payment options including COD and bank transfer"
    },
    {
      icon: <FiMessageCircle className="w-6 h-6" />,
      title: "Direct Customer Communication",
      description: "Get customer contact details, use our integrated messaging system, and create custom orders for special requests"
    },
    {
      icon: <FiStar className="w-6 h-6" />,
      title: "Advanced Seller Tools",
      description: "Access earnings analytics, custom order creation, buyer verification insights, and comprehensive order management"
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Secure Payments & Banking",
      description: "Multiple bank account support, payment slip verification system, and secure COD transactions with fraud protection"
    }
  ];

  return (
    <>
      <SEOHead
        title="Seller Guide - How to Start Selling on Sina.lk"
        description="Complete guide for selling authentic Sri Lankan products online. Learn how to create your shop, list products, manage orders, and grow your small business on Sina.lk."
        keywords={generateKeywords([
          'seller guide',
          'how to sell online',
          'Sina.lk selling',
          'start online business',
          'sell crafts online',
          'small business guide',
          'online selling tips',
          'Sri Lankan marketplace'
        ])}
        canonicalUrl={getCanonicalUrl('/seller-guide')}
        structuredData={getArticleStructuredData({
          title: 'Complete Seller Guide for Sina.lk',
          description: 'Step-by-step guide to start selling authentic Sri Lankan products online on Sina.lk',
          author: 'Sina.lk Team',
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
              Start Selling on Sina.lk
            </h1>
            <p className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} mb-8 opacity-90`}>
              Complete guide to building your successful Sri Lankan online business with advanced tools and features
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
                    to={user ? "/dashboard" : "/auth"}
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
              Need help getting started or have questions about selling? We're here to support you!
            </p>
            <div className="flex justify-center">
              <a 
                href="mailto:support@sina.lk" 
                className="flex items-center gap-2 text-[#454955] hover:text-[#72b01d] transition-colors font-medium"
              >
                <FiMapPin className="w-4 h-4" />
                support@sina.lk
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
