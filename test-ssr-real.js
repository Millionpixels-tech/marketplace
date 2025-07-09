#!/usr/bin/env node

// Simple test to simulate Firebase Admin access
const admin = require('firebase-admin');

// Test with a mock service account to verify the structure
console.log('Testing SSR function setup...');

// Check if FIREBASE_SERVICE_ACCOUNT is available
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.log('⚠️  FIREBASE_SERVICE_ACCOUNT environment variable not set');
  console.log('To test with real data, set the FIREBASE_SERVICE_ACCOUNT environment variable');
  console.log('For now, we\'ll test with mock data...');
  
  // Test with mock data
  const { handler } = require('./netlify/functions/listing-ssr.js');
  
  const mockEvent = {
    path: '/listing/test-listing-123',
    headers: {
      'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
    },
    queryStringParameters: null
  };
  
  handler(mockEvent, {})
    .then(result => {
      console.log('✅ Mock SSR test completed');
      console.log('Status:', result.statusCode);
      console.log('Headers:', result.headers);
      
      if (result.statusCode === 200) {
        console.log('✅ SSR function structure is correct');
      }
    })
    .catch(error => {
      console.error('❌ SSR test failed:', error.message);
    });

} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('✅ FIREBASE_SERVICE_ACCOUNT is properly formatted');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test fetching a real listing (we'll use a generic query first)
    const db = admin.firestore();
    db.collection('listings')
      .limit(1)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('No listings found in database');
        } else {
          const doc = snapshot.docs[0];
          console.log('✅ Found listing:', doc.id);
          console.log('Sample data:', {
            name: doc.data().name,
            price: doc.data().price,
            category: doc.data().category
          });
          
          // Now test our SSR function with real data
          const { handler } = require('./netlify/functions/listing-ssr.js');
          
          const realEvent = {
            path: `/listing/${doc.id}`,
            headers: {
              'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
            },
            queryStringParameters: null
          };
          
          return handler(realEvent, {});
        }
      })
      .then(result => {
        if (result) {
          console.log('✅ Real data SSR test completed');
          console.log('Status:', result.statusCode);
          
          if (result.statusCode === 200) {
            console.log('✅ SSR working with real Firebase data!');
            const htmlContent = result.body;
            const hasMetaTags = htmlContent.includes('og:title') && 
                              htmlContent.includes('og:description') && 
                              htmlContent.includes('og:image');
            console.log('Has proper meta tags:', hasMetaTags ? '✅' : '❌');
            
            if (hasMetaTags) {
              console.log('🎉 Server-side rendering is working perfectly!');
            }
          }
        }
      })
      .catch(error => {
        console.error('❌ Error testing with real data:', error.message);
      });
      
  } catch (error) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
  }
}
