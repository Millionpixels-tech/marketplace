const LISTING_URL_PATTERN = /^\/listing\/([a-zA-Z0-9_-]+)$/;
const SHOP_URL_PATTERN = /^\/shop\/([a-zA-Z0-9_.-]+)$/;

interface ListingData {
  name: string;
  description: string;
  price: number;
  images?: string[];
  category?: string;
  shopId?: string;
}

interface ShopData {
  name: string;
  description: string;
  logo?: string;
  cover?: string;
  username: string;
}

// Get Firebase project configuration from environment
function getFirebaseConfig() {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable not found");
  }
  
  const serviceAccount = JSON.parse(serviceAccountStr);
  return {
    projectId: serviceAccount.project_id,
    serviceAccount
  };
}

// Create access token for Firebase REST API
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Create JWT payload
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  // Create JWT header
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign the token using Web Crypto API
  const privateKey = serviceAccount.private_key;
  const keyData = privateKey.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Fetch listing data from Firestore REST API
async function fetchListingData(listingId: string): Promise<ListingData | null> {
  try {
    const { projectId, serviceAccount } = getFirebaseConfig();
    const accessToken = await getAccessToken(serviceAccount);
    
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/listings/${listingId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch listing: ${response.status}`);
      return null;
    }

    const doc = await response.json();
    
    if (!doc.fields) {
      return null;
    }

    return {
      name: doc.fields.name?.stringValue || 'Sri Lankan Product',
      description: doc.fields.description?.stringValue || 'Authentic Sri Lankan product from our marketplace',
      price: parseInt(doc.fields.price?.integerValue || doc.fields.price?.doubleValue || '0'),
      images: doc.fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      category: doc.fields.category?.stringValue,
      shopId: doc.fields.shopId?.stringValue
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
}

// Fetch shop data from Firestore REST API
async function fetchShopData(username: string): Promise<ShopData | null> {
  try {
    const { projectId, serviceAccount } = getFirebaseConfig();
    const accessToken = await getAccessToken(serviceAccount);
    
    // Use Firestore REST API to query by username
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'shops' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'username' },
            op: 'EQUAL',
            value: { stringValue: username }
          }
        },
        limit: 1
      }
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch shop: ${response.status}`);
      return null;
    }

    const result = await response.json();
    
    if (!result || !result[0]?.document?.fields) {
      return null;
    }

    const doc = result[0].document;

    return {
      name: doc.fields.name?.stringValue || 'Sri Lankan Shop',
      description: doc.fields.description?.stringValue || 'Authentic Sri Lankan products and crafts',
      logo: doc.fields.logo?.stringValue,
      cover: doc.fields.cover?.stringValue,
      username: doc.fields.username?.stringValue || username
    };
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

// Generate HTML with dynamic meta tags
function generateHTML(
  type: 'listing' | 'shop',
  data: ListingData | ShopData,
  originalUrl: string
): string {
  let title = '';
  let description = '';
  let image = '';
  let price = '';

  if (type === 'listing') {
    const listing = data as ListingData;
    title = `${listing.name} - Buy Authentic Sri Lankan Products | Sina.lk`;
    description = listing.description.length > 160 
      ? listing.description.substring(0, 157) + '...' 
      : listing.description;
    image = listing.images?.[0] || 'https://sina.lk/logo.svg';
    price = listing.price > 0 ? `LKR ${listing.price.toLocaleString()}` : '';
  } else {
    const shop = data as ShopData;
    title = `${shop.name} - Sri Lankan Shop | Sina.lk`;
    description = shop.description.length > 160 
      ? shop.description.substring(0, 157) + '...' 
      : shop.description;
    image = shop.cover || shop.logo || 'https://sina.lk/logo.svg';
  }

  const priceTag = price ? `<meta property="product:price:amount" content="${price.replace('LKR ', '').replace(/,/g, '')}" />
    <meta property="product:price:currency" content="LKR" />` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-YNBS2T66R8"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-YNBS2T66R8');
    </script>
    
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/logo.svg" />
    <link rel="mask-icon" href="/logo.svg" color="#72b01d" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#72b01d" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Sina.lk" />
    
    <!-- Preconnect to external domains for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://firebaseapp.com">
    
    <!-- Dynamic title and description -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="${type === 'listing' ? 'product' : 'website'}" />
    <meta property="og:site_name" content="Sina.lk" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${type === 'listing' ? (data as ListingData).name : (data as ShopData).name}" />
    <meta property="og:url" content="https://sina.lk${originalUrl}" />
    ${priceTag}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@SinaLK" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    
    <!-- Additional product-specific meta tags for listings -->
    ${type === 'listing' ? `
    <meta property="product:brand" content="Sri Lankan Marketplace" />
    <meta property="product:availability" content="in stock" />
    <meta property="product:condition" content="new" />
    ${(data as ListingData).category ? `<meta property="product:category" content="${(data as ListingData).category}" />` : ''}
    ` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if this is a social media crawler or preview request
  const isSocialCrawler = /facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegram|discord|skype/i.test(userAgent);
  
  // Also handle preview requests from social platforms
  const isPreviewRequest = /preview|crawler|bot|spider/i.test(userAgent) || 
                          request.headers.get('purpose') === 'prefetch' ||
                          url.searchParams.has('_preview');

  // Only process if it's a social crawler or preview request
  if (!isSocialCrawler && !isPreviewRequest) {
    return new Response(null, { status: 200 });
  }

  const pathname = url.pathname;
  
  // Check if this is a listing page
  const listingMatch = pathname.match(LISTING_URL_PATTERN);
  if (listingMatch) {
    const listingId = listingMatch[1];
    
    try {
      const listingData = await fetchListingData(listingId);
      
      if (listingData) {
        const html = generateHTML('listing', listingData, pathname);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        });
      }
    } catch (error) {
      console.error('Error processing listing page:', error);
    }
  }
  
  // Check if this is a shop page
  const shopMatch = pathname.match(SHOP_URL_PATTERN);
  if (shopMatch) {
    const username = shopMatch[1];
    
    try {
      const shopData = await fetchShopData(username);
      
      if (shopData) {
        const html = generateHTML('shop', shopData, pathname);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        });
      }
    } catch (error) {
      console.error('Error processing shop page:', error);
    }
  }
  
  // For all other requests or if data fetching fails, return the default response
  return new Response(null, { status: 200 });
}

export const config = {
  path: ["/listing/*", "/shop/*"]
};
