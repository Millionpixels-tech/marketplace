import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { useResponsive } from "../hooks/useResponsive";
import { getOrganizationStructuredData } from "../utils/seo";
import { FiFileText, FiUser, FiShoppingBag, FiCreditCard, FiShield, FiAlertTriangle, FiCalendar } from "react-icons/fi";

export default function TermsOfService() {
  const { isMobile } = useResponsive();
  const lastUpdated = "June 14, 2025";

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: <FiFileText className="w-6 h-6" />,
      content: [
        {
          subtitle: "Agreement",
          details: "By accessing and using Sina.lk, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
        },
        {
          subtitle: "Eligibility",
          details: "You must be at least 18 years old to use our services. By using Sina.lk, you represent and warrant that you have the legal capacity to enter into these terms."
        },
        {
          subtitle: "Changes to Terms",
          details: "We reserve the right to modify these terms at any time. We will notify users of any material changes, and continued use of our services constitutes acceptance of the updated terms."
        }
      ]
    },
    {
      title: "User Accounts",
      icon: <FiUser className="w-6 h-6" />,
      content: [
        {
          subtitle: "Account Creation",
          details: "You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the confidentiality of your account credentials."
        },
        {
          subtitle: "Account Responsibility",
          details: "You are responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account."
        },
        {
          subtitle: "Account Termination",
          details: "We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or for any other reason at our discretion."
        }
      ]
    },
    {
      title: "Buying and Selling",
      icon: <FiShoppingBag className="w-6 h-6" />,
      content: [
        {
          subtitle: "Product Listings",
          details: "Sellers are responsible for accurate product descriptions, pricing, and availability. All products must comply with applicable laws and our community guidelines."
        },
        {
          subtitle: "Purchase Process",
          details: "By placing an order, you enter into a direct contractual relationship with the seller. Sina.lk facilitates the transaction but is not a party to the sale. Custom orders may require additional communication between buyers and sellers."
        },
        {
          subtitle: "Order Fulfillment",
          details: "Sellers are responsible for fulfilling orders in a timely manner and as described. Buyers can communicate with sellers directly through our messaging system to discuss order details and requirements."
        },
        {
          subtitle: "Returns and Refunds",
          details: "Return and refund policies are set by individual sellers. Buyers should review these policies before making a purchase. Sina.lk may assist in dispute resolution when necessary."
        }
      ]
    },
    {
      title: "Payments and Fees",
      icon: <FiCreditCard className="w-6 h-6" />,
      content: [
        {
          subtitle: "Payment Processing",
          details: "We support bank transfers and cash on delivery (COD) payments. For bank transfers, buyers upload payment confirmation which is verified by sellers. For COD orders, payment is made directly to the seller upon delivery."
        },
        {
          subtitle: "Seller Fees",
          details: "Sellers may be subject to transaction fees and other charges as outlined in our seller agreement. Current fee structure will be clearly communicated to sellers when they join the platform."
        },
        {
          subtitle: "Pricing",
          details: "Prices are set by individual sellers and displayed in Sri Lankan Rupees (LKR). Shipping charges, if applicable, are determined by sellers and will be clearly indicated before order confirmation."
        },
        {
          subtitle: "Currency",
          details: "All transactions are processed in Sri Lankan Rupees (LKR) unless otherwise specified."
        }
      ]
    },
    {
      title: "Prohibited Activities",
      icon: <FiAlertTriangle className="w-6 h-6" />,
      content: [
        {
          subtitle: "Prohibited Items",
          details: "You may not sell illegal items, counterfeit products, items that infringe intellectual property rights, or items that violate our community guidelines."
        },
        {
          subtitle: "Fraudulent Activity",
          details: "Any fraudulent activity, including but not limited to fake listings, payment fraud, or identity theft, is strictly prohibited and may result in legal action."
        },
        {
          subtitle: "Platform Misuse",
          details: "You may not use our platform for spam, harassment, spreading malware, or any other activity that disrupts our services or harms other users."
        },
        {
          subtitle: "Circumventing Platform",
          details: "Attempting to conduct transactions outside of our platform or directing buyers to external payment methods that bypass our system is prohibited and may result in account suspension."
        }
      ]
    },
    {
      title: "Intellectual Property",
      icon: <FiShield className="w-6 h-6" />,
      content: [
        {
          subtitle: "Platform Content",
          details: "All content on Sina.lk, including but not limited to text, graphics, logos, and software, is owned by us or our licensors and is protected by intellectual property laws."
        },
        {
          subtitle: "User Content",
          details: "You retain ownership of content you upload, but grant us a license to use, display, and distribute your content in connection with our services."
        },
        {
          subtitle: "Respect Rights",
          details: "You must respect the intellectual property rights of others. We will respond to valid claims of copyright infringement in accordance with applicable law."
        },
        {
          subtitle: "Trademark Use",
          details: "You may not use our trademarks, logos, or brand elements without our prior written permission."
        }
      ]
    },
    {
      title: "Limitation of Liability",
      icon: <FiShield className="w-6 h-6" />,
      content: [
        {
          subtitle: "Service Availability",
          details: "While we strive for high availability, we cannot guarantee uninterrupted access to our services. We are not liable for any damages resulting from service interruptions."
        },
        {
          subtitle: "Third-Party Actions",
          details: "We are not responsible for the actions of buyers, sellers, or other third parties using our platform. Users interact at their own risk."
        },
        {
          subtitle: "Damage Limitation",
          details: "To the maximum extent permitted by law, our liability for any damages is limited to the amount you paid for our services in the 12 months preceding the claim."
        },
        {
          subtitle: "Indemnification",
          details: "You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of our services or violation of these terms."
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Terms of Service - Sina.lk"
        description="Read our comprehensive terms of service that govern the use of Sina.lk, Sri Lanka's marketplace platform connecting buyers and sellers."
        keywords="terms of service, user agreement, marketplace terms, Sri Lanka, legal agreement, platform rules"
        canonicalUrl="https://sina.lk/terms"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <div className="min-h-screen bg-white">
        <ResponsiveHeader />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-[#72b01d] to-[#5a8f17] text-white ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-4'} text-center`}>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4`}>Terms of Service</h1>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-green-100 mb-6`}>
            Please read these terms carefully before using Sina.lk services.
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
              <FiFileText className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-blue-900">Welcome to Sina.lk</h2>
            </div>
            <p className="text-blue-800 leading-relaxed">
              These Terms of Service govern your use of Sina.lk and the services we provide. By using our platform, you agree to these terms in full. These terms help ensure a safe and fair marketplace for all users.
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

      {/* Important Notice */}
      <div className="bg-red-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg p-8 shadow-md border-l-4 border-red-400">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-bold text-red-900">Important Notice</h2>
            </div>
            <p className="text-red-800 leading-relaxed mb-4">
              Violation of these terms may result in account suspension, termination, or legal action. We encourage all users to familiarize themselves with these terms and our community guidelines to ensure a positive experience for everyone.
            </p>
            <p className="text-red-800 leading-relaxed">
              If you have questions about these terms or need clarification on any point, please contact our support team before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#0d0a0b]">Questions About These Terms?</h2>
          <p className="text-lg text-gray-600 mb-8">
            If you have any questions about these Terms of Service, please contact our legal team.
          </p>
          
          <div className="bg-white rounded-lg p-8 shadow-md inline-block">
            <div className="flex items-center justify-center mb-4">
              <FiFileText className="w-8 h-8 text-[#72b01d] mr-3" />
              <div className="text-left">
                <div className="font-semibold text-[#0d0a0b]">Support Team</div>
                <a href="mailto:support@sina.lk" className="text-[#72b01d] hover:underline">
                  support@sina.lk
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              We respond to inquiries as quickly as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Governing Law */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold text-[#0d0a0b] mb-4">Governing Law</h3>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of Sri Lanka. Any disputes arising from these terms or your use of Sina.lk will be subject to the exclusive jurisdiction of the courts of Sri Lanka.
            </p>
          </div>
        </div>        </div>

        <Footer />
      </div>
    </>
  );
}
