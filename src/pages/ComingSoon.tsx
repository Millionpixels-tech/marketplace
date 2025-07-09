import { useResponsive } from "../hooks/useResponsive";
import { SEOHead } from "../components/SEO/SEOHead";
import { getCanonicalUrl } from "../utils/seo";

const ComingSoon = () => {
  const { isMobile } = useResponsive();

  return (
    <>
      <SEOHead
        title="Coming Soon | Sina.lk"
        description="Sri Lanka's premier marketplace is launching soon. Stay tuned for authentic local products and crafts."
        keywords="coming soon, Sri Lankan marketplace, launch, Sina"
        canonicalUrl={getCanonicalUrl('/coming-soon')}
      />
      
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Logo/Brand */}
          <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`font-black tracking-tight uppercase ${isMobile ? 'text-4xl' : 'text-6xl'}`} style={{ color: '#0d0a0b' }}>
              Sina<span className="font-light">Marketplace</span>
            </h1>
          </div>

          {/* Coming Soon Message */}
          <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h2 className={`font-bold ${isMobile ? 'text-2xl mb-4' : 'text-4xl mb-6'}`} style={{ color: '#72b01d' }}>
              Coming Soon
            </h2>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} leading-relaxed max-w-2xl mx-auto`} style={{ color: '#454955' }}>
              We're putting the finishing touches on Sri Lanka's premier marketplace for authentic local products and crafts. 
              Get ready to discover unique creations from talented local artisans.
            </p>
          </div>

          {/* Features Preview */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-8'} ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <div className="text-center">
              <div className={`${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'} mx-auto rounded-2xl flex items-center justify-center`}
                style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                <svg className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className={`font-semibold ${isMobile ? 'text-lg mb-2' : 'text-xl mb-3'}`} style={{ color: '#0d0a0b' }}>
                Authentic Products
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                Discover unique Sri Lankan crafts and products from verified local sellers
              </p>
            </div>

            <div className="text-center">
              <div className={`${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'} mx-auto rounded-2xl flex items-center justify-center`}
                style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                <svg className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className={`font-semibold ${isMobile ? 'text-lg mb-2' : 'text-xl mb-3'}`} style={{ color: '#0d0a0b' }}>
                Zero Listing Fees
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                List your products for free and reach customers across Sri Lanka
              </p>
            </div>

            <div className="text-center">
              <div className={`${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'} mx-auto rounded-2xl flex items-center justify-center`}
                style={{ background: 'linear-gradient(135deg, #72b01d, #3f7d20)' }}>
                <svg className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`font-semibold ${isMobile ? 'text-lg mb-2' : 'text-xl mb-3'}`} style={{ color: '#0d0a0b' }}>
                Secure Trading
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'}`} style={{ color: '#454955' }}>
                Safe and secure transactions with cash on delivery options
              </p>
            </div>
          </div>

          {/* Status */}
          <div className={`${isMobile ? 'py-4 px-6' : 'py-6 px-8'} rounded-2xl border`} 
            style={{ backgroundColor: 'rgba(114, 176, 29, 0.1)', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`} style={{ color: '#72b01d' }}>
              🚀 We're working hard to bring you the best marketplace experience. Thank you for your patience!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoon;
