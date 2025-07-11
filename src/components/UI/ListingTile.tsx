import React from 'react';
import { Link } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { FiTruck, FiPackage, FiDownload } from 'react-icons/fi';
import type { DeliveryType as DeliveryTypeType } from '../../types/enums';
import { ItemType } from '../../utils/categories';

interface ReviewStats {
  avg: number | null;
  count: number;
}

interface Listing {
  id: string;
  name?: string;
  price?: number;
  images?: string[];
  description?: string;
  createdAt?: any;
  itemType?: string; // Add itemType for digital product support
  deliveryType?: DeliveryTypeType;
  cashOnDelivery?: boolean;
  wishlist?: Array<{ ip?: string; ownerId?: string; }>;
  // Legacy reviews field - to be phased out
  reviews?: any[];
  // New optimized review stats
  reviewStats?: {
    rating: number | null;
    count: number;
  };
}

interface ListingTileProps {
  listing: Listing;
  onRefresh?: () => void;
  compact?: boolean; // For search page with reduced padding
  className?: string;
}

// Get review statistics for a listing
function getReviewStats(listing: Listing): ReviewStats {
  // Use optimized review stats if available
  if (listing.reviewStats) {
    return {
      avg: listing.reviewStats.rating,
      count: listing.reviewStats.count
    };
  }
  
  // Fallback to no reviews for performance
  return { avg: null, count: 0 };
}

const ListingTile: React.FC<ListingTileProps> = ({ 
  listing, 
  onRefresh, 
  compact = false,
  className = ""
}) => {
  const stats = getReviewStats(listing);
  const padding = compact ? "p-3" : "p-4";
  const imageMargin = compact ? "mb-3" : "mb-4";

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`group flex flex-col rounded-2xl shadow-lg transition-all duration-300 ${padding} relative cursor-pointer border hover:shadow-xl hover:-translate-y-1 ${className}`}
      style={{
        textDecoration: 'none',
        backgroundColor: '#ffffff',
        borderColor: 'rgba(114, 176, 29, 0.3)'
      }}
    >
      {/* Image */}
      <div className={`w-full aspect-square rounded-xl ${imageMargin} flex items-center justify-center overflow-hidden border transition-all duration-300 group-hover:shadow-md`}
        style={{
          backgroundColor: '#ffffff',
          borderColor: 'rgba(114, 176, 29, 0.2)'
        }}>
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl" style={{ color: '#454955' }}>🖼️</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-extrabold text-lg mb-1 truncate transition-colors duration-300"
        style={{ color: '#0d0a0b' }}>
        {listing.name}
      </h3>

      {/* Reviews */}
      <div className="flex items-center gap-2 mb-1 min-h-[22px]">
        {stats.avg ? (
          <>
            <span className="flex items-center" style={{ color: '#72b01d' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <svg
                  key={i}
                  width="16"
                  height="16"
                  className="inline-block"
                  fill={i <= Math.round(stats.avg!) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span className="ml-1 text-xs font-bold" style={{ color: '#3f7d20' }}>
                {stats.avg.toFixed(1)}
              </span>
            </span>
            <span className="text-xs" style={{ color: '#72b01d' }}>({stats.count})</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">No reviews yet</span>
        )}
      </div>

      {/* Delivery & Payment badges */}
      <div className="flex items-center gap-2 mb-2">
        {listing.itemType === ItemType.DIGITAL ? (
          <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-green-700 text-xs font-semibold">
            <FiDownload className="w-4 h-4" />
            Instant download
          </span>
        ) : listing.deliveryType === "free" ? (
          <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-green-700 text-xs font-semibold">
            <FiTruck className="w-4 h-4" />
            Free Delivery
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-gray-500 text-xs font-medium">
            <FiPackage className="w-4 h-4" />
            Delivery Fee will apply
          </span>
        )}
        {listing.cashOnDelivery && listing.itemType !== ItemType.DIGITAL && (
          <span className="inline-flex items-center gap-2 py-0.5 rounded-full text-xs font-semibold ml-2 px-2" 
            style={{ backgroundColor: 'rgba(114, 176, 29, 0.15)', color: '#3f7d20' }}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            COD
          </span>
        )}
      </div>

      {/* Price & Wishlist bottom row */}
      <div className="flex items-end justify-between mt-auto">
        <div className="font-bold text-lg tracking-tight text-black">
          LKR {listing.price?.toLocaleString()}
        </div>
        <div className="ml-2 flex-shrink-0 flex items-end">
          <WishlistButton listing={listing} refresh={onRefresh || (() => {})} />
        </div>
      </div>
    </Link>
  );
};

export default ListingTile;
