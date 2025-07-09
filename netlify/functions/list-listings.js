const admin = require('firebase-admin');

// Simple function to list first few listings
exports.handler = async (event, context) => {
  try {
    // Initialize Firebase if not already done
    if (!admin.apps.length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.VITE_FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
      }
    }

    const db = admin.firestore();
    
    // Get first 5 listings
    const snapshot = await db.collection('listings').limit(5).get();
    
    const listings = [];
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        name: doc.data().name || doc.data().title || 'No name',
        status: doc.data().status || 'unknown'
      });
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        total: snapshot.size,
        listings: listings,
        message: snapshot.size > 0 ? 'Found listings' : 'No listings found'
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message
      }, null, 2)
    };
  }
};
