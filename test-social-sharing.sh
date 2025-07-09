#!/bin/bash

# Test script for social media sharing SSR
LISTING_URL="https://stage.sina.lk/listing/16no6vTN2kXKAqgvkCba"
FUNCTION_URL="https://stage.sina.lk/.netlify/functions/listing-ssr/16no6vTN2kXKAqgvkCba"

echo "🧪 Testing SSR for Social Media Sharing"
echo "======================================="
echo ""

echo "📱 Testing Facebook Bot (should get SSR):"
echo "curl -H 'User-Agent: facebookexternalhit/1.1' '$LISTING_URL'"
curl -s -H "User-Agent: facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" "$LISTING_URL" | grep -E "(og:|twitter:|title)" | head -10
echo ""
echo ""

echo "🤖 Testing Google Bot (should get SSR):"
echo "curl -H 'User-Agent: Googlebot/2.1' '$LISTING_URL'"
curl -s -H "User-Agent: Googlebot/2.1 (+http://www.google.com/bot.html)" "$LISTING_URL" | grep -E "(og:|twitter:|title)" | head -10
echo ""
echo ""

echo "👤 Testing Regular User (should get SPA):"
echo "curl -H 'User-Agent: Mozilla/5.0 (Chrome)' '$LISTING_URL'"
curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "$LISTING_URL" | grep -E "(title)" | head -3
echo ""
echo ""

echo "🔧 Testing Function Directly:"
echo "curl -H 'User-Agent: facebookexternalhit/1.1' '$FUNCTION_URL'"
curl -s -H "User-Agent: facebookexternalhit/1.1" "$FUNCTION_URL" | grep -E "(og:title|og:description|og:image)" | head -5
echo ""
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. Deploy the updated public/_redirects to staging"
echo "2. Test again to see if redirects work (should work better with _redirects file)"
echo "3. Set FIREBASE_SERVICE_ACCOUNT environment variable on Netlify"
echo "4. Clear Facebook's cache at: https://developers.facebook.com/tools/debug/"
echo "5. Test sharing the listing URL on Facebook"
echo ""
echo "💡 Changes made:"
echo "   - Added SSR redirects to public/_redirects (more reliable than netlify.toml)"
echo "   - Covers all major bots: Facebook, Google, Twitter, LinkedIn, WhatsApp, etc."
echo ""
echo "🔗 URLs to test:"
echo "   Listing: $LISTING_URL"
echo "   Function: $FUNCTION_URL"
