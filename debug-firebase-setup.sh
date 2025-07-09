#!/bin/bash

echo "🔍 Firebase Connection Troubleshooting"
echo "======================================"
echo ""

echo "1. Testing current SSR function Firebase connection:"
RESPONSE=$(curl -s -H "User-Agent: facebookexternalhit/1.1" "https://stage.sina.lk/.netlify/functions/listing-ssr/3i3E33w4bwYNrsjYdesx")
echo "   Firebase Connected: $(echo "$RESPONSE" | grep -o 'x-firebase-connected: [^"]*' || echo 'Header not found')"
echo ""

echo "2. Deploy the debug function to check Firebase setup:"
echo "   - Deploy netlify/functions/debug-firebase.js"
echo "   - Test: curl https://stage.sina.lk/.netlify/functions/debug-firebase"
echo ""

echo "3. Common Firebase Service Account Issues:"
echo "   ❌ Private key newlines: Check if \\n are actual newlines"
echo "   ❌ JSON truncation: Large JSON might be cut off"
echo "   ❌ Invalid JSON: Missing quotes, brackets, or commas"
echo "   ❌ Wrong variable name: Should be exactly 'FIREBASE_SERVICE_ACCOUNT'"
echo ""

echo "4. Expected Service Account JSON format:"
echo '{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "...@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}'
echo ""

echo "5. Test real listing data once Firebase is connected:"
echo "   curl -H 'User-Agent: facebookexternalhit/1.1' 'https://stage.sina.lk/listing/3i3E33w4bwYNrsjYdesx'"
echo ""

echo "💡 Next steps:"
echo "   1. Deploy debug-firebase.js function"
echo "   2. Check debug output for Firebase connection details"
echo "   3. Fix environment variable if needed"
echo "   4. Test social sharing with real data"
