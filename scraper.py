"""
LOCATION-AWARE PRODUCT SCRAPER FOR RORK APP
Handles user location for accurate local prices (Swiggy, Zepto, Blinkit)
Ready to plug into your existing Rork UI
"""

import asyncio
import requests
from bs4 import BeautifulSoup
import re
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import time

# Optional: For dynamic sites (install if needed)
try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, GeolocationConfig
    CRAWL4AI_AVAILABLE = True
except:
    CRAWL4AI_AVAILABLE = False
    print("Note: crawl4ai not installed. Quick commerce sites won't work.")

# =============== CONFIGURATION ===============
class Config:
    """Configuration settings"""
    # Default timeout
    TIMEOUT = 10
    
    # Enable/disable platforms
    ENABLE_AMAZON = True
    ENABLE_FLIPKART = True
    ENABLE_SNAPDEAL = True
    ENABLE_CROMA = True
    ENABLE_SWIGGY = True  # Requires location
    ENABLE_ZEPTO = True   # Requires location
    ENABLE_BLINKIT = True # Requires location
    
    # Headers for requests
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }

# =============== MAIN SCRAPER FUNCTION ===============

def scrape_products(product_query: str, user_latitude: float, user_longitude: float) -> Dict:
    """
    MAIN FUNCTION FOR RORK APP - SYNCHRONOUS VERSION
    
    Args:
        product_query: Product name from user input (e.g., "iPhone 15")
        user_latitude: User's latitude from Rork location
        user_longitude: User's longitude from Rork location
    
    Returns:
        Dictionary with all products sorted by price, ready for Rork UI
    
    Example:
        result = scrape_products("laptop", 28.6139, 77.2090)
        # Display result['products'] in your UI
    """
    
    # Run the async scraper
    result = asyncio.run(_async_scrape_all(product_query, user_latitude, user_longitude))
    return result

async def _async_scrape_all(product_query: str, latitude: float, longitude: float) -> Dict:
    """Internal async function that does the actual scraping"""
    
    print(f"🔍 Searching for: {product_query}")
    print(f"📍 Location: {latitude}, {longitude}")
    
    all_products = []
    errors = []
    
    # Run all scrapers concurrently
    tasks = []
    
    # E-commerce sites (don't need location)
    if Config.ENABLE_AMAZON:
        tasks.append(('Amazon', scrape_amazon(product_query)))
    if Config.ENABLE_FLIPKART:
        tasks.append(('Flipkart', scrape_flipkart(product_query)))
    if Config.ENABLE_SNAPDEAL:
        tasks.append(('Snapdeal', scrape_snapdeal(product_query)))
    if Config.ENABLE_CROMA:
        tasks.append(('Croma', scrape_croma(product_query)))
    
    # Quick commerce sites (need location)
    if CRAWL4AI_AVAILABLE:
        if Config.ENABLE_SWIGGY:
            tasks.append(('Swiggy', scrape_swiggy_instamart(product_query, latitude, longitude)))
        if Config.ENABLE_ZEPTO:
            tasks.append(('Zepto', scrape_zepto(product_query, latitude, longitude)))
        if Config.ENABLE_BLINKIT:
            tasks.append(('Blinkit', scrape_blinkit(product_query, latitude, longitude)))
    
    # Execute all tasks
    for platform_name, task in tasks:
        try:
            products = await task
            all_products.extend(products)
            print(f"✅ {platform_name}: Found {len(products)} products")
        except Exception as e:
            error_msg = f"❌ Failed to scrape {platform_name}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
    
    # Sort by price (cheapest first)
    valid_products = [p for p in all_products if p.get('price', 0) > 0]
    valid_products.sort(key=lambda x: x['price'])
    
    # Mark cheapest
    if valid_products:
        valid_products[0]['is_cheapest'] = True
        valid_products[0]['badge'] = '🏆 CHEAPEST!'
        valid_products[0]['highlight'] = True
    
    # Format prices for display
    for product in valid_products:
        product['formatted_price'] = f"₹{product['price']:,.0f}"
        product['display_price'] = f"₹{product['price']:,.0f}"
    
    return {
        'success': len(valid_products) > 0,
        'products': valid_products,
        'total_count': len(valid_products),
        'search_term': product_query,
        'location': {'latitude': latitude, 'longitude': longitude},
        'timestamp': time.time(),
        'errors': errors,
        'cheapest': valid_products[0] if valid_products else None,
        'platforms_searched': [name for name, _ in tasks]
    }

# =============== HELPER FUNCTIONS ===============

def clean_price(price_text: str) -> float:
    """Extract numeric price from text"""
    if not price_text:
        return 0
    price_text = re.sub(r'[^\d.]', '', price_text)
    try:
        return float(price_text)
    except:
        return 0

def truncate_title(title: str, max_length: int = 100) -> str:
    """Truncate title to max length"""
    if len(title) <= max_length:
        return title
    return title[:max_length-3] + "..."

# =============== E-COMMERCE SCRAPERS (No location needed) ===============

async def scrape_amazon(query: str) -> List[Dict]:
    """Scrape Amazon India"""
    products = []
    
    try:
        url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
        
        # Async request
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=Config.HEADERS, timeout=Config.TIMEOUT)
        )
        
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('div[data-component-type="s-search-result"]')[:8]
        
        for item in items:
            try:
                # Title
                title_elem = item.select_one('h2 span')
                if not title_elem:
                    continue
                title = title_elem.text.strip()
                
                # Price
                price_elem = item.select_one('span.a-price-whole')
                if not price_elem:
                    continue
                price = clean_price(price_elem.text)
                
                if price == 0:
                    continue
                
                # Image
                img_elem = item.select_one('img.s-image')
                image = img_elem.get('src', '') if img_elem else ''
                
                # Link
                link_elem = item.select_one('h2 a')
                link = 'https://www.amazon.in' + link_elem.get('href', '') if link_elem else url
                
                # Rating
                rating_elem = item.select_one('span.a-icon-alt')
                rating = rating_elem.text.split()[0] if rating_elem else None
                
                products.append({
                    'title': truncate_title(title),
                    'price': price,
                    'image': image,
                    'link': link,
                    'platform': 'Amazon',
                    'platform_color': '#FF9900',
                    'rating': rating,
                    'delivery': 'Free Delivery',
                    'source': 'amazon.in'
                })
                
            except Exception as e:
                continue
                
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

async def scrape_flipkart(query: str) -> List[Dict]:
    """Scrape Flipkart"""
    products = []
    
    try:
        url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=Config.HEADERS, timeout=Config.TIMEOUT)
        )
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Flipkart has different layouts, try multiple selectors
        containers = soup.select('div._1AtVbE')[:8]
        
        for container in containers:
            try:
                # Price is most reliable element
                price_elem = container.select_one('div._30jeq3')
                if not price_elem:
                    continue
                price = clean_price(price_elem.text)
                
                if price == 0:
                    continue
                
                # Title
                title_elem = container.select_one('div._4rR01T') or container.select_one('a.s1Q9rs')
                if not title_elem:
                    title_elem = container.select_one('a[title]')
                title = title_elem.text.strip() if title_elem else "Product"
                
                # Image
                img_elem = container.select_one('img')
                image = img_elem.get('src', '') if img_elem else ''
                
                # Link
                link_elem = container.select_one('a._1fQZEK') or container.select_one('a.s1Q9rs')
                if link_elem:
                    link = 'https://www.flipkart.com' + link_elem.get('href', '')
                else:
                    link = url
                
                # Rating
                rating_elem = container.select_one('div._3LWZlK')
                rating = rating_elem.text if rating_elem else None
                
                products.append({
                    'title': truncate_title(title),
                    'price': price,
                    'image': image,
                    'link': link,
                    'platform': 'Flipkart',
                    'platform_color': '#2874F0',
                    'rating': rating,
                    'delivery': 'Free Delivery',
                    'source': 'flipkart.com'
                })
                
            except Exception as e:
                continue
                
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

async def scrape_snapdeal(query: str) -> List[Dict]:
    """Scrape Snapdeal"""
    products = []
    
    try:
        url = f"https://www.snapdeal.com/search?keyword={query.replace(' ', '%20')}"
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=Config.HEADERS, timeout=Config.TIMEOUT)
        )
        
        soup = BeautifulSoup(response.text, 'html.parser')
        items = soup.select('div.product-tuple-listing')[:5]
        
        for item in items:
            try:
                # Title
                title_elem = item.select_one('p.product-title')
                title = title_elem.text.strip() if title_elem else "Product"
                
                # Price
                price_elem = item.select_one('span.product-price')
                if price_elem:
                    price = clean_price(price_elem.get('display-price', '0'))
                else:
                    continue
                
                if price == 0:
                    continue
                
                # Image
                img_elem = item.select_one('img')
                image = img_elem.get('src', '') or img_elem.get('data-src', '') if img_elem else ''
                
                # Link
                link_elem = item.select_one('a.dp-widget-link')
                link = link_elem.get('href', '') if link_elem else url
                
                products.append({
                    'title': truncate_title(title),
                    'price': price,
                    'image': image,
                    'link': link,
                    'platform': 'Snapdeal',
                    'platform_color': '#E40046',
                    'delivery': 'Standard Delivery',
                    'source': 'snapdeal.com'
                })
                
            except:
                continue
                
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

async def scrape_croma(query: str) -> List[Dict]:
    """Scrape Croma"""
    products = []
    
    try:
        url = f"https://www.croma.com/search/?text={query.replace(' ', '%20')}"
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=Config.HEADERS, timeout=Config.TIMEOUT)
        )
        
        # Croma uses dynamic loading, but we can try to get basic data
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for product data in scripts
        scripts = soup.find_all('script', type='application/ld+json')
        
        for script in scripts:
            try:
                data = json.loads(script.string)
                if '@type' in data and data['@type'] == 'Product':
                    products.append({
                        'title': truncate_title(data.get('name', 'Product')),
                        'price': float(data.get('offers', {}).get('price', 0)),
                        'image': data.get('image', ''),
                        'link': url,
                        'platform': 'Croma',
                        'platform_color': '#1BA1E2',
                        'delivery': 'Store Pickup Available',
                        'source': 'croma.com'
                    })
            except:
                continue
                
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

# =============== QUICK COMMERCE SCRAPERS (Location required) ===============

async def scrape_swiggy_instamart(query: str, lat: float, lon: float) -> List[Dict]:
    """Scrape Swiggy Instamart with location"""
    products = []
    
    if not CRAWL4AI_AVAILABLE:
        return products
    
    try:
        browser_config = BrowserConfig(
            browser_type="chromium",
            headless=True,
            text_mode=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            config = CrawlerRunConfig(
                wait_for='[data-testid="item-card"]',
                geolocation=GeolocationConfig(
                    latitude=lat,
                    longitude=lon,
                    accuracy=100
                ),
                timeout=15
            )
            
            url = f"https://www.swiggy.com/instamart/search?query={query.replace(' ', '%20')}"
            result = await crawler.arun(url=url, config=config)
            
            # Parse the result
            lines = result.markdown.split('\n')
            for i, line in enumerate(lines):
                if '₹' in line:
                    price_match = re.search(r'₹\s*(\d+)', line)
                    if price_match:
                        price = float(price_match.group(1))
                        # Look for title in nearby lines
                        title = "Product"
                        for j in range(max(0, i-3), i):
                            if lines[j].strip() and len(lines[j]) < 100:
                                title = lines[j].strip()
                                break
                        
                        products.append({
                            'title': truncate_title(title),
                            'price': price,
                            'image': '',
                            'link': url,
                            'platform': 'Swiggy Instamart',
                            'platform_color': '#FC8019',
                            'delivery': '15-30 mins',
                            'source': 'swiggy.com',
                            'location_based': True
                        })
                        
                        if len(products) >= 5:
                            break
                            
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

async def scrape_zepto(query: str, lat: float, lon: float) -> List[Dict]:
    """Scrape Zepto with location"""
    products = []
    
    if not CRAWL4AI_AVAILABLE:
        return products
    
    try:
        browser_config = BrowserConfig(
            browser_type="chromium",
            headless=True,
            text_mode=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            config = CrawlerRunConfig(
                wait_for='[data-testid="product-card"]',
                geolocation=GeolocationConfig(
                    latitude=lat,
                    longitude=lon,
                    accuracy=100
                ),
                timeout=15
            )
            
            url = f"https://www.zepto.com/search?query={query.replace(' ', '%20')}"
            result = await crawler.arun(url=url, config=config)
            
            # Parse the result
            lines = result.markdown.split('\n')
            for i, line in enumerate(lines):
                if '₹' in line:
                    price_match = re.search(r'₹\s*(\d+)', line)
                    if price_match:
                        price = float(price_match.group(1))
                        title = "Product"
                        for j in range(max(0, i-3), i):
                            if lines[j].strip() and len(lines[j]) < 100:
                                title = lines[j].strip()
                                break
                        
                        products.append({
                            'title': truncate_title(title),
                            'price': price,
                            'image': '',
                            'link': url,
                            'platform': 'Zepto',
                            'platform_color': '#7C3AED',
                            'delivery': '10 mins',
                            'source': 'zepto.com',
                            'location_based': True
                        })
                        
                        if len(products) >= 5:
                            break
                            
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

async def scrape_blinkit(query: str, lat: float, lon: float) -> List[Dict]:
    """Scrape Blinkit with location"""
    products = []
    
    if not CRAWL4AI_AVAILABLE:
        return products
    
    try:
        browser_config = BrowserConfig(
            browser_type="chromium",
            headless=True,
            text_mode=True
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            config = CrawlerRunConfig(
                wait_for='[class*="product"]',
                geolocation=GeolocationConfig(
                    latitude=lat,
                    longitude=lon,
                    accuracy=100
                ),
                timeout=15
            )
            
            url = f"https://blinkit.com/search?query={query.replace(' ', '%20')}"
            result = await crawler.arun(url=url, config=config)
            
            # Parse the result
            lines = result.markdown.split('\n')
            for i, line in enumerate(lines):
                if '₹' in line:
                    price_match = re.search(r'₹\s*(\d+)', line)
                    if price_match:
                        price = float(price_match.group(1))
                        title = "Product"
                        for j in range(max(0, i-3), i):
                            if lines[j].strip() and len(lines[j]) < 100:
                                title = lines[j].strip()
                                break
                        
                        products.append({
                            'title': truncate_title(title),
                            'price': price,
                            'image': '',
                            'link': url,
                            'platform': 'Blinkit',
                            'platform_color': '#FFC300',
                            'delivery': '10-20 mins',
                            'source': 'blinkit.com',
                            'location_based': True
                        })
                        
                        if len(products) >= 5:
                            break
                            
    except Exception as e:
        raise Exception(f"Network timeout")
    
    return products

# =============== TESTING ===============

def test_scraper():
    """Test the scraper with sample data"""
    
    # Test locations
    locations = {
        'Delhi': (28.6139, 77.2090),
        'Mumbai': (19.0760, 72.8777),
        'Bangalore': (12.9716, 77.5946)
    }
    
    # Test products
    products = ['laptop', 'iPhone 15', 'milk', 'earbuds']
    
    for city, (lat, lon) in locations.items():
        print(f"\n{'='*60}")
        print(f"Testing in {city}")
        print('='*60)
        
        for product in products:
            result = scrape_products(product, lat, lon)
            
            if result['success']:
                print(f"\n✅ {product}: {result['total_count']} items found")
                if result['cheapest']:
                    print(f"   Cheapest: {result['cheapest']['formatted_price']} on {result['cheapest']['platform']}")
            else:
                print(f"❌ {product}: No results")
        
        break  # Test only first location
    
    # Save sample result
    sample_result = scrape_products("laptop", 28.6139, 77.2090)
    with open('rork_sample_output.json', 'w') as f:
        json.dump(sample_result, f, indent=2)
    print("\n📁 Sample output saved to rork_sample_output.json")

if __name__ == "__main__":
    test_scraper()

"""
END OF SCRAPER CODE
==================

INTEGRATION GUIDE FOR RORK APP:

1. INSTALLATION:
   pip install requests beautifulsoup4
   pip install crawl4ai  # Optional, for quick commerce

2. USAGE IN YOUR APP:
   from scraper import scrape_products
   
   # Get user location from your location hook
   latitude, longitude = get_user_location()
   
   # Scrape products
   result = scrape_products("iPhone 15", latitude, longitude)
   
   # Display results
   if result['success']:
       for product in result['products']:
           display_product_card(product)

3. PRODUCT OBJECT STRUCTURE:
   {
       'title': 'Product Name',
       'price': 50000.0,
       'formatted_price': '₹50,000',
       'image': 'https://...',
       'link': 'https://...',
       'platform': 'Amazon',
       'platform_color': '#FF9900',
       'delivery': 'Free Delivery',
       'rating': '4.5',
       'is_cheapest': True,  # Only for cheapest item
       'badge': '🏆 CHEAPEST!',  # Only for cheapest item
       'location_based': True  # Only for quick commerce
   }

4. ERROR HANDLING:
   - Network timeouts are handled gracefully
   - Failed platforms are logged in result['errors']
   - App continues to work even if some platforms fail

5. LOCATION REQUIREMENTS:
   - E-commerce sites (Amazon, Flipkart, etc.) work without location
   - Quick commerce (Swiggy, Zepto, Blinkit) require user location
   - Location should be obtained from your useLocation hook
"""