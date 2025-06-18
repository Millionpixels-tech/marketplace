// Category types for marketplace - Etsy.com structure (Physical products only)
export const ItemType = {
  PHYSICAL: 'Physical'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

// Main categories based on Etsy.com
export const EtsyCategory = {
  ACCESSORIES: 'Accessories',
  ART_COLLECTIBLES: 'Art & Collectibles',
  BAGS_PURSES: 'Bags & Purses',
  BATH_BEAUTY: 'Bath & Beauty',
  BOOKS_MOVIES_MUSIC: 'Books, Movies & Music',
  CLOTHING: 'Clothing',
  CRAFT_SUPPLIES_TOOLS: 'Craft Supplies & Tools',
  ELECTRONICS_ACCESSORIES: 'Electronics & Accessories',
  HOME_LIVING: 'Home & Living',
  JEWELRY: 'Jewelry',
  PAPER_PARTY_SUPPLIES: 'Paper & Party Supplies',
  PET_SUPPLIES: 'Pet Supplies',
  SHOES: 'Shoes',
  TOYS_GAMES: 'Toys & Games',
  WEDDINGS: 'Weddings'
} as const;

export type EtsyCategory = typeof EtsyCategory[keyof typeof EtsyCategory];

// Subcategories for each main category

// Accessories Subcategories
export const AccessoriesSubcategory = {
  BABY_ACCESSORIES: 'Baby Accessories',
  BELTS_SUSPENDERS: 'Belts & Suspenders',
  BOUQUETS_CORSAGES: 'Bouquets & Corsages',
  COSTUME_ACCESSORIES: 'Costume Accessories',
  GLOVES_MITTENS: 'Gloves & Mittens',
  HAIR_ACCESSORIES: 'Hair Accessories',
  HAND_FANS: 'Hand Fans',
  HATS_CAPS: 'Hats & Caps',
  KEYCHAINS_LANYARDS: 'Keychains & Lanyards',
  LATKANS: 'Latkans',
  PATCHES_PINS: 'Patches & Pins',
  SCARVES_WRAPS: 'Scarves & Wraps',
  SUIT_TIE_ACCESSORIES: 'Suit & Tie Accessories',
  SUNGLASSES_EYEWEAR: 'Sunglasses & Eyewear',
  UMBRELLAS_RAIN_ACCESSORIES: 'Umbrellas & Rain Accessories'
} as const;

export type AccessoriesSubcategory = typeof AccessoriesSubcategory[keyof typeof AccessoriesSubcategory];

// Art & Collectibles Subcategories
export const ArtCollectiblesSubcategory = {
  ARTIST_TRADING_CARDS: 'Artist Trading Cards',
  COLLECTIBLES: 'Collectibles',
  DOLLS_MINIATURES: 'Dolls & Miniatures',
  DRAWING_ILLUSTRATION: 'Drawing & Illustration',
  FIBER_ARTS: 'Fiber Arts',
  FINE_ART_CERAMICS: 'Fine Art Ceramics',
  GLASS_ART: 'Glass Art',
  MIXED_MEDIA_COLLAGE: 'Mixed Media & Collage',
  PAINTING: 'Painting',
  PHOTOGRAPHY: 'Photography',
  PRINTS: 'Prints',
  SCULPTURE: 'Sculpture'
} as const;

export type ArtCollectiblesSubcategory = typeof ArtCollectiblesSubcategory[keyof typeof ArtCollectiblesSubcategory];

// Bags & Purses Subcategories
export const BagsPursesSubcategory = {
  ACCESSORY_CASES: 'Accessory Cases',
  BACKPACKS: 'Backpacks',
  CLOTHING_SHOE_BAGS: 'Clothing & Shoe Bags',
  COSMETIC_TOILETRY_STORAGE: 'Cosmetic & Toiletry Storage',
  DIAPER_BAGS: 'Diaper Bags',
  FANNY_PACKS: 'Fanny Packs',
  FOOD_INSULATED_BAGS: 'Food/Insulated Bags',
  HANDBAGS: 'Handbags',
  LUGGAGE_TRAVEL: 'Luggage & Travel',
  MARKET_BAGS: 'Market Bags',
  MESSENGER_BAGS: 'Messenger Bags',
  POUCHES_COIN_PURSES: 'Pouches & Coin Purses',
  SPORTS_BAGS: 'Sports Bags',
  TOTES: 'Totes',
  WALLETS_MONEY_CLIPS: 'Wallets & Money Clips'
} as const;

export type BagsPursesSubcategory = typeof BagsPursesSubcategory[keyof typeof BagsPursesSubcategory];

// Bath & Beauty Subcategories
export const BathBeautySubcategory = {
  BABY_CHILD_CARE: 'Baby & Child Care',
  BATH_ACCESSORIES: 'Bath Accessories',
  ESSENTIAL_OILS: 'Essential Oils',
  FRAGRANCES: 'Fragrances',
  HAIR_CARE: 'Hair Care',
  MAKEUP_COSMETICS: 'Makeup & Cosmetics',
  PERSONAL_CARE: 'Personal Care',
  SKIN_CARE: 'Skin Care',
  SOAPS: 'Soaps',
  SPA_RELAXATION: 'Spa & Relaxation'
} as const;

export type BathBeautySubcategory = typeof BathBeautySubcategory[keyof typeof BathBeautySubcategory];

// Books, Movies & Music Subcategories
export const BooksMoviesMusicSubcategory = {
  BOOKS: 'Books',
  MOVIES: 'Movies',
  MUSIC: 'Music (instruments, media, & accessories)'
} as const;

export type BooksMoviesMusicSubcategory = typeof BooksMoviesMusicSubcategory[keyof typeof BooksMoviesMusicSubcategory];

// Clothing Subcategories
export const ClothingSubcategory = {
  BOYS_CLOTHING: 'Boys\' Clothing',
  GENDER_NEUTRAL_ADULT_CLOTHING: 'Gender-Neutral Adult Clothing',
  GENDER_NEUTRAL_KIDS_CLOTHING: 'Gender-Neutral Kids\' Clothing',
  GIRLS_CLOTHING: 'Girls\' Clothing',
  MENS_CLOTHING: 'Men\'s Clothing',
  WOMENS_CLOTHING: 'Women\'s Clothing'
} as const;

export type ClothingSubcategory = typeof ClothingSubcategory[keyof typeof ClothingSubcategory];

// Craft Supplies & Tools Subcategories
export const CraftSuppliesToolsSubcategory = {
  BEADS_GEMS_CABOCHONS: 'Beads, Gems & Cabochons',
  BEAUTY_SUPPLIES: 'Beauty Supplies',
  BLANKS: 'Blanks',
  BRUSHES: 'Brushes',
  CANVAS_SURFACES: 'Canvas & Surfaces',
  FABRIC_NOTIONS: 'Fabric & Notions',
  PATTERNS_HOW_TOS: 'Patterns & How-Tos',
  STAMPS_INKS_PAINTS: 'Stamps, Inks & Paints',
  TOOLS_EQUIPMENT: 'Tools & Equipment',
  YARN_FIBER: 'Yarn & Fiber'
} as const;

export type CraftSuppliesToolsSubcategory = typeof CraftSuppliesToolsSubcategory[keyof typeof CraftSuppliesToolsSubcategory];

// Electronics & Accessories Subcategories
export const ElectronicsAccessoriesSubcategory = {
  AUDIO: 'Audio',
  BATTERIES_CHARGING: 'Batteries & Charging',
  CABLES_CORDS: 'Cables & Cords',
  CAMERAS_EQUIPMENT: 'Cameras & Equipment',
  CAR_PARTS_ACCESSORIES: 'Car Parts & Accessories',
  CELL_PHONE_ACCESSORIES: 'Cell-Phone Accessories',
  COMPUTERS_PERIPHERALS: 'Computers & Peripherals',
  DECALS_SKINS: 'Decals & Skins',
  DOCKING_STANDS: 'Docking & Stands',
  ELECTRONICS_CASES: 'Electronics Cases',
  GADGETS: 'Gadgets',
  MAKER_SUPPLIES: 'Maker Supplies',
  PARTS_ELECTRICAL: 'Parts & Electrical',
  TV_PROJECTION: 'TV & Projection',
  TELEPHONES_HANDSETS: 'Telephones & Handsets',
  VIDEO_GAMES: 'Video Games'
} as const;

export type ElectronicsAccessoriesSubcategory = typeof ElectronicsAccessoriesSubcategory[keyof typeof ElectronicsAccessoriesSubcategory];

// Home & Living Subcategories
export const HomeLivingSubcategory = {
  BATHROOM: 'Bathroom',
  BEDDING: 'Bedding',
  CLEANING_SUPPLIES: 'Cleaning Supplies',
  FOOD_DRINK: 'Food & Drink',
  HOME_DECOR: 'Home Décor',
  KITCHEN_DINING: 'Kitchen & Dining',
  LIGHTING: 'Lighting',
  OFFICE: 'Office',
  OUTDOOR_GARDENING: 'Outdoor & Gardening',
  SPIRITUALITY_RELIGION: 'Spirituality & Religion',
  STORAGE_ORGANIZATION: 'Storage & Organization',
  WALL_DECOR_FRAMES: 'Wall Décor & Frames',
  FURNITURE: 'Furniture'
} as const;

export type HomeLivingSubcategory = typeof HomeLivingSubcategory[keyof typeof HomeLivingSubcategory];

// Jewelry Subcategories
export const JewelrySubcategory = {
  ANKLETS: 'Anklets',
  BRACELETS: 'Bracelets',
  BROOCHES: 'Brooches',
  CUFF_LINKS_TIE_CLIPS: 'Cuff Links & Tie Clips',
  EARRINGS: 'Earrings',
  HAIR_JEWELRY: 'Hair Jewelry',
  JEWELRY_SETS: 'Jewelry Sets',
  NECKLACES: 'Necklaces',
  RINGS: 'Rings',
  WATCHES: 'Watches'
} as const;

export type JewelrySubcategory = typeof JewelrySubcategory[keyof typeof JewelrySubcategory];

// Paper & Party Supplies Subcategories
export const PaperPartySuppliesSubcategory = {
  GREETING_CARDS: 'Greeting Cards',
  INVITATIONS_ANNOUNCEMENTS: 'Invitations & Announcements',
  PARTY_DECORATIONS: 'Party Decorations',
  PARTY_FAVORS_GAMES: 'Party Favors & Games',
  PARTY_SUPPLIES: 'Party Supplies',
  STATIONERY: 'Stationery'
} as const;

export type PaperPartySuppliesSubcategory = typeof PaperPartySuppliesSubcategory[keyof typeof PaperPartySuppliesSubcategory];

// Pet Supplies Subcategories
export const PetSuppliesSubcategory = {
  BIRD_SUPPLIES: 'Bird Supplies',
  CAT_SUPPLIES: 'Cat Supplies',
  DOG_SUPPLIES: 'Dog Supplies',
  FISH_AQUATIC: 'Fish & Aquatic',
  PET_MEMORIALS_URNS: 'Pet Memorials & Urns',
  PET_TOYS: 'Pet Toys',
  REPTILE_AMPHIBIAN: 'Reptile & Amphibian',
  SMALL_PET_SUPPLIES: 'Small-Pet Supplies'
} as const;

export type PetSuppliesSubcategory = typeof PetSuppliesSubcategory[keyof typeof PetSuppliesSubcategory];

// Shoes Subcategories
export const ShoesSubcategory = {
  BABY_SHOES: 'Baby Shoes',
  BOOTS: 'Boots',
  FLATS_LOAFERS_OXFORDS: 'Flats, Loafers & Oxfords',
  HEELS: 'Heels',
  SANDALS: 'Sandals',
  SLIPPERS: 'Slippers',
  SNEAKERS: 'Sneakers',
  SHOE_CARE_ACCESSORIES: 'Shoe Care & Accessories'
} as const;

export type ShoesSubcategory = typeof ShoesSubcategory[keyof typeof ShoesSubcategory];

// Toys & Games Subcategories
export const ToysGamesSubcategory = {
  BABY_TODDLER_TOYS: 'Baby & Toddler Toys',
  DOLLS_ACTION_FIGURES: 'Dolls & Action Figures',
  GAMES_PUZZLES: 'Games & Puzzles',
  LEARNING_SCHOOL: 'Learning & School',
  SPORTS_OUTDOOR_PLAY: 'Sports & Outdoor Play',
  STUFFED_ANIMALS_PLUSHIES: 'Stuffed Animals & Plushies'
} as const;

export type ToysGamesSubcategory = typeof ToysGamesSubcategory[keyof typeof ToysGamesSubcategory];

// Weddings Subcategories
export const WeddingsSubcategory = {
  BRIDAL_ACCESSORIES: 'Bridal Accessories',
  BRIDAL_PARTY_ACCESSORIES: 'Bridal Party Accessories',
  WEDDING_BOUQUETS_CORSAGES: 'Bouquets & Corsages',
  CAKE_TOPPERS: 'Cake Toppers',
  WEDDING_CLOTHING: 'Clothing',
  WEDDING_DECORATIONS: 'Decorations',
  WEDDING_FAVORS_GIFTS: 'Favors & Gifts',
  WEDDING_INVITATIONS_PAPER: 'Invitations & Paper',
  WEDDING_JEWELRY: 'Jewelry',
  WEDDING_SHOES: 'Shoes'
} as const;

export type WeddingsSubcategory = typeof WeddingsSubcategory[keyof typeof WeddingsSubcategory];

// Category interface
export interface Category {
  type: ItemType;
  name: EtsyCategory;
  subcategories: string[];
}

// Combined categories structure
export const categories: Category[] = [
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.ACCESSORIES,
    subcategories: Object.values(AccessoriesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.ART_COLLECTIBLES,
    subcategories: Object.values(ArtCollectiblesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.BAGS_PURSES,
    subcategories: Object.values(BagsPursesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.BATH_BEAUTY,
    subcategories: Object.values(BathBeautySubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.BOOKS_MOVIES_MUSIC,
    subcategories: Object.values(BooksMoviesMusicSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.CLOTHING,
    subcategories: Object.values(ClothingSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.CRAFT_SUPPLIES_TOOLS,
    subcategories: Object.values(CraftSuppliesToolsSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.ELECTRONICS_ACCESSORIES,
    subcategories: Object.values(ElectronicsAccessoriesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.HOME_LIVING,
    subcategories: Object.values(HomeLivingSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.JEWELRY,
    subcategories: Object.values(JewelrySubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.PAPER_PARTY_SUPPLIES,
    subcategories: Object.values(PaperPartySuppliesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.PET_SUPPLIES,
    subcategories: Object.values(PetSuppliesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.SHOES,
    subcategories: Object.values(ShoesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.TOYS_GAMES,
    subcategories: Object.values(ToysGamesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: EtsyCategory.WEDDINGS,
    subcategories: Object.values(WeddingsSubcategory)
  }
];

// Category icons mapping
export const categoryIcons: Record<EtsyCategory, string> = {
  [EtsyCategory.ACCESSORIES]: "👜",
  [EtsyCategory.ART_COLLECTIBLES]: "🎨",
  [EtsyCategory.BAGS_PURSES]: "👛",
  [EtsyCategory.BATH_BEAUTY]: "🧴",
  [EtsyCategory.BOOKS_MOVIES_MUSIC]: "📚",
  [EtsyCategory.CLOTHING]: "👕",
  [EtsyCategory.CRAFT_SUPPLIES_TOOLS]: "✂️",
  [EtsyCategory.ELECTRONICS_ACCESSORIES]: "📱",
  [EtsyCategory.HOME_LIVING]: "🏠",
  [EtsyCategory.JEWELRY]: "💍",
  [EtsyCategory.PAPER_PARTY_SUPPLIES]: "🎉",
  [EtsyCategory.PET_SUPPLIES]: "🐾",
  [EtsyCategory.SHOES]: "👟",
  [EtsyCategory.TOYS_GAMES]: "🧸",
  [EtsyCategory.WEDDINGS]: "💒"
};

// Subcategory icons mapping
export const subCategoryIcons: Record<string, string> = {
  // Accessories
  [AccessoriesSubcategory.BABY_ACCESSORIES]: "👶",
  [AccessoriesSubcategory.BELTS_SUSPENDERS]: "🎗️",
  [AccessoriesSubcategory.BOUQUETS_CORSAGES]: "💐",
  [AccessoriesSubcategory.COSTUME_ACCESSORIES]: "🎭",
  [AccessoriesSubcategory.GLOVES_MITTENS]: "🧤",
  [AccessoriesSubcategory.HAIR_ACCESSORIES]: "🎀",
  [AccessoriesSubcategory.HAND_FANS]: "🪭",
  [AccessoriesSubcategory.HATS_CAPS]: "🎩",
  [AccessoriesSubcategory.KEYCHAINS_LANYARDS]: "🔑",
  [AccessoriesSubcategory.LATKANS]: "🪅",
  [AccessoriesSubcategory.PATCHES_PINS]: "📌",
  [AccessoriesSubcategory.SCARVES_WRAPS]: "🧣",
  [AccessoriesSubcategory.SUIT_TIE_ACCESSORIES]: "👔",
  [AccessoriesSubcategory.SUNGLASSES_EYEWEAR]: "🕶️",
  [AccessoriesSubcategory.UMBRELLAS_RAIN_ACCESSORIES]: "☂️",
  
  // Art & Collectibles
  [ArtCollectiblesSubcategory.ARTIST_TRADING_CARDS]: "🃏",
  [ArtCollectiblesSubcategory.COLLECTIBLES]: "🏺",
  [ArtCollectiblesSubcategory.DOLLS_MINIATURES]: "🪆",
  [ArtCollectiblesSubcategory.DRAWING_ILLUSTRATION]: "✏️",
  [ArtCollectiblesSubcategory.FIBER_ARTS]: "🧵",
  [ArtCollectiblesSubcategory.FINE_ART_CERAMICS]: "🏺",
  [ArtCollectiblesSubcategory.GLASS_ART]: "🍷",
  [ArtCollectiblesSubcategory.MIXED_MEDIA_COLLAGE]: "🎨",
  [ArtCollectiblesSubcategory.PAINTING]: "🖼️",
  [ArtCollectiblesSubcategory.PHOTOGRAPHY]: "📸",
  [ArtCollectiblesSubcategory.PRINTS]: "🖨️",
  [ArtCollectiblesSubcategory.SCULPTURE]: "🗿",
  
  // Bags & Purses
  [BagsPursesSubcategory.ACCESSORY_CASES]: "💼",
  [BagsPursesSubcategory.BACKPACKS]: "🎒",
  [BagsPursesSubcategory.CLOTHING_SHOE_BAGS]: "👗",
  [BagsPursesSubcategory.COSMETIC_TOILETRY_STORAGE]: "💄",
  [BagsPursesSubcategory.DIAPER_BAGS]: "👶",
  [BagsPursesSubcategory.FANNY_PACKS]: "🎪",
  [BagsPursesSubcategory.FOOD_INSULATED_BAGS]: "🧊",
  [BagsPursesSubcategory.HANDBAGS]: "👜",
  [BagsPursesSubcategory.LUGGAGE_TRAVEL]: "🧳",
  [BagsPursesSubcategory.MARKET_BAGS]: "🛍️",
  [BagsPursesSubcategory.MESSENGER_BAGS]: "📫",
  [BagsPursesSubcategory.POUCHES_COIN_PURSES]: "👛",
  [BagsPursesSubcategory.SPORTS_BAGS]: "⚽",
  [BagsPursesSubcategory.TOTES]: "🛒",
  [BagsPursesSubcategory.WALLETS_MONEY_CLIPS]: "💰",
  
  // Bath & Beauty
  [BathBeautySubcategory.BABY_CHILD_CARE]: "👶",
  [BathBeautySubcategory.BATH_ACCESSORIES]: "🛁",
  [BathBeautySubcategory.ESSENTIAL_OILS]: "🧴",
  [BathBeautySubcategory.FRAGRANCES]: "🌸",
  [BathBeautySubcategory.HAIR_CARE]: "💇‍♀️",
  [BathBeautySubcategory.MAKEUP_COSMETICS]: "💄",
  [BathBeautySubcategory.PERSONAL_CARE]: "🧼",
  [BathBeautySubcategory.SKIN_CARE]: "🧴",
  [BathBeautySubcategory.SOAPS]: "🧼",
  [BathBeautySubcategory.SPA_RELAXATION]: "🧘‍♀️",
  
  // Books, Movies & Music
  [BooksMoviesMusicSubcategory.BOOKS]: "📖",
  [BooksMoviesMusicSubcategory.MOVIES]: "🎬",
  [BooksMoviesMusicSubcategory.MUSIC]: "🎵",
  
  // Clothing
  [ClothingSubcategory.BOYS_CLOTHING]: "👦",
  [ClothingSubcategory.GENDER_NEUTRAL_ADULT_CLOTHING]: "👤",
  [ClothingSubcategory.GENDER_NEUTRAL_KIDS_CLOTHING]: "🧒",
  [ClothingSubcategory.GIRLS_CLOTHING]: "👧",
  [ClothingSubcategory.MENS_CLOTHING]: "👨",
  [ClothingSubcategory.WOMENS_CLOTHING]: "👩",
  
  // Craft Supplies & Tools
  [CraftSuppliesToolsSubcategory.BEADS_GEMS_CABOCHONS]: "📿",
  [CraftSuppliesToolsSubcategory.BEAUTY_SUPPLIES]: "💄",
  [CraftSuppliesToolsSubcategory.BLANKS]: "⬜",
  [CraftSuppliesToolsSubcategory.BRUSHES]: "🖌️",
  [CraftSuppliesToolsSubcategory.CANVAS_SURFACES]: "🖼️",
  [CraftSuppliesToolsSubcategory.FABRIC_NOTIONS]: "🧵",
  [CraftSuppliesToolsSubcategory.PATTERNS_HOW_TOS]: "📝",
  [CraftSuppliesToolsSubcategory.STAMPS_INKS_PAINTS]: "🎨",
  [CraftSuppliesToolsSubcategory.TOOLS_EQUIPMENT]: "🔧",
  [CraftSuppliesToolsSubcategory.YARN_FIBER]: "🧶",
  
  // Electronics & Accessories
  [ElectronicsAccessoriesSubcategory.AUDIO]: "🔊",
  [ElectronicsAccessoriesSubcategory.BATTERIES_CHARGING]: "🔋",
  [ElectronicsAccessoriesSubcategory.CABLES_CORDS]: "🔌",
  [ElectronicsAccessoriesSubcategory.CAMERAS_EQUIPMENT]: "📷",
  [ElectronicsAccessoriesSubcategory.CAR_PARTS_ACCESSORIES]: "🚗",
  [ElectronicsAccessoriesSubcategory.CELL_PHONE_ACCESSORIES]: "📱",
  [ElectronicsAccessoriesSubcategory.COMPUTERS_PERIPHERALS]: "💻",
  [ElectronicsAccessoriesSubcategory.DECALS_SKINS]: "🏷️",
  [ElectronicsAccessoriesSubcategory.DOCKING_STANDS]: "📱",
  [ElectronicsAccessoriesSubcategory.ELECTRONICS_CASES]: "📦",
  [ElectronicsAccessoriesSubcategory.GADGETS]: "🔧",
  [ElectronicsAccessoriesSubcategory.MAKER_SUPPLIES]: "🛠️",
  [ElectronicsAccessoriesSubcategory.PARTS_ELECTRICAL]: "⚡",
  [ElectronicsAccessoriesSubcategory.TV_PROJECTION]: "📺",
  [ElectronicsAccessoriesSubcategory.TELEPHONES_HANDSETS]: "☎️",
  [ElectronicsAccessoriesSubcategory.VIDEO_GAMES]: "🎮",
  
  // Home & Living
  [HomeLivingSubcategory.BATHROOM]: "🚿",
  [HomeLivingSubcategory.BEDDING]: "🛏️",
  [HomeLivingSubcategory.CLEANING_SUPPLIES]: "🧽",
  [HomeLivingSubcategory.FOOD_DRINK]: "🍽️",
  [HomeLivingSubcategory.HOME_DECOR]: "🏠",
  [HomeLivingSubcategory.KITCHEN_DINING]: "🍴",
  [HomeLivingSubcategory.LIGHTING]: "💡",
  [HomeLivingSubcategory.OFFICE]: "🏢",
  [HomeLivingSubcategory.OUTDOOR_GARDENING]: "🌱",
  [HomeLivingSubcategory.SPIRITUALITY_RELIGION]: "🕯️",
  [HomeLivingSubcategory.STORAGE_ORGANIZATION]: "📦",
  [HomeLivingSubcategory.WALL_DECOR_FRAMES]: "🖼️",
  [HomeLivingSubcategory.FURNITURE]: "🪑",
  
  // Jewelry
  [JewelrySubcategory.ANKLETS]: "👣",
  [JewelrySubcategory.BRACELETS]: "📿",
  [JewelrySubcategory.BROOCHES]: "📌",
  [JewelrySubcategory.CUFF_LINKS_TIE_CLIPS]: "👔",
  [JewelrySubcategory.EARRINGS]: "👂",
  [JewelrySubcategory.HAIR_JEWELRY]: "💎",
  [JewelrySubcategory.JEWELRY_SETS]: "💍",
  [JewelrySubcategory.NECKLACES]: "📿",
  [JewelrySubcategory.RINGS]: "💍",
  [JewelrySubcategory.WATCHES]: "⌚",
  
  // Paper & Party Supplies
  [PaperPartySuppliesSubcategory.GREETING_CARDS]: "💌",
  [PaperPartySuppliesSubcategory.INVITATIONS_ANNOUNCEMENTS]: "💌",
  [PaperPartySuppliesSubcategory.PARTY_DECORATIONS]: "🎊",
  [PaperPartySuppliesSubcategory.PARTY_FAVORS_GAMES]: "🎁",
  [PaperPartySuppliesSubcategory.PARTY_SUPPLIES]: "🎉",
  [PaperPartySuppliesSubcategory.STATIONERY]: "📝",
  
  // Pet Supplies
  [PetSuppliesSubcategory.BIRD_SUPPLIES]: "🐦",
  [PetSuppliesSubcategory.CAT_SUPPLIES]: "🐱",
  [PetSuppliesSubcategory.DOG_SUPPLIES]: "🐶",
  [PetSuppliesSubcategory.FISH_AQUATIC]: "🐠",
  [PetSuppliesSubcategory.PET_MEMORIALS_URNS]: "⚱️",
  [PetSuppliesSubcategory.PET_TOYS]: "🧸",
  [PetSuppliesSubcategory.REPTILE_AMPHIBIAN]: "🦎",
  [PetSuppliesSubcategory.SMALL_PET_SUPPLIES]: "🐹",
  
  // Shoes
  [ShoesSubcategory.BABY_SHOES]: "👶",
  [ShoesSubcategory.BOOTS]: "🥾",
  [ShoesSubcategory.FLATS_LOAFERS_OXFORDS]: "🥿",
  [ShoesSubcategory.HEELS]: "👠",
  [ShoesSubcategory.SANDALS]: "👡",
  [ShoesSubcategory.SLIPPERS]: "🩴",
  [ShoesSubcategory.SNEAKERS]: "👟",
  [ShoesSubcategory.SHOE_CARE_ACCESSORIES]: "🧽",
  
  // Toys & Games
  [ToysGamesSubcategory.BABY_TODDLER_TOYS]: "👶",
  [ToysGamesSubcategory.DOLLS_ACTION_FIGURES]: "🪆",
  [ToysGamesSubcategory.GAMES_PUZZLES]: "🧩",
  [ToysGamesSubcategory.LEARNING_SCHOOL]: "📚",
  [ToysGamesSubcategory.SPORTS_OUTDOOR_PLAY]: "⚽",
  [ToysGamesSubcategory.STUFFED_ANIMALS_PLUSHIES]: "🧸",
  
  // Weddings
  [WeddingsSubcategory.BRIDAL_ACCESSORIES]: "👰",
  [WeddingsSubcategory.BRIDAL_PARTY_ACCESSORIES]: "💒",
  "Bouquets & Corsages (Wedding)": "💐",
  [WeddingsSubcategory.CAKE_TOPPERS]: "🎂",
  [WeddingsSubcategory.WEDDING_CLOTHING]: "👗",
  [WeddingsSubcategory.WEDDING_DECORATIONS]: "🎊",
  [WeddingsSubcategory.WEDDING_FAVORS_GIFTS]: "🎁",
  [WeddingsSubcategory.WEDDING_INVITATIONS_PAPER]: "💌",
  [WeddingsSubcategory.WEDDING_JEWELRY]: "💍",
  [WeddingsSubcategory.WEDDING_SHOES]: "👠"
};
