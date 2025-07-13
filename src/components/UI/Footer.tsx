import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useResponsive } from '../../hooks/useResponsive';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isMobile } = useResponsive();

  const footerLinks = {
    marketplace: [
      { name: 'How to Sell', href: '/seller-guide' },
      { name: 'Browse Items', href: '/search' },
      { name: 'Categories', href: '/search' },
      { name: 'Featured Products', href: '/search' },
    ],
    support: [
      { name: 'Help Center', href: '/help-center' },
      { name: 'Customer Service', href: '/customer-service' },
      { name: 'Returns & Refunds', href: '/returns-refunds' },
      { name: 'Shipping Info', href: '/shipping-info' },
    ],
    company: [
      { name: 'About Us', href: '/about-us' },
      { name: 'Our Story', href: '/our-story' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
      { name: 'Community Guidelines', href: '/community-guidelines' },
    ]
  };

  return (
    <footer className="bg-gradient-to-br from-[#0d0a0b] to-[#2a2a2a] text-white">
      {/* Main Footer Content */}
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-4 py-12'}`}>
        <div className={`gap-8 ${isMobile ? 'grid grid-cols-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5'}`}>
          {/* Brand Section */}
          <div className={`${isMobile ? 'col-span-2 mb-6' : 'lg:col-span-1 md:col-span-2 lg:col-span-1'}`}>
            <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
              <Link to="/" state={{ fromInternal: true }} className="block">
                <img 
                  src="/sina-logo-white.svg" 
                  alt="Sina.lk Logo" 
                  className={`hover:opacity-80 transition-opacity duration-300 ${isMobile ? 'h-5' : 'h-7'} w-auto`}
                />
              </Link>
            </div>
            <p className={`text-gray-300 leading-relaxed ${isMobile ? 'text-xs mb-4' : 'text-sm mb-6'}`}>
              Your platform for selling products, services, and digital content in Sri Lanka. Connecting entrepreneurs with customers across the island.
              Discover everything from traditional crafts to modern services.
            </p>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className={`font-semibold text-[#72b01d] ${isMobile ? 'text-base mb-3' : 'text-lg mb-4'}`}>Marketplace</h3>
            <ul className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className={`font-semibold text-[#72b01d] ${isMobile ? 'text-base mb-3' : 'text-lg mb-4'}`}>Support</h3>
            <ul className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className={`font-semibold text-[#72b01d] ${isMobile ? 'text-base mb-3' : 'text-lg mb-4'}`}>Company</h3>
            <ul className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className={`font-semibold text-[#72b01d] ${isMobile ? 'text-base mb-3' : 'text-lg mb-4'}`}>Legal</h3>
            <ul className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="border-t border-gray-700">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-3' : 'px-4 py-4'}`}>
          <div className={`flex justify-between items-center ${isMobile ? 'flex-col space-y-2 text-center' : 'flex-col md:flex-row space-y-2 md:space-y-0'}`}>
            <div className={`flex items-center space-x-1 text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span>© {currentYear} Sina.lk. Made with</span>
              <FiHeart className="text-red-500" size={isMobile ? 12 : 14} />
              <span>in Sri Lanka. All rights reserved.</span>
            </div>
            <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span>Connect with local businesses across Sri Lanka</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
