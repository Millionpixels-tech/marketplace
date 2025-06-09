import { useResponsive } from "../../hooks/useResponsive";
import ListingTile from "./ListingTile";
import MobileListingTile from "./MobileListingTile";

interface ResponsiveListingTileProps {
  listing: any;
  shopInfo?: {
    name: string;
    location: string;
    username: string;
  };
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}

const ResponsiveListingTile: React.FC<ResponsiveListingTileProps> = ({ 
  listing, 
  shopInfo, 
  onRefresh,
  compact = false,
  className = ""
}) => {
  const { isMobile } = useResponsive();

  return isMobile ? (
    <MobileListingTile listing={listing} shopInfo={shopInfo} onRefresh={onRefresh} />
  ) : (
    <ListingTile 
      listing={listing} 
      onRefresh={onRefresh} 
      compact={compact}
      className={className}
    />
  );
};

export default ResponsiveListingTile;
