import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiBriefcase, FiHeart, FiGlobe, FiUsers, FiMail } from 'react-icons/fi';

export default function Careers() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Careers - SinaMarketplace"
        description="Join our mission to connect Sri Lankan artisans with the world. Explore career opportunities at SinaMarketplace."
        keywords={generateKeywords([
          'careers',
          'jobs',
          'Sri Lankan marketplace',
          'remote work',
          'employment',
          'artisan platform'
        ])}
        canonicalUrl={getCanonicalUrl('/careers')}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8d17] text-white">
          <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-4 py-16'} text-center`}>
            <FiBriefcase className={`mx-auto ${isMobile ? 'text-5xl' : 'text-6xl'} mb-6 text-green-100`} />
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-6`}>Join Our Team</h1>
            <p className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} text-green-100`}>
              Help us connect Sri Lankan artisans with the world
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
        
        {/* Why Work With Us */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Work With SinaMarketplace?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <FiHeart className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Meaningful Impact</h3>
                  <p className="text-gray-600">
                    Every day, you'll be helping Sri Lankan artisans and small businesses reach global markets 
                    and build sustainable livelihoods.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <FiGlobe className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Reach</h3>
                  <p className="text-gray-600">
                    Work on a platform that connects cultures and communities across continents, 
                    promoting Sri Lankan heritage worldwide.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <FiUsers className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Culture</h3>
                  <p className="text-gray-600">
                    Join a diverse, passionate team that values creativity, innovation, and 
                    cultural appreciation.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What We Offer</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Competitive salary and benefits</li>
                <li>• Flexible working arrangements</li>
                <li>• Professional development opportunities</li>
                <li>• Health and wellness benefits</li>
                <li>• Opportunity to travel and meet artisans</li>
                <li>• Employee discounts on marketplace products</li>
                <li>• Collaborative and inclusive work environment</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Current Openings */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Current Openings</h2>
          
          <div className="space-y-6">
            {/* Job Posting 1 */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Senior Frontend Developer</h3>
                  <p className="text-gray-600">Technology • Full-time • Remote/Colombo</p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  New
                </span>
              </div>
              <p className="text-gray-700 mb-4">
                Join our tech team to build and enhance our marketplace platform. You'll work on creating 
                intuitive user experiences for both sellers and buyers, focusing on performance and accessibility.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">React</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">TypeScript</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Node.js</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Firebase</span>
              </div>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Learn More →
              </button>
            </div>

            {/* Job Posting 2 */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Artisan Relations Coordinator</h3>
                  <p className="text-gray-600">Community • Full-time • Colombo/Travel required</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              </div>
              <p className="text-gray-700 mb-4">
                Build relationships with artisans and craftspeople across Sri Lanka. Help them showcase 
                their work, provide training on digital tools, and ensure quality standards.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Community Building</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Cultural Knowledge</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Project Management</span>
              </div>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Learn More →
              </button>
            </div>

            {/* Job Posting 3 */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Customer Success Manager</h3>
                  <p className="text-gray-600">Customer Experience • Full-time • Remote</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Ensure exceptional customer experiences for our global buyer community. Handle inquiries, 
                resolve issues, and work with sellers to maintain service quality.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Customer Service</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Communication</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Problem Solving</span>
              </div>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Learn More →
              </button>
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Apply</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Application</h3>
              <p className="text-gray-600 text-sm">
                Send your resume and cover letter explaining why you're passionate about our mission.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Initial Interview</h3>
              <p className="text-gray-600 text-sm">
                Phone or video call to discuss your background and interest in the role.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#72b01d] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Final Round</h3>
              <p className="text-gray-600 text-sm">
                Meet the team and complete any role-specific assessments or projects.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-300 mb-6">
            We're always looking for passionate individuals who share our vision of supporting 
            Sri Lankan artisans and promoting cultural heritage.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">careers@sina.lk</p>
            <p className="text-gray-400 text-sm">
              Even if you don't see a perfect match above, we'd love to hear from you!
            </p>
          </div>
        </section>
      </div>

      <Footer />
      </div>
    </>
  );
}
