export default async (request, context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // List of social media bots and crawlers
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
    'preview',
    'crawler',
    'spider',
    'scraper',
    'bot'
  ];
  
  // Check if the request is from a social media bot
  const isBot = botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Only process listing pages from bots
  if (isBot && url.pathname.startsWith('/listing/')) {
    const listingId = url.pathname.split('/listing/')[1];
    
    if (listingId) {
      // Redirect to the Netlify function with the listing ID
      const functionUrl = `${url.origin}/.netlify/functions/listing-meta?listingId=${listingId}`;
      return Response.redirect(functionUrl, 302);
    }
  }
  
  // For all other requests (human users, non-listing pages), continue normally
  return context.next();
};
