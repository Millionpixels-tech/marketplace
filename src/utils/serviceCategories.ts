// Service Categories for marketplace - completely separate from products
export const ServiceDeliveryType = {
  ONSITE: 'Onsite',
  ONLINE: 'Online',
  BOTH: 'Both'
} as const;

export type ServiceDeliveryType = typeof ServiceDeliveryType[keyof typeof ServiceDeliveryType];

// Service Duration Types
export const ServiceDurationType = {
  MINUTELY: 'Minutely',
  HOURLY: 'Hourly',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  PROJECT_BASED: 'Project Based',
  PACKAGE: 'Package'
} as const;

export type ServiceDurationType = typeof ServiceDurationType[keyof typeof ServiceDurationType];

// Main Service Categories
export const ServiceCategory = {
  // Professional Services
  BUSINESS_CONSULTING: 'Business Consulting',
  MARKETING_ADVERTISING: 'Marketing & Advertising', 
  LEGAL_SERVICES: 'Legal Services',
  ACCOUNTING_FINANCE: 'Accounting & Finance',
  HR_RECRUITMENT: 'HR & Recruitment',
  
  // Creative Services
  GRAPHIC_DESIGN: 'Graphic Design',
  WEB_DEVELOPMENT: 'Web Development',
  CONTENT_WRITING: 'Content Writing',
  VIDEO_PRODUCTION: 'Video Production',
  PHOTOGRAPHY: 'Photography',
  MUSIC_AUDIO_SERVICES: 'Music & Audio Services',
  
  // Technical Services
  IT_SUPPORT: 'IT Support',
  SOFTWARE_DEVELOPMENT: 'Software Development',
  DATA_ANALYTICS: 'Data Analytics',
  CYBERSECURITY: 'Cybersecurity',
  
  // Personal Services
  FITNESS_TRAINING: 'Fitness Training',
  NUTRITION_COACHING: 'Nutrition Coaching',
  LIFE_COACHING: 'Life Coaching',
  TUTORING_EDUCATION: 'Tutoring & Education',
  LANGUAGE_TRANSLATION: 'Language & Translation',
  
  // Home Services
  CLEANING_SERVICES: 'Cleaning Services',
  REPAIR_MAINTENANCE: 'Repair & Maintenance',
  GARDENING_LANDSCAPING: 'Gardening & Landscaping',
  INTERIOR_DESIGN: 'Interior Design',
  
  // Health & Wellness
  HEALTHCARE_SERVICES: 'Healthcare Services',
  THERAPY_COUNSELING: 'Therapy & Counseling',
  BEAUTY_SERVICES: 'Beauty Services',
  MASSAGE_THERAPY: 'Massage Therapy',
  
  // Events & Entertainment
  EVENT_PLANNING: 'Event Planning',
  CATERING_SERVICES: 'Catering Services',
  ENTERTAINMENT: 'Entertainment',
  TRAVEL_SERVICES: 'Travel Services'
} as const;

export type ServiceCategory = typeof ServiceCategory[keyof typeof ServiceCategory];

// Subcategories for each service category

// Business Consulting Subcategories
export const BusinessConsultingSubcategory = {
  STRATEGY_PLANNING: 'Strategy & Planning',
  BUSINESS_DEVELOPMENT: 'Business Development',
  OPERATIONS_CONSULTING: 'Operations Consulting',
  MANAGEMENT_CONSULTING: 'Management Consulting',
  STARTUP_CONSULTING: 'Startup Consulting',
  PROCESS_IMPROVEMENT: 'Process Improvement',
  RISK_MANAGEMENT: 'Risk Management',
  CHANGE_MANAGEMENT: 'Change Management'
} as const;

export type BusinessConsultingSubcategory = typeof BusinessConsultingSubcategory[keyof typeof BusinessConsultingSubcategory];

// Marketing & Advertising Subcategories
export const MarketingAdvertisingSubcategory = {
  DIGITAL_MARKETING: 'Digital Marketing',
  SOCIAL_MEDIA_MARKETING: 'Social Media Marketing',
  SEO_SEM: 'SEO & SEM',
  CONTENT_MARKETING: 'Content Marketing',
  EMAIL_MARKETING: 'Email Marketing',
  BRAND_STRATEGY: 'Brand Strategy',
  MARKET_RESEARCH: 'Market Research',
  ADVERTISING_CAMPAIGNS: 'Advertising Campaigns'
} as const;

export type MarketingAdvertisingSubcategory = typeof MarketingAdvertisingSubcategory[keyof typeof MarketingAdvertisingSubcategory];

// Legal Services Subcategories
export const LegalServicesSubcategory = {
  CORPORATE_LAW: 'Corporate Law',
  CONTRACT_LAW: 'Contract Law',
  INTELLECTUAL_PROPERTY: 'Intellectual Property',
  EMPLOYMENT_LAW: 'Employment Law',
  FAMILY_LAW: 'Family Law',
  REAL_ESTATE_LAW: 'Real Estate Law',
  TAX_LAW: 'Tax Law',
  LEGAL_CONSULTATION: 'Legal Consultation'
} as const;

export type LegalServicesSubcategory = typeof LegalServicesSubcategory[keyof typeof LegalServicesSubcategory];

// Accounting & Finance Subcategories
export const AccountingFinanceSubcategory = {
  BOOKKEEPING: 'Bookkeeping',
  TAX_PREPARATION: 'Tax Preparation',
  FINANCIAL_PLANNING: 'Financial Planning',
  INVESTMENT_ADVICE: 'Investment Advice',
  PAYROLL_SERVICES: 'Payroll Services',
  AUDIT_SERVICES: 'Audit Services',
  BUDGETING: 'Budgeting',
  FINANCIAL_ANALYSIS: 'Financial Analysis'
} as const;

export type AccountingFinanceSubcategory = typeof AccountingFinanceSubcategory[keyof typeof AccountingFinanceSubcategory];

// HR & Recruitment Subcategories
export const HRRecruitmentSubcategory = {
  TALENT_ACQUISITION: 'Talent Acquisition',
  HR_CONSULTING: 'HR Consulting',
  EMPLOYEE_TRAINING: 'Employee Training',
  PERFORMANCE_MANAGEMENT: 'Performance Management',
  COMPENSATION_BENEFITS: 'Compensation & Benefits',
  HR_POLICIES: 'HR Policies',
  RECRUITMENT_SCREENING: 'Recruitment & Screening',
  WORKFORCE_PLANNING: 'Workforce Planning'
} as const;

export type HRRecruitmentSubcategory = typeof HRRecruitmentSubcategory[keyof typeof HRRecruitmentSubcategory];

// Graphic Design Subcategories
export const GraphicDesignSubcategory = {
  LOGO_DESIGN: 'Logo Design',
  BRAND_IDENTITY: 'Brand Identity',
  PRINT_DESIGN: 'Print Design',
  WEB_DESIGN: 'Web Design',
  PACKAGING_DESIGN: 'Packaging Design',
  ILLUSTRATION: 'Illustration',
  UI_UX_DESIGN: 'UI/UX Design',
  MOTION_GRAPHICS: 'Motion Graphics'
} as const;

export type GraphicDesignSubcategory = typeof GraphicDesignSubcategory[keyof typeof GraphicDesignSubcategory];

// Web Development Subcategories
export const WebDevelopmentSubcategory = {
  FRONTEND_DEVELOPMENT: 'Frontend Development',
  BACKEND_DEVELOPMENT: 'Backend Development',
  FULL_STACK_DEVELOPMENT: 'Full Stack Development',
  ECOMMERCE_DEVELOPMENT: 'E-commerce Development',
  MOBILE_APP_DEVELOPMENT: 'Mobile App Development',
  CMS_DEVELOPMENT: 'CMS Development',
  API_DEVELOPMENT: 'API Development',
  WEBSITE_MAINTENANCE: 'Website Maintenance'
} as const;

export type WebDevelopmentSubcategory = typeof WebDevelopmentSubcategory[keyof typeof WebDevelopmentSubcategory];

// Content Writing Subcategories
export const ContentWritingSubcategory = {
  BLOG_WRITING: 'Blog Writing',
  COPYWRITING: 'Copywriting',
  TECHNICAL_WRITING: 'Technical Writing',
  CREATIVE_WRITING: 'Creative Writing',
  SEO_CONTENT: 'SEO Content',
  SOCIAL_MEDIA_CONTENT: 'Social Media Content',
  PRESS_RELEASES: 'Press Releases',
  GHOSTWRITING: 'Ghostwriting'
} as const;

export type ContentWritingSubcategory = typeof ContentWritingSubcategory[keyof typeof ContentWritingSubcategory];

// Video Production Subcategories
export const VideoProductionSubcategory = {
  CORPORATE_VIDEOS: 'Corporate Videos',
  PROMOTIONAL_VIDEOS: 'Promotional Videos',
  EVENT_VIDEOGRAPHY: 'Event Videography',
  DOCUMENTARY: 'Documentary',
  ANIMATION: 'Animation',
  VIDEO_EDITING: 'Video Editing',
  LIVE_STREAMING: 'Live Streaming',
  TUTORIAL_VIDEOS: 'Tutorial Videos'
} as const;

export type VideoProductionSubcategory = typeof VideoProductionSubcategory[keyof typeof VideoProductionSubcategory];

// Photography Subcategories
export const PhotographySubcategory = {
  PORTRAIT_PHOTOGRAPHY: 'Portrait Photography',
  WEDDING_PHOTOGRAPHY: 'Wedding Photography',
  EVENT_PHOTOGRAPHY: 'Event Photography',
  PRODUCT_PHOTOGRAPHY: 'Product Photography',
  REAL_ESTATE_PHOTOGRAPHY: 'Real Estate Photography',
  FOOD_PHOTOGRAPHY: 'Food Photography',
  FASHION_PHOTOGRAPHY: 'Fashion Photography',
  NATURE_PHOTOGRAPHY: 'Nature Photography'
} as const;

export type PhotographySubcategory = typeof PhotographySubcategory[keyof typeof PhotographySubcategory];

// Music & Audio Services Subcategories
export const MusicAudioServicesSubcategory = {
  MUSIC_PRODUCTION: 'Music Production',
  AUDIO_MIXING: 'Audio Mixing',
  MASTERING: 'Mastering',
  VOICE_OVER: 'Voice Over',
  PODCAST_PRODUCTION: 'Podcast Production',
  SOUND_DESIGN: 'Sound Design',
  JINGLE_CREATION: 'Jingle Creation',
  AUDIO_EDITING: 'Audio Editing'
} as const;

export type MusicAudioServicesSubcategory = typeof MusicAudioServicesSubcategory[keyof typeof MusicAudioServicesSubcategory];

// IT Support Subcategories
export const ITSupportSubcategory = {
  TECHNICAL_SUPPORT: 'Technical Support',
  NETWORK_SETUP: 'Network Setup',
  SYSTEM_ADMINISTRATION: 'System Administration',
  HARDWARE_REPAIR: 'Hardware Repair',
  SOFTWARE_INSTALLATION: 'Software Installation',
  DATA_RECOVERY: 'Data Recovery',
  CLOUD_SERVICES: 'Cloud Services',
  IT_CONSULTING: 'IT Consulting'
} as const;

export type ITSupportSubcategory = typeof ITSupportSubcategory[keyof typeof ITSupportSubcategory];

// Software Development Subcategories
export const SoftwareDevelopmentSubcategory = {
  CUSTOM_SOFTWARE: 'Custom Software',
  MOBILE_APPS: 'Mobile Apps',
  DESKTOP_APPLICATIONS: 'Desktop Applications',
  DATABASE_DEVELOPMENT: 'Database Development',
  INTEGRATION_SERVICES: 'Integration Services',
  SOFTWARE_TESTING: 'Software Testing',
  DEVOPS: 'DevOps',
  SOFTWARE_MAINTENANCE: 'Software Maintenance'
} as const;

export type SoftwareDevelopmentSubcategory = typeof SoftwareDevelopmentSubcategory[keyof typeof SoftwareDevelopmentSubcategory];

// Data Analytics Subcategories
export const DataAnalyticsSubcategory = {
  DATA_ANALYSIS: 'Data Analysis',
  BUSINESS_INTELLIGENCE: 'Business Intelligence',
  DATA_VISUALIZATION: 'Data Visualization',
  MACHINE_LEARNING: 'Machine Learning',
  STATISTICAL_ANALYSIS: 'Statistical Analysis',
  DATA_MINING: 'Data Mining',
  PREDICTIVE_ANALYTICS: 'Predictive Analytics',
  REPORTING: 'Reporting'
} as const;

export type DataAnalyticsSubcategory = typeof DataAnalyticsSubcategory[keyof typeof DataAnalyticsSubcategory];

// Cybersecurity Subcategories
export const CybersecuritySubcategory = {
  SECURITY_AUDIT: 'Security Audit',
  PENETRATION_TESTING: 'Penetration Testing',
  SECURITY_CONSULTING: 'Security Consulting',
  INCIDENT_RESPONSE: 'Incident Response',
  SECURITY_TRAINING: 'Security Training',
  COMPLIANCE_ASSESSMENT: 'Compliance Assessment',
  VULNERABILITY_ASSESSMENT: 'Vulnerability Assessment',
  SECURITY_MONITORING: 'Security Monitoring'
} as const;

export type CybersecuritySubcategory = typeof CybersecuritySubcategory[keyof typeof CybersecuritySubcategory];

// Fitness Training Subcategories
export const FitnessTrainingSubcategory = {
  PERSONAL_TRAINING: 'Personal Training',
  GROUP_FITNESS: 'Group Fitness',
  STRENGTH_TRAINING: 'Strength Training',
  CARDIO_TRAINING: 'Cardio Training',
  YOGA_INSTRUCTION: 'Yoga Instruction',
  PILATES: 'Pilates',
  SPORTS_COACHING: 'Sports Coaching',
  ONLINE_FITNESS: 'Online Fitness'
} as const;

export type FitnessTrainingSubcategory = typeof FitnessTrainingSubcategory[keyof typeof FitnessTrainingSubcategory];

// Service interface
export interface ServiceCategoryInterface {
  name: ServiceCategory;
  subcategories: string[];
  deliveryTypes: ServiceDeliveryType[];
  durationTypes: ServiceDurationType[];
}

// Combined service categories structure
export const serviceCategories: ServiceCategoryInterface[] = [
  {
    name: ServiceCategory.BUSINESS_CONSULTING,
    subcategories: Object.values(BusinessConsultingSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.DAILY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.MARKETING_ADVERTISING,
    subcategories: Object.values(MarketingAdvertisingSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.MONTHLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.LEGAL_SERVICES,
    subcategories: Object.values(LegalServicesSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.ACCOUNTING_FINANCE,
    subcategories: Object.values(AccountingFinanceSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.MONTHLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.HR_RECRUITMENT,
    subcategories: Object.values(HRRecruitmentSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.GRAPHIC_DESIGN,
    subcategories: Object.values(GraphicDesignSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.WEB_DEVELOPMENT,
    subcategories: Object.values(WebDevelopmentSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.WEEKLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.CONTENT_WRITING,
    subcategories: Object.values(ContentWritingSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.VIDEO_PRODUCTION,
    subcategories: Object.values(VideoProductionSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.DAILY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.PHOTOGRAPHY,
    subcategories: Object.values(PhotographySubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.DAILY, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.MUSIC_AUDIO_SERVICES,
    subcategories: Object.values(MusicAudioServicesSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.IT_SUPPORT,
    subcategories: Object.values(ITSupportSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.MONTHLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.SOFTWARE_DEVELOPMENT,
    subcategories: Object.values(SoftwareDevelopmentSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.WEEKLY, ServiceDurationType.PROJECT_BASED]
  },
  {
    name: ServiceCategory.DATA_ANALYTICS,
    subcategories: Object.values(DataAnalyticsSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.CYBERSECURITY,
    subcategories: Object.values(CybersecuritySubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.PROJECT_BASED, ServiceDurationType.PACKAGE]
  },
  {
    name: ServiceCategory.FITNESS_TRAINING,
    subcategories: Object.values(FitnessTrainingSubcategory),
    deliveryTypes: [ServiceDeliveryType.ONSITE, ServiceDeliveryType.ONLINE, ServiceDeliveryType.BOTH],
    durationTypes: [ServiceDurationType.HOURLY, ServiceDurationType.WEEKLY, ServiceDurationType.MONTHLY, ServiceDurationType.PACKAGE]
  }
  // Add more service categories as needed
];

// Service category icons mapping
export const serviceCategoryIcons: Record<ServiceCategory, string> = {
  [ServiceCategory.BUSINESS_CONSULTING]: "💼",
  [ServiceCategory.MARKETING_ADVERTISING]: "📈",
  [ServiceCategory.LEGAL_SERVICES]: "⚖️",
  [ServiceCategory.ACCOUNTING_FINANCE]: "💰",
  [ServiceCategory.HR_RECRUITMENT]: "👥",
  [ServiceCategory.GRAPHIC_DESIGN]: "🎨",
  [ServiceCategory.WEB_DEVELOPMENT]: "💻",
  [ServiceCategory.CONTENT_WRITING]: "✍️",
  [ServiceCategory.VIDEO_PRODUCTION]: "🎬",
  [ServiceCategory.PHOTOGRAPHY]: "📸",
  [ServiceCategory.MUSIC_AUDIO_SERVICES]: "🎵",
  [ServiceCategory.IT_SUPPORT]: "🔧",
  [ServiceCategory.SOFTWARE_DEVELOPMENT]: "👨‍💻",
  [ServiceCategory.DATA_ANALYTICS]: "📊",
  [ServiceCategory.CYBERSECURITY]: "🔐",
  [ServiceCategory.FITNESS_TRAINING]: "💪",
  [ServiceCategory.NUTRITION_COACHING]: "🥗",
  [ServiceCategory.LIFE_COACHING]: "🌟",
  [ServiceCategory.TUTORING_EDUCATION]: "🎓",
  [ServiceCategory.LANGUAGE_TRANSLATION]: "🌍",
  [ServiceCategory.CLEANING_SERVICES]: "🧹",
  [ServiceCategory.REPAIR_MAINTENANCE]: "🔨",
  [ServiceCategory.GARDENING_LANDSCAPING]: "🌿",
  [ServiceCategory.INTERIOR_DESIGN]: "🏠",
  [ServiceCategory.HEALTHCARE_SERVICES]: "🏥",
  [ServiceCategory.THERAPY_COUNSELING]: "🧠",
  [ServiceCategory.BEAUTY_SERVICES]: "💄",
  [ServiceCategory.MASSAGE_THERAPY]: "💆",
  [ServiceCategory.EVENT_PLANNING]: "🎉",
  [ServiceCategory.CATERING_SERVICES]: "🍽️",
  [ServiceCategory.ENTERTAINMENT]: "🎭",
  [ServiceCategory.TRAVEL_SERVICES]: "✈️"
};

// Helper function to get available delivery types for a category
export const getServiceDeliveryTypes = (categoryName: ServiceCategory): ServiceDeliveryType[] => {
  const category = serviceCategories.find(cat => cat.name === categoryName);
  return category?.deliveryTypes || [];
};

// Helper function to get available duration types for a category
export const getServiceDurationTypes = (categoryName: ServiceCategory): ServiceDurationType[] => {
  const category = serviceCategories.find(cat => cat.name === categoryName);
  return category?.durationTypes || [];
};

// Helper function to get subcategories for a category
export const getServiceSubcategories = (categoryName: ServiceCategory): string[] => {
  const category = serviceCategories.find(cat => cat.name === categoryName);
  return category?.subcategories || [];
};
