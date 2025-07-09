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
    echo "⚠️  Warning: FIREBASE_SERVICE_ACCOUNT environment variable not set locally."
    echo "   Make sure to set this in your Netlify dashboard under Site settings > Environment variables"
    echo "   The value should be your Firebase service account JSON as a string."
    echo ""
fi

# Install dependencies in functions directory
echo "📦 Installing function dependencies..."
cd netlify/functions
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
cd ../..

# Build the project
echo "🔧 Building project..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
if command -v netlify &> /dev/null; then
    if netlify deploy --prod; then
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "� Testing your deployment:"
        echo "Replace YOUR_SITE_URL with your actual Netlify URL"
        echo ""
        echo "1. Test basic function:"
        echo "   curl https://YOUR_SITE_URL/.netlify/functions/test"
        echo ""
        echo "2. Test listing meta (replace LISTING_ID):"
        echo "   curl \"https://YOUR_SITE_URL/.netlify/functions/listing-meta?listingId=LISTING_ID\""
        echo ""
        echo "3. Test bot detection (replace LISTING_ID):"
        echo "   curl -H \"User-Agent: facebookexternalhit/1.1\" \"https://YOUR_SITE_URL/listing/LISTING_ID\""
        echo ""
        echo "� Important Configuration:"
        echo "1. Set FIREBASE_SERVICE_ACCOUNT in Netlify dashboard"
        echo "2. Update baseUrl in functions to your actual domain"
        echo "3. Test with Facebook Debugger: https://developers.facebook.com/tools/debug/"
        echo ""
        echo "📖 For troubleshooting, see: TROUBLESHOOTING.md"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Netlify CLI not found. Please install it:"
    echo "   npm install -g netlify-cli"
    echo "   Then run: netlify login && netlify link"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your social media meta functions are now deployed."
echo "   Social media platforms will now show rich previews when your listings are shared."
