// Netlify Function to list shops for testing
// Access via /.netlify/functions/list-shops

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.VITE_FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountKey) {
    throw new Error('Firebase service account key not found in environment variables');
  }
  const serviceAccount = JSON.parse(serviceAccountKey);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id // Use project ID from service account
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    console.log('[List Shops] Fetching shops from Firestore...');
    
    const shopsSnapshot = await db.collection('shops')
      .limit(10)
      .get();
    
    const shops = [];
    shopsSnapshot.forEach(doc => {
      shops.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[List Shops] Found ${shops.length} shops`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        count: shops.length,
        shops: shops.map(shop => ({
          id: shop.id,
          name: shop.name,
          username: shop.username,
          description: shop.description?.substring(0, 100) + (shop.description?.length > 100 ? '...' : ''),
          logo: shop.logo,
          email: shop.email,
          phone: shop.phone
        }))
      }, null, 2)
    };
    
  } catch (error) {
    console.error('[List Shops] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
