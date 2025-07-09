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

// Utility function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Utility function to truncate text
function truncateText(text, maxLength = 160) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

exports.handler = async function(event, context) {
  const { listingId } = event.queryStringParameters || {};
  const baseUrl = "https://mygold.lk"; // Change to your domain
  
  console.log("Function called with listingId:", listingId);
  console.log("User-Agent:", event.headers['user-agent']);
  
  if (!listingId) {
    console.log("Missing listingId parameter");
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing listingId parameter" })
    };
  }

  try {
    // Initialize Firebase
    const admin = await initializeFirebase();
    console.log("Firebase initialized successfully");
    
    console.log(`Fetching listing: ${listingId}`);
    
    // Get listing data from Firestore
    const listingDoc = await admin.firestore().collection("listings").doc(listingId).get();
    
    if (!listingDoc.exists) {
      console.log(`Listing not found: ${listingId}`);
      return generateErrorPage(baseUrl, "Product Not Found", "This product may have been removed or is no longer available.");
    }

    const listing = listingDoc.data();
    console.log(`Found listing: ${listing.name}`);
    
    // Get shop data if available
    let shopName = "Sri Lankan Marketplace";
    let shopLogo = null;
    
    if (listing.shopId) {
      try {
        const shopDoc = await admin.firestore().collection("shops").doc(listing.shopId).get();
        if (shopDoc.exists) {
          const shopData = shopDoc.data();
          shopName = shopData.name || shopName;
          shopLogo = shopData.logo || null;
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    }

    // Prepare meta data with proper escaping
    const productName = escapeHtml(listing.name || 'Product');
    const title = `${productName} - ${escapeHtml(shopName)}`;
    const description = escapeHtml(truncateText(
      listing.description || 'Authentic Sri Lankan product available on our marketplace'
    ));
    
    const price = listing.price ? listing.price : null;
    const formattedPrice = price ? `LKR ${price.toLocaleString()}` : '';
    
    // Use the first image or a default
    const image = listing.images && listing.images.length > 0 
      ? listing.images[0] 
      : `${baseUrl}/logo.svg`;
    
    const listingUrl = `${baseUrl}/listing/${listingId}`;

    // Generate keywords
    const keywords = [
      listing.name,
      listing.category,
      listing.subcategory,
      shopName,
      'Sri Lanka',
      'marketplace',
      'authentic',
      'handmade'
    ].filter(Boolean).map(k => escapeHtml(k)).join(', ');

    // Generate HTML with comprehensive meta tags
    const html = generateListingHTML({
      title,
      description,
      productName,
      image,
      listingUrl,
      price,
      formattedPrice,
      shopName: escapeHtml(shopName),
      category: escapeHtml(listing.category || ''),
      keywords,
      baseUrl
    });

    console.log("Returning HTML response");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600", // Cache for 5 minutes, CDN for 10 minutes
        "X-Robots-Tag": "noindex" // Prevent indexing of meta pages
      },
      body: html
    };

  } catch (error) {
    console.error("Error in listing-meta function:", error);
    
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
    
    return generateErrorPage(baseUrl, "Error Loading Product", "There was an error loading this product. Please try again later.");
  }
};

function generateListingHTML({
  title,
  description,
  productName,
  image,
  listingUrl,
  price,
  formattedPrice,
  shopName,
  category,
  keywords,
  baseUrl
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Standard Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    
    <!-- Open Graph Meta Tags for Facebook, LinkedIn, etc. -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${listingUrl}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Sri Lankan Marketplace">
    <meta property="og:locale" content="en_US">
    ${price ? `<meta property="product:price:amount" content="${price}">` : ''}
    <meta property="product:price:currency" content="LKR">
    ${category ? `<meta property="product:category" content="${category}">` : ''}
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:site" content="@YourTwitterHandle">
    
    <!-- WhatsApp and Telegram optimizations -->
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${productName} - Available on Sri Lankan Marketplace">
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="noindex, nofollow">
    <link rel="canonical" href="${listingUrl}">
    
    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="${baseUrl}/favicon.svg">
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${productName}",
      "description": "${description}",
      "image": "${image}",
      "url": "${listingUrl}",
      ${price ? `"offers": {
        "@type": "Offer",
        "price": "${price}",
        "priceCurrency": "LKR",
        "availability": "https://schema.org/InStock",
        "url": "${listingUrl}",
        "seller": {
          "@type": "Organization",
          "name": "${shopName}"
        }
      },` : ''}
      "brand": {
        "@type": "Brand",
        "name": "${shopName}"
      }${category ? `,
      "category": "${category}"` : ''},
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "1"
      }
    }
    </script>
    
    <!-- Immediate redirect for users -->
    <script>
      // Redirect immediately for human users
      setTimeout(function() {
        window.location.replace("${listingUrl}");
      }, 50);
    </script>
    
    <!-- Fallback redirect -->
    <noscript>
      <meta http-equiv="refresh" content="0; url=${listingUrl}">
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
      .product-image {
        max-width: 300px;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin: 20px 0;
      }
      .price {
        font-size: 28px;
        color: #28a745;
        font-weight: bold;
        margin: 15px 0;
      }
      .shop-name {
        color: #6c757d;
        font-style: italic;
        margin: 10px 0;
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
        transition: background 0.3s ease;
      }
      .btn:hover {
        background: #0056b3;
      }
      .loading {
        color: #6c757d;
        font-size: 14px;
        margin-top: 20px;
      }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sri Lankan Marketplace</h1>
        </div>
        <div class="content">
            <h2>${productName}</h2>
            <p>${description}</p>
            ${formattedPrice ? `<div class="price">${formattedPrice}</div>` : ''}
            <div class="shop-name">by ${shopName}</div>
            <img src="${image}" alt="${productName}" class="product-image" onerror="this.style.display='none'">
            <br>
            <a href="${listingUrl}" class="btn">View Product Details</a>
            <div class="loading">Redirecting automatically...</div>
        </div>
    </div>
    
    <!-- Additional redirect attempt -->
    <script>
      // Fallback redirect for slow loading
      setTimeout(function() {
        if (window.location.href.includes('netlify')) {
          window.location.replace("${listingUrl}");
        }
      }, 2000);
    </script>
</body>
</html>`;
}

function generateErrorPage(baseUrl, title, message) {
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
    <title>${title} - Sri Lankan Marketplace</title>
    <meta property="og:title" content="Sri Lankan Marketplace">
    <meta property="og:description" content="Discover authentic Sri Lankan products from local artisans and businesses">
    <meta property="og:image" content="${baseUrl}/logo.svg">
    <meta property="og:url" content="${baseUrl}">
    <meta property="og:type" content="website">
    <script>
      setTimeout(function() {
        window.location.replace("${baseUrl}");
      }, 2000);
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        padding: 50px;
        background: #f8f9fa;
        color: #333;
      }
      .container {
        max-width: 500px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }
      .btn {
        background: #007bff;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin-top: 20px;
      }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="${baseUrl}" class="btn">Go to Homepage</a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Redirecting automatically...</p>
    </div>
</body>
</html>`
  };
}
