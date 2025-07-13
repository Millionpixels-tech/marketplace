import { Link } from "react-router-dom";
import { 
  FiPackage, 
  FiTool,
  FiZap,
  FiArrowRight,
  FiUsers,
  FiTrendingUp,
  FiCheck,
  FiStar,
  FiHeart,
  FiShield
} from "react-icons/fi";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { AdvancedSEOHead } from "../components/SEO/AdvancedSEOHead";
import { getWebsiteStructuredData, getCanonicalUrl } from "../utils/seo";
import { combineSchemas, generateWebsiteSearchSchema, generateMarketplaceSchema } from "../utils/advancedSchemaMarkup";
import { generateOptimizedKeywords, TITLE_TEMPLATES, META_DESCRIPTION_TEMPLATES } from "../utils/keywordStrategy";

const Home = () => {
  return (
    <>
      <AdvancedSEOHead
        title={TITLE_TEMPLATES.home()}
        description={META_DESCRIPTION_TEMPLATES.general('Home')}
        keywords={generateOptimizedKeywords('Sri Lankan marketplace')}
        canonicalUrl={getCanonicalUrl('/')}
        ogImage="https://sina.lk/logo.svg"
        ogType="website"
        structuredData={combineSchemas(
          generateWebsiteSearchSchema(),
          generateMarketplaceSchema(),
          getWebsiteStructuredData()
        )}
        priority="high"
        changeFreq="daily"
        breadcrumbs={[
          { name: 'Home', url: 'https://sina.lk/' }
        ]}
      />
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-gray-50 to-green-50 py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#72b01d] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                <FiZap className="w-4 h-4" />
                100% Free Platform
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#0d0a0b] leading-tight mb-8">
                Build Your 
                <span className="text-[#72b01d] block">Digital Empire</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
                The most powerful platform for Sri Lankan entrepreneurs to sell 
                <span className="font-bold text-[#72b01d]"> products</span> and 
                <span className="font-bold text-[#72b01d]"> services</span> online
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link
                  to="/create-shop"
                  className="group bg-[#72b01d] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#3f7d20] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  Start Selling Today
                  <FiArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/search"
                  className="group border-2 border-[#72b01d] text-[#72b01d] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#72b01d] hover:text-white transition-all duration-300"
                >
                  Explore Marketplace
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <FiPackage className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Sell Products</h3>
                  <p className="text-gray-600">Physical and digital products</p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <FiTool className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Offer Services</h3>
                  <p className="text-gray-600">Professional services & skills</p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <FiTrendingUp className="w-12 h-12 text-[#72b01d] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Grow Business</h3>
                  <p className="text-gray-600">Analytics & growth tools</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We Give 100% Free Platform */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-[#0d0a0b] mb-6">
                Why 100% Free?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We believe in empowering Sri Lankan entrepreneurs without financial barriers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#72b01d] transition-colors duration-300">
                  <FiHeart className="w-10 h-10 text-[#72b01d] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-[#0d0a0b] mb-4">Support Local Economy</h3>
                <p className="text-gray-600 leading-relaxed">
                  We invest in Sri Lanka's digital future by removing barriers that prevent talented entrepreneurs from starting their journey online.
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#72b01d] transition-colors duration-300">
                  <FiUsers className="w-10 h-10 text-[#72b01d] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-[#0d0a0b] mb-4">Build Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  When entrepreneurs succeed, communities thrive. Our free platform creates opportunities for everyone to participate in the digital economy.
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#72b01d] transition-colors duration-300">
                  <FiShield className="w-10 h-10 text-[#72b01d] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-[#0d0a0b] mb-4">Trust & Transparency</h3>
                <p className="text-gray-600 leading-relaxed">
                  No hidden fees, no commission cuts, no surprise charges. What you earn is what you keep - it's that simple and transparent.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <div className="bg-green-50 rounded-2xl p-8 max-w-4xl mx-auto border border-green-100">
                <h3 className="text-3xl font-bold text-[#0d0a0b] mb-4">Forever Free Promise</h3>
                <p className="text-lg text-gray-700 mb-6">
                  We commit to keeping our core platform 100% free for Sri Lankan entrepreneurs, today and always.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-[#72b01d] font-semibold">
                  <span className="flex items-center gap-2">
                    <FiCheck className="w-5 h-5" /> No Listing Fees
                  </span>
                  <span className="flex items-center gap-2">
                    <FiCheck className="w-5 h-5" /> No Commission
                  </span>
                  <span className="flex items-center gap-2">
                    <FiCheck className="w-5 h-5" /> No Hidden Charges
                  </span>
                  <span className="flex items-center gap-2">
                    <FiCheck className="w-5 h-5" /> No Monthly Fees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Need */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-[#0d0a0b] mb-6">
                What We Need
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Simple requirements to join our thriving marketplace community
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#72b01d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiPackage className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Quality Products or Services</h3>
                    <p className="text-gray-600">
                      Offer genuine, quality products or professional services that add value to customers' lives.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#72b01d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiHeart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Passion for Excellence</h3>
                    <p className="text-gray-600">
                      Commitment to providing excellent customer service and building lasting relationships.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#72b01d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Honest Business Practices</h3>
                    <p className="text-gray-600">
                      Operate with integrity, transparency, and respect for customers and fellow entrepreneurs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#72b01d] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0d0a0b] mb-2">Growth Mindset</h3>
                    <p className="text-gray-600">
                      Willingness to learn, adapt, and grow your business with our platform and community.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-[#0d0a0b] mb-6">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-8">
                  If you have what it takes, join thousands of successful Sri Lankan entrepreneurs already growing their businesses on our platform.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d]" />
                    <span className="text-gray-700">Create your shop in minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d]" />
                    <span className="text-gray-700">List unlimited products & services</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d]" />
                    <span className="text-gray-700">Access powerful business tools</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d]" />
                    <span className="text-gray-700">Connect with customers nationwide</span>
                  </div>
                </div>

                <Link
                  to="/create-shop"
                  className="w-full bg-[#72b01d] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3f7d20] transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <FiZap className="w-5 h-5" />
                  Join Our Community
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Grow Your Business With Us */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-[#0d0a0b] mb-6">
                Grow Your Business With Us
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Powerful tools and features designed to help Sri Lankan entrepreneurs scale their businesses
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              <div>
                <h3 className="text-3xl font-bold text-[#0d0a0b] mb-8">Comprehensive Business Tools</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiTrendingUp className="w-6 h-6 text-[#72b01d]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#0d0a0b] mb-2">Advanced Analytics</h4>
                      <p className="text-gray-600">
                        Track sales, understand customer behavior, and make data-driven decisions to grow your business.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiUsers className="w-6 h-6 text-[#72b01d]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#0d0a0b] mb-2">Customer Management</h4>
                      <p className="text-gray-600">
                        Build relationships with integrated messaging, order management, and customer support tools.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiZap className="w-6 h-6 text-[#72b01d]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#0d0a0b] mb-2">Marketing Automation</h4>
                      <p className="text-gray-600">
                        Automated promotional tools, SEO optimization, and social media integration to reach more customers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiShield className="w-6 h-6 text-[#72b01d]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#0d0a0b] mb-2">Secure Payments</h4>
                      <p className="text-gray-600">
                        Multiple payment options including cash on delivery, bank transfers, and digital wallets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8">
                <h4 className="text-2xl font-bold text-[#0d0a0b] mb-6">Success Statistics</h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#72b01d] mb-2">95%</div>
                    <div className="text-gray-600">Customer Satisfaction</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#72b01d] mb-2">10K+</div>
                    <div className="text-gray-600">Active Entrepreneurs</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#72b01d] mb-2">50K+</div>
                    <div className="text-gray-600">Products & Services</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#72b01d] mb-2">₨2M+</div>
                    <div className="text-gray-600">Monthly Sales Volume</div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-white rounded-xl">
                  <h5 className="font-bold text-[#0d0a0b] mb-3">Ready to Join the Success Story?</h5>
                  <p className="text-gray-600 mb-4">Start your entrepreneurial journey today and become part of Sri Lanka's thriving digital economy.</p>
                  <Link
                    to="/create-shop"
                    className="w-full bg-[#72b01d] text-white py-3 rounded-lg font-semibold hover:bg-[#3f7d20] transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    Get Started Now
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Sri Lanka Needs Entrepreneurs */}
        <section className="bg-[#0d0a0b] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Why Sri Lanka Needs <span className="text-[#72b01d]">Entrepreneurs</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Building the future of Sri Lanka's digital economy, one entrepreneur at a time
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-3xl font-bold mb-8">Economic Impact</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-[#72b01d] mb-2">Job Creation</h4>
                    <p className="text-gray-300">
                      Every successful entrepreneur creates employment opportunities, contributing to reduced unemployment and economic growth across the nation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-[#72b01d] mb-2">Innovation Hub</h4>
                    <p className="text-gray-300">
                      Entrepreneurs drive innovation, bringing new solutions to local challenges and positioning Sri Lanka as a competitive player in the global market.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-[#72b01d] mb-2">Economic Diversification</h4>
                    <p className="text-gray-300">
                      Small and medium enterprises create a resilient economy by reducing dependence on traditional industries and large corporations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-2xl p-8">
                <h4 className="text-2xl font-bold mb-6">Digital Transformation Goals</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Increase digital literacy and adoption</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Develop local e-commerce capabilities</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Reduce economic inequality through opportunity</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Build sustainable business ecosystems</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Foster innovation and creativity</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-[#72b01d] flex-shrink-0" />
                    <span className="text-gray-300">Connect rural areas to digital markets</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-[#72b01d] rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">Be the Change</div>
                    <div className="text-sm opacity-90">Sri Lanka needs you</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold mb-6">Join the Movement</h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Be part of Sri Lanka's entrepreneurial revolution. Your business success contributes to national prosperity.
              </p>
              <Link
                to="/create-shop"
                className="inline-flex items-center gap-3 bg-[#72b01d] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#3f7d20] transition-colors duration-300"
              >
                <FiZap className="w-5 h-5" />
                Start Your Impact Today
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-[#0d0a0b] mb-6">
                Success Stories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real entrepreneurs, real results. See how our platform has transformed businesses across Sri Lanka.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">SA</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0d0a0b]">Samantha Abeysekera</h4>
                    <p className="text-gray-600">Handmade Jewelry Designer</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "Started with just 5 jewelry pieces. Now I'm earning LKR 150,000+ monthly and shipping island-wide. This platform changed my life completely!"
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">RP</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0d0a0b]">Ravindu Perera</h4>
                    <p className="text-gray-600">Web Development Services</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "From freelancing to running a full web agency. The platform's service booking system helped me scale from solo developer to a team of 8!"
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#72b01d] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">NK</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0d0a0b]">Niluka Kumari</h4>
                    <p className="text-gray-600">Organic Food Products</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "My village's organic products now reach Colombo families daily. What started as a small farm venture became a sustainable business supporting 20+ farmers."
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-[#0d0a0b] mb-4">Join Thousands of Success Stories</h3>
                <p className="text-gray-600 mb-6">
                  Every month, hundreds of new entrepreneurs start their journey on our platform. Your success story could be next.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/create-shop"
                    className="bg-[#72b01d] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#3f7d20] transition-colors duration-300"
                  >
                    Start Your Story
                  </Link>
                  <Link
                    to="/success-stories"
                    className="border border-[#72b01d] text-[#72b01d] px-8 py-3 rounded-xl font-semibold hover:bg-[#72b01d] hover:text-white transition-colors duration-300"
                  >
                    Read More Stories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join Our Community */}
        <section className="bg-[#72b01d] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Join Our Community
              </h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto mb-12 leading-relaxed">
                Connect with like-minded entrepreneurs, share experiences, and grow together in Sri Lanka's most supportive business community.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiUsers className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Network & Learn</h3>
                  <p className="opacity-90 leading-relaxed">
                    Connect with successful entrepreneurs, mentors, and industry experts who share knowledge and opportunities.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiHeart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Support & Guidance</h3>
                  <p className="opacity-90 leading-relaxed">
                    Get help when you need it most. Our community provides business advice, technical support, and moral encouragement.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiTrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Collaborate & Grow</h3>
                  <p className="opacity-90 leading-relaxed">
                    Find collaboration opportunities, joint ventures, and partnerships that accelerate your business growth.
                  </p>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-2xl p-8 max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-6">Ready to Join?</h3>
                <p className="text-lg opacity-90 mb-8">
                  Become part of Sri Lanka's fastest-growing entrepreneur community. Free to join, lifetime access to opportunities.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-white flex-shrink-0" />
                    <span>Weekly business workshops</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-white flex-shrink-0" />
                    <span>Exclusive networking events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-white flex-shrink-0" />
                    <span>Mentorship programs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-white flex-shrink-0" />
                    <span>Business collaboration opportunities</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/create-shop"
                    className="bg-white text-[#72b01d] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    <FiZap className="w-5 h-5" />
                    Start Your Journey
                  </Link>
                  <Link
                    to="/community"
                    className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-[#72b01d] transition-colors duration-300"
                  >
                    Explore Community
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;
