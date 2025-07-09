// Netlify Function for Shop Page Server-Side Rendering
// Handles /shop/:username for social media bots and crawlers

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'marketplace-bd270'
  });
}

const db = admin.firestore();

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

// Get shop data from Firestore
async function getShopData(username) {
  try {
    console.log(`[Shop SSR] Fetching shop data for username: ${username}`);
    
    // Query shops collection by username
    const shopQuery = await db.collection('shops')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (shopQuery.empty) {
      console.log(`[Shop SSR] No shop found for username: ${username}`);
      return null;
    }
    
    const shopDoc = shopQuery.docs[0];
    const shopData = shopDoc.data();
    
    console.log(`[Shop SSR] Found shop: ${shopData.name} (${shopData.username})`);
    
    return {
      id: shopDoc.id,
      ...shopData
    };
  } catch (error) {
    console.error('[Shop SSR] Error fetching shop data:', error);
    return null;
  }
}

// Generate HTML for shop page
function generateShopHTML(shop, username) {
  const siteName = 'SINA Marketplace';
  const siteUrl = 'https://sinamarketplace.com';
  
  if (!shop) {
    // Shop not found - generate 404 page
    const title = `Shop Not Found - ${siteName}`;
    const description = `The shop "${username}" could not be found on ${siteName}.`;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/shop/${escapeHtml(username)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="${siteName}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary">
  <meta property="twitter:url" content="${siteUrl}/shop/${escapeHtml(username)}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  
  <!-- WhatsApp -->
  <meta property="og:image" content="${siteUrl}/logo.svg">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
</head>
<body>
  <h1>Shop Not Found</h1>
  <p>The shop "${escapeHtml(username)}" could not be found.</p>
  <p><a href="${siteUrl}">Return to SINA Marketplace</a></p>
</body>
</html>`;
  }
  
  // Generate meta tags for valid shop
  const title = `${shop.name} (@${shop.username}) - ${siteName}`;
  const description = shop.description || `Visit ${shop.name}'s shop on ${siteName} for unique handcrafted items.`;
  const shopUrl = `${siteUrl}/shop/${shop.username}`;
  
  // Use shop logo if available, otherwise default logo
  const imageUrl = shop.logo || `${siteUrl}/logo.svg`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="business.business">
  <meta property="og:url" content="${shopUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:site_name" content="${siteName}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${shopUrl}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${escapeHtml(imageUrl)}">
  
  <!-- WhatsApp (uses Open Graph) -->
  <meta property="og:image:alt" content="${escapeHtml(shop.name)} shop logo">
  
  <!-- Business Schema.org structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "${escapeHtml(shop.name)}",
    "description": "${escapeHtml(description)}",
    "url": "${shopUrl}",
    "image": "${escapeHtml(imageUrl)}",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "LK"
    },
    "priceRange": "$",
    "telephone": "${escapeHtml(shop.phone || '')}",
    "email": "${escapeHtml(shop.email || '')}",
    "sameAs": [
      "${siteUrl}/shop/${shop.username}"
    ]
  }
  </script>
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${shopUrl}">
  
  <!-- Robots -->
  <meta name="robots" content="index, follow">
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <header style="text-align: center; margin-bottom: 30px;">
      ${shop.logo ? `<img src="${escapeHtml(shop.logo)}" alt="${escapeHtml(shop.name)} logo" style="max-width: 200px; height: auto; border-radius: 10px;">` : ''}
      <h1 style="color: #333; margin: 20px 0 10px 0;">${escapeHtml(shop.name)}</h1>
      <p style="color: #666; font-size: 18px; margin: 0;">@${escapeHtml(shop.username)}</p>
    </header>
    
    <main>
      ${shop.description ? `<div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">About this shop</h2>
        <p style="color: #555; line-height: 1.6;">${escapeHtml(shop.description)}</p>
      </div>` : ''}
      
      <div style="text-align: center; padding: 20px; background: #e8f4f8; border-radius: 10px;">
        <p style="margin: 0; color: #555;">This is a server-rendered preview for social media sharing.</p>
        <p style="margin: 10px 0 0 0;">
          <a href="${shopUrl}" style="color: #0066cc; text-decoration: none; font-weight: bold;">
            Visit ${escapeHtml(shop.name)}'s Shop on SINA Marketplace →
          </a>
        </p>
      </div>
    </main>
    
    <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 14px;">
        <a href="${siteUrl}" style="color: #0066cc; text-decoration: none;">SINA Marketplace</a> - 
        Supporting Sri Lankan artisans and craftspeople
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
    
    console.log(`[Shop SSR] Request: ${requestPath} - User-Agent: ${userAgent}`);
    
    // Extract username from path
    const pathMatch = requestPath.match(/\/shop-ssr\/(.+)$/);
    if (!pathMatch) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: '<h1>Not Found</h1><p>Shop not found.</p>'
      };
    }
    
    const username = decodeURIComponent(pathMatch[1]);
    
    // Verify this is a bot request (security measure)
    if (!isBot(userAgent)) {
      console.log(`[Shop SSR] Non-bot request detected, redirecting to SPA`);
      return {
        statusCode: 302,
        headers: {
          'Location': `https://sinamarketplace.com/shop/${username}`,
          'Cache-Control': 'no-cache'
        }
      };
    }
    
    // Fetch shop data
    const shop = await getShopData(username);
    
    // Generate HTML
    const html = generateShopHTML(shop, username);
    
    return {
      statusCode: shop ? 200 : 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Shop-SSR': 'true',
        'X-Shop-Found': shop ? 'true' : 'false'
      },
      body: html
    };
    
  } catch (error) {
    console.error('[Shop SSR] Error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: '<h1>Server Error</h1><p>Unable to load shop page.</p>'
    };
  }
};
