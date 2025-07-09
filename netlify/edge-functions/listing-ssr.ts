import type { Context } from "https://edge.netlify.com/";

// Firebase Admin configuration
interface FirebaseConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface ListingData {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  shopId: string;
  createdAt: any;
}

interface ShopData {
  name: string;
  username: string;
  logo?: string;
}

// Initialize Firebase Admin SDK with service account
async function initializeFirebaseAdmin() {
  try {
    const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}") as FirebaseConfig;
    
    if (!serviceAccount.project_id) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not properly configured");
    }

    // Create a JWT token for Firebase Authentication
    const header = {
      alg: "RS256",
      typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now,
      exp: now + 3600,
      uid: "server-admin",
      claims: {
        admin: true
      }
    };

    // For this edge function, we'll use the Firestore REST API directly
    // instead of the Admin SDK to avoid bundle size issues
    return {
      projectId: serviceAccount.project_id,
      privateKey: serviceAccount.private_key,
      clientEmail: serviceAccount.client_email
    };
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

// Function to create a simple JWT for Firestore access
async function createAccessToken(privateKey: string, clientEmail: string) {
  try {
    // Import the private key
    const pemKey = privateKey.replace(/\\n/g, '\n');
    const keyData = pemKey.replace(/-----BEGIN PRIVATE KEY-----|\s|-----END PRIVATE KEY-----/g, '');
    
    // Create JWT header and payload
    const header = {
      alg: "RS256",
      typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/datastore"
    };

    // Base64 encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // For edge functions, we'll use a simpler approach
    // We'll make direct REST API calls to Firestore with API key authentication
    return null; // We'll use the public Firestore REST API instead
  } catch (error) {
    console.error("Error creating access token:", error);
    return null;
  }
}

// Fetch listing data from Firestore using REST API
async function fetchListingData(listingId: string, projectId: string): Promise<{ listing: ListingData | null, shop: ShopData | null }> {
  try {
    // Use Firestore REST API (public endpoint)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/listings/${listingId}`;
    
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch listing: ${response.status} ${response.statusText}`);
      return { listing: null, shop: null };
    }

    const docData = await response.json();
    
    if (!docData.fields) {
      return { listing: null, shop: null };
    }

    // Convert Firestore document format to our format
    const listing: ListingData = {
      id: listingId,
      name: docData.fields.name?.stringValue || "",
      description: docData.fields.description?.stringValue || "",
      price: parseInt(docData.fields.price?.integerValue || docData.fields.price?.doubleValue || "0"),
      images: docData.fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      category: docData.fields.category?.stringValue || "",
      subcategory: docData.fields.subcategory?.stringValue || "",
      shopId: docData.fields.shopId?.stringValue || docData.fields.shop?.stringValue || "",
      createdAt: docData.fields.createdAt
    };

    // Fetch shop data if shopId is available
    let shop: ShopData | null = null;
    if (listing.shopId) {
      try {
        const shopUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shops/${listing.shopId}`;
        const shopResponse = await fetch(shopUrl);
        
        if (shopResponse.ok) {
          const shopDocData = await shopResponse.json();
          if (shopDocData.fields) {
            shop = {
              name: shopDocData.fields.name?.stringValue || "",
              username: shopDocData.fields.username?.stringValue || "",
              logo: shopDocData.fields.logo?.stringValue || undefined
            };
          }
        }
      } catch (error) {
        console.error("Error fetching shop data:", error);
      }
    }

    return { listing, shop };
  } catch (error) {
    console.error("Error fetching listing data:", error);
    return { listing: null, shop: null };
  }
}

// Generate optimized HTML for listing page
function generateListingHTML(listing: ListingData, shop: ShopData | null, listingId: string): string {
  const siteName = "Sina.lk";
  const siteUrl = "https://sina.lk"; // Update with your actual domain
  
  const title = `${listing.name} - Buy Authentic Sri Lankan Products | ${siteName}`;
  const description = listing.description.length > 160 
    ? listing.description.substring(0, 157) + '...' 
    : listing.description;
  
  const imageUrl = listing.images.length > 0 ? listing.images[0] : `${siteUrl}/default-product.jpg`;
  const pageUrl = `${siteUrl}/listing/${listingId}`;
  
  const priceFormatted = listing.price.toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${listing.name}, ${listing.category}, ${listing.subcategory || ''}, Sri Lankan products, authentic, handmade, artisan">
    
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
    <meta property="product:price:amount" content="${listing.price}">
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
    
    <!-- LinkedIn -->
    <meta property="og:locale" content="en_US">
    
    <!-- Structured Data for Search Engines -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${listing.name}",
      "description": "${description}",
      "image": [
        ${listing.images.map(img => `"${img}"`).join(',')}
      ],
      "offers": {
        "@type": "Offer",
        "url": "${pageUrl}",
        "priceCurrency": "LKR",
        "price": "${listing.price}",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "${shop?.name || 'Sri Lankan Marketplace'}"
        }
      },
      "brand": {
        "@type": "Brand",
        "name": "${shop?.name || 'Sri Lankan Artisan'}"
      },
      "category": "${listing.category}",
      "sku": "${listingId}",
      "url": "${pageUrl}"
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
          "name": "${listing.category}",
          "item": "${siteUrl}/search?cat=${encodeURIComponent(listing.category)}"
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
    
    <!-- Loading optimization -->
    <meta http-equiv="X-DNS-Prefetch-Control" content="on">
    <link rel="dns-prefetch" href="//firebasestorage.googleapis.com">
    
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
                        <div style="font-size: 0.9rem; color: #666;">@${shop.username}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="loading-message">
            <h2>Loading full product details...</h2>
            <p>If this page doesn't load automatically, <a href="${pageUrl}" style="color: #72b01d;">click here</a>.</p>
        </div>
    </div>

    <!-- Redirect to client-side app after a brief moment for crawlers -->
    <script>
        // Allow enough time for crawlers to read the content
        setTimeout(function() {
            // Only redirect if this is not a crawler/bot
            const userAgent = navigator.userAgent.toLowerCase();
            const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot/i.test(userAgent);
            
            if (!isBot) {
                // Load the full React application
                window.location.reload();
            }
        }, 1000);
        
        // Immediate redirect for human users (not bots)
        if (document.readyState === 'complete') {
            const userAgent = navigator.userAgent.toLowerCase();
            const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot/i.test(userAgent);
            
            if (!isBot && window.performance && window.performance.navigation.type === 0) {
                // This is a direct navigation, load the React app
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        }
    </script>
    
    <!-- Load React app for non-bot users -->
    <script>
        // This will be replaced by the actual Vite build scripts
        // The actual React app will handle the full functionality
    </script>
</body>
</html>`;
}

export default async function handler(request: Request, context: Context) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const listingId = pathParts[pathParts.length - 1];
    
    // Check if this is a valid listing ID format
    if (!listingId || listingId.length < 10) {
      // Return a 404-like response, let the main app handle it
      return new Response(null, {
        status: 404,
        headers: {
          'Location': url.pathname
        }
      });
    }

    // Check if this is a bot/crawler request
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|slackbot|skypeuripreview|applebot|yahoo|duckduckbot/i.test(userAgent);
    
    // Always serve SSR for bots, or if specifically requested
    const shouldServeSSR = isBot || url.searchParams.get('ssr') === 'true';
    
    if (!shouldServeSSR) {
      // For regular users, let the SPA handle it
      return context.next();
    }

    // Initialize Firebase and fetch listing data
    const firebaseConfig = await initializeFirebaseAdmin();
    const { listing, shop } = await fetchListingData(listingId, firebaseConfig.projectId);
    
    if (!listing) {
      // Listing not found, let the main app handle 404
      return context.next();
    }

    // Generate optimized HTML
    const html = generateListingHTML(listing, shop, listingId);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5-10 minutes
        'X-Served-By': 'Netlify Edge Function',
        'X-Listing-ID': listingId
      }
    });

  } catch (error) {
    console.error('Error in listing SSR function:', error);
    
    // On error, fall back to the regular SPA
    return context.next();
  }
}
