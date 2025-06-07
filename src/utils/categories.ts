// Local marketplace categories specific to Sri Lankan products
export const LocalCategory = {
  FOOD_SNACKS: 'Food & Snacks',
  CLOTHING_ACCESSORIES: 'Clothing & Accessories',
  ART_CRAFTS: 'Art & Crafts',
  HOME_LIVING: 'Home & Living',
  HEALTH_BEAUTY: 'Health & Beauty',
  TOYS_BABY: 'Toys & Baby',
  STATIONERY_GIFTS: 'Stationery & Gifts',
  WEDDINGS_EVENTS: 'Weddings & Events',
  PET_SUPPLIES: 'Pet Supplies'
} as const;

export type LocalCategory = typeof LocalCategory[keyof typeof LocalCategory];

// Food & Snacks Subcategories
export const FoodSnacksSubcategory = {
  SWEETS: 'Sweets',
  SHORT_EATS: 'Short Eats',
  JAMS: 'Jams',
  PICKLES: 'Pickles',
  DRINKS: 'Drinks',
  CHUTNEYS: 'Chutneys',
  SPICES: 'Spices',
  SNACKS: 'Snacks',
  KITHUL_TREACLE: 'Kithul & Treacle',
  TRADITIONAL_FOODS: 'Traditional Foods',
  RICE_FLOUR_PRODUCTS: 'Rice & Flour Products'
} as const;

export type FoodSnacksSubcategory = typeof FoodSnacksSubcategory[keyof typeof FoodSnacksSubcategory];

// Clothing & Accessories Subcategories
export const ClothingAccessoriesSubcategory = {
  SAREES: 'Sarees',
  HANDLOOM: 'Handloom',
  JEWELRY: 'Jewelry',
  BAGS: 'Bags',
  SHIRTS_TOPS: 'Shirts & Tops',
  SARONGS: 'Sarongs',
  T_SHIRTS: 'T-Shirts',
  DRESSES: 'Dresses',
  KIDS_CLOTHING: 'Kids Clothing',
  HEADWEAR: 'Headwear',
  FOOTWEAR: 'Footwear',
  BELTS: 'Belts'
} as const;

export type ClothingAccessoriesSubcategory = typeof ClothingAccessoriesSubcategory[keyof typeof ClothingAccessoriesSubcategory];

// Art & Crafts Subcategories
export const ArtCraftsSubcategory = {
  PAINTINGS: 'Paintings',
  POTTERY: 'Pottery',
  WOODWORK: 'Woodwork',
  BATIK: 'Batik',
  MASKS: 'Masks',
  GREETING_CARDS: 'Greeting Cards',
  HANDMADE_BOOKS: 'Handmade Books',
  BEADWORK: 'Beadwork',
  MACRAME: 'Macramé',
  PAPERCRAFT: 'Papercraft',
  UPCYCLED_ITEMS: 'Upcycled Items'
} as const;

export type ArtCraftsSubcategory = typeof ArtCraftsSubcategory[keyof typeof ArtCraftsSubcategory];

// Home & Living Subcategories
export const HomeLivingSubcategory = {
  CUSHIONS: 'Cushions',
  DECOR: 'Decor',
  CANDLES: 'Candles',
  PLANTS: 'Plants',
  WALL_HANGINGS: 'Wall Hangings',
  BASKETS: 'Baskets',
  MATS: 'Mats',
  TABLEWARE: 'Tableware',
  CERAMICS: 'Ceramics',
  STORAGE_BOXES: 'Storage Boxes',
  PLANTERS: 'Planters'
} as const;

export type HomeLivingSubcategory = typeof HomeLivingSubcategory[keyof typeof HomeLivingSubcategory];

// Health & Beauty Subcategories
export const HealthBeautyLocalSubcategory = {
  AYURVEDA: 'Ayurveda',
  OILS: 'Oils',
  SOAPS: 'Soaps',
  CREAMS: 'Creams',
  BALMS: 'Balms',
  SCRUBS: 'Scrubs',
  BATH_BOMBS: 'Bath Bombs',
  HAIR_CARE: 'Hair Care',
  FACE_MASKS: 'Face Masks',
  ESSENTIAL_OILS: 'Essential Oils'
} as const;

export type HealthBeautyLocalSubcategory = typeof HealthBeautyLocalSubcategory[keyof typeof HealthBeautyLocalSubcategory];

// Toys & Baby Subcategories
export const ToysBabySubcategory = {
  SOFT_TOYS: 'Soft Toys',
  BABY_CLOTHING: 'Baby Clothing',
  BABY_CARE: 'Baby Care',
  EDUCATIONAL_TOYS: 'Educational Toys',
  WOODEN_TOYS: 'Wooden Toys'
} as const;

export type ToysBabySubcategory = typeof ToysBabySubcategory[keyof typeof ToysBabySubcategory];

// Stationery & Gifts Subcategories
export const StationeryGiftsSubcategory = {
  NOTEBOOKS: 'Notebooks',
  JOURNALS: 'Journals',
  GREETING_CARDS: 'Greeting Cards',
  GIFT_PACKS: 'Gift Packs',
  BOOKMARKS: 'Bookmarks',
  CALENDARS: 'Calendars'
} as const;

export type StationeryGiftsSubcategory = typeof StationeryGiftsSubcategory[keyof typeof StationeryGiftsSubcategory];

// Weddings & Events Subcategories
export const WeddingsEventsSubcategory = {
  PARTY_DECOR: 'Party Decor',
  WEDDING_GIFTS: 'Wedding Gifts',
  EVENT_FAVORS: 'Event Favors',
  HANDMADE_BOUQUETS: 'Handmade Bouquets'
} as const;

export type WeddingsEventsSubcategory = typeof WeddingsEventsSubcategory[keyof typeof WeddingsEventsSubcategory];

// Pet Supplies Subcategories
export const PetSuppliesSubcategory = {
  PET_FOOD: 'Pet Food',
  PET_CLOTHING: 'Pet Clothing',
  PET_ACCESSORIES: 'Pet Accessories',
  PET_TOYS: 'Pet Toys'
} as const;

export type PetSuppliesSubcategory = typeof PetSuppliesSubcategory[keyof typeof PetSuppliesSubcategory];

// Combined categories structure for easier use
export const categories = [
  {
    name: LocalCategory.FOOD_SNACKS,
    subcategories: Object.values(FoodSnacksSubcategory)
  },
  {
    name: LocalCategory.CLOTHING_ACCESSORIES,
    subcategories: Object.values(ClothingAccessoriesSubcategory)
  },
  {
    name: LocalCategory.ART_CRAFTS,
    subcategories: Object.values(ArtCraftsSubcategory)
  },
  {
    name: LocalCategory.HOME_LIVING,
    subcategories: Object.values(HomeLivingSubcategory)
  },
  {
    name: LocalCategory.HEALTH_BEAUTY,
    subcategories: Object.values(HealthBeautyLocalSubcategory)
  },
  {
    name: LocalCategory.TOYS_BABY,
    subcategories: Object.values(ToysBabySubcategory)
  },
  {
    name: LocalCategory.STATIONERY_GIFTS,
    subcategories: Object.values(StationeryGiftsSubcategory)
  },
  {
    name: LocalCategory.WEDDINGS_EVENTS,
    subcategories: Object.values(WeddingsEventsSubcategory)
  },
  {
    name: LocalCategory.PET_SUPPLIES,
    subcategories: Object.values(PetSuppliesSubcategory)
  }
] as const;

export const categoryIcons: Record<LocalCategory, string> = {
  [LocalCategory.FOOD_SNACKS]: "🍱",
  [LocalCategory.CLOTHING_ACCESSORIES]: "🧣",
  [LocalCategory.ART_CRAFTS]: "🎨",
  [LocalCategory.HOME_LIVING]: "🏡",
  [LocalCategory.HEALTH_BEAUTY]: "💅",
  [LocalCategory.TOYS_BABY]: "🧸",
  [LocalCategory.STATIONERY_GIFTS]: "📒",
  [LocalCategory.WEDDINGS_EVENTS]: "🎁",
  [LocalCategory.PET_SUPPLIES]: "🐾"
};

export const subCategoryIcons: Record<string, string> = {
  // Food & Snacks
  [FoodSnacksSubcategory.SWEETS]: "🍬",
  [FoodSnacksSubcategory.SHORT_EATS]: "🥟",
  [FoodSnacksSubcategory.JAMS]: "🍯",
  [FoodSnacksSubcategory.PICKLES]: "🥒",
  [FoodSnacksSubcategory.DRINKS]: "🥤",
  [FoodSnacksSubcategory.CHUTNEYS]: "🍲",
  [FoodSnacksSubcategory.SPICES]: "🌶️",
  [FoodSnacksSubcategory.SNACKS]: "🍘",
  [FoodSnacksSubcategory.KITHUL_TREACLE]: "🍯",
  [FoodSnacksSubcategory.TRADITIONAL_FOODS]: "🍛",
  [FoodSnacksSubcategory.RICE_FLOUR_PRODUCTS]: "🍚",
  // Clothing & Accessories
  [ClothingAccessoriesSubcategory.SAREES]: "👗",
  [ClothingAccessoriesSubcategory.HANDLOOM]: "🧵",
  [ClothingAccessoriesSubcategory.JEWELRY]: "💍",
  [ClothingAccessoriesSubcategory.BAGS]: "👜",
  [ClothingAccessoriesSubcategory.SHIRTS_TOPS]: "👕",
  [ClothingAccessoriesSubcategory.SARONGS]: "🩳",
  [ClothingAccessoriesSubcategory.T_SHIRTS]: "👔",
  [ClothingAccessoriesSubcategory.DRESSES]: "👗",
  [ClothingAccessoriesSubcategory.KIDS_CLOTHING]: "🧒",
  [ClothingAccessoriesSubcategory.HEADWEAR]: "🎩",
  [ClothingAccessoriesSubcategory.FOOTWEAR]: "👡",
  [ClothingAccessoriesSubcategory.BELTS]: "🪢",
  // Art & Crafts
  [ArtCraftsSubcategory.PAINTINGS]: "🖼️",
  [ArtCraftsSubcategory.POTTERY]: "🏺",
  [ArtCraftsSubcategory.WOODWORK]: "🪵",
  [ArtCraftsSubcategory.BATIK]: "🖌️",
  [ArtCraftsSubcategory.MASKS]: "🎭",
  [ArtCraftsSubcategory.GREETING_CARDS]: "💌",
  [ArtCraftsSubcategory.HANDMADE_BOOKS]: "📚",
  [ArtCraftsSubcategory.BEADWORK]: "📿",
  [ArtCraftsSubcategory.MACRAME]: "🪢",
  [ArtCraftsSubcategory.PAPERCRAFT]: "📄",
  [ArtCraftsSubcategory.UPCYCLED_ITEMS]: "♻️",
  // Home & Living
  [HomeLivingSubcategory.CUSHIONS]: "🛋️",
  [HomeLivingSubcategory.DECOR]: "🖼️",
  [HomeLivingSubcategory.CANDLES]: "🕯️",
  [HomeLivingSubcategory.PLANTS]: "🪴",
  [HomeLivingSubcategory.WALL_HANGINGS]: "🪆",
  [HomeLivingSubcategory.BASKETS]: "🧺",
  [HomeLivingSubcategory.MATS]: "🧻",
  [HomeLivingSubcategory.TABLEWARE]: "🥢",
  [HomeLivingSubcategory.CERAMICS]: "🍶",
  [HomeLivingSubcategory.STORAGE_BOXES]: "📦",
  [HomeLivingSubcategory.PLANTERS]: "🪴",
  // Health & Beauty
  [HealthBeautyLocalSubcategory.AYURVEDA]: "🌿",
  [HealthBeautyLocalSubcategory.OILS]: "🧴",
  [HealthBeautyLocalSubcategory.SOAPS]: "🧼",
  [HealthBeautyLocalSubcategory.CREAMS]: "🥛",
  [HealthBeautyLocalSubcategory.BALMS]: "💧",
  [HealthBeautyLocalSubcategory.SCRUBS]: "🛁",
  [HealthBeautyLocalSubcategory.BATH_BOMBS]: "🛀",
  [HealthBeautyLocalSubcategory.HAIR_CARE]: "💇‍♀️",
  [HealthBeautyLocalSubcategory.FACE_MASKS]: "😷",
  [HealthBeautyLocalSubcategory.ESSENTIAL_OILS]: "🧪",
  // Toys & Baby
  [ToysBabySubcategory.SOFT_TOYS]: "🧸",
  [ToysBabySubcategory.BABY_CLOTHING]: "🍼",
  [ToysBabySubcategory.BABY_CARE]: "👶",
  [ToysBabySubcategory.EDUCATIONAL_TOYS]: "🎲",
  [ToysBabySubcategory.WOODEN_TOYS]: "🪆",
  // Stationery & Gifts
  [StationeryGiftsSubcategory.NOTEBOOKS]: "📒",
  [StationeryGiftsSubcategory.JOURNALS]: "📓",
  [StationeryGiftsSubcategory.GIFT_PACKS]: "🎁",
  [StationeryGiftsSubcategory.BOOKMARKS]: "🔖",
  [StationeryGiftsSubcategory.CALENDARS]: "📆",
  // Weddings & Events
  [WeddingsEventsSubcategory.PARTY_DECOR]: "🎉",
  [WeddingsEventsSubcategory.WEDDING_GIFTS]: "💝",
  [WeddingsEventsSubcategory.EVENT_FAVORS]: "🎊",
  [WeddingsEventsSubcategory.HANDMADE_BOUQUETS]: "💐",
  // Pet Supplies
  [PetSuppliesSubcategory.PET_FOOD]: "🥩",
  [PetSuppliesSubcategory.PET_CLOTHING]: "🐕",
  [PetSuppliesSubcategory.PET_ACCESSORIES]: "🦴",
  [PetSuppliesSubcategory.PET_TOYS]: "🧶"
};


