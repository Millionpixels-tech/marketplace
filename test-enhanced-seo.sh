#!/bin/bash

# Test script to verify enhanced SEO meta tags for listings
echo "🔍 Testing Enhanced SEO Meta Tags for Listings"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URL - replace with actual listing ID when testing
LISTING_ID="test-listing-id"
BASE_URL="http://localhost:8888"  # Netlify dev server
PRODUCTION_URL="https://sina.lk"

echo -e "${BLUE}Testing locally first...${NC}"

# Test 1: Check if SSR function responds with bot user agent
echo -e "\n${YELLOW}Test 1: Bot User Agent Response${NC}"
curl -s -H "User-Agent: Googlebot/2.1" "$BASE_URL/listing/$LISTING_ID" | head -20

# Test 2: Check meta tags in response
echo -e "\n${YELLOW}Test 2: Meta Tags Check${NC}"
echo "Checking for essential meta tags..."

RESPONSE=$(curl -s -H "User-Agent: Googlebot/2.1" "$BASE_URL/listing/$LISTING_ID")

# Check for specific meta tags
if echo "$RESPONSE" | grep -q 'property="og:title"'; then
    echo -e "${GREEN}✓ Open Graph title found${NC}"
else
    echo "✗ Open Graph title missing"
fi

if echo "$RESPONSE" | grep -q 'property="og:description"'; then
    echo -e "${GREEN}✓ Open Graph description found${NC}"
else
    echo "✗ Open Graph description missing"
fi

if echo "$RESPONSE" | grep -q 'property="og:image"'; then
    echo -e "${GREEN}✓ Open Graph image found${NC}"
else
    echo "✗ Open Graph image missing"
fi

if echo "$RESPONSE" | grep -q 'name="price"'; then
    echo -e "${GREEN}✓ Price meta tag found${NC}"
else
    echo "✗ Price meta tag missing"
fi

if echo "$RESPONSE" | grep -q '"@type": "Product"'; then
    echo -e "${GREEN}✓ Product structured data found${NC}"
else
    echo "✗ Product structured data missing"
fi

# Test 3: Check structured data validity
echo -e "\n${YELLOW}Test 3: Structured Data Validation${NC}"
echo "Extracting JSON-LD structured data..."

echo "$RESPONSE" | grep -o '<script type="application/ld+json">.*</script>' | sed 's/<script type="application\/ld+json">//g' | sed 's/<\/script>//g' > temp_structured_data.json

if [ -f temp_structured_data.json ]; then
    echo "Structured data extracted. You can validate it at:"
    echo "https://search.google.com/test/rich-results"
    echo "https://validator.schema.org/"
    rm temp_structured_data.json
fi

# Test 4: Performance check
echo -e "\n${YELLOW}Test 4: Response Time Check${NC}"
TIME=$(curl -s -w "%{time_total}" -H "User-Agent: Googlebot/2.1" "$BASE_URL/listing/$LISTING_ID" -o /dev/null)
echo "Response time: ${TIME}s"

if (( $(echo "$TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓ Fast response time${NC}"
else
    echo "⚠ Slow response time (should be < 2s)"
fi

echo -e "\n${BLUE}Testing complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Replace 'test-listing-id' with a real listing ID"
echo "2. Test with production URL: $PRODUCTION_URL"
echo "3. Use Google's Rich Results Test: https://search.google.com/test/rich-results"
echo "4. Use Google Search Console to monitor search appearance"
echo "5. Test with different bot user agents (Facebook, Twitter, etc.)"

# Show example commands for manual testing
echo -e "\n${YELLOW}Manual testing commands:${NC}"
echo "# Test with Google bot:"
echo "curl -H \"User-Agent: Googlebot/2.1\" \"$BASE_URL/listing/YOUR_LISTING_ID\""
echo ""
echo "# Test with Facebook bot:"
echo "curl -H \"User-Agent: facebookexternalhit/1.1\" \"$BASE_URL/listing/YOUR_LISTING_ID\""
echo ""
echo "# Test with Twitter bot:"
echo "curl -H \"User-Agent: Twitterbot/1.0\" \"$BASE_URL/listing/YOUR_LISTING_ID\""
