import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiMail, FiPhone, FiMessageCircle, FiClock, FiHelpCircle, FiLifeBuoy } from 'react-icons/fi';

export default function CustomerService() {
  const { isMobile } = useResponsive();

  const contactMethods = [
    {
      icon: <FiMail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get detailed help via email",
      contact: "support@sina.lk",
      contactHref: "mailto:support@sina.lk",
      responseTime: "Response within 24 hours",
      available: true
    },
    {
      icon: <FiPhone className="w-6 h-6" />,
      title: "Phone Support", 
      description: "Speak directly with our team",
      contact: "+94 11 123 4567",
      contactHref: "tel:+94111234567",
      responseTime: "Mon-Fri 9AM-6PM",
      available: true
    },
    {
      icon: <FiMessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with us in real-time",
      contact: "Start Chat",
      contactHref: "#",
      responseTime: "Usually responds instantly",
      available: false
    }
  ];

  const commonIssues = [
    {
      title: "Order Issues",
      description: "Problems with your order, delivery delays, or order cancellations",
      link: "/help-center#orders"
    },
    {
      title: "Payment Problems", 
      description: "Payment failures, refunds, or billing questions",
      link: "/help-center#payments"
    },
    {
      title: "Account Help",
      description: "Login issues, account settings, or profile updates",
      link: "/help-center#account"
    },
    {
      title: "Seller Support",
      description: "Questions about selling, shop management, or seller policies",
      link: "/help-center#selling"
    }
  ];

  return (
    <>
      <SEOHead
        title="Customer Service - SinaMarketplace"
        description="Get help from our dedicated customer service team. Contact us via email, phone, or chat for support with orders, payments, and account issues."
        keywords={generateKeywords([
          'customer service',
          'support',
          'help',
          'contact',
          'Sri Lankan marketplace',
          'customer support'
        ])}
        canonicalUrl={getCanonicalUrl('/customer-service')}
      />
      <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <div className="flex items-center justify-center mb-6">
            <FiLifeBuoy className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-white`} />
          </div>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4`}>Customer Service</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-green-100 mb-6`}>
            We're here to help! Get in touch with our support team for any questions or assistance.
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
          
          {/* Contact Methods */}
          <section className={`mb-${isMobile ? '8' : '12'}`}>
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 text-center mb-${isMobile ? '6' : '8'}`}>
              Get In Touch
            </h2>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-3 gap-6'}`}>
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-white">
                      {method.icon}
                    </div>
                  </div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2 text-gray-900`}>
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  {method.available ? (
                    <a
                      href={method.contactHref}
                      className="text-[#72b01d] hover:text-[#5a8a16] font-medium text-lg"
                    >
                      {method.contact}
                    </a>
                  ) : (
                    <span className="text-gray-400 font-medium">Coming Soon</span>
                  )}
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                    {method.responseTime}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Common Issues */}
          <section className={`mb-${isMobile ? '8' : '12'}`}>
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 text-center mb-${isMobile ? '6' : '8'}`}>
              Common Issues
            </h2>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
              {commonIssues.map((issue, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-3 text-gray-900`}>
                    {issue.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{issue.description}</p>
                  <a
                    href={issue.link}
                    className="inline-flex items-center text-[#72b01d] hover:text-[#5a8a16] font-medium"
                  >
                    Learn More
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Tips */}
          <section className="bg-white rounded-xl shadow-sm p-8">
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 text-center mb-6`}>
              Quick Tips
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FiClock className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Response Times:</strong> Email support typically responds within 24 hours during business days.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiHelpCircle className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Before Contacting:</strong> Check our Help Center for instant answers to common questions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiMessageCircle className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Order Issues:</strong> Have your order number ready when contacting support for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
