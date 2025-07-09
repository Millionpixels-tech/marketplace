// Universal Edge Function for all page routing
// This runs on every request and routes bots to appropriate SSR functions

export default async (request, context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = url.pathname;
  
  // Skip static assets and API routes
  if (
    pathname.startsWith('/.netlify/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/) ||
    pathname.startsWith('/_') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'
  ) {
    return; // Let these routes pass through normally
  }
  
  // Check if this is a bot/crawler
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|slackbot|skypeuripreview|applebot|yahoo|duckduckbot|bingbot|slackbot/i.test(userAgent);
  
  console.log(`[Universal Router] ${pathname} - User-Agent: ${userAgent} - isBot: ${isBot}`);
  
  if (!isBot) {
    // For regular users, continue to SPA
    return;
  }
  
  // For bots, determine which SSR function to use
  let functionUrl;
  let resourceType;
  
  // Extract ID from path for listings and shops
  const listingMatch = pathname.match(/^\/listing\/(.+)$/);
  const shopMatch = pathname.match(/^\/shop\/(.+)$/);
  
  if (listingMatch) {
    // Listing page
    functionUrl = `${url.origin}/.netlify/functions/listing-ssr/${listingMatch[1]}`;
    resourceType = 'listing';
  } else if (shopMatch) {
    // Shop page
    functionUrl = `${url.origin}/.netlify/functions/shop-ssr/${shopMatch[1]}`;
    resourceType = 'shop';
  } else {
    // General page (home, about, search, etc.)
    functionUrl = `${url.origin}/.netlify/functions/general-ssr${pathname}`;
    resourceType = 'general';
  }
  
  console.log(`[Universal Router] Redirecting bot to: ${functionUrl} (type: ${resourceType})`);
  
  try {
    // Fetch from the appropriate SSR function
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
        'X-Edge-Function': 'universal-router',
        'X-Bot-Detected': 'true',
        'X-Resource-Type': resourceType,
        'X-Original-Path': pathname
      }
    });
  } catch (error) {
    console.error(`[Universal Router] Error fetching from ${functionUrl}:`, error);
    
    // Fallback to SPA if SSR fails
    return;
  }
};
