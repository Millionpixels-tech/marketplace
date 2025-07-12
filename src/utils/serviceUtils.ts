import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import type { Service, ServiceBooking, ServiceReview } from "../types/service";

// Service CRUD operations

export const createService = async (serviceData: Omit<Service, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "services"), {
      ...serviceData,
      createdAt: Timestamp.now(),
      isActive: true,
      isPaused: false,
      viewCount: 0,
      bookingCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating service:", error);
    throw new Error("Failed to create service");
  }
};

export const getService = async (serviceId: string): Promise<Service | null> => {
  try {
    const docRef = doc(db, "services", serviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service;
    }
    return null;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw new Error("Failed to fetch service");
  }
};

export const getUserServices = async (userId: string): Promise<Service[]> => {
  try {
    const q = query(
      collection(db, "services"),
      where("owner", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
  } catch (error) {
    console.error("Error fetching user services:", error);
    throw new Error("Failed to fetch user services");
  }
};

export const updateService = async (serviceId: string, updates: Partial<Service>): Promise<void> => {
  try {
    const docRef = doc(db, "services", serviceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating service:", error);
    throw new Error("Failed to update service");
  }
};

export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "services", serviceId));
  } catch (error) {
    console.error("Error deleting service:", error);
    throw new Error("Failed to delete service");
  }
};

export const toggleServiceStatus = async (serviceId: string, isActive: boolean): Promise<void> => {
  try {
    const docRef = doc(db, "services", serviceId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error toggling service status:", error);
    throw new Error("Failed to update service status");
  }
};

// Service Booking operations

export const createServiceBooking = async (bookingData: Omit<ServiceBooking, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "serviceBookings"), {
      ...bookingData,
      createdAt: Timestamp.now(),
      status: 'pending',
      paymentStatus: 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating service booking:", error);
    throw new Error("Failed to create booking");
  }
};

export const getServiceBooking = async (bookingId: string): Promise<ServiceBooking | null> => {
  try {
    const docRef = doc(db, "serviceBookings", bookingId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ServiceBooking;
    }
    return null;
  } catch (error) {
    console.error("Error fetching service booking:", error);
    throw new Error("Failed to fetch booking");
  }
};

export const getUserBookings = async (userId: string, asProvider = false): Promise<ServiceBooking[]> => {
  try {
    const field = asProvider ? "providerId" : "clientId";
    const q = query(
      collection(db, "serviceBookings"),
      where(field, "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceBooking[];
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw new Error("Failed to fetch bookings");
  }
};

export const updateBookingStatus = async (
  bookingId: string, 
  status: ServiceBooking['status']
): Promise<void> => {
  try {
    const docRef = doc(db, "serviceBookings", bookingId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw new Error("Failed to update booking status");
  }
};

// Service Review operations

export const createServiceReview = async (reviewData: Omit<ServiceReview, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "serviceReviews"), {
      ...reviewData,
      createdAt: Timestamp.now(),
      isVerified: true // Assuming reviews come from actual bookings
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating service review:", error);
    throw new Error("Failed to create review");
  }
};

export const getServiceReviews = async (serviceId: string, limitCount = 10): Promise<ServiceReview[]> => {
  try {
    const q = query(
      collection(db, "serviceReviews"),
      where("serviceId", "==", serviceId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceReview[];
  } catch (error) {
    console.error("Error fetching service reviews:", error);
    throw new Error("Failed to fetch reviews");
  }
};

// Service Analytics

export const incrementServiceView = async (serviceId: string): Promise<void> => {
  try {
    const docRef = doc(db, "services", serviceId);
    const serviceDoc = await getDoc(docRef);
    
    if (serviceDoc.exists()) {
      const currentViews = serviceDoc.data().viewCount || 0;
      await updateDoc(docRef, {
        viewCount: currentViews + 1
      });
    }
  } catch (error) {
    console.error("Error incrementing service view:", error);
    // Don't throw error for analytics failures
  }
};

export const incrementServiceBooking = async (serviceId: string): Promise<void> => {
  try {
    const docRef = doc(db, "services", serviceId);
    const serviceDoc = await getDoc(docRef);
    
    if (serviceDoc.exists()) {
      const currentBookings = serviceDoc.data().bookingCount || 0;
      await updateDoc(docRef, {
        bookingCount: currentBookings + 1
      });
    }
  } catch (error) {
    console.error("Error incrementing service booking:", error);
    // Don't throw error for analytics failures
  }
};

// Search and Filter operations

export const searchServices = async (searchParams: {
  category?: string;
  subcategory?: string;
  location?: string;
  deliveryType?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  limitCount?: number;
}): Promise<Service[]> => {
  try {
    let q = query(
      collection(db, "services"),
      where("isActive", "==", true),
      where("isPaused", "==", false)
    );
    
    // Add filters
    if (searchParams.category) {
      q = query(q, where("category", "==", searchParams.category));
    }
    
    if (searchParams.subcategory) {
      q = query(q, where("subcategory", "==", searchParams.subcategory));
    }
    
    if (searchParams.deliveryType) {
      q = query(q, where("deliveryType", "==", searchParams.deliveryType));
    }
    
    if (searchParams.location) {
      q = query(q, where("location", "==", searchParams.location));
    }
    
    // Add ordering and limit
    q = query(q, orderBy("createdAt", "desc"));
    
    if (searchParams.limitCount) {
      q = query(q, limit(searchParams.limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    let services = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
    
    // Client-side filtering for price range and text search
    if (searchParams.minPrice || searchParams.maxPrice || searchParams.query) {
      services = services.filter(service => {
        // Price filtering
        if (searchParams.minPrice || searchParams.maxPrice) {
          const minPackagePrice = Math.min(...service.packages.map(pkg => pkg.price));
          const maxPackagePrice = Math.max(...service.packages.map(pkg => pkg.price));
          
          if (searchParams.minPrice && maxPackagePrice < searchParams.minPrice) {
            return false;
          }
          
          if (searchParams.maxPrice && minPackagePrice > searchParams.maxPrice) {
            return false;
          }
        }
        
        // Text search
        if (searchParams.query) {
          const query = searchParams.query.toLowerCase();
          return (
            service.title.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query) ||
            service.category.toLowerCase().includes(query) ||
            service.subcategory.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
    }
    
    return services;
  } catch (error) {
    console.error("Error searching services:", error);
    throw new Error("Failed to search services");
  }
};

// Utility functions

export const calculateServiceRating = (reviews: ServiceReview[]): { average: number; count: number } => {
  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = totalRating / reviews.length;
  
  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal place
    count: reviews.length
  };
};

export const formatServicePrice = (packages: Service['packages']): string => {
  if (packages.length === 0) return "Contact for pricing";
  
  const prices = packages.map(pkg => pkg.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    return `Rs. ${minPrice.toLocaleString()}`;
  }
  
  return `Rs. ${minPrice.toLocaleString()} - Rs. ${maxPrice.toLocaleString()}`;
};

export const getServiceAvailabilityStatus = (service: Service): {
  isAvailable: boolean;
  nextAvailable?: string;
} => {
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  
  const todayAvailability = service.availability[currentDay as keyof typeof service.availability];
  
  if (todayAvailability && todayAvailability.available) {
    return { isAvailable: true };
  }
  
  // Find next available day
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = daysOfWeek.indexOf(currentDay);
  
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = daysOfWeek[nextDayIndex];
    const nextDayAvailability = service.availability[nextDay as keyof typeof service.availability];
    
    if (nextDayAvailability && nextDayAvailability.available) {
      return {
        isAvailable: false,
        nextAvailable: nextDay.charAt(0).toUpperCase() + nextDay.slice(1)
      };
    }
  }
  
  return { isAvailable: false };
};
