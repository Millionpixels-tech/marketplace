import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1 md:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Link to="/" className="text-2xl font-black tracking-tight">
                <span className="text-white hover:text-[#72b01d] transition-colors duration-300">
                  Sina<span className="font-light">Marketplace</span>
                </span>
              </Link>
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Discover authentic Sri Lankan crafts, handmade treasures, and local products. 
              Supporting local artisans and businesses across the beautiful island of Sri Lanka.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
              >
                <FiFacebook size={16} />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300"
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram"
              >
                <FiInstagram size={16} />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#72b01d] transition-colors duration-300"
                onClick={(e) => e.preventDefault()}
                aria-label="Twitter"
              >
                <FiTwitter size={16} />
              </a>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#72b01d]">Marketplace</h3>
            <ul className="space-y-2">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#72b01d]">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#72b01d]">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#72b01d]">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white hover:text-[#72b01d] transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center">
                <FiMail size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-sm text-white">support@sina.lk</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center">
                <FiPhone size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-sm text-white">+94 11 123 4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#72b01d] rounded-full flex items-center justify-center">
                <FiMapPin size={16} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-sm text-white">Colombo, Sri Lanka</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>© {currentYear} SinaMarketplace. Made with</span>
              <FiHeart className="text-red-500" size={14} />
              <span>in Sri Lanka. All rights reserved.</span>
            </div>
            <div className="text-sm text-gray-400">
              <span>Promoting Sri Lankan craftsmanship worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
