const admin = require('firebase-admin');

// Debug all environment variables related to Firebase
exports.handler = async (event, context) => {
  const debug = [];
  
  try {
    // Check all environment variables
    const allEnvVars = Object.keys(process.env);
    debug.push(`TOTAL ENV VARS: ${allEnvVars.length}`);
    
    // Look for Firebase-related variables
    const firebaseVars = allEnvVars.filter(key => 
      key.toLowerCase().includes('firebase') || 
      key.toLowerCase().includes('service') ||
      key.toLowerCase().includes('account')
    );
    debug.push(`FIREBASE-RELATED VARS: ${firebaseVars.join(', ') || 'NONE'}`);
    
    // Check specific variable names
    const commonNames = [
      'FIREBASE_SERVICE_ACCOUNT',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'GOOGLE_SERVICE_ACCOUNT',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'SERVICE_ACCOUNT_KEY'
    ];
    
    commonNames.forEach(name => {
      const exists = !!process.env[name];
      debug.push(`${name}: ${exists ? 'EXISTS' : 'NOT SET'}`);
    });
    
    // Check Netlify-specific environment info
    debug.push(`NETLIFY_DEV: ${process.env.NETLIFY_DEV || 'false'}`);
    debug.push(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    debug.push(`CONTEXT: ${context?.deployId ? 'DEPLOYED' : 'LOCAL'}`);
    
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
