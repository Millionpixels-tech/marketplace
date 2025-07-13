import { Timestamp } from "firebase/firestore";
import { ServiceCategory, ServiceDeliveryType, ServiceDurationType } from "../utils/serviceCategories";

// Service Package interface
export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string; // e.g., "2 hours", "1 day", "1 week"
  durationType: ServiceDurationType;
  features: string[]; // List of features included in this package
  deliveryTime: string; // e.g., "Same day", "1-3 days", "1 week"
  isPopular?: boolean; // Mark as popular package
}

// Service interface for database
export interface Service {
  id?: string;
  owner: string; // User ID who created the service
  shopId: string; // Shop ID this service belongs to
  
  // Basic Information
  title: string;
  description: string;
  category: ServiceCategory;
  subcategory: string;
  
  // Service Details
  deliveryType: ServiceDeliveryType; // onsite, online, both
  location?: string; // Required for onsite services
  serviceArea?: string[]; // Areas covered for onsite services
  
  // Packages
  packages: ServicePackage[];
  
  // Additional Information
  requirements?: string; // What client needs to provide
  additionalInfo?: string; // Any additional notes
  
  // Media
  images: string[]; // Service images
  imageMetadata?: any[]; // Image metadata for SEO
  
  // Availability
  availability: {
    monday: { available: boolean; hours?: string };
    tuesday: { available: boolean; hours?: string };
    wednesday: { available: boolean; hours?: string };
    thursday: { available: boolean; hours?: string };
    friday: { available: boolean; hours?: string };
    saturday: { available: boolean; hours?: string };
    sunday: { available: boolean; hours?: string };
  };
  
  // Contact & Booking
  acceptsInstantBooking: boolean;
  requiresConsultation: boolean;
  responseTime: string; // e.g., "Within 1 hour", "Within 24 hours"
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  
  // Stats (calculated fields)
  viewCount?: number;
  bookingCount?: number;
  rating?: number;
  reviewCount?: number;
  minPrice?: number; // Calculated minimum price from packages
}

// Service Booking interface
export interface ServiceBooking {
  id?: string;
  serviceId: string;
  packageId: string; // Which package was booked
  
  // Client Information
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  
  // Service Provider
  providerId: string;
  providerName: string;
  shopId: string;
  
  // Booking Details
  scheduledDate: Date;
  scheduledTime?: string;
  location?: string; // For onsite services
  duration: string;
  totalPrice: number;
  
  // Additional Details
  specialRequests?: string;
  clientRequirements?: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  
  // Communication
  messages?: {
    id: string;
    senderId: string;
    message: string;
    timestamp: Timestamp;
    isRead: boolean;
  }[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Review
  clientReview?: {
    rating: number;
    comment: string;
    timestamp: Timestamp;
  };
  
  providerReview?: {
    rating: number;
    comment: string;
    timestamp: Timestamp;
  };
}

// Service Review interface
export interface ServiceReview {
  id?: string;
  serviceId: string;
  serviceRequestId: string; // Link to the service request that generated this review
  shopId: string; // Shop ID for easier querying
  
  // Reviewer Information
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  
  // Review Content
  rating: number; // 1-5 stars
  title?: string;
  comment: string;
  serviceTitle: string; // Title of the service being reviewed
  
  // Media
  images?: string[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Status
  isVerified: boolean; // Only from actual bookings/service requests
  isHelpful?: number; // Helpfulness count
  
  // Response from service provider
  providerResponse?: {
    message: string;
    timestamp: Timestamp;
  };
}

// Service Analytics interface
export interface ServiceAnalytics {
  serviceId: string;
  views: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    revenue: number;
  };
  ratings: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  topPackages: {
    packageId: string;
    packageName: string;
    bookingCount: number;
  }[];
}

// Default availability (business hours)
export const getDefaultAvailability = () => ({
  monday: { available: true, hours: "9:00 AM - 5:00 PM" },
  tuesday: { available: true, hours: "9:00 AM - 5:00 PM" },
  wednesday: { available: true, hours: "9:00 AM - 5:00 PM" },
  thursday: { available: true, hours: "9:00 AM - 5:00 PM" },
  friday: { available: true, hours: "9:00 AM - 5:00 PM" },
  saturday: { available: false, hours: "" },
  sunday: { available: false, hours: "" }
});

// Helper function to create a default service package
export const createDefaultPackage = (): ServicePackage => ({
  id: crypto.randomUUID(),
  name: "Basic Package",
  description: "Basic service package",
  price: 0,
  duration: "1 hour",
  durationType: ServiceDurationType.HOURLY,
  features: [],
  deliveryTime: "Same day"
});

// Service status options
export const SERVICE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'purple' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'disputed', label: 'Disputed', color: 'orange' }
] as const;

// Payment status options
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'refunded', label: 'Refunded', color: 'gray' }
] as const;
