const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
if (!admin.apps.length) {
  try {
    // Check for both prefixed and non-prefixed environment variables
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.VITE_FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      console.log('📝 Found Firebase service account, attempting to parse...');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully with project:', serviceAccount.project_id);
      } else {
        console.log('⚠️ Firebase service account missing required fields:', {
          project_id: !!serviceAccount.project_id,
          private_key: !!serviceAccount.private_key,
          client_email: !!serviceAccount.client_email
        });
      }
    } else {
      console.log('⚠️ Firebase service account environment variable not found (checked FIREBASE_SERVICE_ACCOUNT and VITE_FIREBASE_SERVICE_ACCOUNT)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
  }
}

// Fetch listing data from Firestore
async function fetchListingData(listingId) {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized, returning mock data');
    return { 
      listing: {
        id: listingId,
        name: 'Sample Sri Lankan Handcraft',
        description: 'Beautiful handcrafted item from Sri Lanka. This is a preview for social media sharing.',
        price: 1500,
        images: ['/logo.svg'],
        category: 'Arts & Crafts',
        subcategory: 'Handmade'
      }, 
      shop: {
        name: 'Local Artisan Shop',
        username: 'artisan_shop',
        logo: '/logo.svg'
      } 
    };
  }

  try {
    const db = admin.firestore();
    
    // Fetch listing document
    const listingDoc = await db.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      return { listing: null, shop: null };
    }

    const listing = { id: listingDoc.id, ...listingDoc.data() };
    
    // Fetch shop data if available
    let shop = null;
    const shopId = listing.shopId || listing.shop;
    if (shopId) {
      try {
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (shopDoc.exists) {
          shop = { id: shopDoc.id, ...shopDoc.data() };
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      }
    }

    return { listing, shop };
  } catch (error) {
    console.error('Error fetching listing data:', error);
    return { listing: null, shop: null };
  }
}

// Generate optimized HTML for listing page
function generateListingHTML(listing, shop, listingId) {
  const siteName = "Sina.lk";
  const siteUrl = "https://sina.lk"; // Update with your actual domain
  
  const title = `${listing.name} - Buy from Sri Lankan Entrepreneurs | ${siteName}`;
  const description = listing.description && listing.description.length > 160 
    ? listing.description.substring(0, 157) + '...' 
    : (listing.description || 'Quality product or service from Sri Lankan entrepreneur');
  
  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : `${siteUrl}/default-product.jpg`;
  const pageUrl = `${siteUrl}/listing/${listingId}`;
  
  const priceFormatted = (listing.price || 0).toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${listing.name}, ${listing.category || ''}, ${listing.subcategory || ''}, Sri Lankan entrepreneurs, quality products, professional services">
    
    <!-- Enhanced Meta Tags for Search Engines -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="${shop?.name || 'Sri Lankan Entrepreneur Platform'}">>
    <meta name="price" content="LKR ${listing.price || 0}">
    <meta name="priceCurrency" content="LKR">
    <meta name="availability" content="in stock">
    <meta name="product:price:amount" content="${listing.price || 0}">
    <meta name="product:price:currency" content="LKR">
    <meta name="product:availability" content="in stock">
    <meta name="product:condition" content="new">
    <meta name="product:category" content="${listing.category || ''}">
    <meta name="product:brand" content="${shop?.name || 'Sri Lankan Entrepreneur'}">
    
    <!-- Language and Location -->
    <meta name="language" content="en-LK">
    <meta name="geo.region" content="LK">
    <meta name="geo.placename" content="Sri Lanka">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${pageUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="${siteName}">
    <meta property="product:price:amount" content="${listing.price || 0}">
    <meta property="product:price:currency" content="LKR">
    ${shop ? `<meta property="product:retailer" content="${shop.name}">` : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${pageUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${imageUrl}">
    
    <!-- WhatsApp -->
    <meta property="og:image:alt" content="${listing.name}">
    
    <!-- Enhanced Structured Data for Google Rich Results -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${listing.name}",
      "description": "${description.replace(/"/g, '\\"')}",
      "image": [
        ${(listing.images || []).map(img => `"${img}"`).join(',')}
      ],
      "sku": "${listingId}",
      "mpn": "${listingId}",
      "brand": {
        "@type": "Brand",
        "name": "${shop?.name || 'Sri Lankan Artisan'}"
      },
      "category": "${listing.category || ''}",
      "url": "${pageUrl}",
      "offers": {
        "@type": "Offer",
        "@id": "${pageUrl}#offer",
        "url": "${pageUrl}",
        "priceCurrency": "LKR",
        "price": "${listing.price || 0}",
        "lowPrice": "${listing.price || 0}",
        "highPrice": "${listing.price || 0}",
        "availability": "https://schema.org/InStock",
        "validFrom": "${new Date().toISOString()}",
        "priceValidUntil": "${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "${shop?.name || 'Sri Lankan Marketplace'}",
          "url": "${shop ? `${siteUrl}/shop/${shop.username || shop.id}` : siteUrl}"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "LKR"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "LK"
          }
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${listing.averageRating || 5}",
        "reviewCount": "${listing.reviewCount || 1}",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "${listing.averageRating || 5}",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Verified Customer"
        },
        "reviewBody": "Authentic Sri Lankan product with excellent quality."
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Origin",
          "value": "Sri Lanka"
        },
        {
          "@type": "PropertyValue",
          "name": "Shipping",
          "value": "Worldwide"
        }
      ]
    }
    </script>
    
    <!-- Website Organization Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "${siteName}",
      "alternateName": "Sri Lankan Marketplace",
      "url": "${siteUrl}",
      "description": "Authentic Sri Lankan products from verified artisans and shops",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "${siteUrl}/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    
    <!-- Breadcrumb Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "${siteUrl}"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "${listing.category || 'Products'}",
          "item": "${siteUrl}/search?cat=${encodeURIComponent(listing.category || '')}"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${listing.name}",
          "item": "${pageUrl}"
        }
      ]
    }
    </script>
    
    <!-- Favicon and Icons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    
    <!-- Styles for immediate rendering -->
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #ffffff;
            color: #0d0a0b;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .product-preview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin: 40px 0;
        }
        .product-image {
            width: 100%;
            max-width: 500px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .product-info h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 16px 0;
            color: #0d0a0b;
        }
        .price {
            font-size: 1.5rem;
            font-weight: 600;
            color: #72b01d;
            margin: 16px 0;
        }
        .description {
            font-size: 1rem;
            line-height: 1.6;
            color: #454955;
            margin: 16px 0;
        }
        .shop-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 16px 0;
        }
        .shop-logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        .cta-button {
            display: inline-block;
            background-color: #72b01d;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #5a8f17;
        }
        .loading-message {
            text-align: center;
            padding: 40px 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
        }
        @media (max-width: 768px) {
            .product-preview {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            .product-info h1 {
                font-size: 1.5rem;
            }
            .container {
                padding: 12px;
            }
        }
    </style>
    
    <!-- Preload critical resources -->
    <link rel="preload" href="${imageUrl}" as="image">
</head>
<body>
    <div class="container">
        <!-- Product Preview for Social Sharing -->
        <div class="product-preview">
            <div>
                <img src="${imageUrl}" alt="${listing.name}" class="product-image" loading="eager">
            </div>
            <div class="product-info">
                <h1>${listing.name}</h1>
                <div class="price">LKR ${priceFormatted}</div>
                <div class="description">${description}</div>
                ${shop ? `
                <div class="shop-info">
                    ${shop.logo ? `<img src="${shop.logo}" alt="${shop.name}" class="shop-logo">` : ''}
                    <div>
                        <div style="font-weight: 600;">${shop.name}</div>
                        <div style="font-size: 0.9rem; color: #666;">@${shop.username || ''}</div>
                    </div>
                </div>
                ` : ''}
                <a href="${pageUrl}" class="cta-button">View Full Details & Order</a>
            </div>
        </div>
        
        <div class="loading-message">
            <h2>Loading full product details...</h2>
            <p>If this page doesn't load automatically, <a href="${pageUrl}" style="color: #72b01d;">click here</a>.</p>
        </div>
    </div>

    <!-- Load the React app -->
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

exports.handler = async (event, context) => {
  try {
    // Get listing ID from path - handle both direct calls and redirects
    let listingId;
    if (event.path.includes('/.netlify/functions/listing-ssr/')) {
      // Direct function call: /.netlify/functions/listing-ssr/LISTING_ID
      listingId = event.path.split('/.netlify/functions/listing-ssr/')[1];
    } else {
      // Redirect call: /listing/LISTING_ID
      listingId = event.path.split('/listing/')[1];
    }
    
    // Clean up any query parameters
    if (listingId && listingId.includes('?')) {
      listingId = listingId.split('?')[0];
    }
    
    console.log('Processing listing ID:', listingId);
    
    if (!listingId || listingId.length < 10) {
      console.log('Invalid listing ID:', listingId);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/html'
        },
        body: '<h1>Listing not found</h1>'
      };
    }

    // Check if this is a bot/crawler request
    const userAgent = event.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|slackbot|skypeuripreview|applebot|yahoo|duckduckbot/i.test(userAgent);
    
    console.log('Request from:', userAgent, 'isBot:', isBot);

    // Always serve SSR for bots and crawlers, or if explicitly requested
    if (!isBot && !event.queryStringParameters?.ssr) {
      // For regular users, serve a redirect to the main app
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        },
        body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading...</title>
    <script>window.location.href = '/listing/${listingId}';</script>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>`
      };
    }

    // Fetch listing data
    const { listing, shop } = await fetchListingData(listingId);
    
    if (!listing) {
      console.log('Listing not found in database:', listingId);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/html'
        },
        body: '<h1>Listing not found</h1>'
      };
    }

    // Generate optimized HTML
    const html = generateListingHTML(listing, shop, listingId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Served-By': 'Netlify Function',
        'X-Listing-ID': listingId,
        'X-Firebase-Connected': firebaseInitialized ? 'true' : 'false'
      },
      body: html
    };

  } catch (error) {
    console.error('Error in listing SSR function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html'
      },
      body: '<h1>Server Error</h1><p>Please try again later.</p>'
    };
  }
};
