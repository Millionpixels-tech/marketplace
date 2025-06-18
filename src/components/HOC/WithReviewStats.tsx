import React, { useEffect, useMemo, useRef } from 'react';
import { useReviewStats } from '../../hooks/useReviewStats';

interface ListingWithReviewStats {
  id: string;
  name?: string;
  price?: number;
  images?: string[];
  description?: string;
  createdAt?: any;
  deliveryType?: any;
  cashOnDelivery?: boolean;
  wishlist?: Array<{ ip?: string; ownerId?: string; }>;
  // Injected review stats
  reviewStats?: {
    rating: number | null;
    count: number;
  };
}

interface WithReviewStatsProps {
  listings: any[];
  children: (listingsWithStats: ListingWithReviewStats[]) => React.ReactNode;
}

const WithReviewStats: React.FC<WithReviewStatsProps> = ({ listings, children }) => {
  const { reviewStats, fetchReviewStats } = useReviewStats();
  const fetchedItemsRef = useRef<Set<string>>(new Set());

  // Extract item IDs from listings
  const itemIds = useMemo(() => {
    return listings.map(listing => listing.id).filter(Boolean);
  }, [listings]);

  // Stringify itemIds for stable comparison
  const itemIdsString = useMemo(() => itemIds.join(','), [itemIds]);

  // Fetch review stats when listings change, but avoid duplicate fetches
  useEffect(() => {
    if (itemIds.length > 0) {
      // Check if we need to fetch any new items
      const newItems = itemIds.filter(id => !fetchedItemsRef.current.has(id));
      
      if (newItems.length > 0) {
        fetchReviewStats(itemIds); // Fetch all to get batch efficiency
        // Mark all items as fetched
        itemIds.forEach(id => fetchedItemsRef.current.add(id));
      }
    }
  }, [itemIdsString, fetchReviewStats]); // Use string for stable dependency

  // Merge listings with review stats
  const listingsWithStats = useMemo(() => {
    return listings.map(listing => ({
      ...listing,
      reviewStats: reviewStats.get(listing.id) || { rating: null, count: 0 }
    }));
  }, [listings, reviewStats]);

  return <>{children(listingsWithStats)}</>;
};

export default WithReviewStats;
