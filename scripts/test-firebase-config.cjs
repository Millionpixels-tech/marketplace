#!/usr/bin/env node

/**
 * Test Firebase Service Account Environment Variable
 * 
 * This script tests if the VITE_FIREBASE_SERVICE_ACCOUNT environment variable
 * contains valid JSON and can be used to initialize Firebase Admin.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🧪 Testing Firebase Service Account Environment Variable...\n');

if (!process.env.VITE_FIREBASE_SERVICE_ACCOUNT) {
  console.log('❌ VITE_FIREBASE_SERVICE_ACCOUNT environment variable not found');
  console.log('💡 Please add it to your .env file');
  process.exit(1);
}

console.log('✅ VITE_FIREBASE_SERVICE_ACCOUNT found');
console.log('📏 Length:', process.env.VITE_FIREBASE_SERVICE_ACCOUNT.length, 'characters');
console.log('🔤 First 50 characters:', process.env.VITE_FIREBASE_SERVICE_ACCOUNT.substring(0, 50) + '...');

try {
  // Try to parse the JSON
  let serviceAccountString = process.env.VITE_FIREBASE_SERVICE_ACCOUNT.trim();
  
  console.log('\n🔍 Attempting to parse JSON...');
  
  // Remove surrounding quotes if present
  if (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"')) {
    console.log('🔧 Removing surrounding quotes');
    serviceAccountString = serviceAccountString.slice(1, -1);
  }
  
  // Replace escaped quotes
  serviceAccountString = serviceAccountString.replace(/\\"/g, '"');
  
  const serviceAccountJson = JSON.parse(serviceAccountString);
  
  console.log('✅ JSON parsing successful!');
  console.log('📋 Service Account Info:');
  console.log('   - Type:', serviceAccountJson.type);
  console.log('   - Project ID:', serviceAccountJson.project_id);
  console.log('   - Client Email:', serviceAccountJson.client_email);
  console.log('   - Private Key ID:', serviceAccountJson.private_key_id?.substring(0, 10) + '...');
  
  console.log('\n🎉 Firebase service account configuration looks good!');
  
} catch (error) {
  console.log('\n❌ JSON parsing failed:');
  console.log('Error:', error.message);
  console.log('\n💡 Tips:');
  console.log('1. Ensure the JSON is properly escaped');
  console.log('2. Use single quotes around the entire JSON string in .env');
  console.log('3. Make sure there are no line breaks in the JSON');
  console.log('4. Check for unescaped special characters');
  process.exit(1);
}
