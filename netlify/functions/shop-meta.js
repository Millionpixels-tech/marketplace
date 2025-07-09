let admin;
let isFirebaseInitialized = false;

// Initialize Firebase Admin only when needed
async function initializeFirebase() {
  if (isFirebaseInitialized) return admin;
  
  try {
    admin = require("firebase-admin");
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    isFirebaseInitialized = true;
    return admin;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

exports.handler = async function(event, context) {
  const { shopUsername } = event.queryStringParameters || {};
  const baseUrl = "https://mygold.lk"; // Change to your domain
  
  console.log("Shop function called with username:", shopUsername);
  console.log("User-Agent:", event.headers['user-agent']);
  
  if (!shopUsername) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing shopUsername parameter" })
    };
  }

  try {
    // Initialize Firebase
    const admin = await initializeFirebase();
    console.log("Firebase initialized successfully");
    
    console.log(`Fetching shop: ${shopUsername}`);
    
    // Get shop data from Firestore by username
    const shopsQuery = admin.firestore().collection("shops").where("username", "==", shopUsername);
    const shopSnapshot = await shopsQuery.get();
    
    if (shopSnapshot.empty) {
      console.log(`Shop not found: ${shopUsername}`);
      return generateErrorPage(baseUrl);
    }

    const shopDoc = shopSnapshot.docs[0];
    const shop = shopDoc.data();
    const shopId = shopDoc.id;
    
    // Get shop's listings count
    let listingCount = 0;
    try {
      const listingsQuery = admin.firestore().collection("listings").where("shopId", "==", shopId);
      const listingsSnapshot = await listingsQuery.get();
      listingCount = listingsSnapshot.size;
    } catch (error) {
      console.error("Error counting listings:", error);
    }

    // Prepare meta data
    const shopName = escapeHtml(shop.name || 'Shop');
    const title = `${shopName} - Sri Lankan Marketplace`;
    const description = escapeHtml(
      shop.description 
        ? (shop.description.length > 160 ? shop.description.substring(0, 157) + '...' : shop.description)
        : `Discover authentic Sri Lankan products from ${shopName}. ${listingCount} products available.`
    );
    
    const shopLogo = shop.logo || `${baseUrl}/logo.svg`;
    const shopUrl = `${baseUrl}/shop/${shopUsername}`;
    const location = escapeHtml(shop.location || 'Sri Lanka');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Standard Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${shopLogo}">
    <meta property="og:url" content="${shopUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Sri Lankan Marketplace">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${shopLogo}">
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="noindex, nofollow">
    <link rel="canonical" href="${shopUrl}">
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": "${shopName}",
      "description": "${description}",
      "image": "${shopLogo}",
      "url": "${shopUrl}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${location}",
        "addressCountry": "Sri Lanka"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "10"
      }
    }
    </script>
    
    <script>
      setTimeout(function() {
        window.location.replace("${shopUrl}");
      }, 50);
    </script>
    
    <noscript>
      <meta http-equiv="refresh" content="0; url=${shopUrl}">
    </noscript>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f8f9fa;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #72b01d, #3f7d20);
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 30px;
        text-align: center;
      }
      .shop-logo {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #e9ecef;
        margin: 20px 0;
      }
      .stats {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .btn {
        background: #007bff;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin-top: 20px;
        font-weight: 500;
      }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sri Lankan Marketplace</h1>
        </div>
        <div class="content">
            <img src="${shopLogo}" alt="${shopName} Logo" class="shop-logo" onerror="this.style.display='none'">
            <h2>${shopName}</h2>
            <p>${description}</p>
            <div class="stats">
                <strong>${listingCount}</strong> products available<br>
                <small>📍 ${location}</small>
            </div>
            <a href="${shopUrl}" class="btn">Visit Shop</a>
            <div style="color: #6c757d; font-size: 14px; margin-top: 20px;">Redirecting automatically...</div>
        </div>
    </div>
</body>
</html>`;

    console.log("Returning shop HTML response");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "X-Robots-Tag": "noindex"
      },
      body: html
    };

  } catch (error) {
    console.error("Error in shop-meta function:", error);
    
    // Check if this is a Firebase connection error
    if (error.message.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.error("Firebase service account configuration error");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "Firebase configuration error",
          details: "FIREBASE_SERVICE_ACCOUNT environment variable is not properly configured"
        })
      };
    }
    
    return generateErrorPage(baseUrl);
  }
};

function generateErrorPage(baseUrl) {
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    },
    body: `<!DOCTYPE html>
<html>
<head>
    <title>Shop Not Found - Sri Lankan Marketplace</title>
    <meta property="og:title" content="Sri Lankan Marketplace">
    <meta property="og:description" content="Discover authentic Sri Lankan products from local artisans and businesses">
    <meta property="og:image" content="${baseUrl}/logo.svg">
    <script>
      setTimeout(function() {
        window.location.replace("${baseUrl}");
      }, 2000);
    </script>
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h1>Shop Not Found</h1>
    <p>This shop may have been removed or is no longer available.</p>
    <a href="${baseUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Homepage</a>
</body>
</html>`
  };
}
