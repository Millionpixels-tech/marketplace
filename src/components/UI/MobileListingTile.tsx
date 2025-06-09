import { Link } from "react-router-dom";
import { FiMapPin } from "react-icons/fi";
import WishlistButton from "./WishlistButton";
import type { DeliveryType as DeliveryTypeType } from "../../types/enums";

export interface Listing {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  shopId: string;
  category: string;
  subcategory: string;
  quantity: number;
  deliveryType: DeliveryTypeType;
  deliveryPerItem: number;
  deliveryAdditional: number;
  cashOnDelivery: boolean;
  createdAt: any;
  reviews?: any[];
  wishlist?: Array<{ ip?: string; ownerId?: string; }>;
}

interface ReviewStats {
  avg: number | null;
  count: number;
}

interface MobileListingTileProps {
  listing: Listing;
  shopInfo?: {
    name: string;
    location: string;
    username: string;
  };
  onRefresh?: () => void;
}

// Get review statistics for a listing
function getReviewStats(listing: Listing): ReviewStats {
  const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
  if (!reviews.length) return { avg: null, count: 0 };
  const avg = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length;
  return { avg, count: reviews.length };
}

const MobileListingTile: React.FC<MobileListingTileProps> = ({ listing, shopInfo, onRefresh }) => {
  const stats = getReviewStats(listing);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getDeliveryText = () => {
    if (listing.deliveryType === "free") return "Free delivery";
    if (listing.deliveryType === "paid") return `Rs. ${listing.deliveryPerItem} delivery`;
    return "Pickup only";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Image Section */}
      <div className="relative aspect-square flex-shrink-0">
        <Link to={`/listing/${listing.id}`}>
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </Link>
        
        {/* Wishlist Button */}
        <div className="absolute top-2 right-2">
          <WishlistButton listing={listing} refresh={onRefresh || (() => {})} />
        </div>

        {/* Delivery Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            listing.deliveryType === "free" 
              ? "bg-green-100 text-green-800"
              : listing.deliveryType === "paid"
              ? "bg-blue-100 text-blue-800"
              : "bg-orange-100 text-orange-800"
          }`}>
            {getDeliveryText()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title and Price */}
        <div className="mb-2 flex-shrink-0">
          <Link to={`/listing/${listing.id}`}>
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-green-600 transition-colors min-h-[2.5rem]">
              {listing.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-black">
              {formatPrice(listing.price)}
            </span>
          </div>
        </div>

        {/* Reviews */}
        <div className="flex items-center gap-2 mb-2 min-h-[18px] flex-shrink-0">
          {stats.avg ? (
            <>
              <div className="flex items-center" style={{ color: '#72b01d' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <svg
                    key={i}
                    width="12"
                    height="12"
                    className="inline-block"
                    fill={i <= Math.round(stats.avg!) ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
                <span className="ml-1 text-xs font-medium" style={{ color: '#3f7d20' }}>
                  {stats.avg.toFixed(1)}
                </span>
              </div>
              <span className="text-xs" style={{ color: '#72b01d' }}>({stats.count})</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>

        {/* Payment Method Badge */}
        <div className="mb-2 flex-shrink-0">
          {listing.cashOnDelivery && (
            <span className="inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-semibold" 
              style={{ backgroundColor: 'rgba(114, 176, 29, 0.15)', color: '#3f7d20' }}>
              <svg
                className="w-3 h-3"
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
              COD Available
            </span>
          )}
        </div>

        {/* Shop Info - Push to bottom */}
        <div className="mt-auto">
          {shopInfo && (
            <div className="border-t pt-2">
              <Link 
                to={`/shop/${shopInfo.username}`}
                className="flex items-center text-xs text-gray-600 hover:text-green-600 transition-colors"
              >
                <span className="font-medium truncate flex-1">
                  {shopInfo.name}
                </span>
                {shopInfo.location && (
                  <span className="flex items-center ml-1 flex-shrink-0">
                    <FiMapPin size={10} className="mr-1" />
                    {shopInfo.location}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileListingTile;
