const admin = require('firebase-admin');

// Debug Firebase initialization
exports.handler = async (event, context) => {
  const debug = [];
  
  try {
    // Check environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    debug.push(`ENV VAR EXISTS: ${!!serviceAccountJson}`);
    
    if (serviceAccountJson) {
      debug.push(`ENV VAR LENGTH: ${serviceAccountJson.length}`);
      debug.push(`ENV VAR FIRST 50 CHARS: ${serviceAccountJson.substring(0, 50)}...`);
      
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        debug.push(`JSON PARSE: SUCCESS`);
        debug.push(`PROJECT_ID: ${serviceAccount.project_id || 'MISSING'}`);
        debug.push(`CLIENT_EMAIL: ${serviceAccount.client_email ? 'EXISTS' : 'MISSING'}`);
        debug.push(`PRIVATE_KEY: ${serviceAccount.private_key ? 'EXISTS' : 'MISSING'}`);
        
        // Try to initialize Firebase
        if (!admin.apps.length) {
          if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: serviceAccount.project_id
            });
            debug.push(`FIREBASE INIT: SUCCESS`);
          } else {
            debug.push(`FIREBASE INIT: MISSING REQUIRED FIELDS`);
          }
        } else {
          debug.push(`FIREBASE INIT: ALREADY INITIALIZED`);
        }
        
      } catch (parseError) {
        debug.push(`JSON PARSE ERROR: ${parseError.message}`);
      }
    } else {
      debug.push(`ENV VAR: NOT SET`);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        debug: debug,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        debug: debug,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
