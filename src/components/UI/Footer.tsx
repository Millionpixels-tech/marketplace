import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiHeart } from 'react-icons/fi';
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
              <Link to="/" state={{ fromInternal: true }} className={`font-black tracking-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                <span className="text-white hover:text-[#72b01d] transition-colors duration-300">
                  Sina<span className="font-light">Marketplace</span>
                </span>
              </Link>
            </div>
            <p className={`text-gray-300 leading-relaxed ${isMobile ? 'text-xs mb-4' : 'text-sm mb-6'}`}>
              Discover authentic Sri Lankan crafts, handmade treasures, and local products. 
              Supporting local artisans and businesses across the beautiful island of Sri Lanka.
            </p>
            <div className={`flex ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
              <a
                href="#"
                className={`bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
              >
                <FiFacebook size={isMobile ? 14 : 16} />
              </a>
              <a
                href="#"
                className={`bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram"
              >
                <FiInstagram size={isMobile ? 14 : 16} />
              </a>
              <a
                href="#"
                className={`bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                onClick={(e) => e.preventDefault()}
                aria-label="Twitter"
              >
                <FiTwitter size={isMobile ? 14 : 16} />
              </a>
            </div>
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

        {/* Contact Info Section */}
        <div className={`border-t border-gray-700 ${isMobile ? 'mt-6 pt-6' : 'mt-8 pt-8'}`}>
          <div className={`gap-6 ${isMobile ? 'grid grid-cols-1 space-y-3' : 'grid grid-cols-1 md:grid-cols-3'}`}>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`bg-[#72b01d] rounded-full flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}>
                <FiMail size={isMobile ? 14 : 16} />
              </div>
              <div>
                <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Email</p>
                <p className={`text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>support@sina.lk</p>
              </div>
            </div>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`bg-[#72b01d] rounded-full flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}>
                <FiPhone size={isMobile ? 14 : 16} />
              </div>
              <div>
                <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Phone</p>
                <p className={`text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>+94 11 123 4567</p>
              </div>
            </div>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`bg-[#72b01d] rounded-full flex items-center justify-center ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}>
                <FiMapPin size={isMobile ? 14 : 16} />
              </div>
              <div>
                <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Address</p>
                <p className={`text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>Colombo, Sri Lanka</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="border-t border-gray-700">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-3' : 'px-4 py-4'}`}>
          <div className={`flex justify-between items-center ${isMobile ? 'flex-col space-y-2 text-center' : 'flex-col md:flex-row space-y-2 md:space-y-0'}`}>
            <div className={`flex items-center space-x-1 text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span>© {currentYear} SinaMarketplace. Made with</span>
              <FiHeart className="text-red-500" size={isMobile ? 12 : 14} />
              <span>in Sri Lanka. All rights reserved.</span>
            </div>
            <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <span>Promoting small businesses islandwide with Sina</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
