#!/usr/bin/env node

const { handler } = require('./netlify/functions/listing-ssr.js');

// Mock event for testing
const mockEvent = {
  path: '/listing/test-listing-id-123456',
  headers: {
    'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  },
  queryStringParameters: null
};

const mockContext = {};

console.log('Testing SSR function with mock data...');

handler(mockEvent, mockContext)
  .then(result => {
    console.log('Status:', result.statusCode);
    console.log('Headers:', result.headers);
    console.log('Body length:', result.body ? result.body.length : 0);
    
    if (result.statusCode === 200) {
      console.log('✅ SSR function test passed!');
      
      // Check if HTML contains expected meta tags
      const body = result.body;
      const hasMetaTags = body.includes('og:title') && body.includes('og:description') && body.includes('og:image');
      console.log('Has proper meta tags:', hasMetaTags ? '✅' : '❌');
    } else {
      console.log('❌ SSR function test failed');
    }
  })
  .catch(error => {
    console.error('❌ Error testing SSR function:', error.message);
  });
