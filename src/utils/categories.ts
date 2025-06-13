// Category types for marketplace
export const ItemType = {
  PHYSICAL: 'Physical',
  DIGITAL: 'Digital'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

// Physical product categories specific to Sri Lankan products
export const PhysicalCategory = {
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

export type PhysicalCategory = typeof PhysicalCategory[keyof typeof PhysicalCategory];

// Digital product categories
export const DigitalCategory = {
  EBOOKS_MAGAZINES: 'eBooks & Magazines',
  MUSIC_AUDIO: 'Music & Audio',
  SOFTWARE_APPS: 'Software & Apps',
  COURSES_TUTORIALS: 'Courses & Tutorials',
  DIGITAL_ART: 'Digital Art & Graphics',
  PHOTOGRAPHY: 'Photography & Stock Images',
  TEMPLATES_DESIGNS: 'Templates & Designs',
  VIDEOS_FILMS: 'Videos & Films',
  GAMES: 'Games & Entertainment',
  DOCUMENTS_GUIDES: 'Documents & Guides'
} as const;

export type DigitalCategory = typeof DigitalCategory[keyof typeof DigitalCategory];

// Combined for backward compatibility
export const LocalCategory = {
  ...PhysicalCategory,
  ...DigitalCategory
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

// Digital Categories Subcategories

// eBooks & Magazines Subcategories
export const EbooksMagazinesSubcategory = {
  FICTION: 'Fiction',
  NON_FICTION: 'Non-Fiction',
  EDUCATIONAL: 'Educational',
  SELF_HELP: 'Self-Help',
  TRAVEL_GUIDES: 'Travel Guides',
  COOKBOOKS: 'Cookbooks',
  BUSINESS: 'Business',
  MAGAZINES: 'Magazines',
  POETRY: 'Poetry',
  CHILDRENS_BOOKS: 'Children\'s Books'
} as const;

export type EbooksMagazinesSubcategory = typeof EbooksMagazinesSubcategory[keyof typeof EbooksMagazinesSubcategory];

// Music & Audio Subcategories
export const MusicAudioSubcategory = {
  INSTRUMENTAL: 'Instrumental',
  VOCAL: 'Vocal',
  TRADITIONAL: 'Traditional Music',
  MODERN: 'Modern Music',
  SOUND_EFFECTS: 'Sound Effects',
  PODCASTS: 'Podcasts',
  AUDIOBOOKS: 'Audiobooks',
  MEDITATION: 'Meditation & Relaxation',
  NATURE_SOUNDS: 'Nature Sounds'
} as const;

export type MusicAudioSubcategory = typeof MusicAudioSubcategory[keyof typeof MusicAudioSubcategory];

// Software & Apps Subcategories
export const SoftwareAppsSubcategory = {
  MOBILE_APPS: 'Mobile Apps',
  WEB_APPS: 'Web Applications',
  PRODUCTIVITY: 'Productivity Tools',
  EDUCATIONAL_SOFTWARE: 'Educational Software',
  GAMES: 'Games',
  UTILITIES: 'Utilities',
  PLUGINS: 'Plugins & Extensions'
} as const;

export type SoftwareAppsSubcategory = typeof SoftwareAppsSubcategory[keyof typeof SoftwareAppsSubcategory];

// Courses & Tutorials Subcategories
export const CoursesTutorialsSubcategory = {
  COOKING: 'Cooking Classes',
  ARTS_CRAFTS: 'Arts & Crafts',
  BUSINESS: 'Business & Entrepreneurship',
  TECHNOLOGY: 'Technology',
  LANGUAGES: 'Languages',
  MUSIC: 'Music Lessons',
  FITNESS: 'Fitness & Health',
  PHOTOGRAPHY: 'Photography',
  PERSONAL_DEVELOPMENT: 'Personal Development'
} as const;

export type CoursesTutorialsSubcategory = typeof CoursesTutorialsSubcategory[keyof typeof CoursesTutorialsSubcategory];

// Digital Art & Graphics Subcategories
export const DigitalArtSubcategory = {
  ILLUSTRATIONS: 'Illustrations',
  LOGOS: 'Logos',
  ICONS: 'Icons',
  WALLPAPERS: 'Wallpapers',
  DIGITAL_PAINTINGS: 'Digital Paintings',
  GRAPHIC_DESIGNS: 'Graphic Designs',
  PATTERNS: 'Patterns & Textures',
  CLIPART: 'Clipart'
} as const;

export type DigitalArtSubcategory = typeof DigitalArtSubcategory[keyof typeof DigitalArtSubcategory];

// Photography & Stock Images Subcategories
export const PhotographySubcategory = {
  NATURE: 'Nature Photography',
  PORTRAITS: 'Portraits',
  LANDSCAPES: 'Landscapes',
  ARCHITECTURE: 'Architecture',
  FOOD: 'Food Photography',
  BUSINESS: 'Business & Corporate',
  STOCK_PHOTOS: 'Stock Photos',
  EVENT_PHOTOGRAPHY: 'Event Photography'
} as const;

export type PhotographySubcategory = typeof PhotographySubcategory[keyof typeof PhotographySubcategory];

// Templates & Designs Subcategories
export const TemplatesDesignsSubcategory = {
  WEBSITE_TEMPLATES: 'Website Templates',
  PRESENTATION_TEMPLATES: 'Presentation Templates',
  RESUME_TEMPLATES: 'Resume Templates',
  INVITATION_TEMPLATES: 'Invitation Templates',
  BUSINESS_CARDS: 'Business Card Templates',
  SOCIAL_MEDIA: 'Social Media Templates',
  PRINT_DESIGNS: 'Print Design Templates'
} as const;

export type TemplatesDesignsSubcategory = typeof TemplatesDesignsSubcategory[keyof typeof TemplatesDesignsSubcategory];

// Videos & Films Subcategories
export const VideosFilmsSubcategory = {
  SHORT_FILMS: 'Short Films',
  DOCUMENTARIES: 'Documentaries',
  TUTORIALS: 'Video Tutorials',
  ANIMATIONS: 'Animations',
  STOCK_FOOTAGE: 'Stock Footage',
  MUSIC_VIDEOS: 'Music Videos',
  PROMOTIONAL: 'Promotional Videos'
} as const;

export type VideosFilmsSubcategory = typeof VideosFilmsSubcategory[keyof typeof VideosFilmsSubcategory];

// Games Subcategories
export const GamesSubcategory = {
  MOBILE_GAMES: 'Mobile Games',
  PC_GAMES: 'PC Games',
  BROWSER_GAMES: 'Browser Games',
  EDUCATIONAL_GAMES: 'Educational Games',
  PUZZLE_GAMES: 'Puzzle Games',
  ADVENTURE_GAMES: 'Adventure Games'
} as const;

export type GamesSubcategory = typeof GamesSubcategory[keyof typeof GamesSubcategory];

// Documents & Guides Subcategories
export const DocumentsGuidesSubcategory = {
  BUSINESS_PLANS: 'Business Plans',
  LEGAL_DOCUMENTS: 'Legal Documents',
  HOW_TO_GUIDES: 'How-to Guides',
  CHECKLISTS: 'Checklists',
  FORMS: 'Forms & Templates',
  RESEARCH_PAPERS: 'Research Papers',
  MANUALS: 'Manuals & Instructions'
} as const;

export type DocumentsGuidesSubcategory = typeof DocumentsGuidesSubcategory[keyof typeof DocumentsGuidesSubcategory];

// Combined categories structure for easier use
export const categories = [
  // Physical Products
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.FOOD_SNACKS,
    subcategories: Object.values(FoodSnacksSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.CLOTHING_ACCESSORIES,
    subcategories: Object.values(ClothingAccessoriesSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.ART_CRAFTS,
    subcategories: Object.values(ArtCraftsSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.HOME_LIVING,
    subcategories: Object.values(HomeLivingSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.HEALTH_BEAUTY,
    subcategories: Object.values(HealthBeautyLocalSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.TOYS_BABY,
    subcategories: Object.values(ToysBabySubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.STATIONERY_GIFTS,
    subcategories: Object.values(StationeryGiftsSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.WEDDINGS_EVENTS,
    subcategories: Object.values(WeddingsEventsSubcategory)
  },
  {
    type: ItemType.PHYSICAL,
    name: LocalCategory.PET_SUPPLIES,
    subcategories: Object.values(PetSuppliesSubcategory)
  },
  // Digital Products
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.EBOOKS_MAGAZINES,
    subcategories: Object.values(EbooksMagazinesSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.MUSIC_AUDIO,
    subcategories: Object.values(MusicAudioSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.SOFTWARE_APPS,
    subcategories: Object.values(SoftwareAppsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.COURSES_TUTORIALS,
    subcategories: Object.values(CoursesTutorialsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.DIGITAL_ART,
    subcategories: Object.values(DigitalArtSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.PHOTOGRAPHY,
    subcategories: Object.values(PhotographySubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.TEMPLATES_DESIGNS,
    subcategories: Object.values(TemplatesDesignsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.VIDEOS_FILMS,
    subcategories: Object.values(VideosFilmsSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.GAMES,
    subcategories: Object.values(GamesSubcategory)
  },
  {
    type: ItemType.DIGITAL,
    name: LocalCategory.DOCUMENTS_GUIDES,
    subcategories: Object.values(DocumentsGuidesSubcategory)
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
  [LocalCategory.PET_SUPPLIES]: "🐾",
  [LocalCategory.EBOOKS_MAGAZINES]: "📚",
  [LocalCategory.MUSIC_AUDIO]: "🎶",
  [LocalCategory.SOFTWARE_APPS]: "💻",
  [LocalCategory.COURSES_TUTORIALS]: "🎓",
  [LocalCategory.DIGITAL_ART]: "🖌️",
  [LocalCategory.PHOTOGRAPHY]: "📸",
  [LocalCategory.TEMPLATES_DESIGNS]: "🖥️",
  [LocalCategory.VIDEOS_FILMS]: "🎬",
  [LocalCategory.GAMES]: "🎮",
  [LocalCategory.DOCUMENTS_GUIDES]: "📄"
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
  [PetSuppliesSubcategory.PET_TOYS]: "🧶",
  // eBooks & Magazines
  [EbooksMagazinesSubcategory.FICTION]: "📖",
  [EbooksMagazinesSubcategory.NON_FICTION]: "📚",
  [EbooksMagazinesSubcategory.EDUCATIONAL]: "🎓",
  [EbooksMagazinesSubcategory.SELF_HELP]: "💡",
  [EbooksMagazinesSubcategory.TRAVEL_GUIDES]: "🗺️",
  [EbooksMagazinesSubcategory.COOKBOOKS]: "🍳",
  [EbooksMagazinesSubcategory.BUSINESS]: "💼",
  [EbooksMagazinesSubcategory.MAGAZINES]: "📰",
  [EbooksMagazinesSubcategory.POETRY]: "📜",
  [EbooksMagazinesSubcategory.CHILDRENS_BOOKS]: "📚",
  // Music & Audio
  [MusicAudioSubcategory.INSTRUMENTAL]: "🎻",
  [MusicAudioSubcategory.VOCAL]: "🎤",
  [MusicAudioSubcategory.TRADITIONAL]: "🎶",
  [MusicAudioSubcategory.MODERN]: "🎵",
  [MusicAudioSubcategory.SOUND_EFFECTS]: "🔊",
  [MusicAudioSubcategory.PODCASTS]: "🎧",
  [MusicAudioSubcategory.AUDIOBOOKS]: "📚",
  [MusicAudioSubcategory.MEDITATION]: "🧘‍♀️",
  [MusicAudioSubcategory.NATURE_SOUNDS]: "🌳",
  // Software & Apps
  [SoftwareAppsSubcategory.MOBILE_APPS]: "📱",
  [SoftwareAppsSubcategory.WEB_APPS]: "💻",
  [SoftwareAppsSubcategory.PRODUCTIVITY]: "📈",
  [SoftwareAppsSubcategory.EDUCATIONAL_SOFTWARE]: "🎓",
  [SoftwareAppsSubcategory.GAMES]: "🎮",
  [SoftwareAppsSubcategory.UTILITIES]: "🛠️",
  [SoftwareAppsSubcategory.PLUGINS]: "🔌",
  // Courses & Tutorials
  [CoursesTutorialsSubcategory.COOKING]: "🍳",
  [CoursesTutorialsSubcategory.ARTS_CRAFTS]: "🎨",
  [CoursesTutorialsSubcategory.BUSINESS]: "💼",
  [CoursesTutorialsSubcategory.TECHNOLOGY]: "💻",
  [CoursesTutorialsSubcategory.LANGUAGES]: "🗣️",
  [CoursesTutorialsSubcategory.MUSIC]: "🎶",
  [CoursesTutorialsSubcategory.FITNESS]: "🏋️‍♀️",
  [CoursesTutorialsSubcategory.PHOTOGRAPHY]: "📸",
  [CoursesTutorialsSubcategory.PERSONAL_DEVELOPMENT]: "🌱",
  // Digital Art & Graphics
  [DigitalArtSubcategory.ILLUSTRATIONS]: "🖌️",
  [DigitalArtSubcategory.LOGOS]: "🔤",
  [DigitalArtSubcategory.ICONS]: "🖼️",
  [DigitalArtSubcategory.WALLPAPERS]: "🖥️",
  [DigitalArtSubcategory.DIGITAL_PAINTINGS]: "🎨",
  [DigitalArtSubcategory.GRAPHIC_DESIGNS]: "🖌️",
  [DigitalArtSubcategory.PATTERNS]: "🧵",
  [DigitalArtSubcategory.CLIPART]: "🖼️",
  // Photography & Stock Images
  [PhotographySubcategory.NATURE]: "🌳",
  [PhotographySubcategory.PORTRAITS]: "👤",
  [PhotographySubcategory.LANDSCAPES]: "🏞️",
  [PhotographySubcategory.ARCHITECTURE]: "🏛️",
  [PhotographySubcategory.FOOD]: "🍽️",
  [PhotographySubcategory.BUSINESS]: "💼",
  [PhotographySubcategory.STOCK_PHOTOS]: "🖼️",
  [PhotographySubcategory.EVENT_PHOTOGRAPHY]: "📸",
  // Templates & Designs
  [TemplatesDesignsSubcategory.WEBSITE_TEMPLATES]: "🖥️",
  [TemplatesDesignsSubcategory.PRESENTATION_TEMPLATES]: "📊",
  [TemplatesDesignsSubcategory.RESUME_TEMPLATES]: "📄",
  [TemplatesDesignsSubcategory.INVITATION_TEMPLATES]: "✉️",
  [TemplatesDesignsSubcategory.BUSINESS_CARDS]: "💳",
  [TemplatesDesignsSubcategory.SOCIAL_MEDIA]: "📱",
  [TemplatesDesignsSubcategory.PRINT_DESIGNS]: "🖨️",
  // Videos & Films
  [VideosFilmsSubcategory.SHORT_FILMS]: "🎥",
  [VideosFilmsSubcategory.DOCUMENTARIES]: "📽️",
  [VideosFilmsSubcategory.TUTORIALS]: "📹",
  [VideosFilmsSubcategory.ANIMATIONS]: "🌀",
  [VideosFilmsSubcategory.STOCK_FOOTAGE]: "🎞️",
  [VideosFilmsSubcategory.MUSIC_VIDEOS]: "🎶",
  [VideosFilmsSubcategory.PROMOTIONAL]: "📢",
  // Games
  [GamesSubcategory.MOBILE_GAMES]: "📱",
  [GamesSubcategory.PC_GAMES]: "💻",
  [GamesSubcategory.BROWSER_GAMES]: "🌐",
  [GamesSubcategory.EDUCATIONAL_GAMES]: "🎓",
  [GamesSubcategory.PUZZLE_GAMES]: "🧩",
  [GamesSubcategory.ADVENTURE_GAMES]: "🗺️",
  // Documents & Guides
  [DocumentsGuidesSubcategory.BUSINESS_PLANS]: "📊",
  [DocumentsGuidesSubcategory.LEGAL_DOCUMENTS]: "⚖️",
  [DocumentsGuidesSubcategory.HOW_TO_GUIDES]: "📝",
  [DocumentsGuidesSubcategory.CHECKLISTS]: "☑️",
  [DocumentsGuidesSubcategory.FORMS]: "📄",
  [DocumentsGuidesSubcategory.RESEARCH_PAPERS]: "📚",
  [DocumentsGuidesSubcategory.MANUALS]: "📖"
};


