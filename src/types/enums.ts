// Order Status Constants
export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  RECEIVED: 'RECEIVED',
  REFUND_REQUESTED: 'REFUND_REQUESTED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Payment Status Constants
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// Payment Method Constants
export const PaymentMethod = {
  CASH_ON_DELIVERY: 'cod',
  PAY_NOW: 'paynow',
  CARD: 'card',
  BANK_TRANSFER: 'bankTransfer',
  DIGITAL_WALLET: 'digitalWallet'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Delivery Type Constants
export const DeliveryType = {
  FREE: 'free',
  PAID: 'paid',
  STANDARD: 'standard',
  EXPRESS: 'express',
  PICKUP: 'pickup',
  SAME_DAY: 'sameDay'
} as const;

export type DeliveryType = typeof DeliveryType[keyof typeof DeliveryType];

// Listing Status Constants
export const ListingStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD: 'sold',
  PENDING: 'pending',
  REJECTED: 'rejected'
} as const;

export type ListingStatus = typeof ListingStatus[keyof typeof ListingStatus];

// Verification Status Constants  
export const VerificationStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NO_DATA: 'NO_DATA'
} as const;

export type VerificationStatus = typeof VerificationStatus[keyof typeof VerificationStatus];

// User Role Constants
export const UserRole = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Condition Constants
export const Condition = {
  NEW: 'new',
  LIKE_NEW: 'likeNew',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
} as const;

export type Condition = typeof Condition[keyof typeof Condition];

// Category Constants
export const Category = {
  ELECTRONICS: 'Electronics',
  CLOTHING_FASHION: 'Clothing & Fashion',
  HOME_GARDEN: 'Home & Garden',
  SPORTS_OUTDOORS: 'Sports & Outdoors',
  BOOKS_MEDIA: 'Books & Media',
  TOYS_GAMES: 'Toys & Games',
  AUTOMOTIVE: 'Automotive',
  HEALTH_BEAUTY: 'Health & Beauty',
  COLLECTIBLES_ART: 'Collectibles & Art',
  BUSINESS_INDUSTRIAL: 'Business & Industrial'
} as const;

export type Category = typeof Category[keyof typeof Category];

// Electronics Subcategories
export const ElectronicsSubcategory = {
  COMPUTERS_LAPTOPS: 'Computers & Laptops',
  SMARTPHONES_TABLETS: 'Smartphones & Tablets',
  AUDIO_HEADPHONES: 'Audio & Headphones',
  CAMERAS_PHOTOGRAPHY: 'Cameras & Photography',
  GAMING_CONSOLES: 'Gaming Consoles',
  HOME_ELECTRONICS: 'Home Electronics',
  WEARABLE_TECH: 'Wearable Tech',
  ACCESSORIES: 'Accessories'
} as const;

export type ElectronicsSubcategory = typeof ElectronicsSubcategory[keyof typeof ElectronicsSubcategory];

// Clothing & Fashion Subcategories
export const ClothingFashionSubcategory = {
  MENS_CLOTHING: "Men's Clothing",
  WOMENS_CLOTHING: "Women's Clothing",
  SHOES: 'Shoes',
  ACCESSORIES: 'Accessories',
  BAGS_LUGGAGE: 'Bags & Luggage',
  JEWELRY_WATCHES: 'Jewelry & Watches',
  KIDS_CLOTHING: "Kids' Clothing",
  VINTAGE_CLOTHING: 'Vintage Clothing'
} as const;

export type ClothingFashionSubcategory = typeof ClothingFashionSubcategory[keyof typeof ClothingFashionSubcategory];

// Home & Garden Subcategories
export const HomeGardenSubcategory = {
  FURNITURE: 'Furniture',
  KITCHEN_DINING: 'Kitchen & Dining',
  BEDDING_BATH: 'Bedding & Bath',
  HOME_DECOR: 'Home Decor',
  APPLIANCES: 'Appliances',
  TOOLS_HARDWARE: 'Tools & Hardware',
  GARDENING: 'Gardening',
  LIGHTING: 'Lighting'
} as const;

export type HomeGardenSubcategory = typeof HomeGardenSubcategory[keyof typeof HomeGardenSubcategory];

// Sports & Outdoors Subcategories
export const SportsOutdoorsSubcategory = {
  FITNESS_EXERCISE: 'Fitness & Exercise',
  OUTDOOR_RECREATION: 'Outdoor Recreation',
  TEAM_SPORTS: 'Team Sports',
  WATER_SPORTS: 'Water Sports',
  WINTER_SPORTS: 'Winter Sports',
  CYCLING: 'Cycling',
  FISHING_HUNTING: 'Fishing & Hunting',
  GOLF: 'Golf'
} as const;

export type SportsOutdoorsSubcategory = typeof SportsOutdoorsSubcategory[keyof typeof SportsOutdoorsSubcategory];

// Books & Media Subcategories
export const BooksMediaSubcategory = {
  BOOKS: 'Books',
  MOVIES_TV: 'Movies & TV',
  MUSIC: 'Music',
  VIDEO_GAMES: 'Video Games',
  MAGAZINES: 'Magazines',
  AUDIOBOOKS: 'Audiobooks',
  EDUCATIONAL: 'Educational',
  RARE_COLLECTIBLE: 'Rare & Collectible'
} as const;

export type BooksMediaSubcategory = typeof BooksMediaSubcategory[keyof typeof BooksMediaSubcategory];

// Toys & Games Subcategories
export const ToysGamesSubcategory = {
  ACTION_FIGURES: 'Action Figures',
  BOARD_GAMES: 'Board Games',
  DOLLS_ACCESSORIES: 'Dolls & Accessories',
  EDUCATIONAL_TOYS: 'Educational Toys',
  ELECTRONIC_TOYS: 'Electronic Toys',
  OUTDOOR_TOYS: 'Outdoor Toys',
  PUZZLES: 'Puzzles',
  STUFFED_ANIMALS: 'Stuffed Animals'
} as const;

export type ToysGamesSubcategory = typeof ToysGamesSubcategory[keyof typeof ToysGamesSubcategory];

// Automotive Subcategories
export const AutomotiveSubcategory = {
  CAR_PARTS: 'Car Parts',
  TOOLS_EQUIPMENT: 'Tools & Equipment',
  ACCESSORIES: 'Accessories',
  MOTORCYCLE_PARTS: 'Motorcycle Parts',
  TIRES_WHEELS: 'Tires & Wheels',
  ELECTRONICS: 'Electronics',
  MAINTENANCE: 'Maintenance',
  PERFORMANCE_PARTS: 'Performance Parts'
} as const;

export type AutomotiveSubcategory = typeof AutomotiveSubcategory[keyof typeof AutomotiveSubcategory];

// Health & Beauty Subcategories
export const HealthBeautySubcategory = {
  SKINCARE: 'Skincare',
  MAKEUP: 'Makeup',
  HAIR_CARE: 'Hair Care',
  FRAGRANCE: 'Fragrance',
  HEALTH_SUPPLEMENTS: 'Health Supplements',
  PERSONAL_CARE: 'Personal Care',
  FITNESS_NUTRITION: 'Fitness & Nutrition',
  MEDICAL_SUPPLIES: 'Medical Supplies'
} as const;

export type HealthBeautySubcategory = typeof HealthBeautySubcategory[keyof typeof HealthBeautySubcategory];

// Collectibles & Art Subcategories
export const CollectiblesArtSubcategory = {
  ANTIQUES: 'Antiques',
  ARTWORK: 'Artwork',
  COINS_CURRENCY: 'Coins & Currency',
  STAMPS: 'Stamps',
  TRADING_CARDS: 'Trading Cards',
  VINTAGE_ITEMS: 'Vintage Items',
  MEMORABILIA: 'Memorabilia',
  CRAFTS: 'Crafts'
} as const;

export type CollectiblesArtSubcategory = typeof CollectiblesArtSubcategory[keyof typeof CollectiblesArtSubcategory];

// Business & Industrial Subcategories
export const BusinessIndustrialSubcategory = {
  OFFICE_SUPPLIES: 'Office Supplies',
  RESTAURANT_FOOD_SERVICE: 'Restaurant & Food Service',
  MANUFACTURING: 'Manufacturing',
  CONSTRUCTION: 'Construction',
  MEDICAL_DENTAL: 'Medical & Dental',
  RETAIL_SERVICES: 'Retail & Services',
  AGRICULTURE: 'Agriculture',
  TEST_MEASUREMENT: 'Test & Measurement'
} as const;

export type BusinessIndustrialSubcategory = typeof BusinessIndustrialSubcategory[keyof typeof BusinessIndustrialSubcategory];

// Notification Type Constants
export const NotificationType = {
  ORDER_UPDATE: 'orderUpdate',
  PAYMENT_CONFIRMATION: 'paymentConfirmation',
  DELIVERY_UPDATE: 'deliveryUpdate',
  MESSAGE: 'message',
  SYSTEM: 'system'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Search Sort Options
export const SortOption = {
  RELEVANCE: 'relevance',
  PRICE_LOW_TO_HIGH: 'priceLowToHigh',
  PRICE_HIGH_TO_LOW: 'priceHighToLow',
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_POPULAR: 'mostPopular'
} as const;

export type SortOption = typeof SortOption[keyof typeof SortOption];

// Filter Price Range
export const PriceRange = {
  UNDER_50: 'under50',
  FIFTY_TO_100: '50to100',
  ONE_HUNDRED_TO_250: '100to250',
  TWO_FIFTY_TO_500: '250to500',
  OVER_500: 'over500'
} as const;

export type PriceRange = typeof PriceRange[keyof typeof PriceRange];

// Review Rating Constants
export const ReviewRating = {
  ONE_STAR: 1,
  TWO_STARS: 2,
  THREE_STARS: 3,
  FOUR_STARS: 4,
  FIVE_STARS: 5
} as const;

export type ReviewRating = typeof ReviewRating[keyof typeof ReviewRating];
