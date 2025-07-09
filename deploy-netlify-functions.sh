#!/bin/bash

# Deploy script for Netlify Functions
# This script helps you deploy the social media meta functions

echo "🚀 Deploying Netlify Functions for Social Media Meta Tags"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if Firebase service account is configured
if [ -z "$FIREBASE_SERVICE_ACCOUNT" ]; then
    echo "⚠️  Warning: FIREBASE_SERVICE_ACCOUNT environment variable not set."
    echo "   Please set this in your Netlify dashboard under Site settings > Environment variables"
    echo "   The value should be your Firebase service account JSON as a string."
    echo ""
fi

# Install dependencies in functions directory
echo "📦 Installing function dependencies..."
cd netlify/functions
npm install
cd ../..

# Build the project
echo "🔧 Building project..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
if command -v netlify &> /dev/null; then
    netlify deploy --prod
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📝 Testing instructions:"
    echo "1. Test basic function: curl https://yourdomain.com/.netlify/functions/test"
    echo "2. Test listing meta: curl -H 'User-Agent: facebookexternalhit/1.1' https://yourdomain.com/listing/YOUR_LISTING_ID"
    echo "3. Test shop meta: curl -H 'User-Agent: Twitterbot/1.0' https://yourdomain.com/shop/YOUR_SHOP_USERNAME"
    echo ""
    echo "🔍 Debug URLs:"
    echo "- View function output: /.netlify/functions/listing-meta?listingId=YOUR_ID"
    echo "- Check user agent detection: /.netlify/functions/test"
else
    echo "❌ Netlify CLI not found. Please install it:"
    echo "   npm install -g netlify-cli"
    echo "   Then run: netlify login && netlify link"
fi

echo ""
echo "🎉 Setup complete! Your social media meta functions are now deployed."
echo "   Social media platforms will now show rich previews when your listings are shared."
