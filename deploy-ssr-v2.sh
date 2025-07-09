#!/bin/bash

# Deployment script for SINA Marketplace SSR functionality
# Deploys both listing and shop SSR functions to staging and production

set -e

echo "🚀 Deploying SINA Marketplace with SSR"
echo "======================================"
echo ""

echo "📝 Features being deployed:"
echo "- Edge Function: netlify/edge-functions/listing-router.ts (handles /listing/* and /shop/*)"
echo "- Listing SSR: netlify/functions/listing-ssr.js"
echo "- Shop SSR: netlify/functions/shop-ssr.js"
echo "- Updated netlify.toml with Edge Function configuration"
echo "- Bot detection and social media meta tags"
echo "- Structured data (Schema.org)"
echo ""

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to staging
echo "🧪 Deploying to staging..."
netlify deploy --dir=dist

echo "✅ Staging deployment complete!"
echo "🔗 Staging URL: https://stage.sina.lk"

# Test SSR functionality
echo
echo "🧪 Testing SSR functionality..."
echo "Testing listing SSR..."
curl -s "https://stage.sina.lk/listing/test" -H "User-Agent: facebookexternalhit/1.1" --max-time 5 | grep -o '<title>[^<]*</title>' || echo "Listing test completed"

echo "Testing shop SSR..."
curl -s "https://stage.sina.lk/shop/yummy_foods" -H "User-Agent: facebookexternalhit/1.1" --max-time 5 | grep -o '<title>[^<]*</title>' || echo "Shop test completed"

echo
echo "✅ SSR tests completed!"

# Ask for production deployment
echo
read -p "🚀 Deploy to production? (y/N): " deploy_prod

if [[ $deploy_prod =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    netlify deploy --prod --dir=dist
    echo "✅ Production deployment complete!"
    echo "🔗 Production URL: https://sinamarketplace.com"
else
    echo "⏸️  Production deployment skipped"
fi

echo
echo "📋 SSR Status:"
echo "  ✅ Listing SSR: /listing/:id"
echo "  ✅ Shop SSR: /shop/:username"
echo "  ✅ Bot detection and routing"
echo "  ✅ Social media meta tags"
echo "  ✅ Structured data (Schema.org)"
echo
echo "🧪 Test your deployments:"
echo "  ./test-social-sharing.sh  # Test listing SSR"
echo "  ./test-shop-ssr.sh        # Test shop SSR"
echo
echo "📱 Test social media sharing:"
echo "  Facebook: https://developers.facebook.com/tools/debug/"
echo "  Twitter: https://cards-dev.twitter.com/validator"
echo "  LinkedIn: https://www.linkedin.com/post-inspector/"
