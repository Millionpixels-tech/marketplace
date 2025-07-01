#!/usr/bin/env node

/**
 * Sitemap Generation Script
 * 
 * This script generates a comprehensive sitemap.xml file for the marketplace.
 * It includes all static routes, category pages, search filters, and dynamic content.
 * 
 * Usage:
 * node scripts/generate-sitemap.js [baseUrl]
 * 
 * Example:
 * node scripts/generate-sitemap.js https://yourmarketplace.com
 */

const fs = require('fs');
const path = require('path');

// Base URL - can be passed as command line argument or set default
const baseUrl = process.argv[2] || 'https://yourmarketplace.com';

// Categories from your categories.ts file
const categories = [
  'Accessories',
  'Art & Collectibles',
  'Bags & Purses',
  'Bath & Beauty',
  'Books, Movies & Music',
  'Clothing',
  'Craft Supplies & Tools',
  'Electronics & Accessories',
  'Home & Living',
  'Jewelry',
  'Paper & Party Supplies',
  'Pet Supplies',
  'Shoes',
  'Toys & Games',
  'Weddings'
];

// Static routes
const staticRoutes = [
  '/',
  '/search',
  '/auth',
  '/cart',
  '/wishlist',
  '/create-shop',
  '/add-listing',
  '/seller-guide',
  '/early-launch-promotion',
  '/about-us',
  '/our-story',
  '/careers',
  '/press',
  '/help-center',
  '/customer-service',
  '/returns-refunds',
  '/shipping-info',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/community-guidelines'
];

// Popular search terms
const searchTerms = [
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
const sortOptions = [
  'newest',
  'price_low_high',
  'price_high_low',
  'most_popular'
];

// Price ranges
const priceRanges = [
  { min: 0, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 10000 }
];

// Popular subcategories
const popularSubcategories = {
  'Accessories': ['Hair Accessories', 'Hats & Caps', 'Scarves & Wraps'],
  'Jewelry': ['Necklaces', 'Earrings', 'Bracelets', 'Rings'],
  'Home & Living': ['Home Decor', 'Kitchen & Dining', 'Furniture'],
  'Art & Collectibles': ['Painting', 'Sculpture', 'Photography']
};

// Generate URL entry
function generateUrlEntry(url, priority = '0.5', changefreq = 'monthly') {
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Properly encode XML entities
  const encodedUrl = url.replace(/&/g, '&amp;');
  
  return `  <url>
    <loc>${baseUrl}${encodedUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Generate sitemap content
function generateSitemap() {
  const urls = [];
  
  // Add static routes
  staticRoutes.forEach(route => {
    let priority = '0.5';
    let changefreq = 'monthly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route === '/search') {
      priority = '0.9';
      changefreq = 'daily';
    } else if (['/create-shop', '/add-listing', '/seller-guide'].includes(route)) {
      priority = '0.8';
      changefreq = 'monthly';
    } else if (['/about-us', '/help-center'].includes(route)) {
      priority = '0.7';
      changefreq = 'monthly';
    }
    
    urls.push(generateUrlEntry(route, priority, changefreq));
  });
  
  // Add category pages
  categories.forEach(category => {
    const encodedCategory = encodeURIComponent(category);
    urls.push(generateUrlEntry(`/search?cat=${encodedCategory}`, '0.8', 'daily'));
  });
  
  // Add search filter combinations
  sortOptions.forEach(sort => {
    urls.push(generateUrlEntry(`/search?sort=${sort}`, '0.7', 'daily'));
  });
  
  // Add price range searches
  priceRanges.forEach(({ min, max }) => {
    urls.push(generateUrlEntry(`/search?min=${min}&max=${max}`, '0.6', 'weekly'));
  });
  
  // Add popular search terms
  searchTerms.forEach(term => {
    const encodedTerm = encodeURIComponent(term);
    urls.push(generateUrlEntry(`/search?q=${encodedTerm}`, '0.7', 'weekly'));
  });
  Object.entries(popularSubcategories).forEach(([category, subcategories]) => {
    const encodedCategory = encodeURIComponent(category);
    subcategories.forEach(subcategory => {
      const encodedSubcategory = encodeURIComponent(subcategory);
      urls.push(generateUrlEntry(`/search?cat=${encodedCategory}&sub=${encodedSubcategory}`, '0.6', 'daily'));
    });
  });
  
  // Add category + search term combinations (limited to avoid too many URLs)
  categories.slice(0, 5).forEach(category => {
    searchTerms.slice(0, 3).forEach(term => {
      const encodedCategory = encodeURIComponent(category);
      const encodedTerm = encodeURIComponent(term);
      urls.push(generateUrlEntry(`/search?cat=${encodedCategory}&q=${encodedTerm}`, '0.6', 'weekly'));
    });
  });
  
  // Generate XML structure
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return sitemapXml;
}

// Write sitemap to file
function writeSitemap() {
  const sitemapContent = generateSitemap();
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  try {
    fs.writeFileSync(outputPath, sitemapContent, 'utf8');
    console.log(`✅ Sitemap generated successfully at: ${outputPath}`);
    console.log(`🔗 Base URL: ${baseUrl}`);
    console.log(`📊 Total URLs: ${sitemapContent.split('<url>').length - 1}`);
  } catch (error) {
    console.error('❌ Error writing sitemap:', error);
    process.exit(1);
  }
}

// Generate robots.txt
function generateRobotsTxt() {
  const robotsContent = `User-agent: *
Allow: /

# Disallow private pages
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_auth_actions
Disallow: /email-verification
Disallow: /reset-password

# Allow important pages for SEO
Allow: /search
Allow: /create-shop
Allow: /add-listing
Allow: /seller-guide

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (be nice to servers)
Crawl-delay: 1`;

  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  
  try {
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log(`✅ robots.txt generated successfully at: ${robotsPath}`);
  } catch (error) {
    console.error('❌ Error writing robots.txt:', error);
  }
}

// Main execution
console.log('🚀 Generating sitemap and robots.txt...');
writeSitemap();
generateRobotsTxt();
console.log('✨ Done!');
