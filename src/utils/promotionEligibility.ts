import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface EligibilityData {
  isEligible: boolean;
  shopsCount: number;
  listingsCount: number;
  requirementsShops: number;
  requirementsListings: number;
}

/**
 * Check if a user is eligible for the early launch promotion
 * Requirements: At least 1 active shop and 5 active listings
 */
export const checkPromotionEligibility = async (userId: string): Promise<EligibilityData> => {
  const REQUIRED_SHOPS = 1;
  const REQUIRED_LISTINGS = 5;

  try {
    // Fetch user's shops (using 'owner' field)
    const shopsQuery = query(
      collection(db, "shops"),
      where("owner", "==", userId)
    );
    const shopsSnapshot = await getDocs(shopsQuery);
    const shopsCount = shopsSnapshot.size;

    console.log("Utility function - shops count:", shopsCount);

    // Fetch user's listings (using 'owner' field)
    const listingsQuery = query(
      collection(db, "listings"),
      where("owner", "==", userId)
    );
    const listingsSnapshot = await getDocs(listingsQuery);
    const listingsCount = listingsSnapshot.size;

    console.log("Utility function - listings count:", listingsCount);

    return {
      isEligible: shopsCount >= REQUIRED_SHOPS && listingsCount >= REQUIRED_LISTINGS,
      shopsCount,
      listingsCount,
      requirementsShops: REQUIRED_SHOPS,
      requirementsListings: REQUIRED_LISTINGS,
    };
  } catch (error) {
    console.error("Error checking promotion eligibility:", error);
    return {
      isEligible: false,
      shopsCount: 0,
      listingsCount: 0,
      requirementsShops: REQUIRED_SHOPS,
      requirementsListings: REQUIRED_LISTINGS,
    };
  }
};

/**
 * Get promotion progress percentage (0-100)
 * Based on combined requirements completion
 */
export const getPromotionProgress = (eligibilityData: EligibilityData): number => {
  const { shopsCount, listingsCount, requirementsShops, requirementsListings } = eligibilityData;
  
  const shopProgress = Math.min(shopsCount / requirementsShops, 1);
  const listingProgress = Math.min(listingsCount / requirementsListings, 1);
  
  // Weight shops and listings equally (50% each)
  return Math.round((shopProgress * 50) + (listingProgress * 50));
};

/**
 * Get user-friendly promotion status message
 */
export const getPromotionStatusMessage = (eligibilityData: EligibilityData): string => {
  const { isEligible, shopsCount, listingsCount, requirementsShops, requirementsListings } = eligibilityData;
  
  if (isEligible) {
    return "🎉 Congratulations! You're eligible for the Early Launch Promotion!";
  }
  
  const needsShops = Math.max(0, requirementsShops - shopsCount);
  const needsListings = Math.max(0, requirementsListings - listingsCount);
  
  if (needsShops > 0 && needsListings > 0) {
    return `You need ${needsShops} more shop${needsShops > 1 ? 's' : ''} and ${needsListings} more listing${needsListings > 1 ? 's' : ''} to qualify.`;
  } else if (needsShops > 0) {
    return `You need ${needsShops} more shop${needsShops > 1 ? 's' : ''} to qualify.`;
  } else if (needsListings > 0) {
    return `You need ${needsListings} more listing${needsListings > 1 ? 's' : ''} to qualify.`;
  }
  
  return "Almost there! Keep up the great work!";
};
