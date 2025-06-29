import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { getOrganizationStructuredData } from "../utils/seo";
import { FiShield, FiEye, FiLock, FiMail, FiCalendar } from "react-icons/fi";
import { useResponsive } from "../hooks/useResponsive";

export default function PrivacyPolicy() {
  const { isMobile } = useResponsive();
  const lastUpdated = "June 14, 2025";

  const sections = [
    {
      title: "Information We Collect",
      icon: <FiEye className="w-6 h-6" />,
      content: [
        {
          subtitle: "Personal Information",
          details: "We collect information you provide directly to us, such as when you create an account, make a purchase, contact sellers, or use our messaging system. This includes your name, email address, phone number, shipping address, and payment information for bank transfers or cash on delivery orders."
        },
        {
          subtitle: "Usage Information", 
          details: "We automatically collect information about how you use our website, including your IP address, browser type, pages visited, time spent on pages, and other analytics data to improve our services."
        },
        {
          subtitle: "Device Information",
          details: "We may collect information about the device you use to access our services, including device type, operating system, and mobile device identifiers."
        }
      ]
    },
    {
      title: "How We Use Your Information",
      icon: <FiShield className="w-6 h-6" />,
      content: [
        {
          subtitle: "Service Delivery",
          details: "We use your information to provide, maintain, and improve our marketplace services, process transactions, facilitate communication between buyers and sellers, manage custom orders, and provide customer support."
        },
        {
          subtitle: "Communication",
          details: "We may send you service-related emails about your orders, account updates, important platform changes, and responses to your inquiries. We do not send promotional marketing emails unless you specifically opt in."
        },
        {
          subtitle: "Security & Fraud Prevention",
          details: "We use your information to detect, prevent, and address fraud, security issues, and other harmful activities on our platform."
        },
        {
          subtitle: "Legal Compliance",
          details: "We may use your information to comply with applicable laws, regulations, and legal processes."
        }
      ]
    },
    {
      title: "Information Sharing",
      icon: <FiLock className="w-6 h-6" />,
      content: [
        {
          subtitle: "With Sellers",
          details: "When you make a purchase or send a custom order request, we share necessary information with sellers to fulfill your order, including your name, contact information, shipping address, and order details. This enables direct communication between buyers and sellers."
        },
        {
          subtitle: "Service Providers",
          details: "We work with trusted third-party service providers for essential functions such as hosting, data storage, and basic analytics. They only receive information necessary to perform their specific services and are bound by confidentiality agreements."
        },
        {
          subtitle: "Legal Requirements",
          details: "We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety."
        },
        {
          subtitle: "Business Transfers",
          details: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction."
        }
      ]
    },
    {
      title: "Data Security",
      icon: <FiShield className="w-6 h-6" />,
      content: [
        {
          subtitle: "Protection Measures",
          details: "We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
        },
        {
          subtitle: "Payment Security",
          details: "For bank transfer payments, we securely store payment confirmation details provided by users. For Cash on Delivery orders, no financial information is stored. We do not process or store credit card information directly."
        },
        {
          subtitle: "Data Transmission",
          details: "We use SSL encryption to protect data transmitted between your device and our servers."
        }
      ]
    },
    {
      title: "Your Rights and Choices",
      icon: <FiEye className="w-6 h-6" />,
      content: [
        {
          subtitle: "Account Information",
          details: "You can review and update your account information at any time by logging into your dashboard."
        },
        {
          subtitle: "Marketing Communications",
          details: "We do not send promotional or marketing emails unless you specifically request them. All our communications are service-related and necessary for your use of the platform."
        },
        {
          subtitle: "Data Access & Deletion",
          details: "You have the right to request access to your personal information, request corrections, or request deletion of your account and associated data."
        },
        {
          subtitle: "Cookie Preferences",
          details: "You can manage cookie preferences through your browser settings, though some features may not function properly if you disable certain cookies."
        }
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: <FiEye className="w-6 h-6" />,
      content: [
        {
          subtitle: "Essential Cookies",
          details: "We use cookies that are necessary for the website to function, including authentication, security, and basic functionality."
        },
        {
          subtitle: "Analytics Cookies",
          details: "We use basic analytics to understand how users interact with our website, helping us improve our services and user experience. We do not use extensive tracking or third-party advertising cookies."
        },
        {
          subtitle: "Marketing Cookies",
          details: "We do not currently use marketing or advertising cookies. Our focus is on providing essential marketplace functionality rather than advertising tracking."
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Privacy Policy - Sina.lk"
        description="Learn about how Sina.lk collects, uses, and protects your personal information. Our privacy policy for the Sri Lankan marketplace platform."
        keywords="privacy policy, data protection, personal information, Sri Lanka, marketplace privacy, Sina.lk"
        canonicalUrl="https://sina.lk/privacy"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <div className="min-h-screen bg-white">
        <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white py-8 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>Privacy Policy</h1>
          <p className={`text-green-100 mb-6 ${isMobile ? 'text-base' : 'text-xl'}`}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <div className={`flex items-center justify-center space-x-2 text-green-100 ${isMobile ? 'text-sm' : ''}`}>
            <FiCalendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className={`${isMobile ? 'py-6' : 'py-12'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
          <div className={`bg-blue-50 border-l-4 border-blue-400 ${isMobile ? 'p-4 mb-6' : 'p-6 mb-8'}`}>
            <div className="flex items-center mb-4">
              <FiShield className={`text-blue-600 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <h2 className={`font-bold text-blue-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>Our Commitment to Your Privacy</h2>
            </div>
            <p className={`text-blue-800 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
              At Sina.lk, we are committed to protecting your privacy and ensuring transparency about how we handle your personal information. This Privacy Policy applies to all users of our marketplace website and services.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isMobile ? 'pb-8' : 'pb-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
          <div className={`${isMobile ? 'space-y-6' : 'space-y-12'}`}>
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className={`bg-gray-50 border-b border-gray-200 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                  <div className="flex items-center">
                    <div className={`text-[#72b01d] mr-3`}>{section.icon}</div>
                    <h2 className={`font-bold text-[#0d0a0b] ${isMobile ? 'text-lg' : 'text-2xl'}`}>{section.title}</h2>
                  </div>
                </div>
                
                <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h3 className={`font-semibold text-[#0d0a0b] mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>{item.subtitle}</h3>
                        <p className={`text-gray-600 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className={`bg-gray-50 ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <h2 className={`font-bold mb-4 text-[#0d0a0b] ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Questions About This Policy?</h2>
          <p className={`text-gray-600 mb-8 ${isMobile ? 'text-base' : 'text-lg'}`}>
            If you have any questions about this Privacy Policy or how we handle your information, please don't hesitate to contact us.
          </p>
          
          <div className={`bg-white rounded-lg shadow-md inline-block ${isMobile ? 'p-6' : 'p-8'}`}>
            <div className={`flex items-center justify-center mb-4 ${isMobile ? 'flex-col space-y-2' : ''}`}>
              <FiMail className={`text-[#72b01d] ${isMobile ? 'w-6 h-6 mb-2' : 'w-8 h-8 mr-3'}`} />
              <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
                <div className={`font-semibold text-[#0d0a0b] ${isMobile ? 'text-sm' : ''}`}>Support Team</div>
                <a href="mailto:support@sina.lk" className={`text-[#72b01d] hover:underline ${isMobile ? 'text-sm' : ''}`}>
                  support@sina.lk
                </a>
              </div>
            </div>
            <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              We respond to privacy and support inquiries as quickly as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Updates Notice */}
      <div className={`${isMobile ? 'py-6' : 'py-12'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'}`}>
          <div className={`bg-yellow-50 border-l-4 border-yellow-400 ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center mb-2">
              <FiCalendar className={`text-yellow-600 mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <h3 className={`font-semibold text-yellow-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Policy Updates</h3>
            </div>
            <p className={`text-yellow-800 ${isMobile ? 'text-sm' : ''}`}>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
    </>
  );
}
