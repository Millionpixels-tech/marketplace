import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getOrganizationStructuredData } from '../utils/seo';
import { FiShield, FiEye, FiLock, FiDatabase, FiGlobe, FiMail } from 'react-icons/fi';

export default function CookiePolicy() {
  const { isMobile } = useResponsive();
  const lastUpdated = "June 14, 2025";
  return (
    <>
      <SEOHead
        title="Cookie Policy - Sina.lk"
        description="Learn how Sina.lk uses cookies and similar technologies to enhance your browsing experience and maintain essential website functionality."
        keywords="cookie policy, privacy, web cookies, Sina.lk marketplace"
        canonicalUrl="https://sina.lk/cookies"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-8'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <FiShield className={`text-[#72b01d] ${isMobile ? 'text-2xl' : 'text-3xl'}`} />
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>Cookie Policy</h1>
          </div>
          <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Learn how Sina.lk uses cookies and similar technologies to enhance your browsing experience.
          </p>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* What Are Cookies */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiEye className="text-[#72b01d] text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">What Are Cookies?</h2>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you 
              visit our website. They help us provide you with a better experience by remembering your preferences 
              and understanding how you use our platform.
            </p>
            
            <p className="text-gray-700">
              We use both session cookies (which expire when you close your browser) and persistent cookies 
              (which remain on your device for a set period or until you delete them).
            </p>
          </div>
        </section>

        {/* Types of Cookies */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiDatabase className="text-[#72b01d] text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Types of Cookies We Use</h2>
          </div>
          
          <div className="space-y-6">
            {/* Essential Cookies */}
            <div className="border-l-4 border-[#72b01d] pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
              <p className="text-gray-700 mb-3">
                These cookies are necessary for the website to function properly. They enable core functionality 
                such as security, network management, and accessibility.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Authentication cookies to keep you logged in</li>
                  <li>• Security cookies to protect against fraud</li>
                  <li>• Basic functionality for the marketplace</li>
                  <li>• Language and region preferences</li>
                </ul>
              </div>
            </div>

            {/* Performance Cookies */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Cookies</h3>
              <p className="text-gray-700 mb-3">
                We use basic analytics to understand how visitors use our website, helping us improve 
                our services. This information is collected anonymously.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Basic website analytics</li>
                  <li>• Page load performance tracking</li>
                  <li>• Error reporting for technical issues</li>
                  <li>• General usage patterns</li>
                </ul>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
              <p className="text-gray-700 mb-3">
                These cookies enhance the functionality of our website and help remember your preferences 
                for a better user experience.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Remembering your display preferences</li>
                  <li>• Recently viewed products</li>
                  <li>• Basic user interface preferences</li>
                  <li>• Language and region settings</li>
                </ul>
              </div>
            </div>

            {/* Note: No Marketing Cookies */}
            <div className="border-l-4 border-gray-400 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing & Advertising Cookies</h3>
              <p className="text-gray-700 mb-3">
                <strong>We do not use marketing or advertising cookies.</strong> Sina.lk does not engage in 
                extensive user tracking, advertising networks, or retargeting campaigns.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">What we don't do:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No advertising network tracking</li>
                  <li>• No retargeting or remarketing</li>
                  <li>• No cross-site user profiling</li>
                  <li>• No third-party advertising cookies</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiGlobe className="text-[#72b01d] text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Third-Party Services</h2>
          </div>
          
          <p className="text-gray-700 mb-6">
            We use minimal third-party services that may set cookies on our website. 
            These are limited to:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Basic Analytics</h3>
              <p className="text-sm text-gray-600 mb-2">
                We use minimal analytics to understand basic website usage patterns.
              </p>
              <p className="text-xs text-gray-500">
                Data is collected anonymously and aggregated only
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Firebase</h3>
              <p className="text-sm text-gray-600 mb-2">
                Powers our authentication, database, and basic platform functionality.
              </p>
              <p className="text-xs text-gray-500">
                Essential for account management and messaging
              </p>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What we don't use:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• No external payment processor cookies (we use manual bank transfers and COD)</li>
              <li>• No social media tracking or sharing buttons</li>
              <li>• No advertising networks or marketing platforms</li>
              <li>• No extensive user profiling or behavioral tracking</li>
            </ul>
          </div>
        </section>

        {/* Managing Cookies */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiLock className="text-[#72b01d] text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Managing Your Cookie Preferences</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                You can control and/or delete cookies as you wish. You can delete all cookies that are 
                already on your computer and you can set most browsers to prevent them from being placed.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Chrome</h4>
                  <p className="text-gray-600">Settings → Privacy and security → Cookies and other site data</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Firefox</h4>
                  <p className="text-gray-600">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Safari</h4>
                  <p className="text-gray-600">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Edge</h4>
                  <p className="text-gray-600">Settings → Cookies and site permissions → Cookies and site data</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Important Note</h4>
              <p className="text-yellow-700 text-sm">
                If you disable or refuse cookies, please note that some parts of our website may become 
                inaccessible or not function properly. Essential cookies cannot be disabled as they are 
                necessary for the basic functioning of our platform.
              </p>
            </div>
          </div>
        </section>

        {/* Updates to Policy */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Updates to This Policy</h2>
          
          <p className="text-gray-700 mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We will notify you of any material 
            changes by posting the updated policy on our website.
          </p>
          
          <p className="text-gray-700">
            We encourage you to review this policy periodically to stay informed about how we use cookies 
            and similar technologies.
          </p>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Questions About Cookies?</h2>
          <p className="text-gray-300 mb-6">
            If you have any questions about our use of cookies or this Cookie Policy, please contact us.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">support@sina.lk</p>
            <p className="text-gray-400 text-sm">
              We'll respond to your privacy questions as soon as possible
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
    </>
  );
}
