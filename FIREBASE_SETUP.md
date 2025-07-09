# Firebase Service Account Setup for Sitemap Generation

To enable dynamic content fetching for sitemap generation, you need to set up Firebase Admin SDK authentication.

## Option 1: Environment Variable (Recommended)

Add the Firebase service account JSON to your `.env` file:

```bash
VITE_FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important:** The JSON should be properly escaped and enclosed in single quotes to avoid issues with special characters.

## Option 2: Service Account Key File

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Rename it to `firebase-service-account.json`
7. Place it in the root directory of your project (next to package.json)
8. Add `firebase-service-account.json` to your `.gitignore` file

## Option 3: Application Default Credentials

Set this environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

## Usage

After setting up authentication, you can run:

```bash
# Generate sitemap with dynamic content from Firebase
npm run generate-sitemap

# Generate sitemap for a specific domain
npm run generate-sitemap https://sina.lk

# Update only robots.txt
npm run update-robots

# Update robots.txt for a specific domain  
npm run update-robots https://sina.lk
```

## Troubleshooting

If you get JSON parsing errors:
1. Ensure the VITE_FIREBASE_SERVICE_ACCOUNT value is properly escaped
2. Use single quotes around the entire JSON string in your .env file
3. Make sure there are no line breaks in the JSON string

## Note

If Firebase Admin SDK is not properly configured, the sitemap script will still work but will skip dynamic content (listings, shops, user profiles) and only include static pages.
