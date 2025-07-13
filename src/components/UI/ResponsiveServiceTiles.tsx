import React from 'react';
import type { ReactNode } from 'react';
import ServiceTile from './ServiceTile';
import { useResponsive } from '../../hooks/useResponsive';
import type { Service } from '../../types/service';

interface ResponsiveServiceTilesProps {
  services: Service[];
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: ReactNode;
  className?: string;
}

const ResponsiveServiceTiles: React.FC<ResponsiveServiceTilesProps> = ({
  services,
  onRefresh,
  isLoading = false,
  error = null,
  emptyMessage,
  className = ""
}) => {
  const { isMobile } = useResponsive();

  if (isLoading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-xl h-64 mb-3"></div>
            <div className="bg-gray-200 rounded h-4 mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        {emptyMessage || (
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🔧</div>
            <p className="text-lg">No services found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'} ${className}`}>
      {services.map((service) => (
        <ServiceTile
          key={service.id}
          service={service}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default ResponsiveServiceTiles;
