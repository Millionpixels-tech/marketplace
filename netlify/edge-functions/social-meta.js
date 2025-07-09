export default async (request, context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  console.log(`Edge function called for: ${url.pathname}`);
  console.log(`User-Agent: ${userAgent}`);
  
  // List of social media bots and crawlers - be more specific
  const botPatterns = [
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
    'telegram',
    'discordbot',
    'slackbot',
    'linkedinbot',
    'pinterest',
    'googlebot',
    'bingbot',
    'yandexbot',
    'applebot',
    'developers.google.com/+/web/snippet',
    'preview'
  ];
  
  // Check if the request is from a social media bot
  const isBot = botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  console.log(`Is bot: ${isBot}`);
  
  // Handle listing pages from bots
  if (isBot && url.pathname.startsWith('/listing/')) {
    const listingId = url.pathname.split('/listing/')[1];
    console.log(`Redirecting bot to listing function for: ${listingId}`);
    
    if (listingId) {
      // Redirect to the Netlify function with the listing ID
      const functionUrl = `${url.origin}/.netlify/functions/listing-meta?listingId=${listingId}`;
      console.log(`Redirecting to: ${functionUrl}`);
      return Response.redirect(functionUrl, 302);
    }
  }
  
  // Handle shop pages from bots
  if (isBot && url.pathname.startsWith('/shop/')) {
    const shopUsername = url.pathname.split('/shop/')[1];
    console.log(`Redirecting bot to shop function for: ${shopUsername}`);
    
    if (shopUsername) {
      // Redirect to the Netlify function with the shop username
      const functionUrl = `${url.origin}/.netlify/functions/shop-meta?shopUsername=${shopUsername}`;
      console.log(`Redirecting to: ${functionUrl}`);
      return Response.redirect(functionUrl, 302);
    }
  }
  
  // For all other requests (human users, non-bot requests), continue normally
  console.log('Continuing to normal app');
  return context.next();
};
