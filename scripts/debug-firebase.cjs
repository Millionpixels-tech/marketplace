#!/usr/bin/env node

/**
 * Debug Firebase Collections
 * 
 * This script explores your Firebase collections to understand the data structure
 * and field names so we can update the sitemap generation accordingly.
 */

const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function debugCollections() {
  try {
    // Initialize Firebase
    const serviceAccountString = process.env.VITE_FIREBASE_SERVICE_ACCOUNT.trim();
    const serviceAccountJson = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson)
    });
    
    const db = admin.firestore();
    console.log('✅ Firebase connected successfully\n');

    // Check listings collection
    console.log('📦 LISTINGS COLLECTION:');
    console.log('========================');
    
    const listingsSnapshot = await db.collection('listings').limit(3).get();
    console.log(`Total listings found: ${listingsSnapshot.size}`);
    
    if (!listingsSnapshot.empty) {
      listingsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nListing ${index + 1} (ID: ${doc.id}):`);
        console.log('- Fields:', Object.keys(data));
        console.log('- Status field:', data.status);
        console.log('- Active field:', data.active);
        console.log('- Published field:', data.published);
        console.log('- IsActive field:', data.isActive);
      });
    } else {
      console.log('No listings found');
    }

    // Check shops collection
    console.log('\n\n🏪 SHOPS COLLECTION:');
    console.log('====================');
    
    const shopsSnapshot = await db.collection('shops').limit(3).get();
    console.log(`Total shops found: ${shopsSnapshot.size}`);
    
    if (!shopsSnapshot.empty) {
      shopsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nShop ${index + 1} (ID: ${doc.id}):`);
        console.log('- Fields:', Object.keys(data));
        console.log('- Username:', data.username);
        console.log('- IsActive field:', data.isActive);
        console.log('- Active field:', data.active);
        console.log('- Status field:', data.status);
      });
    } else {
      console.log('No shops found');
    }

    // Check users collection
    console.log('\n\n👤 USERS COLLECTION:');
    console.log('====================');
    
    const usersSnapshot = await db.collection('users').limit(3).get();
    console.log(`Total users found: ${usersSnapshot.size}`);
    
    if (!usersSnapshot.empty) {
      usersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nUser ${index + 1} (ID: ${doc.id}):`);
        console.log('- Fields:', Object.keys(data));
        console.log('- IsPublic field:', data.isPublic);
        console.log('- Public field:', data.public);
        console.log('- Visibility field:', data.visibility);
      });
    } else {
      console.log('No users found');
    }

    await admin.app().delete();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCollections();
