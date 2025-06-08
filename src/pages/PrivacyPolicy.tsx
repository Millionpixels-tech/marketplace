import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";
import { FiShield, FiEye, FiLock, FiMail, FiCalendar } from "react-icons/fi";

export default function PrivacyPolicy() {
  const lastUpdated = "June 8, 2025";

  const sections = [
    {
      title: "Information We Collect",
      icon: <FiEye className="w-6 h-6" />,
      content: [
        {
          subtitle: "Personal Information",
          details: "We collect information you provide directly to us, such as when you create an account, make a purchase, contact us, or participate in our services. This includes your name, email address, phone number, shipping address, and payment information."
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
          details: "We use your information to provide, maintain, and improve our marketplace services, process transactions, and communicate with you about your orders and account."
        },
        {
          subtitle: "Communication",
          details: "We may send you service-related emails, promotional materials (with your consent), and important updates about our platform and policies."
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
          details: "When you make a purchase, we share necessary information with sellers to fulfill your order, including your name, shipping address, and contact information."
        },
        {
          subtitle: "Service Providers",
          details: "We work with trusted third-party service providers for payment processing, shipping, analytics, and other business functions. They only receive information necessary to perform their services."
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
          subtitle: "Secure Payments",
          details: "All payment information is processed through secure, PCI-compliant payment processors. We do not store your complete payment card information on our servers."
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
          details: "You can opt out of promotional emails by clicking the unsubscribe link in any marketing email or by updating your preferences in your account settings."
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
          details: "We use analytics tools to understand how users interact with our website, helping us improve our services and user experience."
        },
        {
          subtitle: "Marketing Cookies",
          details: "With your consent, we may use cookies for advertising and marketing purposes to show you relevant content and advertisements."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-green-100 mb-6">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <div className="flex items-center justify-center space-x-2 text-green-100">
            <FiCalendar className="w-5 h-5" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <div className="flex items-center mb-4">
              <FiShield className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-blue-900">Our Commitment to Your Privacy</h2>
            </div>
            <p className="text-blue-800 leading-relaxed">
              At SinaMarketplace, we are committed to protecting your privacy and ensuring transparency about how we handle your personal information. This Privacy Policy applies to all users of our website and services.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="text-[#72b01d] mr-3">{section.icon}</div>
                    <h2 className="text-2xl font-bold text-[#0d0a0b]">{section.title}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h3 className="text-lg font-semibold text-[#0d0a0b] mb-2">{item.subtitle}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.details}</p>
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
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#0d0a0b]">Questions About This Policy?</h2>
          <p className="text-lg text-gray-600 mb-8">
            If you have any questions about this Privacy Policy or how we handle your information, please don't hesitate to contact us.
          </p>
          
          <div className="bg-white rounded-lg p-8 shadow-md inline-block">
            <div className="flex items-center justify-center mb-4">
              <FiMail className="w-8 h-8 text-[#72b01d] mr-3" />
              <div className="text-left">
                <div className="font-semibold text-[#0d0a0b]">Privacy Officer</div>
                <a href="mailto:privacy@sina.lk" className="text-[#72b01d] hover:underline">
                  privacy@sina.lk
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              We typically respond to privacy inquiries within 48 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Updates Notice */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <div className="flex items-center mb-2">
              <FiCalendar className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-900">Policy Updates</h3>
            </div>
            <p className="text-yellow-800">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
