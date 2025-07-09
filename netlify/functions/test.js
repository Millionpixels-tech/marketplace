exports.handler = async function(event, context) {
  console.log("Test function called");
  console.log("Headers:", event.headers);
  console.log("Query parameters:", event.queryStringParameters);
  
  const userAgent = event.headers['user-agent'] || 'Unknown';
  
  // Check if this is a social media bot
  const botPatterns = [
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
    'telegram',
    'discordbot',
    'slackbot',
    'linkedinbot',
    'pinterest',
    'bot',
    'crawler',
    'spider'
  ];
  
  const isBot = botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Test Firebase availability
  let firebaseStatus = "Unknown";
  try {
    const admin = require("firebase-admin");
    firebaseStatus = "Module loaded successfully";
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      firebaseStatus = "Environment variable found";
      
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseStatus = "Service account parsed successfully";
      } catch (parseError) {
        firebaseStatus = "Error parsing service account JSON: " + parseError.message;
      }
    } else {
      firebaseStatus = "FIREBASE_SERVICE_ACCOUNT environment variable not found";
    }
  } catch (error) {
    firebaseStatus = "Error loading firebase-admin module: " + error.message;
  }
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Netlify Functions are working!",
      timestamp: new Date().toISOString(),
      userAgent: userAgent,
      isDetectedAsBot: isBot,
      firebaseStatus: firebaseStatus,
      query: event.queryStringParameters,
      environment: {
        nodeVersion: process.version,
        hasFirebaseEnv: !!process.env.FIREBASE_SERVICE_ACCOUNT
      }
    }, null, 2)
  };
};
