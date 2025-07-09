import { Link } from "react-router-dom";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { FiHome, FiSearch, FiShoppingBag, FiArrowLeft } from "react-icons/fi";
import { useResponsive } from "../hooks/useResponsive";

export default function NotFound() {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title="Page Not Found - Sina.lk"
        description="The page you're looking for doesn't exist. Browse our marketplace for amazing products from local sellers."
        noIndex={true}
      />
      
      <ResponsiveHeader />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full text-center">
          {/* 404 Illustration */}
          <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
            <div className="relative">
              <h1 className={`${isMobile ? 'text-8xl' : 'text-9xl'} font-bold text-gray-100 select-none`}>
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiShoppingBag className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} text-[#72b01d]`} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4`}>
                Oops! Page Not Found
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The page you're looking for doesn't exist or has been moved. 
                Don't worry, there are plenty of amazing products waiting for you!
              </p>
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'} mt-8`}>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#72b01d] text-white font-semibold rounded-xl hover:bg-[#5a8c17] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FiHome className="w-5 h-5" />
                Go to Homepage
              </Link>
              
              <Link
                to="/search"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white text-[#72b01d] font-semibold rounded-xl border-2 border-[#72b01d] hover:bg-[#72b01d] hover:text-white transition-all duration-200"
              >
                <FiSearch className="w-5 h-5" />
                Browse Products
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                Go Back
              </button>
            </div>
          </div>

          {/* Additional Help */}
          <div className={`mt-12 pt-8 border-t border-gray-200 ${isMobile ? 'text-sm' : ''}`}>
            <p className="text-gray-500 mb-4">
              Still can't find what you're looking for?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                to="/help" 
                className="text-[#72b01d] hover:text-[#5a8c17] font-medium"
              >
                Help Center
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/contact" 
                className="text-[#72b01d] hover:text-[#5a8c17] font-medium"
              >
                Contact Us
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/about" 
                className="text-[#72b01d] hover:text-[#5a8c17] font-medium"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
