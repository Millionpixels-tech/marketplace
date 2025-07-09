const admin = require('firebase-admin');

// Test Firebase Firestore connection and collections
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
    const results = {
      timestamp: new Date().toISOString(),
      firebaseConnected: true,
      collections: {},
      testQueries: {}
    };

    try {
      // Test listings collection
      const listingsSnapshot = await db.collection('listings').limit(5).get();
      results.collections.listings = {
        exists: true,
        count: listingsSnapshot.size,
        sampleIds: listingsSnapshot.docs.map(doc => doc.id)
      };

      // Test if there are any documents at all
      if (listingsSnapshot.size > 0) {
        const firstListing = listingsSnapshot.docs[0];
        results.testQueries.firstListing = {
          id: firstListing.id,
          data: firstListing.data()
        };
      }

    } catch (error) {
      results.collections.listings = {
        exists: false,
        error: error.message
      };
    }

    try {
      // Test shops collection
      const shopsSnapshot = await db.collection('shops').limit(3).get();
      results.collections.shops = {
        exists: true,
        count: shopsSnapshot.size,
        sampleIds: shopsSnapshot.docs.map(doc => doc.id)
      };
    } catch (error) {
      results.collections.shops = {
        exists: false,
        error: error.message
      };
    }

    // Test specific listing IDs that were tried
    const testIds = ['3i3E33w4bwYNrsjYdesx', '0BieMfGmwNpQztgtzVNs'];
    for (const testId of testIds) {
      try {
        const doc = await db.collection('listings').doc(testId).get();
        results.testQueries[`listing_${testId}`] = {
          exists: doc.exists,
          data: doc.exists ? doc.data() : null
        };
      } catch (error) {
        results.testQueries[`listing_${testId}`] = {
          exists: false,
          error: error.message
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        firebaseConnected: false,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
