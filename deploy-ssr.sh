#!/bin/bash

echo "🚀 Deploying SSR with Edge Function Routing"
echo "==========================================="
echo ""

echo "📝 Changes being deployed:"
echo "- Edge Function: netlify/edge-functions/listing-router.ts"
echo "- Updated netlify.toml with Edge Function configuration"
echo "- Simplified _redirects file"
echo "- SSR Function: netlify/functions/listing-ssr.js"
echo ""

echo "🔧 Building and deploying..."
npm run build

echo ""
echo "📤 Deploying to Netlify..."
echo "Note: Make sure you have FIREBASE_SERVICE_ACCOUNT set in Netlify env vars"
echo ""

# You can replace this with your preferred deployment method
echo "Deploy command: netlify deploy --prod --build"
echo "Or use your CI/CD pipeline"
echo ""

echo "✅ After deployment, test with:"
echo "   curl -H 'User-Agent: facebookexternalhit/1.1' 'https://stage.sina.lk/listing/1JSheePhxorsRxDQQ6c8'"
echo ""
echo "🔍 Check the response headers for:"
echo "   X-Edge-Function: listing-router"
echo "   X-Bot-Detected: true"
echo ""
echo "📱 Then test Facebook sharing at:"
echo "   https://developers.facebook.com/tools/debug/"
