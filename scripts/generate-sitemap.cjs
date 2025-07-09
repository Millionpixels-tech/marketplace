#!/usr/bin/env node

/**
 * Sitemap Generation Script
 * 
 * This script generates a comprehensive sitemap.xml file for the marketplace.
 * It includes all static routes, category pages, search filters, and dynamic content
 * from Firebase including listings, shops, and public profiles.
 * 
 * Usage:
 * node scripts/generate-sitemap.cjs [baseUrl]
 * 
 * Example:
 * node scripts/generate-sitemap.cjs https://sina.lk
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Base URL - can be passed as command line argument or set default
const baseUrl = process.argv[2] || 'https://sina.lk';

// Initialize Firebase Admin SDK
let db;
try {
  let credential;
  
  // Try to use VITE_FIREBASE_SERVICE_ACCOUNT environment variable first
  if (process.env.VITE_FIREBASE_SERVICE_ACCOUNT) {
    console.log('🔑 Using service account from VITE_FIREBASE_SERVICE_ACCOUNT environment variable');
    try {
      // Remove any surrounding quotes and parse JSON
      let serviceAccountString = process.env.VITE_FIREBASE_SERVICE_ACCOUNT.trim();
      if (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"')) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      // Replace escaped quotes
      serviceAccountString = serviceAccountString.replace(/\\"/g, '"');
      
      const serviceAccountJson = JSON.parse(serviceAccountString);
      credential = admin.credential.cert(serviceAccountJson);
    } catch (parseError) {
      console.warn('❌ Failed to parse VITE_FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
      throw parseError;
    }
  } else {
    // Try to initialize with service account key file if available
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔑 Using service account from firebase-service-account.json file');
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Initialize with application default credentials
      console.log('🔑 Using application default credentials');
      credential = admin.credential.applicationDefault();
    }
  }
  
  admin.initializeApp({
    credential: credential
  });
  
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed. Will generate sitemap without dynamic content.');
  console.warn('Error:', error.message);
  db = null;
}

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

// Fetch dynamic URLs from Firebase
async function fetchDynamicUrls() {
  const dynamicUrls = [];
  
  if (!db) {
    console.log('📝 Skipping dynamic content (Firebase not available)');
    return dynamicUrls;
  }

  try {
    // Fetch all listings
    console.log('📦 Fetching listings...');
    const listingsSnapshot = await db.collection('listings')
      .limit(5000) // Limit to prevent memory issues
      .get();
    
    listingsSnapshot.forEach(doc => {
      dynamicUrls.push({
        url: `/listing/${doc.id}`,
        priority: '0.8',
        changefreq: 'weekly'
      });
    });
    console.log(`✓ Added ${listingsSnapshot.size} listings`);

    // Fetch all shops
    console.log('🏪 Fetching shops...');
    const shopsSnapshot = await db.collection('shops')
      .limit(1000)
      .get();
    
    shopsSnapshot.forEach(doc => {
      const shopData = doc.data();
      if (shopData.username) {
        dynamicUrls.push({
          url: `/shop/${shopData.username}`,
          priority: '0.7',
          changefreq: 'weekly'
        });
      }
    });
    console.log(`✓ Added ${shopsSnapshot.size} shops`);

    // Fetch all user profiles
    console.log('👤 Fetching user profiles...');
    const usersSnapshot = await db.collection('users')
      .limit(1000)
      .get();
    
    usersSnapshot.forEach(doc => {
      dynamicUrls.push({
        url: `/profile/${doc.id}`,
        priority: '0.6',
        changefreq: 'monthly'
      });
    });
    console.log(`✓ Added ${usersSnapshot.size} user profiles`);

  } catch (error) {
    console.error('❌ Error fetching dynamic URLs:', error);
  }

  return dynamicUrls;
}

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
async function generateSitemap() {
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

  // Add dynamic URLs from Firebase
  const dynamicUrls = await fetchDynamicUrls();
  dynamicUrls.forEach(({ url, priority, changefreq }) => {
    urls.push(generateUrlEntry(url, priority, changefreq));
  });
  
  // Generate XML structure
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return sitemapXml;
}

// Write sitemap to file
async function writeSitemap() {
  const sitemapContent = await generateSitemap();
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

// Main execution
async function main() {
  console.log('🚀 Generating sitemap...');
  try {
    await writeSitemap();
    console.log('✨ Sitemap generation completed!');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  } finally {
    // Clean up Firebase connection
    if (db) {
      try {
        await admin.app().delete();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}

// Run the script
main();
