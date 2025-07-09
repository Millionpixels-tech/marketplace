// Netlify Function for General Page Server-Side Rendering
// Handles all pages except /listing/* and /shop/* for social media bots and crawlers

// Bot detection
function isBot(userAgent) {
  if (!userAgent) return false;
  return /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|slackbot|skypeuripreview|applebot|yahoo|duckduckbot|bingbot|slackbot/i.test(userAgent);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Get page meta data based on route
function getPageMetaData(path) {
  const siteName = 'sina.lk';
  const siteUrl = 'https://sina.lk';
  const defaultDescription = 'Discover authentic Sri Lankan products, handmade crafts, traditional textiles, Ceylon tea, and unique artisan creations. Connect with local sellers and support Sri Lankan businesses worldwide.';
  const defaultImage = `${siteUrl}/logo.svg`;

  // Route-specific meta data
  const routes = {
    '/': {
      title: `${siteName} - Authentic Sri Lankan Products & Handmade Crafts`,
      description: defaultDescription,
      type: 'website'
    },
    '/search': {
      title: `Search Products - ${siteName}`,
      description: 'Search for authentic Sri Lankan products, handmade crafts, traditional textiles, and unique artisan creations.',
      type: 'website'
    },
    '/cart': {
      title: `Shopping Cart - ${siteName}`,
      description: 'Review your selected Sri Lankan products and proceed to checkout.',
      type: 'website'
    },
    '/wishlist': {
      title: `Wishlist - ${siteName}`,
      description: 'Your saved favorite Sri Lankan products and handmade crafts.',
      type: 'website'
    },
    '/seller-guide': {
      title: `Seller Guide - ${siteName}`,
      description: 'Learn how to sell your handmade products and crafts on sina.lk. Join our community of Sri Lankan artisans.',
      type: 'article'
    },
    '/about-us': {
      title: `About Us - ${siteName}`,
      description: 'Learn about sina.lk, our mission to support Sri Lankan artisans and connect them with global customers.',
      type: 'website'
    },
    '/our-story': {
      title: `Our Story - ${siteName}`,
      description: 'Discover the story behind sina.lk and our commitment to preserving Sri Lankan craftsmanship.',
      type: 'article'
    },
    '/careers': {
      title: `Careers - ${siteName}`,
      description: 'Join our team and help build the future of Sri Lankan e-commerce. Explore career opportunities at sina.lk.',
      type: 'website'
    },
    '/help-center': {
      title: `Help Center - ${siteName}`,
      description: 'Get help with your orders, account, and shopping experience on sina.lk.',
      type: 'website'
    },
    '/privacy-policy': {
      title: `Privacy Policy - ${siteName}`,
      description: 'Learn how sina.lk protects your privacy and handles your personal information.',
      type: 'website'
    },
    '/terms-of-service': {
      title: `Terms of Service - ${siteName}`,
      description: 'Read the terms and conditions for using sina.lk.',
      type: 'website'
    },
    '/shipping-info': {
      title: `Shipping Information - ${siteName}`,
      description: 'Learn about shipping options, delivery times, and costs for Sri Lankan products.',
      type: 'website'
    },
    '/returns-refunds': {
      title: `Returns & Refunds - ${siteName}`,
      description: 'Understand our return and refund policy for products purchased on sina.lk.',
      type: 'website'
    }
  };

  // Get meta data for the specific route or use default
  const meta = routes[path] || {
    title: `${siteName} - Authentic Sri Lankan Products`,
    description: defaultDescription,
    type: 'website'
  };

  return {
    ...meta,
    image: defaultImage,
    url: `${siteUrl}${path}`,
    siteName,
    siteUrl
  };
}

// Generate HTML for any page
function generatePageHTML(path, meta) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${meta.type}">
  <meta property="og:url" content="${meta.url}">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:image" content="${escapeHtml(meta.image)}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:site_name" content="${meta.siteName}">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${meta.url}">
  <meta property="twitter:title" content="${escapeHtml(meta.title)}">
  <meta property="twitter:description" content="${escapeHtml(meta.description)}">
  <meta property="twitter:image" content="${escapeHtml(meta.image)}">
  <meta property="twitter:site" content="@SinaMarketplace">
  
  <!-- WhatsApp (uses Open Graph) -->
  <meta property="og:image:alt" content="SINA Marketplace Logo">
  
  <!-- Website Schema.org structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "${escapeHtml(meta.siteName)}",
    "description": "${escapeHtml(meta.description)}",
    "url": "${meta.siteUrl}",
    "image": "${escapeHtml(meta.image)}",
    "sameAs": [
      "https://facebook.com/sinamarketplace",
      "https://twitter.com/sinamarketplace",
      "https://instagram.com/sinamarketplace"
    ],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "${meta.siteUrl}/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${meta.url}">
  
  <!-- Robots -->
  <meta name="robots" content="index, follow">
  
  <!-- Theme and icons -->
  <meta name="theme-color" content="#72b01d">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/logo.svg">
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <header style="text-align: center; margin-bottom: 30px;">
      <img src="${escapeHtml(meta.image)}" alt="sina.lk Logo" style="max-width: 200px; height: auto; border-radius: 10px;">
      <h1 style="color: #333; margin: 20px 0 10px 0;">${escapeHtml(meta.siteName)}</h1>
      <p style="color: #666; font-size: 18px; margin: 0;">Authentic Sri Lankan Products & Handmade Crafts</p>
    </header>
    
    <main>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Welcome to sina.lk</h2>
        <p style="color: #555; line-height: 1.6;">${escapeHtml(meta.description)}</p>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #e8f4f8; border-radius: 10px;">
        <p style="margin: 0; color: #555;">This is a server-rendered preview for social media sharing.</p>
        <p style="margin: 10px 0 0 0;">
          <a href="${meta.url}" style="color: #0066cc; text-decoration: none; font-weight: bold;">
            Visit sina.lk →
          </a>
        </p>
      </div>
    </main>
    
    <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 14px;">
        <a href="${meta.siteUrl}" style="color: #0066cc; text-decoration: none;">sina.lk</a> - 
        Supporting Sri Lankan artisans and craftspeople worldwide
      </p>
    </footer>
  </div>
</body>
</html>`;
}

// Main handler
exports.handler = async (event, context) => {
  try {
    const userAgent = event.headers['user-agent'] || '';
    const requestPath = event.path;
    
    console.log(`[General SSR] Request: ${requestPath} - User-Agent: ${userAgent}`);
    
    // Extract the actual page path from the function path
    const pathMatch = requestPath.match(/\/general-ssr(.*)$/);
    const pagePath = pathMatch ? pathMatch[1] || '/' : '/';
    
    // Verify this is a bot request (security measure)
    if (!isBot(userAgent)) {
      console.log(`[General SSR] Non-bot request detected, redirecting to SPA`);
      return {
        statusCode: 302,
        headers: {
          'Location': `https://sina.lk${pagePath}`,
          'Cache-Control': 'no-cache'
        }
      };
    }
    
    // Get meta data for the page
    const meta = getPageMetaData(pagePath);
    
    // Generate HTML
    const html = generatePageHTML(pagePath, meta);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-General-SSR': 'true',
        'X-Page-Path': pagePath
      },
      body: html
    };
    
  } catch (error) {
    console.error('[General SSR] Error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Server Error</h1><p>Unable to load page.</p>'
    };
  }
};
