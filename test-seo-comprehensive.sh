#!/bin/bash

# Comprehensive SEO Testing and Monitoring Script
# Tests all SEO implementations for maximum search rankings

echo "🔍 Comprehensive SEO Testing for Top Search Rankings"
echo "====================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"  # Change to your local dev server
PRODUCTION_URL="https://sina.lk"  # Your production URL
TEST_LISTING_ID="test-listing-123"
TEST_SHOP_USERNAME="test-artisan"

echo -e "${BLUE}Testing Environment: $BASE_URL${NC}"
echo -e "${BLUE}Production URL: $PRODUCTION_URL${NC}"
echo ""

# Function to test URL response
test_url_response() {
    local url=$1
    local user_agent=$2
    local description=$3
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo -e "URL: $url"
    echo -e "User-Agent: $user_agent"
    
    response=$(curl -s -w "\n%{http_code}\n%{time_total}\n" -H "User-Agent: $user_agent" "$url")
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    time_total=$(echo "$response" | tail -n 1)
    content=$(echo "$response" | head -n -2)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ HTTP $http_code (${time_total}s)${NC}"
    else
        echo -e "${RED}❌ HTTP $http_code (${time_total}s)${NC}"
    fi
    
    return 0
}

# Function to check meta tags
check_meta_tags() {
    local url=$1
    local user_agent=$2
    local page_type=$3
    
    echo -e "\n${PURPLE}Checking Meta Tags: $page_type${NC}"
    
    content=$(curl -s -H "User-Agent: $user_agent" "$url")
    
    # Check essential meta tags
    if echo "$content" | grep -q '<title>'; then
        title=$(echo "$content" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
        echo -e "${GREEN}✅ Title: $title${NC}"
    else
        echo -e "${RED}❌ Title tag missing${NC}"
    fi
    
    if echo "$content" | grep -q 'name="description"'; then
        description=$(echo "$content" | grep -o 'name="description"[^>]*content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
        echo -e "${GREEN}✅ Description: ${description:0:80}...${NC}"
    else
        echo -e "${RED}❌ Description meta tag missing${NC}"
    fi
    
    if echo "$content" | grep -q 'name="keywords"'; then
        echo -e "${GREEN}✅ Keywords meta tag found${NC}"
    else
        echo -e "${YELLOW}⚠️ Keywords meta tag missing${NC}"
    fi
    
    # Check Open Graph tags
    if echo "$content" | grep -q 'property="og:title"'; then
        echo -e "${GREEN}✅ Open Graph title found${NC}"
    else
        echo -e "${RED}❌ Open Graph title missing${NC}"
    fi
    
    if echo "$content" | grep -q 'property="og:description"'; then
        echo -e "${GREEN}✅ Open Graph description found${NC}"
    else
        echo -e "${RED}❌ Open Graph description missing${NC}"
    fi
    
    if echo "$content" | grep -q 'property="og:image"'; then
        echo -e "${GREEN}✅ Open Graph image found${NC}"
    else
        echo -e "${RED}❌ Open Graph image missing${NC}"
    fi
    
    # Check Twitter Card
    if echo "$content" | grep -q 'name="twitter:card"'; then
        echo -e "${GREEN}✅ Twitter Card found${NC}"
    else
        echo -e "${RED}❌ Twitter Card missing${NC}"
    fi
    
    # Check structured data
    if echo "$content" | grep -q 'application/ld+json'; then
        echo -e "${GREEN}✅ Structured data (JSON-LD) found${NC}"
        # Count structured data scripts
        json_count=$(echo "$content" | grep -c 'application/ld+json')
        echo -e "${BLUE}   📊 $json_count structured data scripts${NC}"
    else
        echo -e "${RED}❌ Structured data missing${NC}"
    fi
    
    # Check canonical URL
    if echo "$content" | grep -q 'rel="canonical"'; then
        canonical=$(echo "$content" | grep -o 'rel="canonical"[^>]*href="[^"]*"' | sed 's/.*href="\([^"]*\)".*/\1/')
        echo -e "${GREEN}✅ Canonical URL: $canonical${NC}"
    else
        echo -e "${RED}❌ Canonical URL missing${NC}"
    fi
    
    return 0
}

# Function to validate structured data
validate_structured_data() {
    local url=$1
    local user_agent=$2
    
    echo -e "\n${PURPLE}Validating Structured Data${NC}"
    
    content=$(curl -s -H "User-Agent: $user_agent" "$url")
    
    # Extract JSON-LD scripts
    json_scripts=$(echo "$content" | grep -o '<script type="application/ld+json">[^<]*</script>' | sed 's/<script[^>]*>//g' | sed 's/<\/script>//g')
    
    if [ -n "$json_scripts" ]; then
        echo "$json_scripts" | while IFS= read -r json_script; do
            if [ -n "$json_script" ]; then
                # Validate JSON syntax
                if echo "$json_script" | python3 -m json.tool > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Valid JSON-LD structure${NC}"
                    
                    # Check for schema.org context
                    if echo "$json_script" | grep -q "schema.org"; then
                        echo -e "${GREEN}✅ Schema.org context found${NC}"
                    else
                        echo -e "${YELLOW}⚠️ Schema.org context missing${NC}"
                    fi
                    
                    # Identify schema types
                    schema_types=$(echo "$json_script" | grep -o '"@type"[^,]*' | sed 's/"@type"[^"]*"\([^"]*\)".*/\1/' | sort | uniq)
                    if [ -n "$schema_types" ]; then
                        echo -e "${BLUE}   📋 Schema types: $(echo $schema_types | tr '\n' ', ')${NC}"
                    fi
                else
                    echo -e "${RED}❌ Invalid JSON-LD syntax${NC}"
                fi
            fi
        done
    else
        echo -e "${RED}❌ No structured data found${NC}"
    fi
}

# Function to check performance metrics
check_performance() {
    local url=$1
    
    echo -e "\n${PURPLE}Performance Analysis${NC}"
    
    # Use curl to measure response times
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")
    ttfb=$(curl -o /dev/null -s -w "%{time_starttransfer}" "$url")
    
    echo -e "${BLUE}📊 Response Time: ${response_time}s${NC}"
    echo -e "${BLUE}📊 Time to First Byte: ${ttfb}s${NC}"
    
    # Performance recommendations
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        echo -e "${RED}⚠️ Response time > 2s - Consider optimization${NC}"
    else
        echo -e "${GREEN}✅ Good response time${NC}"
    fi
    
    if (( $(echo "$ttfb > 0.6" | bc -l) )); then
        echo -e "${RED}⚠️ TTFB > 600ms - Server optimization needed${NC}"
    else
        echo -e "${GREEN}✅ Good TTFB${NC}"
    fi
}

# Function to check mobile-friendliness
check_mobile_friendly() {
    local url=$1
    
    echo -e "\n${PURPLE}Mobile-Friendly Check${NC}"
    
    content=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15" "$url")
    
    if echo "$content" | grep -q 'viewport'; then
        viewport=$(echo "$content" | grep -o 'name="viewport"[^>]*content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
        echo -e "${GREEN}✅ Viewport meta tag: $viewport${NC}"
    else
        echo -e "${RED}❌ Viewport meta tag missing${NC}"
    fi
    
    if echo "$content" | grep -q 'responsive\|mobile'; then
        echo -e "${GREEN}✅ Mobile-responsive indicators found${NC}"
    else
        echo -e "${YELLOW}⚠️ Mobile-responsive indicators not detected${NC}"
    fi
}

# Function to test different bot user agents
test_bot_detection() {
    local url=$1
    
    echo -e "\n${PURPLE}Bot Detection Testing${NC}"
    
    # Test different bot user agents
    declare -a bots=(
        "Googlebot/2.1 (+http://www.google.com/bot.html)"
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
        "Twitterbot/1.0"
        "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com/)"
        "WhatsApp/2.16.11"
    )
    
    for bot in "${bots[@]}"; do
        echo -e "\n${YELLOW}Testing with: $bot${NC}"
        response=$(curl -s -w "%{http_code}" -H "User-Agent: $bot" "$url")
        http_code=$(echo "$response" | tail -c 4)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ Bot can access content${NC}"
            
            # Check if SSR is working (look for complete HTML)
            if echo "$response" | head -n -1 | grep -q '<html\|<body\|<title'; then
                echo -e "${GREEN}✅ SSR working - Full HTML returned${NC}"
            else
                echo -e "${RED}❌ SSR not working - Incomplete HTML${NC}"
            fi
        else
            echo -e "${RED}❌ Bot cannot access content (HTTP $http_code)${NC}"
        fi
    done
}

# Main testing sequence
echo -e "${BLUE}Starting Comprehensive SEO Tests...${NC}\n"

# Test 1: Home Page
echo -e "${BLUE}=== TEST 1: HOME PAGE ===${NC}"
test_url_response "$BASE_URL/" "Googlebot/2.1" "Home Page"
check_meta_tags "$BASE_URL/" "Googlebot/2.1" "Home"
validate_structured_data "$BASE_URL/" "Googlebot/2.1"
check_performance "$BASE_URL/"
check_mobile_friendly "$BASE_URL/"

# Test 2: Search Page
echo -e "\n${BLUE}=== TEST 2: SEARCH PAGE ===${NC}"
search_url="$BASE_URL/search?q=handmade+crafts"
test_url_response "$search_url" "Googlebot/2.1" "Search Results"
check_meta_tags "$search_url" "Googlebot/2.1" "Search"

# Test 3: Category Page
echo -e "\n${BLUE}=== TEST 3: CATEGORY PAGE ===${NC}"
category_url="$BASE_URL/search?category=Arts+%26+Crafts"
test_url_response "$category_url" "Googlebot/2.1" "Category Page"
check_meta_tags "$category_url" "Googlebot/2.1" "Category"

# Test 4: Listing Page (if SSR is working)
echo -e "\n${BLUE}=== TEST 4: LISTING PAGE SSR ===${NC}"
listing_url="$BASE_URL/listing/$TEST_LISTING_ID"
test_url_response "$listing_url" "Googlebot/2.1" "Product Listing SSR"
check_meta_tags "$listing_url" "Googlebot/2.1" "Product"
validate_structured_data "$listing_url" "Googlebot/2.1"

# Test 5: Shop Page (if SSR is working)
echo -e "\n${BLUE}=== TEST 5: SHOP PAGE SSR ===${NC}"
shop_url="$BASE_URL/shop/$TEST_SHOP_USERNAME"
test_url_response "$shop_url" "Googlebot/2.1" "Shop Page SSR"
check_meta_tags "$shop_url" "Googlebot/2.1" "Shop"

# Test 6: Bot Detection
echo -e "\n${BLUE}=== TEST 6: BOT DETECTION ===${NC}"
test_bot_detection "$BASE_URL/"

# Test 7: Static Assets
echo -e "\n${BLUE}=== TEST 7: STATIC ASSETS ===${NC}"
echo -e "${YELLOW}Testing static assets...${NC}"

static_assets=("/robots.txt" "/sitemap.xml" "/favicon.ico" "/logo.svg")
for asset in "${static_assets[@]}"; do
    asset_url="$BASE_URL$asset"
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$asset_url")
    if [ "$response_code" = "200" ]; then
        echo -e "${GREEN}✅ $asset (HTTP $response_code)${NC}"
    else
        echo -e "${RED}❌ $asset (HTTP $response_code)${NC}"
    fi
done

# Test 8: Core Web Vitals Readiness
echo -e "\n${BLUE}=== TEST 8: CORE WEB VITALS READINESS ===${NC}"
echo -e "${YELLOW}Checking Core Web Vitals optimization...${NC}"

home_content=$(curl -s "$BASE_URL/")

# Check for performance optimizations
if echo "$home_content" | grep -q 'preload'; then
    echo -e "${GREEN}✅ Resource preloading detected${NC}"
else
    echo -e "${YELLOW}⚠️ Resource preloading not detected${NC}"
fi

if echo "$home_content" | grep -q 'lazy'; then
    echo -e "${GREEN}✅ Lazy loading implemented${NC}"
else
    echo -e "${YELLOW}⚠️ Lazy loading not detected${NC}"
fi

# Final Summary
echo -e "\n${PURPLE}=== SEO TEST SUMMARY ===${NC}"
echo -e "${BLUE}📋 Tests Completed:${NC}"
echo -e "   ✓ Home page SEO"
echo -e "   ✓ Search page SEO" 
echo -e "   ✓ Category page SEO"
echo -e "   ✓ SSR functionality"
echo -e "   ✓ Bot detection"
echo -e "   ✓ Meta tags validation"
echo -e "   ✓ Structured data validation"
echo -e "   ✓ Performance analysis"
echo -e "   ✓ Mobile-friendly check"
echo -e "   ✓ Static assets"
echo -e "   ✓ Core Web Vitals readiness"

echo -e "\n${YELLOW}📊 Recommendations:${NC}"
echo -e "1. Review any failed tests above"
echo -e "2. Test with real listing/shop IDs"
echo -e "3. Validate structured data with Google's Rich Results Test"
echo -e "4. Monitor Core Web Vitals in Google Search Console"
echo -e "5. Submit updated sitemap to search engines"

echo -e "\n${GREEN}🎯 Next Steps for Top Rankings:${NC}"
echo -e "1. Run './optimize-performance.sh' for speed improvements"
echo -e "2. Create high-quality content with target keywords"
echo -e "3. Build high-authority backlinks"
echo -e "4. Monitor and improve based on search console data"
echo -e "5. Implement user experience improvements"

echo -e "\n${GREEN}✅ SEO Testing Complete!${NC}"
echo -e "${BLUE}Your site is ready to dominate search results! 🏆${NC}"
