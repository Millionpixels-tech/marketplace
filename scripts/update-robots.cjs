#!/usr/bin/env node

/**
 * Robots.txt Update Script
 * 
 * This script updates the robots.txt file with the correct domain.
 * 
 * Usage:
 * node scripts/update-robots.cjs [baseUrl]
 * 
 * Example:
 * node scripts/update-robots.cjs https://sina.lk
 */

const fs = require('fs');
const path = require('path');

// Base URL - can be passed as command line argument or set default
const baseUrl = process.argv[2] || 'https://sina.lk';

// Generate robots.txt
function generateRobotsTxt() {
  const robotsContent = `User-agent: *
Allow: /

# Allow all search pages explicitly (including with query parameters)
Allow: /search
Allow: /search?*
Allow: /search/*

# Allow important pages for SEO
Allow: /create-shop
Allow: /add-listing
Allow: /seller-guide

# Allow dynamic content pages
Allow: /listing/*
Allow: /shop/*
Allow: /profile/*

# Allow auth pages (except private actions)
Allow: /auth
Allow: /ref/*

# Disallow private pages
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /_auth_actions
Disallow: /email-verification
Disallow: /reset-password
Disallow: /checkout
Disallow: /cart
Disallow: /wishlist
Disallow: /order/
Disallow: /custom-order/
Disallow: /edit-shop/
Disallow: /listing/*/edit

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (be nice to servers)
Crawl-delay: 1`;

  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  
  try {
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log(`✅ robots.txt updated successfully at: ${robotsPath}`);
    console.log(`🔗 Base URL: ${baseUrl}`);
  } catch (error) {
    console.error('❌ Error writing robots.txt:', error);
    process.exit(1);
  }
}

// Main execution
console.log('🤖 Updating robots.txt...');
generateRobotsTxt();
console.log('✨ Done!');
