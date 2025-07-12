import React from 'react';
import { 
  FiShoppingBag, FiImage, FiBriefcase, FiHeart, FiBook, FiUser, 
  FiTool, FiSmartphone, FiHome, FiGift, FiFeather, FiPackage,
  FiCamera, FiMonitor, FiMusic, FiVideo, FiPlay,
  FiFileText, FiEdit3, FiStar, FiShield, FiHeadphones,
  FiZap, FiScissors, FiSettings, FiPenTool, FiDroplet, 
  FiActivity, FiAward, FiTarget, FiTrendingUp, FiBarChart,
  FiKey, FiSquare, FiLayers, FiMic, 
  FiGlobe, FiArchive, FiTag, FiBox, FiWatch, FiPrinter,
  FiMapPin, FiCoffee, FiAperture,
  FiSun, FiUmbrella, FiBattery,
  FiRotateCcw, FiEyeOff, FiEye, FiType, FiCircle,
  FiMinus
} from 'react-icons/fi';

// Category types for marketplace - supports both Physical and Digital products
export const ItemType = {
  PHYSICAL: 'Physical',
  DIGITAL: 'Digital'
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

// Digital Product Categories
export const DigitalCategory = {
  SOFTWARE_APPS: 'Software & Apps',
  DIGITAL_ART_GRAPHICS: 'Digital Art & Graphics',
  MUSIC_AUDIO: 'Music & Audio',
  VIDEO_CONTENT: 'Video Content',
  EBOOKS_DOCUMENTS: 'eBooks & Documents',
  PHOTOGRAPHY_PRESETS: 'Photography & Presets',
  TEMPLATES_PRINTABLES: 'Templates & Printables',
  COURSES_EDUCATION: 'Courses & Education',
  FONTS_TYPOGRAPHY: 'Fonts & Typography',
  DIGITAL_CRAFT_SUPPLIES: 'Digital Craft Supplies'
} as const;

export type DigitalCategory = typeof DigitalCategory[keyof typeof DigitalCategory];

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

// Digital Product Subcategories

// Software & Apps Subcategories
export const SoftwareAppsSubcategory = {
  MOBILE_APPS: 'Mobile Apps',
  DESKTOP_SOFTWARE: 'Desktop Software',
  WEB_APPLICATIONS: 'Web Applications',
  PLUGINS_EXTENSIONS: 'Plugins & Extensions',
  SCRIPTS_AUTOMATION: 'Scripts & Automation',
  GAMES: 'Games',
  PRODUCTIVITY_TOOLS: 'Productivity Tools',
  DEVELOPMENT_TOOLS: 'Development Tools'
} as const;

export type SoftwareAppsSubcategory = typeof SoftwareAppsSubcategory[keyof typeof SoftwareAppsSubcategory];

// Digital Art & Graphics Subcategories
export const DigitalArtGraphicsSubcategory = {
  ILLUSTRATIONS: 'Illustrations',
  DIGITAL_PAINTINGS: 'Digital Paintings',
  VECTOR_GRAPHICS: 'Vector Graphics',
  ICONS_SYMBOLS: 'Icons & Symbols',
  CLIPART: 'Clipart',
  BACKGROUNDS_TEXTURES: 'Backgrounds & Textures',
  LOGOS_BRANDING: 'Logos & Branding',
  DIGITAL_SCRAPBOOK: 'Digital Scrapbook Elements'
} as const;

export type DigitalArtGraphicsSubcategory = typeof DigitalArtGraphicsSubcategory[keyof typeof DigitalArtGraphicsSubcategory];

// Music & Audio Subcategories
export const MusicAudioSubcategory = {
  BACKGROUND_MUSIC: 'Background Music',
  SOUND_EFFECTS: 'Sound Effects',
  AUDIO_LOOPS: 'Audio Loops',
  PODCAST_INTROS: 'Podcast Intros',
  MEDITATION_SOUNDS: 'Meditation Sounds',
  VOICEOVERS: 'Voiceovers',
  MUSIC_BEATS: 'Music Beats',
  AUDIO_BOOKS: 'Audio Books'
} as const;

export type MusicAudioSubcategory = typeof MusicAudioSubcategory[keyof typeof MusicAudioSubcategory];

// Video Content Subcategories
export const VideoContentSubcategory = {
  STOCK_FOOTAGE: 'Stock Footage',
  MOTION_GRAPHICS: 'Motion Graphics',
  VIDEO_TEMPLATES: 'Video Templates',
  ANIMATIONS: 'Animations',
  INTRO_OUTROS: 'Intro & Outros',
  TUTORIALS: 'Tutorials',
  DOCUMENTARIES: 'Documentaries',
  SHORT_FILMS: 'Short Films'
} as const;

export type VideoContentSubcategory = typeof VideoContentSubcategory[keyof typeof VideoContentSubcategory];

// eBooks & Documents Subcategories
export const EbooksDocumentsSubcategory = {
  FICTION_BOOKS: 'Fiction Books',
  NON_FICTION: 'Non-Fiction',
  TECHNICAL_MANUALS: 'Technical Manuals',
  GUIDES_HOWTOS: 'Guides & How-tos',
  RESEARCH_PAPERS: 'Research Papers',
  BUSINESS_PLANS: 'Business Plans',
  LEGAL_DOCUMENTS: 'Legal Documents',
  ACADEMIC_CONTENT: 'Academic Content'
} as const;

export type EbooksDocumentsSubcategory = typeof EbooksDocumentsSubcategory[keyof typeof EbooksDocumentsSubcategory];

// Photography & Presets Subcategories
export const PhotographyPresetsSubcategory = {
  LIGHTROOM_PRESETS: 'Lightroom Presets',
  PHOTOSHOP_ACTIONS: 'Photoshop Actions',
  STOCK_PHOTOS: 'Stock Photos',
  CAMERA_RAW_PRESETS: 'Camera Raw Presets',
  MOBILE_PRESETS: 'Mobile Presets',
  VIDEO_LUTS: 'Video LUTs',
  PHOTOGRAPHY_OVERLAYS: 'Photography Overlays',
  PHOTO_FILTERS: 'Photo Filters'
} as const;

export type PhotographyPresetsSubcategory = typeof PhotographyPresetsSubcategory[keyof typeof PhotographyPresetsSubcategory];

// Templates & Printables Subcategories
export const TemplatesPrintablesSubcategory = {
  BUSINESS_TEMPLATES: 'Business Templates',
  SOCIAL_MEDIA_TEMPLATES: 'Social Media Templates',
  PRESENTATION_TEMPLATES: 'Presentation Templates',
  WEBSITE_TEMPLATES: 'Website Templates',
  PRINTABLE_PLANNERS: 'Printable Planners',
  INVITATIONS_CARDS: 'Invitations & Cards',
  POSTERS_FLYERS: 'Posters & Flyers',
  RESUME_TEMPLATES: 'Resume Templates'
} as const;

export type TemplatesPrintablesSubcategory = typeof TemplatesPrintablesSubcategory[keyof typeof TemplatesPrintablesSubcategory];

// Courses & Education Subcategories
export const CoursesEducationSubcategory = {
  ONLINE_COURSES: 'Online Courses',
  TUTORIALS_LESSONS: 'Tutorials & Lessons',
  EDUCATIONAL_VIDEOS: 'Educational Videos',
  STUDY_MATERIALS: 'Study Materials',
  WEBINARS: 'Webinars',
  WORKSHOPS: 'Workshops',
  SKILL_DEVELOPMENT: 'Skill Development',
  CERTIFICATION_PREP: 'Certification Prep'
} as const;

export type CoursesEducationSubcategory = typeof CoursesEducationSubcategory[keyof typeof CoursesEducationSubcategory];

// Fonts & Typography Subcategories
export const FontsTypographySubcategory = {
  SERIF_FONTS: 'Serif Fonts',
  SANS_SERIF_FONTS: 'Sans Serif Fonts',
  SCRIPT_FONTS: 'Script Fonts',
  DISPLAY_FONTS: 'Display Fonts',
  HANDWRITTEN_FONTS: 'Handwritten Fonts',
  VINTAGE_FONTS: 'Vintage Fonts',
  MODERN_FONTS: 'Modern Fonts',
  FONT_BUNDLES: 'Font Bundles'
} as const;

export type FontsTypographySubcategory = typeof FontsTypographySubcategory[keyof typeof FontsTypographySubcategory];

// Digital Craft Supplies Subcategories
export const DigitalCraftSuppliesSubcategory = {
  DIGITAL_PAPERS: 'Digital Papers',
  DIGITAL_STICKERS: 'Digital Stickers',
  DIGITAL_STAMPS: 'Digital Stamps',
  CRAFTING_TEMPLATES: 'Crafting Templates',
  CUTTING_FILES: 'Cutting Files (SVG, DXF)',
  EMBROIDERY_PATTERNS: 'Embroidery Patterns',
  KNITTING_PATTERNS: 'Knitting Patterns',
  CROCHET_PATTERNS: 'Crochet Patterns'
} as const;

export type DigitalCraftSuppliesSubcategory = typeof DigitalCraftSuppliesSubcategory[keyof typeof DigitalCraftSuppliesSubcategory];

// Category interface
export interface Category {
  type: ItemType;
  name: EtsyCategory | DigitalCategory;
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
  },
  // Digital Product Categories
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.SOFTWARE_APPS,
    subcategories: Object.values(SoftwareAppsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.DIGITAL_ART_GRAPHICS,
    subcategories: Object.values(DigitalArtGraphicsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.MUSIC_AUDIO,
    subcategories: Object.values(MusicAudioSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.VIDEO_CONTENT,
    subcategories: Object.values(VideoContentSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.EBOOKS_DOCUMENTS,
    subcategories: Object.values(EbooksDocumentsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.PHOTOGRAPHY_PRESETS,
    subcategories: Object.values(PhotographyPresetsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.TEMPLATES_PRINTABLES,
    subcategories: Object.values(TemplatesPrintablesSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.COURSES_EDUCATION,
    subcategories: Object.values(CoursesEducationSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.FONTS_TYPOGRAPHY,
    subcategories: Object.values(FontsTypographySubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: DigitalCategory.DIGITAL_CRAFT_SUPPLIES,
    subcategories: Object.values(DigitalCraftSuppliesSubcategory)
  }
];

// Category icons mapping - Using React Icons
export const categoryIcons: Record<EtsyCategory | DigitalCategory, React.ComponentType<any>> = {
  [EtsyCategory.ACCESSORIES]: FiShoppingBag,
  [EtsyCategory.ART_COLLECTIBLES]: FiImage,
  [EtsyCategory.BAGS_PURSES]: FiBriefcase,
  [EtsyCategory.BATH_BEAUTY]: FiHeart,
  [EtsyCategory.BOOKS_MOVIES_MUSIC]: FiBook,
  [EtsyCategory.CLOTHING]: FiUser,
  [EtsyCategory.CRAFT_SUPPLIES_TOOLS]: FiTool,
  [EtsyCategory.ELECTRONICS_ACCESSORIES]: FiSmartphone,
  [EtsyCategory.HOME_LIVING]: FiHome,
  [EtsyCategory.JEWELRY]: FiStar,
  [EtsyCategory.PAPER_PARTY_SUPPLIES]: FiGift,
  [EtsyCategory.PET_SUPPLIES]: FiHeart,
  [EtsyCategory.SHOES]: FiFeather,
  [EtsyCategory.TOYS_GAMES]: FiPlay,
  [EtsyCategory.WEDDINGS]: FiHeart,
  // Digital Category Icons
  [DigitalCategory.SOFTWARE_APPS]: FiMonitor,
  [DigitalCategory.DIGITAL_ART_GRAPHICS]: FiImage,
  [DigitalCategory.MUSIC_AUDIO]: FiMusic,
  [DigitalCategory.VIDEO_CONTENT]: FiVideo,
  [DigitalCategory.EBOOKS_DOCUMENTS]: FiBook,
  [DigitalCategory.PHOTOGRAPHY_PRESETS]: FiCamera,
  [DigitalCategory.TEMPLATES_PRINTABLES]: FiFileText,
  [DigitalCategory.COURSES_EDUCATION]: FiBook,
  [DigitalCategory.FONTS_TYPOGRAPHY]: FiEdit3,
  [DigitalCategory.DIGITAL_CRAFT_SUPPLIES]: FiPackage
};

// Subcategory icons mapping - React Icons
export const subCategoryIcons: Record<string, React.ComponentType> = {
  // Accessories
  [AccessoriesSubcategory.BABY_ACCESSORIES]: FiUser,
  [AccessoriesSubcategory.BELTS_SUSPENDERS]: FiPackage,
  [AccessoriesSubcategory.BOUQUETS_CORSAGES]: FiHeart,
  [AccessoriesSubcategory.COSTUME_ACCESSORIES]: FiStar,
  [AccessoriesSubcategory.GLOVES_MITTENS]: FiShield,
  [AccessoriesSubcategory.HAIR_ACCESSORIES]: FiFeather,
  [AccessoriesSubcategory.HAND_FANS]: FiSun,
  [AccessoriesSubcategory.HATS_CAPS]: FiShield,
  [AccessoriesSubcategory.KEYCHAINS_LANYARDS]: FiKey,
  [AccessoriesSubcategory.LATKANS]: FiGift,
  [AccessoriesSubcategory.PATCHES_PINS]: FiMapPin,
  [AccessoriesSubcategory.SCARVES_WRAPS]: FiPackage,
  [AccessoriesSubcategory.SUIT_TIE_ACCESSORIES]: FiBriefcase,
  [AccessoriesSubcategory.SUNGLASSES_EYEWEAR]: FiEye,
  [AccessoriesSubcategory.UMBRELLAS_RAIN_ACCESSORIES]: FiUmbrella,
  
  // Art & Collectibles
  [ArtCollectiblesSubcategory.ARTIST_TRADING_CARDS]: FiImage,
  [ArtCollectiblesSubcategory.COLLECTIBLES]: FiArchive,
  [ArtCollectiblesSubcategory.DOLLS_MINIATURES]: FiGift,
  [ArtCollectiblesSubcategory.DRAWING_ILLUSTRATION]: FiEdit3,
  [ArtCollectiblesSubcategory.FIBER_ARTS]: FiPackage,
  [ArtCollectiblesSubcategory.FINE_ART_CERAMICS]: FiAperture,
  [ArtCollectiblesSubcategory.GLASS_ART]: FiDroplet,
  [ArtCollectiblesSubcategory.MIXED_MEDIA_COLLAGE]: FiLayers,
  [ArtCollectiblesSubcategory.PAINTING]: FiImage,
  [ArtCollectiblesSubcategory.PHOTOGRAPHY]: FiCamera,
  [ArtCollectiblesSubcategory.PRINTS]: FiPrinter,
  [ArtCollectiblesSubcategory.SCULPTURE]: FiBox,
  
  // Bags & Purses
  [BagsPursesSubcategory.ACCESSORY_CASES]: FiPackage,
  [BagsPursesSubcategory.BACKPACKS]: FiShoppingBag,
  [BagsPursesSubcategory.CLOTHING_SHOE_BAGS]: FiShoppingBag,
  [BagsPursesSubcategory.COSMETIC_TOILETRY_STORAGE]: FiPackage,
  [BagsPursesSubcategory.DIAPER_BAGS]: FiUser,
  [BagsPursesSubcategory.FANNY_PACKS]: FiShoppingBag,
  [BagsPursesSubcategory.FOOD_INSULATED_BAGS]: FiShoppingBag,
  [BagsPursesSubcategory.HANDBAGS]: FiShoppingBag,
  [BagsPursesSubcategory.LUGGAGE_TRAVEL]: FiShoppingBag,
  [BagsPursesSubcategory.MARKET_BAGS]: FiShoppingBag,
  [BagsPursesSubcategory.MESSENGER_BAGS]: FiShoppingBag,
  [BagsPursesSubcategory.POUCHES_COIN_PURSES]: FiShoppingBag,
  [BagsPursesSubcategory.SPORTS_BAGS]: FiActivity,
  [BagsPursesSubcategory.TOTES]: FiShoppingBag,
  [BagsPursesSubcategory.WALLETS_MONEY_CLIPS]: FiShoppingBag,
  
  // Bath & Beauty
  [BathBeautySubcategory.BABY_CHILD_CARE]: FiUser,
  [BathBeautySubcategory.BATH_ACCESSORIES]: FiDroplet,
  [BathBeautySubcategory.ESSENTIAL_OILS]: FiDroplet,
  [BathBeautySubcategory.FRAGRANCES]: FiHeart,
  [BathBeautySubcategory.HAIR_CARE]: FiScissors,
  [BathBeautySubcategory.MAKEUP_COSMETICS]: FiStar,
  [BathBeautySubcategory.PERSONAL_CARE]: FiUser,
  [BathBeautySubcategory.SKIN_CARE]: FiDroplet,
  [BathBeautySubcategory.SOAPS]: FiDroplet,
  [BathBeautySubcategory.SPA_RELAXATION]: FiSun,
  
  // Books, Movies & Music
  [BooksMoviesMusicSubcategory.BOOKS]: FiBook,
  [BooksMoviesMusicSubcategory.MOVIES]: FiVideo,
  [BooksMoviesMusicSubcategory.MUSIC]: FiMusic,
  
  // Clothing
  [ClothingSubcategory.BOYS_CLOTHING]: FiUser,
  [ClothingSubcategory.GENDER_NEUTRAL_ADULT_CLOTHING]: FiUser,
  [ClothingSubcategory.GENDER_NEUTRAL_KIDS_CLOTHING]: FiUser,
  [ClothingSubcategory.GIRLS_CLOTHING]: FiUser,
  [ClothingSubcategory.MENS_CLOTHING]: FiUser,
  [ClothingSubcategory.WOMENS_CLOTHING]: FiUser,
  
  // Craft Supplies & Tools
  [CraftSuppliesToolsSubcategory.BEADS_GEMS_CABOCHONS]: FiGift,
  [CraftSuppliesToolsSubcategory.BEAUTY_SUPPLIES]: FiStar,
  [CraftSuppliesToolsSubcategory.BLANKS]: FiSquare,
  [CraftSuppliesToolsSubcategory.BRUSHES]: FiPenTool,
  [CraftSuppliesToolsSubcategory.CANVAS_SURFACES]: FiImage,
  [CraftSuppliesToolsSubcategory.FABRIC_NOTIONS]: FiPackage,
  [CraftSuppliesToolsSubcategory.PATTERNS_HOW_TOS]: FiFileText,
  [CraftSuppliesToolsSubcategory.STAMPS_INKS_PAINTS]: FiEdit3,
  [CraftSuppliesToolsSubcategory.TOOLS_EQUIPMENT]: FiTool,
  [CraftSuppliesToolsSubcategory.YARN_FIBER]: FiPackage,
  
  // Electronics & Accessories
  [ElectronicsAccessoriesSubcategory.AUDIO]: FiHeadphones,
  [ElectronicsAccessoriesSubcategory.BATTERIES_CHARGING]: FiBattery,
  [ElectronicsAccessoriesSubcategory.CABLES_CORDS]: FiZap,
  [ElectronicsAccessoriesSubcategory.CAMERAS_EQUIPMENT]: FiCamera,
  [ElectronicsAccessoriesSubcategory.CAR_PARTS_ACCESSORIES]: FiTool,
  [ElectronicsAccessoriesSubcategory.CELL_PHONE_ACCESSORIES]: FiSmartphone,
  [ElectronicsAccessoriesSubcategory.COMPUTERS_PERIPHERALS]: FiMonitor,
  [ElectronicsAccessoriesSubcategory.DECALS_SKINS]: FiTag,
  [ElectronicsAccessoriesSubcategory.DOCKING_STANDS]: FiSmartphone,
  [ElectronicsAccessoriesSubcategory.ELECTRONICS_CASES]: FiPackage,
  [ElectronicsAccessoriesSubcategory.GADGETS]: FiTool,
  [ElectronicsAccessoriesSubcategory.MAKER_SUPPLIES]: FiTool,
  [ElectronicsAccessoriesSubcategory.PARTS_ELECTRICAL]: FiZap,
  [ElectronicsAccessoriesSubcategory.TV_PROJECTION]: FiMonitor,
  [ElectronicsAccessoriesSubcategory.TELEPHONES_HANDSETS]: FiSmartphone,
  [ElectronicsAccessoriesSubcategory.VIDEO_GAMES]: FiPlay,
  
  // Home & Living
  [HomeLivingSubcategory.BATHROOM]: FiDroplet,
  [HomeLivingSubcategory.BEDDING]: FiHome,
  [HomeLivingSubcategory.CLEANING_SUPPLIES]: FiTool,
  [HomeLivingSubcategory.FOOD_DRINK]: FiCoffee,
  [HomeLivingSubcategory.HOME_DECOR]: FiHome,
  [HomeLivingSubcategory.KITCHEN_DINING]: FiCoffee,
  [HomeLivingSubcategory.LIGHTING]: FiSun,
  [HomeLivingSubcategory.OFFICE]: FiBriefcase,
  [HomeLivingSubcategory.OUTDOOR_GARDENING]: FiSun,
  [HomeLivingSubcategory.SPIRITUALITY_RELIGION]: FiSun,
  [HomeLivingSubcategory.STORAGE_ORGANIZATION]: FiPackage,
  [HomeLivingSubcategory.WALL_DECOR_FRAMES]: FiImage,
  [HomeLivingSubcategory.FURNITURE]: FiHome,
  
  // Jewelry
  [JewelrySubcategory.ANKLETS]: FiCircle,
  [JewelrySubcategory.BRACELETS]: FiWatch,
  [JewelrySubcategory.BROOCHES]: FiMapPin,
  [JewelrySubcategory.CUFF_LINKS_TIE_CLIPS]: FiBriefcase,
  [JewelrySubcategory.EARRINGS]: FiCircle,
  [JewelrySubcategory.HAIR_JEWELRY]: FiFeather,
  [JewelrySubcategory.JEWELRY_SETS]: FiGift,
  [JewelrySubcategory.NECKLACES]: FiCircle,
  [JewelrySubcategory.RINGS]: FiCircle,
  [JewelrySubcategory.WATCHES]: FiWatch,
  
  // Paper & Party Supplies
  [PaperPartySuppliesSubcategory.GREETING_CARDS]: FiFileText,
  [PaperPartySuppliesSubcategory.INVITATIONS_ANNOUNCEMENTS]: FiFileText,
  [PaperPartySuppliesSubcategory.PARTY_DECORATIONS]: FiGift,
  [PaperPartySuppliesSubcategory.PARTY_FAVORS_GAMES]: FiGift,
  [PaperPartySuppliesSubcategory.PARTY_SUPPLIES]: FiGift,
  [PaperPartySuppliesSubcategory.STATIONERY]: FiFileText,
  
  // Pet Supplies
  [PetSuppliesSubcategory.BIRD_SUPPLIES]: FiFeather,
  [PetSuppliesSubcategory.CAT_SUPPLIES]: FiHeart,
  [PetSuppliesSubcategory.DOG_SUPPLIES]: FiHeart,
  [PetSuppliesSubcategory.FISH_AQUATIC]: FiDroplet,
  [PetSuppliesSubcategory.PET_MEMORIALS_URNS]: FiArchive,
  [PetSuppliesSubcategory.PET_TOYS]: FiGift,
  [PetSuppliesSubcategory.REPTILE_AMPHIBIAN]: FiSun,
  [PetSuppliesSubcategory.SMALL_PET_SUPPLIES]: FiHeart,
  
  // Shoes
  [ShoesSubcategory.BABY_SHOES]: FiUser,
  [ShoesSubcategory.BOOTS]: FiShield,
  [ShoesSubcategory.FLATS_LOAFERS_OXFORDS]: FiMinus,
  [ShoesSubcategory.HEELS]: FiTrendingUp,
  [ShoesSubcategory.SANDALS]: FiSun,
  [ShoesSubcategory.SLIPPERS]: FiHome,
  [ShoesSubcategory.SNEAKERS]: FiActivity,
  [ShoesSubcategory.SHOE_CARE_ACCESSORIES]: FiTool,
  
  // Toys & Games
  [ToysGamesSubcategory.BABY_TODDLER_TOYS]: FiUser,
  [ToysGamesSubcategory.DOLLS_ACTION_FIGURES]: FiGift,
  [ToysGamesSubcategory.GAMES_PUZZLES]: FiTarget,
  [ToysGamesSubcategory.LEARNING_SCHOOL]: FiBook,
  [ToysGamesSubcategory.SPORTS_OUTDOOR_PLAY]: FiActivity,
  [ToysGamesSubcategory.STUFFED_ANIMALS_PLUSHIES]: FiHeart,
  
  // Weddings
  [WeddingsSubcategory.BRIDAL_ACCESSORIES]: FiHeart,
  [WeddingsSubcategory.BRIDAL_PARTY_ACCESSORIES]: FiGift,
  "Bouquets & Corsages (Wedding)": FiHeart,
  [WeddingsSubcategory.CAKE_TOPPERS]: FiGift,
  [WeddingsSubcategory.WEDDING_CLOTHING]: FiUser,
  [WeddingsSubcategory.WEDDING_DECORATIONS]: FiGift,
  [WeddingsSubcategory.WEDDING_FAVORS_GIFTS]: FiGift,
  [WeddingsSubcategory.WEDDING_INVITATIONS_PAPER]: FiFileText,
  [WeddingsSubcategory.WEDDING_JEWELRY]: FiCircle,
  [WeddingsSubcategory.WEDDING_SHOES]: FiTrendingUp,
  
  // Digital Product Subcategory Icons
  
  // Software & Apps
  [SoftwareAppsSubcategory.MOBILE_APPS]: FiSmartphone,
  [SoftwareAppsSubcategory.DESKTOP_SOFTWARE]: FiMonitor,
  [SoftwareAppsSubcategory.WEB_APPLICATIONS]: FiGlobe,
  [SoftwareAppsSubcategory.PLUGINS_EXTENSIONS]: FiSettings,
  [SoftwareAppsSubcategory.SCRIPTS_AUTOMATION]: FiSettings,
  [SoftwareAppsSubcategory.GAMES]: FiPlay,
  [SoftwareAppsSubcategory.PRODUCTIVITY_TOOLS]: FiBarChart,
  [SoftwareAppsSubcategory.DEVELOPMENT_TOOLS]: FiTool,
  
  // Digital Art & Graphics
  [DigitalArtGraphicsSubcategory.ILLUSTRATIONS]: FiImage,
  [DigitalArtGraphicsSubcategory.DIGITAL_PAINTINGS]: FiEdit3,
  [DigitalArtGraphicsSubcategory.VECTOR_GRAPHICS]: FiEdit3,
  [DigitalArtGraphicsSubcategory.ICONS_SYMBOLS]: FiStar,
  [DigitalArtGraphicsSubcategory.CLIPART]: FiScissors,
  [DigitalArtGraphicsSubcategory.BACKGROUNDS_TEXTURES]: FiLayers,
  [DigitalArtGraphicsSubcategory.LOGOS_BRANDING]: FiTag,
  [DigitalArtGraphicsSubcategory.DIGITAL_SCRAPBOOK]: FiFileText,
  
  // Music & Audio
  [MusicAudioSubcategory.BACKGROUND_MUSIC]: FiMusic,
  [MusicAudioSubcategory.SOUND_EFFECTS]: FiHeadphones,
  [MusicAudioSubcategory.AUDIO_LOOPS]: FiRotateCcw,
  [MusicAudioSubcategory.PODCAST_INTROS]: FiMic,
  [MusicAudioSubcategory.MEDITATION_SOUNDS]: FiSun,
  [MusicAudioSubcategory.VOICEOVERS]: FiMic,
  [MusicAudioSubcategory.MUSIC_BEATS]: FiMusic,
  [MusicAudioSubcategory.AUDIO_BOOKS]: FiBook,
  
  // Video Content
  [VideoContentSubcategory.STOCK_FOOTAGE]: FiVideo,
  [VideoContentSubcategory.MOTION_GRAPHICS]: FiPlay,
  [VideoContentSubcategory.VIDEO_TEMPLATES]: FiVideo,
  [VideoContentSubcategory.ANIMATIONS]: FiPlay,
  [VideoContentSubcategory.INTRO_OUTROS]: FiVideo,
  [VideoContentSubcategory.TUTORIALS]: FiMonitor,
  [VideoContentSubcategory.DOCUMENTARIES]: FiVideo,
  [VideoContentSubcategory.SHORT_FILMS]: FiVideo,
  
  // eBooks & Documents
  [EbooksDocumentsSubcategory.FICTION_BOOKS]: FiBook,
  [EbooksDocumentsSubcategory.NON_FICTION]: FiBook,
  [EbooksDocumentsSubcategory.TECHNICAL_MANUALS]: FiFileText,
  [EbooksDocumentsSubcategory.GUIDES_HOWTOS]: FiBook,
  [EbooksDocumentsSubcategory.RESEARCH_PAPERS]: FiFileText,
  [EbooksDocumentsSubcategory.BUSINESS_PLANS]: FiBarChart,
  [EbooksDocumentsSubcategory.LEGAL_DOCUMENTS]: FiFileText,
  [EbooksDocumentsSubcategory.ACADEMIC_CONTENT]: FiBook,
  
  // Photography & Presets
  [PhotographyPresetsSubcategory.LIGHTROOM_PRESETS]: FiCamera,
  [PhotographyPresetsSubcategory.PHOTOSHOP_ACTIONS]: FiEdit3,
  [PhotographyPresetsSubcategory.STOCK_PHOTOS]: FiImage,
  [PhotographyPresetsSubcategory.CAMERA_RAW_PRESETS]: FiCamera,
  [PhotographyPresetsSubcategory.MOBILE_PRESETS]: FiSmartphone,
  [PhotographyPresetsSubcategory.VIDEO_LUTS]: FiVideo,
  [PhotographyPresetsSubcategory.PHOTOGRAPHY_OVERLAYS]: FiLayers,
  [PhotographyPresetsSubcategory.PHOTO_FILTERS]: FiEyeOff,
  
  // Templates & Printables
  [TemplatesPrintablesSubcategory.BUSINESS_TEMPLATES]: FiBriefcase,
  [TemplatesPrintablesSubcategory.SOCIAL_MEDIA_TEMPLATES]: FiGlobe,
  [TemplatesPrintablesSubcategory.PRESENTATION_TEMPLATES]: FiBarChart,
  [TemplatesPrintablesSubcategory.WEBSITE_TEMPLATES]: FiGlobe,
  [TemplatesPrintablesSubcategory.PRINTABLE_PLANNERS]: FiFileText,
  [TemplatesPrintablesSubcategory.INVITATIONS_CARDS]: FiFileText,
  [TemplatesPrintablesSubcategory.POSTERS_FLYERS]: FiFileText,
  [TemplatesPrintablesSubcategory.RESUME_TEMPLATES]: FiFileText,
  
  // Courses & Education
  [CoursesEducationSubcategory.ONLINE_COURSES]: FiMonitor,
  [CoursesEducationSubcategory.TUTORIALS_LESSONS]: FiBook,
  [CoursesEducationSubcategory.EDUCATIONAL_VIDEOS]: FiVideo,
  [CoursesEducationSubcategory.STUDY_MATERIALS]: FiBook,
  [CoursesEducationSubcategory.WEBINARS]: FiMonitor,
  [CoursesEducationSubcategory.WORKSHOPS]: FiTool,
  [CoursesEducationSubcategory.SKILL_DEVELOPMENT]: FiTarget,
  [CoursesEducationSubcategory.CERTIFICATION_PREP]: FiAward,
  
  // Fonts & Typography
  [FontsTypographySubcategory.SERIF_FONTS]: FiType,
  [FontsTypographySubcategory.SANS_SERIF_FONTS]: FiType,
  [FontsTypographySubcategory.SCRIPT_FONTS]: FiEdit3,
  [FontsTypographySubcategory.DISPLAY_FONTS]: FiType,
  [FontsTypographySubcategory.HANDWRITTEN_FONTS]: FiEdit3,
  [FontsTypographySubcategory.VINTAGE_FONTS]: FiType,
  [FontsTypographySubcategory.MODERN_FONTS]: FiType,
  [FontsTypographySubcategory.FONT_BUNDLES]: FiPackage,
  
  // Digital Craft Supplies
  [DigitalCraftSuppliesSubcategory.DIGITAL_PAPERS]: FiFileText,
  [DigitalCraftSuppliesSubcategory.DIGITAL_STICKERS]: FiStar,
  [DigitalCraftSuppliesSubcategory.DIGITAL_STAMPS]: FiTag,
  [DigitalCraftSuppliesSubcategory.CRAFTING_TEMPLATES]: FiEdit3,
  [DigitalCraftSuppliesSubcategory.CUTTING_FILES]: FiScissors,
  [DigitalCraftSuppliesSubcategory.EMBROIDERY_PATTERNS]: FiPackage,
  [DigitalCraftSuppliesSubcategory.KNITTING_PATTERNS]: FiPackage,
  [DigitalCraftSuppliesSubcategory.CROCHET_PATTERNS]: FiPackage
};
