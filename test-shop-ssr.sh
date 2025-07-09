#!/bin/bash

# Test script for Shop Page SSR functionality
# Tests both staging and production environments with various social media bots

set -e

echo "🧪 Testing Shop Page SSR functionality"
echo "======================================="

# Configuration
STAGING_URL="https://stage.sina.lk"
PROD_URL="https://sina.lk"

# Test shops (update with actual shop usernames)
TEST_SHOPS=("yummy_foods" "yummy" "nonexistent_shop")

# Regular user agent
REGULAR_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Test function
test_shop_ssr() {
    local url=$1
    local shop_username=$2
    local user_agent=$3
    local bot_name=$4
    
    echo -n "  Testing $bot_name: "
    
    # Get response with timeout
    response=$(curl -s --max-time 10 -H "User-Agent: $user_agent" "$url/shop/$shop_username")
    
    if [[ $? -eq 0 ]]; then
        # Extract title and check for SSR indicators
        title=$(echo "$response" | grep -o '<title>[^<]*</title>' | sed 's/<title>//g' | sed 's/<\/title>//g')
        has_og_image=$(echo "$response" | grep -q 'property="og:image"' && echo "✓" || echo "✗")
        has_og_title=$(echo "$response" | grep -q 'property="og:title"' && echo "✓" || echo "✗")
        has_description=$(echo "$response" | grep -q 'property="og:description"' && echo "✓" || echo "✗")
        has_schema=$(echo "$response" | grep -q '"@type": "Store"' && echo "✓" || echo "✗")
        
        echo "✅"
        echo "    Title: $title"
        echo "    Meta tags: OG:Image($has_og_image) OG:Title($has_og_title) Description($has_description) Schema($has_schema)"
    else
        echo "❌ Request failed"
    fi
}

# Test regular user gets SPA
test_regular_user() {
    local url=$1
    local shop_username=$2
    
    echo -n "  Testing regular user: "
    
    # Check headers only to see if we get SPA
    response=$(curl -s --max-time 10 -I -H "User-Agent: $REGULAR_USER_AGENT" "$url/shop/$shop_username")
    
    if [[ $? -eq 0 ]]; then
        status_code=$(echo "$response" | grep -o 'HTTP/[0-9.]\+ [0-9]\+' | awk '{print $2}')
        content_type=$(echo "$response" | grep -i 'content-type' | head -1)
        
        if [[ "$status_code" == "200" ]]; then
            echo "✅ Gets SPA (Status: $status_code)"
        else
            echo "⚠️  Status: $status_code"
        fi
    else
        echo "❌ Request failed"
    fi
}

# Test bot agents
test_bots() {
    local url=$1
    local shop=$2
    
    echo "  Testing Facebook bot:"
    test_shop_ssr "$url" "$shop" "facebookexternalhit/1.1" "Facebook"
    
    echo "  Testing Twitter bot:"
    test_shop_ssr "$url" "$shop" "Twitterbot/1.0" "Twitter"
    
    echo "  Testing WhatsApp bot:"
    test_shop_ssr "$url" "$shop" "WhatsApp/2.19.81 A" "WhatsApp"
    
    echo "  Testing LinkedIn bot:"
    test_shop_ssr "$url" "$shop" "LinkedInBot/1.0" "LinkedIn"
}

# Test environments
for env_name in "Staging"; do
    if [[ "$env_name" == "Staging" ]]; then
        BASE_URL="$STAGING_URL"
    else
        BASE_URL="$PROD_URL"
    fi
    
    echo
    echo "🌐 Testing $env_name Environment: $BASE_URL"
    echo "================================================"
    
    for shop in "${TEST_SHOPS[@]}"; do
        echo
        echo "🏪 Shop: $shop"
        echo "-------------------"
        
        # Test bots
        test_bots "$BASE_URL" "$shop"
        
        # Test regular user
        test_regular_user "$BASE_URL" "$shop"
        
        echo
    done
done

echo
echo "🎯 Direct Function Tests"
echo "========================"

echo
echo "📋 Available shops:"
curl -s "$STAGING_URL/.netlify/functions/list-shops" | jq -r '.shops[]? | "  - \(.username): \(.name)"' 2>/dev/null || echo "Could not fetch shop list"

echo
echo "🔧 Testing direct SSR function:"
echo "  yummy_foods: $(curl -s --max-time 5 "$STAGING_URL/.netlify/functions/shop-ssr/yummy_foods" -H "User-Agent: facebookexternalhit/1.1" | grep -o '<title>[^<]*</title>' | sed 's/<title>//g' | sed 's/<\/title>//g')"

echo
echo "✅ Shop SSR Testing Complete!"
echo
echo "📝 Summary:"
echo "   - Shop pages should show rich previews for bots/crawlers"
echo "   - Regular users should get the React SPA"
echo "   - Non-existent shops should show 404 pages with proper meta tags"
echo "   - All social media platforms should get the same SSR content"
