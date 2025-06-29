import ResponsiveHeader from '../components/UI/ResponsiveHeader';
import Footer from '../components/UI/Footer';
import { SEOHead } from '../components/SEO/SEOHead';
import { useResponsive } from '../hooks/useResponsive';
import { getCanonicalUrl, generateKeywords } from '../utils/seo';
import { FiBriefcase, FiHeart, FiUsers, FiMail } from 'react-icons/fi';

export default function Careers() {
  const { isMobile } = useResponsive();
  
  return (
    <>
      <SEOHead
        title="Careers - Sina.lk"
        description="Join Sina.lk in the future. Learn about our mission to support Sri Lankan businesses through our marketplace platform. No current openings, but we welcome expressions of interest."
        keywords={generateKeywords([
          'careers',
          'jobs',
          'Sina.lk marketplace',
          'future opportunities',
          'Sri Lankan business platform'
        ])}
        canonicalUrl={getCanonicalUrl('/careers')}
      />
      <ResponsiveHeader />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#72b01d] to-[#5a8d17] text-white">
          <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-4 py-16'} text-center`}>
            <FiBriefcase className={`mx-auto ${isMobile ? 'text-5xl' : 'text-6xl'} mb-6 text-green-100`} />
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-6`}>Careers</h1>
            <p className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} text-green-100`}>
              Building the future of Sri Lankan digital commerce
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-4 py-12'}`}>
        
        {/* Why Work With Us */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Working at Sina.lk</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <FiHeart className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Meaningful Work</h3>
                  <p className="text-gray-600">
                    Contribute to supporting small businesses across Sri Lanka by building and 
                    maintaining technology that helps them succeed online.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <FiUsers className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Impact</h3>
                  <p className="text-gray-600">
                    Work on a platform that directly benefits Sri Lankan entrepreneurs and 
                    contributes to the country's digital economy growth.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <FiBriefcase className="text-[#72b01d] text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Opportunities</h3>
                  <p className="text-gray-600">
                    Be part of a growing platform with opportunities to learn, develop skills, 
                    and take on new challenges as we expand.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Values</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Supporting local business growth</li>
                <li>• Building reliable, user-friendly technology</li>
                <li>• Maintaining high standards of service</li>
                <li>• Transparent and honest business practices</li>
                <li>• Continuous learning and improvement</li>
                <li>• Collaborative problem-solving</li>
                <li>• Customer-focused approach</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Current Openings */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Current Openings</h2>
          
          <div className="text-center py-12">
            <FiBriefcase className="mx-auto text-6xl text-gray-300 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Current Openings</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We don't have any job openings at the moment, but we're always interested in hearing 
              from talented individuals who are passionate about supporting Sri Lankan businesses 
              through technology.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Interested in Future Opportunities?</h4>
              <p className="text-gray-600 text-sm">
                Send us your resume and a note about your interests. We'll keep your information 
                on file and reach out when relevant positions become available.
              </p>
            </div>
          </div>
        </section>

        {/* Future Opportunities */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Areas We May Hire For</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Technology</h3>
              <p className="text-gray-600 text-sm">
                Platform development, security, and user experience improvements.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Support</h3>
              <p className="text-gray-600 text-sm">
                Helping sellers and buyers with platform questions and issues.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Development</h3>
              <p className="text-gray-600 text-sm">
                Growing our seller community and expanding platform capabilities.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Interested in Our Mission?</h2>
          <p className="text-gray-300 mb-6">
            While we don't have open positions right now, we're always interested in connecting 
            with people who share our vision of supporting Sri Lankan businesses.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">careers@sina.lk</p>
            <p className="text-gray-400 text-sm">
              Feel free to send us your resume and tell us about your interests and background.
            </p>
          </div>
        </section>
      </div>

      <Footer />
      </div>
    </>
  );
}
