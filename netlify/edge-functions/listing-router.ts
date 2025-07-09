// Edge Function for listing page routing
// This runs on every request to /listing/* and routes based on user agent

export default async (request, context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Extract listing ID from path
  const pathMatch = url.pathname.match(/^\/listing\/(.+)$/);
  if (!pathMatch) {
    return; // Let other routes handle this
  }
  
  const listingId = pathMatch[1];
  
  // Check if this is a bot/crawler
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|slackbot|skypeuripreview|applebot|yahoo|duckduckbot|bingbot|slackbot/i.test(userAgent);
  
  console.log(`[Edge Function] ${url.pathname} - User-Agent: ${userAgent} - isBot: ${isBot}`);
  
  if (isBot) {
    // For bots, redirect to SSR function
    const functionUrl = `${url.origin}/.netlify/functions/listing-ssr/${listingId}`;
    console.log(`[Edge Function] Redirecting bot to: ${functionUrl}`);
    
    // Fetch from the SSR function
    const response = await fetch(functionUrl, {
      headers: {
        'User-Agent': userAgent,
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || ''
      }
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Edge-Function': 'listing-router',
        'X-Bot-Detected': 'true'
      }
    });
  }
  
  // For regular users, continue to SPA (return nothing to let normal routing handle it)
  return;
};
