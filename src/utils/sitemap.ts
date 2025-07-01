// Sitemap generation utility for better SEO
// This can be used to generate a sitemap.xml for the site

// Sitemap generation utility for better SEO
// This can be used to generate a sitemap.xml for the site

import { EtsyCategory } from './categories';

export const STATIC_ROUTES = [
  // Core pages
  '/',
  '/search',
  '/auth',
  '/cart',
  '/wishlist',
  
  // Seller & Business pages
  '/create-shop',
  '/add-listing', 
  '/seller-guide',
  
  // Marketing pages
  '/early-launch-promotion',
  
  // Company pages
  '/about-us',
  '/our-story',
  '/careers',
  '/press',
  
  // Support pages
  '/help-center',
  '/customer-service',
  '/returns-refunds',
  '/shipping-info',
  
  // Legal pages
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/community-guidelines'
];

// Popular search terms for SEO
export const POPULAR_SEARCH_TERMS = [
  'handmade',
  'sri lankan',
  'authentic',
  'artisan',
  'traditional',
  'craft',
  'unique',
  'gift'
];

// Sort options
export const SORT_OPTIONS = [
  'newest',
  'price_low_high',
  'price_high_low',
  'most_popular'
];

// Price ranges for filtering
export const PRICE_RANGES = [
  { min: 0, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 10000 }
];

// Popular locations in Sri Lanka
export const LOCATIONS = [
  'Colombo',
  'Kandy',
  'Galle',
  'Negombo',
  'Jaffna',
  'Anuradhapura'
];

// Generate category-based URLs
export const generateCategoryRoutes = () => {
  const routes: string[] = [];
  
  // Main categories
  Object.values(EtsyCategory).forEach(category => {
    routes.push(`/search?cat=${encodeURIComponent(category)}`);
  });
  
  return routes;
};

// Generate search filter combinations
export const generateSearchFilterRoutes = () => {
  const routes: string[] = [];
  
  // Sort-based routes
  SORT_OPTIONS.forEach(sort => {
    routes.push(`/search?sort=${sort}`);
  });
  
  // Price range routes
  PRICE_RANGES.forEach(({ min, max }) => {
    routes.push(`/search?min=${min}&max=${max}`);
  });
  
  // Popular search terms
  POPULAR_SEARCH_TERMS.forEach(term => {
    routes.push(`/search?q=${encodeURIComponent(term)}`);
  });
  
  // Location-based searches
  LOCATIONS.forEach(location => {
    routes.push(`/search?location=${encodeURIComponent(location)}`);
  });
  
  // Combined category + search term routes
  Object.values(EtsyCategory).slice(0, 5).forEach(category => { // Limit to first 5 to avoid too many URLs
    POPULAR_SEARCH_TERMS.slice(0, 3).forEach(term => { // Limit to first 3 terms
      routes.push(`/search?cat=${encodeURIComponent(category)}&q=${encodeURIComponent(term)}`);
    });
  });
  
  return routes;
};

// Generate all dynamic routes
export const generateAllDynamicRoutes = () => {
  return [
    ...generateCategoryRoutes(),
    ...generateSearchFilterRoutes()
  ];
};

export const generateSitemapXML = (baseUrl: string, additionalRoutes: string[] = []) => {
  const dynamicRoutes = generateAllDynamicRoutes();
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes, ...additionalRoutes];
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemapEntries = allRoutes.map(route => {
    // Determine priority and change frequency based on route
    let priority = '0.5';
    let changefreq = 'monthly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route === '/search' || route.includes('/search?')) {
      priority = route.includes('category=') ? '0.8' : '0.7';
      changefreq = 'daily';
    } else if (route.startsWith('/listing/') || route.startsWith('/shop/')) {
      priority = '0.8';
      changefreq = 'daily';
    } else if (['/create-shop', '/add-listing', '/seller-guide'].includes(route)) {
      priority = '0.8';
      changefreq = 'monthly';
    } else if (['/about-us', '/help-center', '/customer-service'].includes(route)) {
      priority = '0.7';
      changefreq = 'monthly';
    } else if (route.includes('privacy-policy') || route.includes('terms-of-service')) {
      priority = '0.5';
      changefreq = 'yearly';
    }
    
    return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;
};

export const generateRobotsTxt = (baseUrl: string) => {
  return `User-agent: *
Allow: /

# Disallow private pages
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1`;
};

// SEO best practices checklist
export const SEO_CHECKLIST = {
  technical: [
    'HTML5 semantic markup',
    'Proper heading hierarchy (H1, H2, H3, etc.)',
    'Alt text for all images',
    'Meta descriptions under 160 characters',
    'Title tags under 60 characters',
    'Canonical URLs',
    'Structured data (JSON-LD)',
    'XML sitemap',
    'Robots.txt file',
    'Mobile-friendly design',
    'Fast loading times',
    'HTTPS enabled',
    'Clean URL structure'
  ],
  content: [
    'Unique, valuable content',
    'Keyword optimization without stuffing',
    'Internal linking strategy',
    'Fresh, updated content',
    'User-focused content',
    'Local SEO for Sri Lankan market',
    'Multilingual support potential'
  ],
  performance: [
    'Core Web Vitals optimization',
    'Image optimization',
    'Lazy loading',
    'Minified CSS/JS',
    'Browser caching',
    'CDN usage',
    'Server response time < 200ms'
  ]
};

// Generate meta keywords for different page types
export const getPageTypeKeywords = (pageType: string) => {
  const keywordMap: Record<string, string[]> = {
    home: ['Sri Lankan marketplace', 'authentic Sri Lankan products', 'handmade crafts', 'local artisans'],
    search: ['search products', 'find items', 'browse categories', 'Sri Lankan goods'],
    product: ['buy Sri Lankan products', 'authentic crafts', 'handmade items', 'artisan products'],
    shop: ['Sri Lankan shops', 'local sellers', 'artisan stores', 'craft shops'],
    category: ['Sri Lankan categories', 'product types', 'craft categories'],
    about: ['about us', 'our mission', 'Sri Lankan culture', 'supporting artisans'],
    help: ['customer support', 'FAQ', 'help center', 'buying guide'],
    auth: ['user account', 'sign in', 'register', 'login']
  };
  
  return keywordMap[pageType] || [];
};
