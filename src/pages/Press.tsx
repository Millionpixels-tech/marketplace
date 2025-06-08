import Footer from '../components/UI/Footer';
import { FiFileText, FiUsers, FiMail, FiCalendar } from 'react-icons/fi';

export default function Press() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <FiFileText className="text-[#72b01d] text-3xl" />
            <h1 className="text-3xl font-bold text-gray-900">Press & Media</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Media resources, press releases, and information about SinaMarketplace for journalists and media professionals.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Press Kit */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Press Kit</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Assets</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Logo Package (PNG, SVG)</span>
                  <button className="text-[#72b01d] text-sm font-medium hover:text-[#5a8d17]">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Brand Guidelines</span>
                  <button className="text-[#72b01d] text-sm font-medium hover:text-[#5a8d17]">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Product Screenshots</span>
                  <button className="text-[#72b01d] text-sm font-medium hover:text-[#5a8d17]">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Executive Photos</span>
                  <button className="text-[#72b01d] text-sm font-medium hover:text-[#5a8d17]">
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded:</span>
                  <span className="text-gray-900 font-medium">2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Headquarters:</span>
                  <span className="text-gray-900 font-medium">Colombo, Sri Lanka</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Sellers:</span>
                  <span className="text-gray-900 font-medium">500+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Countries Served:</span>
                  <span className="text-gray-900 font-medium">60+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Categories:</span>
                  <span className="text-gray-900 font-medium">15+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mission:</span>
                  <span className="text-gray-900 font-medium">Connect Sri Lankan artisans globally</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Press Releases */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Press Releases</h2>
          
          <div className="space-y-6">
            <article className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <FiCalendar size={14} />
                <span>December 15, 2024</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                SinaMarketplace Expands to 60+ Countries, Connecting Sri Lankan Artisans Worldwide
              </h3>
              <p className="text-gray-700 mb-3">
                Leading Sri Lankan e-commerce platform announces major milestone in international expansion, 
                now serving customers across six continents and supporting over 500 local sellers.
              </p>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Read Full Release →
              </button>
            </article>

            <article className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <FiCalendar size={14} />
                <span>November 28, 2024</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Traditional Craft Revival: How Digital Platforms Are Preserving Sri Lankan Heritage
              </h3>
              <p className="text-gray-700 mb-3">
                SinaMarketplace partners with UNESCO Sri Lanka to launch artisan training programs, 
                helping traditional craftspeople adapt to digital commerce while preserving cultural techniques.
              </p>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Read Full Release →
              </button>
            </article>

            <article className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <FiCalendar size={14} />
                <span>October 10, 2024</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                SinaMarketplace Launches Sustainability Initiative for Eco-Friendly Packaging
              </h3>
              <p className="text-gray-700 mb-3">
                New program introduces biodegradable packaging options and carbon-neutral shipping 
                for international orders, reinforcing commitment to environmental responsibility.
              </p>
              <button className="text-[#72b01d] font-medium hover:text-[#5a8d17]">
                Read Full Release →
              </button>
            </article>
          </div>
        </section>

        {/* Media Coverage */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">In the News</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">The Daily Mirror, Sri Lanka</div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  "Bridging Tradition and Technology"
                </h4>
                <p className="text-sm text-gray-600">
                  Feature story on how SinaMarketplace is helping traditional artisans reach global markets...
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Tech in Asia</div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  "Sri Lankan E-commerce Platform Making Waves"
                </h4>
                <p className="text-sm text-gray-600">
                  Analysis of SinaMarketplace's growth and impact on the regional e-commerce landscape...
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Sri Lankan Airlines Magazine</div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  "Showcasing Island Craftsmanship"
                </h4>
                <p className="text-sm text-gray-600">
                  Interview with founders about preserving Sri Lankan cultural heritage through commerce...
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Startup Sri Lanka</div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  "From Local to Global: A Success Story"
                </h4>
                <p className="text-sm text-gray-600">
                  Profile of SinaMarketplace's journey from startup to international platform...
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Awards & Recognition */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Awards & Recognition</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#72b01d] mb-2">2024</div>
              <h3 className="font-semibold text-gray-900 mb-2">Best E-commerce Platform</h3>
              <p className="text-sm text-gray-600">Sri Lanka Digital Awards</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#72b01d] mb-2">2024</div>
              <h3 className="font-semibold text-gray-900 mb-2">Cultural Preservation Initiative</h3>
              <p className="text-sm text-gray-600">UNESCO Sri Lanka Recognition</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#72b01d] mb-2">2023</div>
              <h3 className="font-semibold text-gray-900 mb-2">Startup of the Year</h3>
              <p className="text-sm text-gray-600">Ceylon Chamber of Commerce</p>
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FiUsers className="text-[#72b01d] text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Leadership Team</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900">Samantha Perera</h3>
              <p className="text-gray-600 mb-2">CEO & Co-Founder</p>
              <p className="text-sm text-gray-500">
                Former tech executive with 15 years in e-commerce and digital transformation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900">Rajitha Fernando</h3>
              <p className="text-gray-600 mb-2">CTO & Co-Founder</p>
              <p className="text-sm text-gray-500">
                Technology leader specializing in scalable platforms and user experience design.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 text-center">
          <FiMail className="mx-auto text-4xl mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
          <p className="text-gray-300 mb-6">
            For press inquiries, interview requests, or additional information, please contact our media team.
          </p>
          <div className="space-y-2">
            <p className="text-green-400 font-medium">press@sina.lk</p>
            <p className="text-gray-400">+94 11 123 4567</p>
            <p className="text-gray-400 text-sm">
              Response time: 24-48 hours for media inquiries
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
