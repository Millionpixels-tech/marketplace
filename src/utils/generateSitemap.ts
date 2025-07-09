/**
 * Sitemap Generator for Sina.lk
 * Generates sitemap.xml with all SEO-optimized pages
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const SITE_BASE_URL = 'https://sina.lk';

// Static pages with their SEO priorities
export const STATIC_PAGES: SitemapUrl[] = [
  // Primary pages
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/search', changefreq: 'daily', priority: 0.9 },
  
  // Legal and information pages
  { loc: '/about', changefreq: 'monthly', priority: 0.7 },
  { loc: '/our-story', changefreq: 'monthly', priority: 0.6 },
  { loc: '/help', changefreq: 'weekly', priority: 0.7 },
  { loc: '/seller-guide', changefreq: 'monthly', priority: 0.8 },
  
  // Legal pages
  { loc: '/terms', changefreq: 'yearly', priority: 0.5 },
  { loc: '/privacy', changefreq: 'yearly', priority: 0.5 },
  { loc: '/returns', changefreq: 'monthly', priority: 0.6 },
  { loc: '/shipping', changefreq: 'monthly', priority: 0.6 },
  { loc: '/cookies', changefreq: 'yearly', priority: 0.4 },
  { loc: '/community-guidelines', changefreq: 'monthly', priority: 0.5 },
  
  // User pages (noindex but in sitemap for crawl budget)
  { loc: '/auth', changefreq: 'never', priority: 0.1 },
  { loc: '/cart', changefreq: 'never', priority: 0.1 },
  { loc: '/wishlist', changefreq: 'never', priority: 0.1 },
  { loc: '/checkout', changefreq: 'never', priority: 0.1 },
];

// Category pages - these should be dynamically generated based on your categories
export const CATEGORY_PAGES: SitemapUrl[] = [
  { loc: '/search?category=Art', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Clothing', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Jewelry', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Home', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Food', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Electronics', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Books', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Toys', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Beauty', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Sports', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Automotive', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Garden', changefreq: 'daily', priority: 0.8 },
  { loc: '/search?category=Other', changefreq: 'daily', priority: 0.7 },
];

/**
 * Generates sitemap XML content
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urlEntries = urls.map(url => {
    const fullUrl = url.loc.startsWith('http') ? url.loc : `${SITE_BASE_URL}${url.loc}`;
    const lastmod = url.lastmod || currentDate;
    
    return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    ${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `    <priority>${url.priority}</priority>` : ''}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generates robots.txt content
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Block admin and private sections
Disallow: /admin/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /cart/
Disallow: /auth/
Disallow: /api/

# Block search with parameters except category
Disallow: /search?*
Allow: /search?category=*

# Allow specific file types
Allow: /*.css$
Allow: /*.js$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.gif$
Allow: /*.webp$
Allow: /*.svg$

# Sitemap location
Sitemap: ${SITE_BASE_URL}/sitemap.xml

# Crawl delay for politeness
Crawl-delay: 1`;
}

/**
 * Generates a complete sitemap with all pages
 */
export function generateCompleteSitemap(): string {
  const allUrls = [
    ...STATIC_PAGES,
    ...CATEGORY_PAGES,
  ];
  
  return generateSitemapXML(allUrls);
}

/**
 * Generates dynamic listing URLs for sitemap
 * Note: This should be called with actual listing data from your database
 */
export function generateListingUrls(listings: Array<{ id: string; lastModified?: string }>): SitemapUrl[] {
  return listings.map(listing => ({
    loc: `/listing/${listing.id}`,
    lastmod: listing.lastModified || new Date().toISOString().split('T')[0],
    changefreq: 'weekly' as const,
    priority: 0.6,
  }));
}

/**
 * Generates dynamic shop URLs for sitemap
 * Note: This should be called with actual shop data from your database
 */
export function generateShopUrls(shops: Array<{ username: string; lastModified?: string }>): SitemapUrl[] {
  return shops.map(shop => ({
    loc: `/shop/${shop.username}`,
    lastmod: shop.lastModified || new Date().toISOString().split('T')[0],
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));
}

/**
 * Usage example for generating and saving sitemap files
 */
export function generateSitemapFiles() {
  const sitemap = generateCompleteSitemap();
  const robots = generateRobotsTxt();
  
 // console.log('Sitemap XML:', sitemap);
 // console.log('Robots.txt:', robots);
  
  // In a real application, you would save these to public/ directory
  // fs.writeFileSync('public/sitemap.xml', sitemap);
  // fs.writeFileSync('public/robots.txt', robots);
  
  return { sitemap, robots };
}
