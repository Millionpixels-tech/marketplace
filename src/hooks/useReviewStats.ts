import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface UseReviewStatsReturn {
  reviewStats: Map<string, { rating: number | null; count: number }>;
  loading: boolean;
  fetchReviewStats: (itemIds: string[]) => Promise<void>;
}

// Cache for review stats to avoid repeated fetching
const reviewStatsCache = new Map<string, { rating: number | null; count: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Batch size for optimal Firestore performance
const BATCH_SIZE = 10;

export const useReviewStats = (): UseReviewStatsReturn => {
  const [reviewStats, setReviewStats] = useState<Map<string, { rating: number | null; count: number }>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchReviewStats = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    setLoading(true);
    const now = Date.now();
    const itemsToFetch: string[] = [];

    // Check cache first and build new stats map
    const newStats = new Map<string, { rating: number | null; count: number }>();
    
    itemIds.forEach(itemId => {
      const cached = reviewStatsCache.get(itemId);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        newStats.set(itemId, { rating: cached.rating, count: cached.count });
      } else {
        itemsToFetch.push(itemId);
      }
    });

    if (itemsToFetch.length === 0) {
      setReviewStats(newStats);
      setLoading(false);
      return;
    }

    try {
      // Process items in batches to avoid large queries
      for (let i = 0; i < itemsToFetch.length; i += BATCH_SIZE) {
        const batch = itemsToFetch.slice(i, i + BATCH_SIZE);
        
        // Use 'in' operator for batch querying (Firestore supports up to 10 items)
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('itemId', 'in', batch)
        );

        const reviewsSnap = await getDocs(reviewsQuery);
        
        // Group reviews by itemId
        const reviewsByItem: Record<string, any[]> = {};
        batch.forEach(itemId => {
          reviewsByItem[itemId] = [];
        });

        reviewsSnap.docs.forEach(doc => {
          const review = doc.data();
          if (review.itemId && reviewsByItem[review.itemId]) {
            reviewsByItem[review.itemId].push(review);
          }
        });

        // Calculate stats for each item in the batch
        Object.entries(reviewsByItem).forEach(([itemId, reviews]) => {
          let rating: number | null = null;
          const count = reviews.length;

          if (count > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            rating = Math.round((totalRating / count) * 100) / 100;
          }

          const stats = { rating, count };
          newStats.set(itemId, stats);
          
          // Cache the result
          reviewStatsCache.set(itemId, { ...stats, timestamp: now });
        });
      }

      setReviewStats(newStats);
    } catch (error) {
      console.error('Error fetching review stats:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Remove reviewStats dependency to prevent infinite loops

  return { reviewStats, loading, fetchReviewStats };
};

// Utility function to get cached stats immediately
export const getCachedReviewStats = (itemId: string): { rating: number | null; count: number } | null => {
  const cached = reviewStatsCache.get(itemId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return { rating: cached.rating, count: cached.count };
  }
  return null;
};
