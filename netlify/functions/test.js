exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Netlify Functions are working!",
      timestamp: new Date().toISOString(),
      query: event.queryStringParameters,
      userAgent: event.headers['user-agent'] || 'Unknown'
    })
  };
};
