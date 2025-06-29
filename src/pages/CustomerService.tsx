import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiMail, FiClock, FiHelpCircle, FiLifeBuoy } from 'react-icons/fi';

export default function CustomerService() {
  const { isMobile } = useResponsive();

  const contactMethods = [
    {
      icon: <FiMail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get comprehensive help via email for all your questions",
      contact: "support@sina.lk",
      contactHref: "mailto:support@sina.lk",
      responseTime: "Response within 24 hours",
      available: true
    }
  ];

  const commonIssues = [
    {
      title: "Order & Payment Issues",
      description: "Problems with orders, payment slip uploads, bank transfers, COD, or delivery delays",
      needsEmail: true
    },
    {
      title: "Account Verification",
      description: "Account verification process, buyer reports, verification badge, or order restrictions",
      needsEmail: true
    },
    {
      title: "Custom Orders & Shop Management",
      description: "Custom order creation, shop setup, product listings, bank account management, or earnings tracking",
      needsEmail: true
    },
    {
      title: "Technical Issues",
      description: "Login problems, website errors, messaging system issues, or mobile app difficulties",
      needsEmail: true
    },
    {
      title: "Seller Support",
      description: "Questions about selling policies, buyer verification system, reporting buyers, or marketplace features",
      needsEmail: true
    },
    {
      title: "General Inquiries",
      description: "Questions about marketplace policies, Sri Lankan shipping, or platform features",
      needsEmail: true
    }
  ];

  return (
    <>
      <SEOHead
        title="Customer Service - Sina.lk Marketplace"
        description="Get comprehensive email support for orders, custom orders, payment issues, account verification, and all marketplace questions. Contact support@sina.lk for help."
        keywords={generateKeywords([
          'customer service',
          'email support',
          'help',
          'contact',
          'Sri Lankan marketplace',
          'custom orders',
          'payment support',
          'account verification'
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
            Get comprehensive email support for all your marketplace questions and issues. We're here to help with orders, payments, verification, and more.
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
            <div className="flex justify-center">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-8 text-center hover:shadow-md transition-shadow max-w-md w-full">
                  <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-white">
                      {method.icon}
                    </div>
                  </div>
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold mb-3 text-gray-900`}>
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-6">{method.description}</p>
                  <a
                    href={method.contactHref}
                    className="text-[#72b01d] hover:text-[#5a8a16] font-medium text-xl"
                  >
                    {method.contact}
                  </a>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500 mt-3`}>
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
                    href="mailto:support@sina.lk"
                    className="inline-flex items-center text-[#72b01d] hover:text-[#5a8a16] font-medium"
                  >
                    Email Support
                    <FiMail className="w-4 h-4 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Tips */}
          <section className="bg-white rounded-xl shadow-sm p-8">
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 text-center mb-6`}>
              Getting Help
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <FiClock className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Response Times:</strong> We respond to all emails within 24 hours during business days. Complex issues may require additional time for proper resolution.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiHelpCircle className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Before Emailing:</strong> Check our Help Center for instant answers about custom orders, payment slips, account verification, and common marketplace questions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiMail className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>When Contacting Support:</strong> Include your order number, account email, and detailed description of the issue. For payment problems, mention if you're using COD or bank transfer.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FiLifeBuoy className="w-5 h-5 text-[#72b01d] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Account Verification:</strong> For verification badge issues or buyer reports, email us with your account details. We review all verification requests and reports carefully.
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
