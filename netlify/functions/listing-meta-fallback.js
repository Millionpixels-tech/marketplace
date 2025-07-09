// Listing meta function with Firebase fallback
exports.handler = async function(event, context) {
  const { listingId } = event.queryStringParameters || {};
  const baseUrl = "https://sina.lk";
  
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

  // Try to use Firebase, but fall back to static content if it fails
  let listing = null;
  let shopName = "Sri Lankan Marketplace";
  
  try {
    // Try to load Firebase and get real data
    const admin = require('firebase-admin');
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      
      console.log("Firebase initialized, fetching listing...");
      const listingDoc = await admin.firestore().collection("listings").doc(listingId).get();
      
      if (listingDoc.exists) {
        listing = listingDoc.data();
        console.log(`Found listing: ${listing.name}`);
        
        // Get shop data if available
        if (listing.shopId) {
          try {
            const shopDoc = await admin.firestore().collection("shops").doc(listing.shopId).get();
            if (shopDoc.exists) {
              shopName = shopDoc.data().name || shopName;
            }
          } catch (error) {
            console.error("Error fetching shop:", error);
          }
        }
      }
    }
  } catch (error) {
    console.log("Firebase failed, using fallback data:", error.message);
  }
  
  // If Firebase failed or no data found, use fallback
  if (!listing) {
    console.log("Using fallback listing data");
    listing = {
      name: "Authentic Sri Lankan Product",
      description: "Discover authentic Sri Lankan products, handmade crafts, traditional textiles, Ceylon tea, and unique artisan creations from local artisans.",
      price: 2500,
      category: "Handmade Crafts",
      images: [`${baseUrl}/logo.svg`]
    };
  }
  
  // Generate meta tags
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  const productName = escapeHtml(listing.name || 'Product');
  const title = `${productName} - ${escapeHtml(shopName)}`;
  const description = escapeHtml(
    listing.description && listing.description.length > 160 
      ? listing.description.substring(0, 157) + '...' 
      : listing.description || 'Authentic Sri Lankan product available on our marketplace'
  );
  
  const price = listing.price ? listing.price : null;
  const formattedPrice = price ? `LKR ${price.toLocaleString()}` : '';
  
  const image = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : `${baseUrl}/logo.svg`;
  
  const listingUrl = `${baseUrl}/listing/${listingId}`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Standard Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph Meta Tags for Facebook, LinkedIn, etc. -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${listingUrl}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Sina.lk - Sri Lankan Marketplace">
    <meta property="og:locale" content="en_US">
    ${price ? `<meta property="product:price:amount" content="${price}">` : ''}
    <meta property="product:price:currency" content="LKR">
    ${listing.category ? `<meta property="product:category" content="${escapeHtml(listing.category)}">` : ''}
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:site" content="@SinaLK">
    
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
          "name": "${escapeHtml(shopName)}"
        }
      },` : ''}
      "brand": {
        "@type": "Brand",
        "name": "${escapeHtml(shopName)}"
      }${listing.category ? `,
      "category": "${escapeHtml(listing.category)}"` : ''},
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
            <h1>Sina.lk - Sri Lankan Marketplace</h1>
        </div>
        <div class="content">
            <h2>${productName}</h2>
            <p>${description}</p>
            ${formattedPrice ? `<div class="price">${formattedPrice}</div>` : ''}
            <div class="shop-name">by ${escapeHtml(shopName)}</div>
            <img src="${image}" alt="${productName}" class="product-image" onerror="this.style.display='none'">
            <br>
            <a href="${listingUrl}" class="btn">View Product Details</a>
            <div class="loading">Redirecting automatically...</div>
        </div>
    </div>
</body>
</html>`;

  console.log("Returning HTML response");
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "X-Robots-Tag": "noindex"
    },
    body: html
  };
};
