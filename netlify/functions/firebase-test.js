// Simple test to verify firebase-admin loading
exports.handler = async function(event, context) {
  console.log("Testing firebase-admin loading...");
  
  try {
    // Try to require firebase-admin
    const admin = require('firebase-admin');
    console.log("✅ firebase-admin module loaded successfully");
    
    // Check if environment variable exists
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "error",
          message: "firebase-admin loads but FIREBASE_SERVICE_ACCOUNT env var is missing",
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Try to parse the service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("✅ Service account parsed successfully");
    } catch (parseError) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "error",
          message: "FIREBASE_SERVICE_ACCOUNT env var is not valid JSON",
          error: parseError.message,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Try to initialize Firebase (only if not already initialized)
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase initialized successfully");
      } catch (initError) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "error",
            message: "Firebase initialization failed",
            error: initError.message,
            timestamp: new Date().toISOString()
          })
        };
      }
    }
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "success",
        message: "Firebase-admin is working properly!",
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        firebaseApps: admin.apps.length,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error("❌ Error loading firebase-admin:", error);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        message: "Failed to load firebase-admin module",
        error: error.message,
        code: error.code,
        requireStack: error.requireStack,
        timestamp: new Date().toISOString()
      })
    };
  }
};
