import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { getOrganizationStructuredData } from '../utils/seo';
import { FiUsers, FiHeart, FiShield, FiFlag, FiMessageCircle, FiMail } from 'react-icons/fi';

export default function CommunityGuidelines() {
  return (
    <>
      <SEOHead
        title="Community Guidelines - SinaMarketplace"
        description="Learn about our community guidelines for creating a safe, respectful marketplace that celebrates Sri Lankan culture and craftsmanship."
        keywords="community guidelines, marketplace rules, safe shopping, Sri Lanka community, respectful trading, platform rules"
        canonicalUrl="https://sinamarketplace.com/community-guidelines"
        noIndex={false}
        structuredData={getOrganizationStructuredData()}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8d17] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <FiUsers className="mx-auto text-5xl mb-4 text-green-100" />
          <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-xl text-green-100">
            Creating a safe, respectful, and thriving marketplace for everyone
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Introduction */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiHeart className="text-[#72b01d] text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Our Community</h2>
          </div>
          
          <p className="text-gray-700 mb-4">
            SinaMarketplace is more than just a trading platform – we're a community that celebrates 
            Sri Lankan culture, craftsmanship, and creativity. These guidelines help ensure that everyone 
            can participate safely and respectfully in our marketplace.
          </p>
          
          <p className="text-gray-700">
            By using our platform, you agree to follow these guidelines. We reserve the right to remove 
            content or restrict access for violations of these rules.
          </p>
        </section>

        {/* Core Values */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Core Values</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiHeart className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Respect</h3>
                  <p className="text-gray-600 text-sm">
                    Treat all community members with dignity and courtesy, regardless of background or beliefs.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiShield className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Authenticity</h3>
                  <p className="text-gray-600 text-sm">
                    Be honest in your listings, descriptions, and interactions with other users.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiUsers className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Community</h3>
                  <p className="text-gray-600 text-sm">
                    Support fellow artisans and sellers while building positive relationships.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FiMessageCircle className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Communication</h3>
                  <p className="text-gray-600 text-sm">
                    Maintain professional and constructive communication in all interactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's Allowed */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Encourage</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>Authentic Sri Lankan products:</strong> Handcrafted items, traditional crafts, 
                local foods, and cultural artifacts
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>Detailed product descriptions:</strong> Clear photos, accurate measurements, 
                material information, and cultural context
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>Cultural storytelling:</strong> Share the history, tradition, or personal story 
                behind your products
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>Constructive feedback:</strong> Honest, helpful reviews that assist other buyers 
                and help sellers improve
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>Professional communication:</strong> Prompt responses to inquiries and 
                respectful customer service
              </p>
            </div>
          </div>
        </section>

        {/* What's Not Allowed */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiFlag className="text-red-500 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-900">Prohibited Content & Behavior</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Restrictions</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Counterfeit or replica items claiming to be authentic</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Illegal wildlife products or endangered species items</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Weapons, drugs, or other illegal substances</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Stolen or misrepresented cultural artifacts</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Behavioral Guidelines</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Harassment, bullying, or discriminatory language</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Spam, excessive self-promotion, or irrelevant content</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">False reviews or manipulated ratings</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Attempting to conduct transactions outside the platform</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seller Guidelines */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Guidelines for Sellers</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Listings</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Use clear, high-quality photos showing the actual product</li>
                <li>• Provide accurate descriptions including materials and dimensions</li>
                <li>• Set fair prices that reflect the value and craftsmanship</li>
                <li>• Include shipping information and processing times</li>
                <li>• Disclose any flaws or imperfections honestly</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Respond to inquiries within 24-48 hours</li>
                <li>• Ship items promptly and provide tracking information</li>
                <li>• Handle returns and disputes professionally</li>
                <li>• Maintain consistent quality across all products</li>
                <li>• Honor your return and refund policies</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Buyer Guidelines */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Guidelines for Buyers</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Making Purchases</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Read product descriptions and seller policies carefully</li>
                <li>• Ask questions before purchasing if you need clarification</li>
                <li>• Respect sellers' processing and shipping timeframes</li>
                <li>• Use secure payment methods provided by the platform</li>
                <li>• Understand that handmade items may have slight variations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Feedback</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Leave honest, constructive reviews based on your experience</li>
                <li>• Focus on product quality, shipping, and customer service</li>
                <li>• Contact sellers directly before leaving negative reviews</li>
                <li>• Avoid personal attacks or inappropriate language</li>
                <li>• Update reviews if issues are resolved satisfactorily</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Reporting & Enforcement */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reporting & Enforcement</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Report Issues</h3>
              <p className="text-gray-700 mb-4">
                If you encounter content or behavior that violates these guidelines, please report it to us. 
                We take all reports seriously and investigate them promptly.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What to include in your report:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Specific details about the issue</li>
                  <li>• Screenshots or evidence when possible</li>
                  <li>• URLs or user information</li>
                  <li>• Your contact information for follow-up</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Response</h3>
              <p className="text-gray-700 mb-4">
                Depending on the severity of the violation, we may take various actions including:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Minor Violations</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Warning messages</li>
                    <li>• Content removal</li>
                    <li>• Educational guidance</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Serious Violations</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Temporary suspension</li>
                    <li>• Permanent account ban</li>
                    <li>• Legal action if necessary</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Questions or Concerns?</h2>
          <p className="text-gray-300 mb-6">
            If you have questions about these guidelines or need to report an issue, we're here to help.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">community@sina.lk</p>
            <p className="text-gray-400">+94 11 123 4567</p>
            <p className="text-gray-400 text-sm">
              Community support available 24/7
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
    </>
  );
}
