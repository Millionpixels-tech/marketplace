# Troubleshooting Guide: Social Media Preview Functions

## Current Issue
The `firebase-admin` module is not being found, which prevents the functions from accessing Firestore data.

## Steps to Fix

### 1. Deploy the Updated Functions
```bash
# Install dependencies
cd netlify/functions
npm install

# Go back to project root
cd ../..

# Deploy to Netlify
netlify deploy --prod
```

### 2. Set Environment Variable
In your Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add: `FIREBASE_SERVICE_ACCOUNT`
3. Value: Your complete Firebase service account JSON (as a single line string)

### 3. Test the Functions

#### Test Basic Function (should work immediately):
```bash
curl https://your-staging-url.netlify.app/.netlify/functions/test
```

This should return JSON with function status and Firebase availability.

#### Test Listing Meta Function Directly:
```bash
curl "https://your-staging-url.netlify.app/.netlify/functions/listing-meta?listingId=YOUR_ACTUAL_LISTING_ID"
```

#### Test with Social Media Bot User-Agent:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" "https://your-staging-url.netlify.app/listing/YOUR_ACTUAL_LISTING_ID"
```

### 4. Debugging Steps

#### Check Function Logs:
1. Go to Netlify dashboard
2. Functions tab
3. Click on the function name
4. View logs

#### Test Environment Variable:
```bash
curl https://your-staging-url.netlify.app/.netlify/functions/test
```

Look for the `firebaseStatus` field in the response.

#### Test Edge Function:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" -v "https://your-staging-url.netlify.app/listing/test123"
```

Check if it redirects to the function.

### 5. Expected Behavior

#### For Human Users:
- Visiting `/listing/abc123` should load your React app normally
- No redirects should happen

#### For Social Media Bots:
- Visiting `/listing/abc123` should redirect to the meta function
- Function should return HTML with Open Graph tags
- Bot should scrape the meta data

### 6. Common Issues and Solutions

#### Issue: "Cannot find module 'firebase-admin'"
**Solution**: Ensure dependencies are installed in the functions directory:
```bash
cd netlify/functions
npm install
```

#### Issue: "FIREBASE_SERVICE_ACCOUNT not found"
**Solution**: Set the environment variable in Netlify dashboard with your complete service account JSON.

#### Issue: "Redirects not working"
**Solution**: The edge function approach is more reliable than redirect rules. Make sure edge functions are deployed.

#### Issue: "Function works but redirects don't"
**Solution**: Test with specific User-Agent headers:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" your-url
```

### 7. Testing Social Media Platforms

#### Facebook:
1. Go to https://developers.facebook.com/tools/debug/
2. Enter your listing URL
3. Check if it shows the correct meta data

#### Twitter:
1. Go to https://cards-dev.twitter.com/validator
2. Enter your listing URL
3. Check the preview

#### WhatsApp:
1. Send the listing URL to yourself in WhatsApp
2. Check if it shows the preview

### 8. Debugging Output

The test function will show you:
- If Netlify Functions are working
- If firebase-admin module is available
- If environment variables are set
- Current User-Agent detection

### 9. Next Steps

1. Deploy the updated functions
2. Set the Firebase environment variable
3. Test the `/test` function first
4. Test with actual listing IDs
5. Test with social media bot user agents
6. Finally test with actual social media platforms

### 10. Alternative Fallback

If Firebase continues to have issues, we can create a static version that uses hardcoded data or fetches from your API instead of directly from Firestore.

## Quick Test Commands

Replace `YOUR_SITE_URL` and `YOUR_LISTING_ID` with actual values:

```bash
# Test function availability
curl https://YOUR_SITE_URL/.netlify/functions/test

# Test listing function directly
curl "https://YOUR_SITE_URL/.netlify/functions/listing-meta?listingId=YOUR_LISTING_ID"

# Test bot redirect
curl -H "User-Agent: facebookexternalhit/1.1" "https://YOUR_SITE_URL/listing/YOUR_LISTING_ID"

# Test human user (should get React app)
curl "https://YOUR_SITE_URL/listing/YOUR_LISTING_ID"
```
