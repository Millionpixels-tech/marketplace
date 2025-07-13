import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
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
      <div className="p-4 flex flex-col justify-between h-48">
        {/* Top section with title and packages */}
        <div className="flex-1">
          {/* Title - exactly 2 lines */}
          <h3 className="font-bold text-lg text-gray-900 mb-4 leading-tight" 
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

          {/* Packages Available */}
          {hasPackages && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 font-medium">
                {service.packages.length} package{service.packages.length !== 1 ? 's' : ''} available
              </div>
            </div>
          )}
        </div>

        {/* Bottom section with price - always at bottom */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between">
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
            
            {/* Rating - only show if rating exists and is greater than 0 */}
            <div className="flex items-center">
              {service.rating && service.rating > 0 ? (
                <div className="flex items-center gap-1">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                  {service.reviewCount && service.reviewCount > 0 ? (
                    <span className="text-xs text-gray-500">({service.reviewCount})</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceTile;
