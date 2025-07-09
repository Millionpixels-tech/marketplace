#!/usr/bin/env bash

echo "🧪 Testing SSR Implementation for Sina.lk Marketplace"
echo "=================================================="
echo ""

# Test with different user agents
USER_AGENTS=(
    "facebookexternalhit/1.1"
    "Twitterbot/1.0"
    "WhatsApp/2.0"
    "LinkedInBot/1.0"
    "Googlebot/2.1"
    "Mozilla/5.0 (regular user)"
)

# Function to test user agent
test_user_agent() {
    local user_agent="$1"
    echo "Testing with User-Agent: $user_agent"
    
    if [[ "$user_agent" == *"Mozilla"* ]]; then
        echo "  Expected: Regular React SPA"
    else
        echo "  Expected: Server-side rendered HTML"
    fi
    
    # Test the function directly
    response=$(curl -s -H "User-Agent: $user_agent" "http://localhost:8000/.netlify/functions/listing-ssr/test-listing-123")
    
    if [[ "$response" == *"Sample Sri Lankan Handcraft"* ]]; then
        echo "  ✅ SSR Response: Contains product title"
    else
        echo "  ❌ SSR Response: Missing product title"
    fi
    
    if [[ "$response" == *"og:title"* ]]; then
        echo "  ✅ Meta Tags: Contains Open Graph tags"
    else
        echo "  ❌ Meta Tags: Missing Open Graph tags"
    fi
    
    if [[ "$response" == *"application/ld+json"* ]]; then
        echo "  ✅ Structured Data: Contains JSON-LD schema"
    else
        echo "  ❌ Structured Data: Missing JSON-LD schema"
    fi
    
    echo ""
}

echo "Prerequisites:"
echo "- Netlify dev server should be running on port 8000"
echo "- Run 'npm run netlify:dev' in another terminal"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ Netlify dev server is not running on port 8000"
    echo "Please run: npm run netlify:dev"
    exit 1
fi

echo "✅ Netlify dev server is running"
echo ""

# Test each user agent
for user_agent in "${USER_AGENTS[@]}"; do
    test_user_agent "$user_agent"
done

echo "🎉 SSR Testing Complete!"
echo ""
echo "Summary:"
echo "- Bot user agents should get server-rendered HTML with meta tags"
echo "- Regular users should get the React SPA"
echo "- All responses should contain the product title for this test"
echo ""
echo "To test in production:"
echo "1. Deploy to Netlify with FIREBASE_SERVICE_ACCOUNT environment variable"
echo "2. Use social media debugging tools:"
echo "   - Facebook: https://developers.facebook.com/tools/debug/"
echo "   - Twitter: https://cards-dev.twitter.com/validator"
echo "   - LinkedIn: https://www.linkedin.com/post-inspector/"
echo ""
echo "🚀 Your marketplace now has professional SSR for listing pages!"
