#!/bin/bash

# Email Functions Deployment Script
# This script builds and deploys the Firebase Functions for email sending

echo "🚀 Deploying Email Functions..."

# Build functions
echo "📦 Building functions..."
cd functions
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Functions build failed!"
    exit 1
fi

echo "✅ Functions built successfully"

# Deploy functions
echo "🌐 Deploying to Firebase..."
cd ..
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
    echo ""
    echo "📧 Email functions are now live:"
    echo "• sendEmail - Sends order confirmation emails"
    echo "• generatePaymentHash - Generates PayHere payment hashes"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Configure SMTP settings using: firebase functions:config:set"
    echo "2. Test email sending functionality"
    echo "3. Monitor function logs: firebase functions:log"
else
    echo "❌ Deployment failed!"
    exit 1
fi
