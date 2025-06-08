// Sitemap generation utility for better SEO
// This can be used to generate a sitemap.xml for the site

export const STATIC_ROUTES = [
  '/',
  '/search',
  '/auth',
  '/about',
  '/help',
  '/customer-service',
  '/returns-refunds',
  '/shipping-info',
  '/our-story',
  '/careers',
  '/press',
  '/terms-of-service',
  '/privacy-policy',
  '/cookie-policy',
  '/community-guidelines',
  '/seller-guide'
];

export const generateSitemapXML = (baseUrl: string, dynamicRoutes: string[] = []) => {
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemapEntries = allRoutes.map(route => {
    // Determine priority and change frequency based on route
    let priority = '0.5';
    let changefreq = 'monthly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'weekly';
    } else if (route === '/search' || route.startsWith('/listing/') || route.startsWith('/shop/')) {
      priority = '0.8';
      changefreq = 'daily';
    } else if (route === '/about' || route === '/help') {
      priority = '0.7';
      changefreq = 'monthly';
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
