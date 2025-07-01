#!/usr/bin/env node

/**
 * Update Domain Script
 * 
 * This script updates the domain in sitemap.xml and robots.txt files
 * 
 * Usage:
 * node scripts/update-domain.cjs https://yourmarketplace.com
 */

const fs = require('fs');
const path = require('path');

const newDomain = process.argv[2];

if (!newDomain) {
  console.error('❌ Please provide a domain URL');
  console.log('Usage: node scripts/update-domain.cjs https://yourmarketplace.com');
  process.exit(1);
}

// Validate URL format
try {
  new URL(newDomain);
} catch (error) {
  console.error('❌ Invalid URL format');
  process.exit(1);
}

// Update sitemap.xml
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  sitemapContent = sitemapContent.replace(/https:\/\/yourmarketplace\.com/g, newDomain);
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log(`✅ Updated sitemap.xml with domain: ${newDomain}`);
}

// Update robots.txt
const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
if (fs.existsSync(robotsPath)) {
  let robotsContent = fs.readFileSync(robotsPath, 'utf8');
  robotsContent = robotsContent.replace(/https:\/\/yourmarketplace\.com/g, newDomain);
  fs.writeFileSync(robotsPath, robotsContent);
  console.log(`✅ Updated robots.txt with domain: ${newDomain}`);
}

console.log('✨ Domain update complete!');
