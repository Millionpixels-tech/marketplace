# Social Media Meta Functions

This directory contains Netlify Functions that provide rich social media previews for your marketplace listings and shops.

## Functions

### 1. `listing-meta.js`
Generates rich meta tags for listing pages when shared on social media platforms.

**URL**: `/.netlify/functions/listing-meta?listingId={listingId}`

**Features**:
- Open Graph meta tags for Facebook, LinkedIn, WhatsApp
- Twitter Card meta tags
- Schema.org structured data
- Automatic redirect to actual listing page
- Error handling with fallback pages

### 2. `shop-meta.js`
Generates rich meta tags for shop pages when shared on social media platforms.

**URL**: `/.netlify/functions/shop-meta?shopUsername={shopUsername}`

**Features**:
- Open Graph meta tags for shops
- Store information with listing count
- Location information
- Automatic redirect to actual shop page

### 3. `test.js`
Simple test function to verify Netlify Functions are working.

**URL**: `/.netlify/functions/test`

## Setup

### 1. Environment Variables
Add the following environment variable to your Netlify dashboard:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

This should contain your Firebase service account JSON as a string.

### 2. User Agent Detection
The system automatically detects social media bots based on User-Agent strings:
- Facebook External Hit
- Twitter Bot
- WhatsApp
- Telegram
- Discord Bot
- LinkedIn Bot
- Pinterest Bot
- And many more...

### 3. Redirects Configuration
The redirects are configured in both:
- `netlify.toml` (preferred)
- `public/_redirects` (fallback)

## How It Works

1. When a social media bot visits a listing URL (e.g., `/listing/abc123`)
2. Netlify redirects the bot to the meta function
3. The function fetches listing data from Firestore
4. Returns HTML with rich meta tags for the bot to scrape
5. Human users are immediately redirected to the React app

## Testing

### Test Basic Function
```bash
curl https://yourdomain.com/.netlify/functions/test
```

### Test Listing Meta (simulate bot)
```bash
curl -H "User-Agent: facebookexternalhit/1.1" https://yourdomain.com/listing/YOUR_LISTING_ID
```

### Test Shop Meta (simulate bot)
```bash
curl -H "User-Agent: Twitterbot/1.0" https://yourdomain.com/shop/YOUR_SHOP_USERNAME
```

### Test with Browser (should redirect)
Visit any listing or shop URL normally - you should be redirected to the React app.

## Debugging

### Check Function Logs
1. Go to Netlify Dashboard > Functions
2. Click on the function name
3. View the logs tab

### Common Issues
1. **Firebase connection**: Ensure `FIREBASE_SERVICE_ACCOUNT` is properly set
2. **Bot detection**: Test with proper User-Agent headers
3. **Redirects**: Check that redirects are working in Netlify dashboard

### Debug URLs
- View function output directly: `/.netlify/functions/listing-meta?listingId=YOUR_ID`
- Check what user agent is detected: `/.netlify/functions/test`

## Performance

- Functions are cached for 5 minutes (300 seconds)
- CDN cache for 10 minutes (600 seconds)
- Meta pages are marked as `noindex` to prevent search engine indexing
- Automatic redirects happen within 50ms for human users

## Security

- All user inputs are HTML escaped to prevent XSS
- Functions only return data for valid Firebase documents
- Error pages don't expose sensitive information
- Rate limiting is handled by Netlify automatically

## Domain Configuration

Remember to update the `baseUrl` variable in both functions:
```javascript
const baseUrl = "https://yourdomain.com"; // Change this to your actual domain
```
