import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc,
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "./firebase";
import type { ServiceReview } from "../types/service";

/**
 * Create a service review
 */
export const createServiceReview = async (
  serviceId: string,
  serviceRequestId: string,
  reviewData: {
    rating: number;
    comment: string;
    reviewerId: string;
    reviewerName: string;
    serviceTitle: string;
    shopId?: string;
  }
): Promise<string> => {
  try {
    // If shopId is not provided, fetch it from the service
    let shopId = reviewData.shopId;
    if (!shopId) {
      const serviceDoc = await getDoc(doc(db, "services", serviceId));
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        shopId = serviceData.shopId;
        console.log("Fetched shopId from service:", shopId);
      }
      
      if (!shopId) {
        throw new Error("Unable to determine shopId for service review");
      }
    }

    // Create the review document
    const reviewDoc = {
      serviceId,
      serviceRequestId, // Link to the original service request
      rating: reviewData.rating,
      comment: reviewData.comment,
      reviewerId: reviewData.reviewerId,
      reviewerName: reviewData.reviewerName,
      serviceTitle: reviewData.serviceTitle,
      shopId,
      isVerified: true, // Reviews from completed service requests are verified
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add the review to the serviceReviews collection
    const docRef = await addDoc(collection(db, "serviceReviews"), reviewDoc);

    // Update service rating and review count
    await updateServiceRating(serviceId);

    return docRef.id;
  } catch (error) {
    console.error("Error creating service review:", error);
    throw new Error("Failed to create service review");
  }
};

/**
 * Update service rating after a new review
 */
export const updateServiceRating = async (serviceId: string): Promise<void> => {
  try {
    // Get all reviews for this service to calculate new average
    const reviewsQuery = query(
      collection(db, "serviceReviews"),
      where("serviceId", "==", serviceId)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate new average rating
    const totalRating = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / reviews.length;
    const reviewCount = reviews.length;

    // Update the service document
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, {
      rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      reviewCount: reviewCount,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating service rating:", error);
    throw new Error("Failed to update service rating");
  }
};

/**
 * Get reviews for a service
 */
export const getServiceReviews = async (serviceId: string, limitCount = 10): Promise<ServiceReview[]> => {
  try {
    const reviewsQuery = query(
      collection(db, "serviceReviews"),
      where("serviceId", "==", serviceId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    return reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceReview[];
  } catch (error) {
    console.error("Error fetching service reviews:", error);
    throw new Error("Failed to fetch service reviews");
  }
};

/**
 * Get reviews for a shop (including both product and service reviews)
 */
export const getShopReviews = async (shopId: string): Promise<any[]> => {
  try {
    // Get product reviews
    const productReviewsQuery = query(
      collection(db, "reviews"),
      where("shopId", "==", shopId),
      orderBy("reviewedAt", "desc")
    );
    
    const productReviewsSnapshot = await getDocs(productReviewsQuery);
    const productReviews = productReviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "product"
    }));

    // Get service reviews
    const serviceReviewsQuery = query(
      collection(db, "serviceReviews"),
      where("shopId", "==", shopId),
      orderBy("createdAt", "desc")
    );
    
    const serviceReviewsSnapshot = await getDocs(serviceReviewsQuery);
    const serviceReviews = serviceReviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "service",
      // Map service review fields to match product review structure
      reviewedAt: doc.data().createdAt,
      review: doc.data().comment,
      itemName: doc.data().serviceTitle
    }));

    // Combine and sort all reviews by date
    const allReviews = [...productReviews, ...serviceReviews];
    allReviews.sort((a: any, b: any) => {
      const aDate = a.reviewedAt?.seconds || a.createdAt?.seconds || 0;
      const bDate = b.reviewedAt?.seconds || b.createdAt?.seconds || 0;
      return bDate - aDate;
    });

    return allReviews;
  } catch (error) {
    console.error("Error fetching shop reviews:", error);
    throw new Error("Failed to fetch shop reviews");
  }
};

/**
 * Check if a user has already reviewed a service request
 */
export const hasUserReviewedServiceRequest = async (
  serviceRequestId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const reviewsQuery = query(
      collection(db, "serviceReviews"),
      where("serviceRequestId", "==", serviceRequestId),
      where("reviewerId", "==", userId)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    return reviewsSnapshot.docs.length > 0;
  } catch (error) {
    console.error("Error checking existing review:", error);
    return false;
  }
};

/**
 * Calculate shop rating including both product and service reviews
 */
export const calculateShopRating = async (shopId: string): Promise<{ rating: number | null; count: number }> => {
  try {
    const allReviews = await getShopReviews(shopId);
    
    if (allReviews.length === 0) {
      return { rating: null, count: 0 };
    }
    
    const totalRating = allReviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / allReviews.length;
    
    return {
      rating: Math.round(averageRating * 100) / 100,
      count: allReviews.length
    };
  } catch (error) {
    console.error("Error calculating shop rating:", error);
    return { rating: null, count: 0 };
  }
};
