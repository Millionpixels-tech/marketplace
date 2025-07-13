// Enhanced Universal Edge Function for maximum SEO performance
// This runs on every request and provides comprehensive bot detection and routing

export default async (request, context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = url.pathname;
  
  // Skip static assets and API routes
  if (
    pathname.startsWith('/.netlify/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|webp|avif)$/) ||
    pathname.startsWith('/_') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return; // Let these routes pass through normally
  }
  
  // Enhanced bot detection with comprehensive patterns
  const botPatterns = [
    // Major search engines
    'googlebot', 'google-structured-data-testing-tool', 'google-site-verification',
    'bingbot', 'msnbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
    
    // Social media crawlers
    'facebookexternalhit', 'facebookcatalog', 'twitterbot', 'linkedinbot',
    'whatsapp', 'telegrambot', 'skypeuripreview', 'slackbot', 'discordbot',
    'pinterest', 'reddit', 'tumblr', 'vkshare',
    
    // SEO and monitoring tools
    'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming frog',
    'sitebulb', 'lighthouse', 'gtmetrix', 'pagespeed', 'webpagetest',
    
    // Generic patterns
    'crawler', 'spider', 'crawling', 'indexer', 'bot', 'scraper'
  ];
  
  const lowerUA = userAgent.toLowerCase();
  const isBot = botPatterns.some(pattern => lowerUA.includes(pattern));
  
  // Log with more detail for analytics
  const botInfo = {
    isBot,
    userAgent: userAgent.substring(0, 100),
    pathname,
    timestamp: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || 'unknown',
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  };
  
  if (!isBot) {
    // For regular users, let the request pass through to normal routing
    // Don't return a response - this allows Netlify to serve the SPA normally
    return;
  }
  
  // For bots, determine optimal SSR strategy
  let functionUrl;
  let resourceType;
  let cacheHeaders;
  
  // Extract ID from path for listings and shops
  const listingMatch = pathname.match(/^\/listing\/(.+)$/);
  const shopMatch = pathname.match(/^\/shop\/(.+)$/);
  
  if (listingMatch) {
    // Listing page - highest priority for SEO
    functionUrl = `${url.origin}/.netlify/functions/listing-ssr/${listingMatch[1]}`;
    resourceType = 'listing';
    cacheHeaders = 'public, max-age=600, s-maxage=1200'; // 10min/20min cache
  } else if (shopMatch) {
    // Shop page - high priority
    functionUrl = `${url.origin}/.netlify/functions/shop-ssr/${shopMatch[1]}`;
    resourceType = 'shop';
    cacheHeaders = 'public, max-age=300, s-maxage=900'; // 5min/15min cache
  } else {
    // General page - standard priority
    functionUrl = `${url.origin}/.netlify/functions/general-ssr${pathname}${url.search}`;
    resourceType = 'general';
    cacheHeaders = 'public, max-age=1800, s-maxage=3600'; // 30min/1hr cache
  }
  
  try {
    // Fetch from the appropriate SSR function with enhanced headers
    const response = await fetch(functionUrl, {
      headers: {
        'User-Agent': userAgent,
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
        'Accept': request.headers.get('accept') || 'text/html',
        'Accept-Language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
        'X-Bot-Type': getBotType(userAgent),
        'X-Original-URL': request.url
      }
    });
    
    // Enhanced response headers for maximum SEO benefit
    const enhancedHeaders = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cacheHeaders,
      'X-Edge-Function': 'enhanced-universal-router',
      'X-Bot-Detected': 'true',
      'X-Bot-Type': getBotType(userAgent),
      'X-Resource-Type': resourceType,
      'X-Original-Path': pathname,
      'X-Rendered-At': new Date().toISOString(),
      'Vary': 'User-Agent',
      'X-Robots-Tag': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      
      // Performance headers
      'X-DNS-Prefetch-Control': 'on',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // SEO enhancement headers
      'Link': [
        '<https://sina.lk>; rel=canonical',
        '<https://sina.lk/sitemap.xml>; rel=sitemap; type=application/xml',
        '</logo.svg>; rel=icon; type=image/svg+xml',
        '</manifest.json>; rel=manifest'
      ].join(', ')
    };
    
    return new Response(response.body, {
      status: response.status,
      headers: enhancedHeaders
    });
  } catch (error) {
    console.error(`[Enhanced Universal Router] Error fetching from ${functionUrl}:`, error);
    
    // Enhanced fallback with basic SEO meta
    const fallbackHTML = generateFallbackHTML(pathname, userAgent);
    
    return new Response(fallbackHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Edge-Function': 'fallback-ssr',
        'X-Bot-Detected': 'true',
        'X-Fallback-Reason': 'ssr-function-error'
      }
    });
  }
};

// Determine bot type for analytics and optimization
function getBotType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('googlebot') || ua.includes('google')) return 'google';
  if (ua.includes('bingbot') || ua.includes('bing')) return 'bing';
  if (ua.includes('facebook')) return 'facebook';
  if (ua.includes('twitter')) return 'twitter';
  if (ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('slack')) return 'slack';
  if (ua.includes('discord')) return 'discord';
  if (ua.includes('pinterest')) return 'pinterest';
  if (ua.includes('ahrefsbot')) return 'ahrefs';
  if (ua.includes('semrushbot')) return 'semrush';
  if (ua.includes('lighthouse')) return 'lighthouse';
  
  return 'other';
}

// Generate fallback HTML with basic SEO when SSR functions fail
function generateFallbackHTML(pathname: string, userAgent: string): string {
  const title = 'Sina.lk - Authentic Sri Lankan Products & Handmade Crafts';
  const description = 'Discover authentic Sri Lankan products, handmade crafts, traditional textiles, Ceylon tea, and unique artisan creations from verified local artisans.';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="https://sina.lk${pathname}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sina.lk${pathname}">
    <meta property="og:image" content="https://sina.lk/logo.svg">
    <meta property="og:site_name" content="Sina.lk">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 40px; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #2c3e50; margin-bottom: 20px; }
        .description { color: #5a6c7d; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
        .cta { background: #72b01d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sina.lk - Sri Lankan Marketplace</h1>
        <p class="description">${description}</p>
        <a href="/" class="cta">Explore Products</a>
        <script>
            // Redirect non-bots to SPA
            if (!/bot|crawler|spider/i.test(navigator.userAgent)) {
                window.location.href = '/';
            }
        </script>
    </div>
</body>
</html>`;
}
