import React from 'react';
import { Link } from 'react-router-dom';
import { serviceCategoryIcons } from '../../utils/serviceCategories';
import type { Service } from '../../types/service';

interface ServiceTileProps {
  service: Service;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}

const ServiceTile: React.FC<ServiceTileProps> = ({ 
  service, 
  className = ""
}) => {
  // Safety check for packages
  const hasPackages = service.packages && service.packages.length > 0;
  const minPrice = hasPackages ? Math.min(...service.packages.map(pkg => pkg.price)) : 0;
  const maxPrice = hasPackages ? Math.max(...service.packages.map(pkg => pkg.price)) : 0;

  return (
    <Link 
      to={`/service/${service.id}`}
      className={`block bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer h-full ${className}`}
    >
      {/* Service Image */}
      <div className="relative h-64 bg-gray-100">
        {service.images && service.images.length > 0 ? (
          <img 
            src={service.images[0]} 
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#72b01d] to-[#3f7d20]">
            <span className="text-4xl text-white">
              {(() => {
                const IconComponent = serviceCategoryIcons[service.category];
                return IconComponent ? <IconComponent className="w-8 h-8" /> : <span className="text-2xl">🔧</span>;
              })()}
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {service.category}
          </span>
        </div>
        
        {/* Delivery Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            service.deliveryType === 'Online' 
              ? 'bg-blue-100 text-blue-700'
              : service.deliveryType === 'Onsite'
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {service.deliveryType}
          </span>
        </div>
      </div>

      {/* Service Content */}
      <div className="p-4 pb-6 flex flex-col">
        {/* Top section with title and packages */}
        <div className="flex-1">
          {/* Title - exactly 2 lines */}
          <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '3.5rem',
                maxHeight: '3.5rem'
              }}>
            {service.title}
          </h3>

          {/* Rating - show under title with consistent spacing */}
          <div className="flex items-center gap-2 mb-2 min-h-[22px]">
            {service.rating && service.rating > 0 ? (
              <>
                <span className="flex items-center text-[#72b01d]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      className="inline-block"
                      fill={i <= Math.round(service.rating!) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  <span className="ml-1 text-xs font-bold text-[#3f7d20]">
                    {service.rating.toFixed(1)}
                  </span>
                </span>
                <span className="text-xs text-[#72b01d]">
                  ({service.reviewCount || 0})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </div>

          {/* Packages Available */}
          {hasPackages && (
            <div className="mb-6">
              <div className="text-sm text-gray-600 font-medium">
                {service.packages.length} package{service.packages.length !== 1 ? 's' : ''} available
              </div>
            </div>
          )}
        </div>

        {/* Bottom section with price */}
        <div className="mt-auto">
          {hasPackages && minPrice > 0 ? (
            <div>
              <span className="text-xs text-gray-500">Starting from</span>
              <div className="font-bold text-lg">
                LKR {minPrice.toLocaleString()}
                {minPrice !== maxPrice && (
                  <span className="text-sm text-gray-500"> - LKR {maxPrice.toLocaleString()}</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <span className="text-sm text-gray-500">Contact for pricing</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ServiceTile;
