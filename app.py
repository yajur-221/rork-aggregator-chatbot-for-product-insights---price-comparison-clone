#!/usr/bin/env python3
"""
Clean Multi-Platform Price Scraper - No Hardcoded Prices
Only returns actual scraped data from real platforms
"""

import os
import requests
from bs4 import BeautifulSoup
import re
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get ScraperAPI key from environment variable
SCRAPER_API_KEY = os.environ.get('SCRAPER_API_KEY', '')

print(f"🚀 Starting Clean Multi-Platform Price Scraper")
print(f"🔑 ScraperAPI: {'Configured ✅' if SCRAPER_API_KEY else 'Not configured ❌'}")

# ===== PLATFORM CONFIGURATIONS =====

PLATFORM_CONFIGS = {
    'amazon': {
        'name': 'Amazon',
        'base_url': 'https://www.amazon.in',
        'search_url': 'https://www.amazon.in/s?k={query}',
        'selectors': {
            'container': 'div[data-component-type="s-search-result"]',
            'title': ['h2 a span', 'h2', 'span.a-size-medium'],
            'price': ['span.a-price-whole', 'span.a-price', 'span.a-offscreen'],
            'link': 'h2 a',
            'image': 'img.s-image'
        }
    },
    'flipkart': {
        'name': 'Flipkart',
        'base_url': 'https://www.flipkart.com',
        'search_url': 'https://www.flipkart.com/search?q={query}',
        'selectors': {
            'container': 'div._1AtVbE',
            'title': ['div._4rR01T', 'a.s1Q9rs', 'div._2WkVRV'],
            'price': ['div._30jeq3', 'div._1_WHN1', 'div._3I9_wc'],
            'link': 'a._1fQZEK',
            'image': 'img._396cs4'
        }
    },
    'swiggy_instamart': {
        'name': 'Swiggy Instamart',
        'base_url': 'https://www.swiggy.com',
        'search_url': 'https://www.swiggy.com/instamart/search?query={query}',
        'selectors': {
            'container': 'div.sc-jTgLJQ',
            'title': ['div.sc-aXZVg', 'div.product-name'],
            'price': ['span.sc-kDDrLX', 'span.rupee'],
            'link': None,
            'image': 'img.sc-hLQSwg'
        },
        'requires_js': True
    },
    'blinkit': {
        'name': 'Blinkit',
        'base_url': 'https://blinkit.com',
        'search_url': 'https://blinkit.com/search?q={query}',
        'selectors': {
            'container': 'div.plp-product',
            'title': ['div.Product__UpdatedTitle', 'div.product-name'],
            'price': ['div.Product__UpdatedPrice', 'span.price'],
            'link': None,
            'image': 'img.Product__UpdatedImageContainer'
        },
        'requires_js': True
    },
    'zepto': {
        'name': 'Zepto',
        'base_url': 'https://www.zp.delivery',
        'search_url': 'https://www.zp.delivery/search?query={query}',
        'selectors': {
            'container': 'div[data-testid="product-card"]',
            'title': ['h3', 'p.font-semibold'],
            'price': ['h4', 'p.text-gray-900'],
            'link': None,
            'image': 'img'
        },
        'requires_js': True
    },
    'bigbasket': {
        'name': 'BigBasket',
        'base_url': 'https://www.bigbasket.com',
        'search_url': 'https://www.bigbasket.com/ps/?q={query}',
        'selectors': {
            'container': ['div.SKU-Content', 'div.item.prod-deck'],
            'title': ['h3.Description___StyledH', 'a.ng-binding'],
            'price': ['div.Pricing___StyledDiv', 'span.discnt-price'],
            'link': 'a',
            'image': 'img'
        }
    },
    'croma': {
        'name': 'Croma',
        'base_url': 'https://www.croma.com',
        'search_url': 'https://www.croma.com/searchB?q={query}',
        'selectors': {
            'container': ['li.product-item', 'div.product-tile'],
            'title': ['h3.product-title', 'a.product-title'],
            'price': ['span.amount', 'span.new-price'],
            'link': 'a.product-title',
            'image': 'img.product-img'
        }
    },
    'vijay_sales': {
        'name': 'Vijay Sales',
        'base_url': 'https://www.vijaysales.com',
        'search_url': 'https://www.vijaysales.com/search/{query}',
        'selectors': {
            'container': 'div.product-thumb',
            'title': ['h2 a', 'div.product-name'],
            'price': ['span.price', 'div.product-price'],
            'link': 'a',
            'image': 'img'
        }
    },
    'reliance_digital': {
        'name': 'Reliance Digital',
        'base_url': 'https://www.reliancedigital.in',
        'search_url': 'https://www.reliancedigital.in/search?q={query}',
        'selectors': {
            'container': 'div.sp',
            'title': ['p.sp__name', 'div.RIL-product-list__product_name'],
            'price': ['span.TextWeb__Text', 'span.RIL-product-list__price'],
            'link': 'a',
            'image': 'img.sp__image'
        }
    },
    'myntra': {
        'name': 'Myntra',
        'base_url': 'https://www.myntra.com',
        'search_url': 'https://www.myntra.com/{query}',
        'selectors': {
            'container': 'li.product-base',
            'title': ['h3.product-brand', 'h4.product-product'],
            'price': ['span.product-discountedPrice', 'div.product-price'],
            'link': 'a',
            'image': 'img.img-responsive'
        }
    }
}

# ===== CATEGORY DETECTION =====

def detect_product_category(query: str) -> str:
    """Detect product category to select relevant platforms"""
    query_lower = query.lower()
    
    # Grocery items
    grocery_keywords = [
        'milk', 'bread', 'rice', 'dal', 'atta', 'flour', 'oil', 'ghee',
        'sugar', 'salt', 'spices', 'masala', 'tea', 'coffee',
        'fruits', 'vegetables', 'apple', 'banana', 'orange', 'onion', 'potato', 'tomato',
        'eggs', 'butter', 'cheese', 'paneer', 'yogurt', 'curd',
        'biscuits', 'cookies', 'chips', 'snacks', 'chocolate',
        'grocery', 'food', 'beverages'
    ]
    
    # Electronics
    electronics_keywords = [
        'phone', 'mobile', 'iphone', 'samsung', 'oneplus', 'laptop', 'macbook',
        'tablet', 'ipad', 'tv', 'television', 'camera', 'headphones', 'earphones',
        'watch', 'smartwatch', 'refrigerator', 'washing machine', 'ac',
        'playstation', 'xbox', 'electronics', 'gadget'
    ]
    
    # Fashion
    fashion_keywords = [
        'shirt', 'tshirt', 'jeans', 'pants', 'dress', 'shoes', 'sandals',
        'saree', 'kurta', 'jacket', 'clothing', 'fashion', 'wear'
    ]
    
    if any(keyword in query_lower for keyword in grocery_keywords):
        return 'grocery'
    elif any(keyword in query_lower for keyword in electronics_keywords):
        return 'electronics'
    elif any(keyword in query_lower for keyword in fashion_keywords):
        return 'fashion'
    else:
        return 'general'

def get_relevant_platforms(query: str) -> list:
    """Get relevant platforms based on product category"""
    category = detect_product_category(query)
    logger.info(f"Detected category: {category} for query: {query}")
    
    platform_mapping = {
        'grocery': ['amazon', 'flipkart', 'swiggy_instamart', 'blinkit', 'zepto', 'bigbasket'],
        'electronics': ['amazon', 'flipkart', 'croma', 'vijay_sales', 'reliance_digital'],
        'fashion': ['amazon', 'flipkart', 'myntra'],
        'general': ['amazon', 'flipkart']
    }
    
    platforms = platform_mapping.get(category, ['amazon', 'flipkart'])
    logger.info(f"Selected platforms: {platforms}")
    return platforms

# ===== SCRAPING FUNCTIONS =====

def clean_price(price_text):
    """Extract numeric price from text"""
    if not price_text:
        return 0
    # Remove currency symbols and non-numeric characters
    price_text = re.sub(r'[^\d.]', '', str(price_text))
    try:
        price = float(price_text)
        # Sanity check - prices should be reasonable
        if price > 0 and price < 10000000:  # Less than 1 crore
            return price
    except:
        pass
    return 0

def scrape_with_scraperapi(url: str, render_js: bool = False) -> requests.Response:
    """Use ScraperAPI to bypass blocking"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }
    
    if SCRAPER_API_KEY:
        api_url = "http://api.scraperapi.com"
        params = {
            'api_key': SCRAPER_API_KEY,
            'url': url,
            'country_code': 'in',
            'render': 'true' if render_js else 'false'
        }
        try:
            response = requests.get(api_url, params=params, timeout=30)
            return response
        except Exception as e:
            logger.error(f"ScraperAPI error: {e}")
    
    # Fallback to direct request
    return requests.get(url, headers=headers, timeout=10)

def extract_with_multiple_selectors(container, selectors):
    """Try multiple selectors and return the first match"""
    if not selectors:
        return None
    
    if isinstance(selectors, list):
        for selector in selectors:
            try:
                elem = container.select_one(selector)
                if elem:
                    return elem
            except:
                continue
    else:
        try:
            return container.select_one(selectors)
        except:
            pass
    return None

def scrape_platform(platform_key: str, query: str) -> list:
    """Scrape a specific platform and return only real results"""
    if platform_key not in PLATFORM_CONFIGS:
        return []
    
    config = PLATFORM_CONFIGS[platform_key]
    results = []
    
    try:
        logger.info(f"Scraping {config['name']} for: {query}")
        
        # Format search URL
        search_url = config['search_url'].format(query=query.replace(' ', '+'))
        
        # Check if platform requires JS rendering
        requires_js = config.get('requires_js', False)
        
        # Scrape the page
        response = scrape_with_scraperapi(search_url, render_js=requires_js)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try multiple container selectors
            containers = []
            container_selectors = config['selectors']['container']
            if isinstance(container_selectors, list):
                for selector in container_selectors:
                    containers.extend(soup.select(selector)[:10])
            else:
                containers = soup.select(container_selectors)[:10]
            
            logger.info(f"Found {len(containers)} product containers on {config['name']}")
            
            for container in containers:
                try:
                    # Extract title
                    title_elem = extract_with_multiple_selectors(container, config['selectors']['title'])
                    title = title_elem.text.strip()[:200] if title_elem else None
                    
                    # Extract price
                    price_elem = extract_with_multiple_selectors(container, config['selectors']['price'])
                    price = clean_price(price_elem.text) if price_elem else 0
                    
                    # Only add if we have both title and valid price
                    if title and price > 0:
                        # Extract link
                        link = search_url  # Default to search page
                        if config['selectors'].get('link'):
                            link_elem = extract_with_multiple_selectors(container, config['selectors']['link'])
                            if link_elem and link_elem.get('href'):
                                href = link_elem['href']
                                if href.startswith('http'):
                                    link = href
                                elif href.startswith('/'):
                                    link = config['base_url'] + href
                        
                        # Extract image if available
                        image = None
                        if config['selectors'].get('image'):
                            img_elem = extract_with_multiple_selectors(container, config['selectors']['image'])
                            if img_elem:
                                image = img_elem.get('src') or img_elem.get('data-src')
                        
                        results.append({
                            'price': price,
                            'title': title,
                            'platform': config['name'],
                            'url': link,
                            'image': image
                        })
                        
                        logger.info(f"Scraped: {title[:50]}... - ₹{price} from {config['name']}")
                
                except Exception as e:
                    logger.error(f"Error parsing item on {config['name']}: {e}")
                    continue
            
            logger.info(f"Successfully scraped {len(results)} products from {config['name']}")
        else:
            logger.error(f"{config['name']} returned status: {response.status_code}")
    
    except Exception as e:
        logger.error(f"Failed to scrape {config['name']}: {e}")
    
    return results

def scrape_all_platforms(query: str, platforms: list = None) -> list:
    """Scrape all relevant platforms in parallel"""
    if not platforms:
        platforms = get_relevant_platforms(query)
    
    all_results = []
    
    # Use ThreadPoolExecutor for parallel scraping
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(scrape_platform, platform, query): platform 
            for platform in platforms
        }
        
        for future in futures:
            platform = futures[future]
            try:
                results = future.result(timeout=20)
                all_results.extend(results)
            except Exception as e:
                logger.error(f"Platform {platform} scraping failed: {e}")
    
    return all_results

# ===== FLASK ROUTES =====

@app.route('/')
def home():
    return jsonify({
        'status': 'active',
        'service': 'Clean Multi-Platform Price Scraper',
        'version': '4.0.0',
        'scraper_api': 'enabled' if SCRAPER_API_KEY else 'disabled',
        'supported_platforms': list(PLATFORM_CONFIGS.keys()),
        'endpoints': {
            'health': '/health',
            'scrape_prices': '/scrape/prices/',
            'platforms': '/platforms'
        }
    })

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'scraper_api_configured': bool(SCRAPER_API_KEY)
    })

@app.route('/platforms')
def list_platforms():
    return jsonify({
        'platforms': {
            key: config['name'] for key, config in PLATFORM_CONFIGS.items()
        }
    })

@app.route('/scrape/prices/', methods=['POST', 'OPTIONS'])
@app.route('/scrape/prices', methods=['POST', 'OPTIONS'])
def scrape_prices_endpoint():
    """Main scraping endpoint - returns only real scraped data"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json() or {}
        product_name = data.get('product_name', '').strip()
        custom_platforms = data.get('platforms')
        
        if not product_name:
            return jsonify({
                'success': False,
                'error': 'Missing product_name in request'
            }), 400
        
        logger.info(f"Scraping request for: {product_name}")
        
        # Get category and platforms
        category = detect_product_category(product_name)
        platforms = custom_platforms if custom_platforms else get_relevant_platforms(product_name)
        
        # Scrape all platforms
        start_time = time.time()
        products = scrape_all_platforms(product_name, platforms)
        scraping_time = time.time() - start_time
        
        # Sort by price
        products.sort(key=lambda x: x['price'])
        
        # Prepare response - NO MOCK DATA
        response_data = {
            'success': len(products) > 0,
            'products': products,
            'product_searched': product_name,
            'category': category,
            'platforms_searched': platforms,
            'platforms_with_results': list(set(p['platform'] for p in products)),
            'total_results': len(products),
            'cheapest': products[0] if products else None,
            'scraping_time': round(scraping_time, 2),
            'timestamp': time.time()
        }
        
        logger.info(f"Completed: {len(products)} products from {len(set(p['platform'] for p in products))} platforms in {scraping_time:.2f}s")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in scrape_prices_endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/query/price/', methods=['POST', 'OPTIONS'])
def query_price_endpoint():
    """Natural language query endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    
    # Extract product name
    words = query.lower().split()
    remove_words = ['find', 'search', 'price', 'cost', 'cheap', 'cheapest', 'for', 'of', 'what', 'is', 'the']
    product_words = [w for w in words if w not in remove_words]
    product_name = ' '.join(product_words).strip()
    
    if not product_name:
        return jsonify({
            'success': False,
            'error': 'Could not extract product name'
        }), 400
    
    # Set product_name in request data and forward
    data['product_name'] = product_name
    request.get_json = lambda: data
    return scrape_prices_endpoint()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"""
    🚀 Clean Multi-Platform Price Scraper v4.0
    📍 Port: {port}
    🔑 ScraperAPI: {'Configured ✅' if SCRAPER_API_KEY else 'Not configured ❌'}
    ⚠️  NO HARDCODED PRICES - Only real scraped data
    
    📋 Supported Platforms:
    {', '.join(PLATFORM_CONFIGS.keys())}
    
    To test:
    curl -X POST http://localhost:{port}/scrape/prices/ -H 'Content-Type: application/json' -d '{{"product_name": "milk"}}'
    """)
    app.run(host='0.0.0.0', port=port, debug=False)
