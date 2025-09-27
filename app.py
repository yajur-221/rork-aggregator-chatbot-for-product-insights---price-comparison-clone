#!/usr/bin/env python3
"""
Enhanced Multi-Platform Price Scraper with Working Selectors
Optimized for Indian E-commerce Platforms with ScraperAPI
"""

import os
import requests
from bs4 import BeautifulSoup
import re
import json
import time
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from datetime import datetime
import asyncio

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get ScraperAPI key from environment variable
SCRAPER_API_KEY = os.environ.get('SCRAPER_API_KEY', '')

print(f"🚀 Starting Enhanced Multi-Platform Price Scraper v2.0")
print(f"🔑 ScraperAPI: {'Configured ✅' if SCRAPER_API_KEY else 'Not configured ❌'}")

# ===== UPDATED PLATFORM CONFIGURATIONS (December 2024) =====

PLATFORM_CONFIGS = {
    'amazon': {
        'name': 'Amazon',
        'base_url': 'https://www.amazon.in',
        'search_url': 'https://www.amazon.in/s?k={query}',
        'selectors': {
            'container': 'div[data-component-type="s-search-result"]',
            'title': ['h2 a span', 'h2.s-size-mini span', 'span.a-size-medium'],
            'price': ['span.a-price-whole', 'span.a-price.a-text-price.a-size-medium', 'span.a-offscreen'],
            'link': 'h2 a',
            'image': 'img.s-image',
            'rating': 'span.a-icon-alt'
        },
        'requires_js': False,
        'credits': 5  # Amazon India costs 5 credits
    },
    'flipkart': {
        'name': 'Flipkart',
        'base_url': 'https://www.flipkart.com',
        'search_url': 'https://www.flipkart.com/search?q={query}',
        'selectors': {
            # Updated selectors for December 2024
            'container': ['div._75nlfW', 'div._13oc-S', 'div._2kHMtA', 'div._1xHGtK._373qXS'],
            'title': ['div._4rR01T', 'a.s1Q9rs', 'a.IRpwTa', 'div._2WkVRV', 'a._2UzuFa'],
            'price': ['div._30jeq3._16Jk6d', 'div._30jeq3', 'div._1_WHN1', 'div._25b18c span'],
            'link': ['a._1fQZEK', 'a.s1Q9rs', 'a.IRpwTa', 'a._2UzuFa'],
            'image': ['img._396cs4', 'img._2r_T1I', 'img._53J4C-'],
            'rating': ['div._3LWZlK', 'span._2_R_DZ span']
        },
        'requires_js': True,
        'credits': 15  # Flipkart with JS rendering
    },
    'myntra': {
        'name': 'Myntra',
        'base_url': 'https://www.myntra.com',
        'search_url': 'https://www.myntra.com/{query}',
        'selectors': {
            'container': 'li.product-base',
            'title': ['h3.product-brand', 'h4.product-product', 'div.product-productMetaInfo h3'],
            'price': ['span.product-discountedPrice', 'div.product-price span'],
            'link': 'a',
            'image': ['img.img-responsive', 'picture._2OHU_q img'],
            'brand': 'h3.product-brand'
        },
        'requires_js': True,
        'credits': 15
    },
    'ajio': {
        'name': 'Ajio',
        'base_url': 'https://www.ajio.com',
        'search_url': 'https://www.ajio.com/search/?text={query}',
        'selectors': {
            'container': ['div.item.rilrtl-products-list__item', 'div.item'],
            'title': ['div.nameCls', 'div.brand', 'div.name'],
            'price': ['div.price strong', 'span.price', 'div.price'],
            'link': 'a',
            'image': ['img.rilrtl-lazy-img', 'img']
        },
        'requires_js': True,
        'credits': 15
    },
    'croma': {
        'name': 'Croma',
        'base_url': 'https://www.croma.com',
        'search_url': 'https://www.croma.com/searchB?q={query}',
        'selectors': {
            'container': ['li.product-item', 'div.cp-product', 'div.product-tile'],
            'title': ['h3.product-title a', 'a.product-title', 'h3'],
            'price': ['span.new-price', 'span.amount', 'span.pdpPrice', 'span[data-testid="price"]'],
            'link': ['a.product-title', 'h3.product-title a'],
            'image': ['img.product-img', 'img[loading="lazy"]']
        },
        'requires_js': False,
        'credits': 5
    },
    'reliance_digital': {
        'name': 'Reliance Digital',
        'base_url': 'https://www.reliancedigital.in',
        'search_url': 'https://www.reliancedigital.in/search?q={query}',
        'selectors': {
            'container': ['div.sp__product', 'div.sp grid'],
            'title': ['p.sp__name', 'div.sp__name'],
            'price': ['span.TextWeb__Text', 'span.pdp__offerPrice', 'span[class*="TextWeb__Text"]'],
            'link': 'a.sp__name',
            'image': ['img.sp__image', 'img']
        },
        'requires_js': True,
        'credits': 10
    },
    'swiggy_instamart': {
        'name': 'Swiggy Instamart',
        'base_url': 'https://www.swiggy.com',
        'search_url': 'https://www.swiggy.com/instamart/search?query={query}',
        'selectors': {
            'container': 'div[data-testid="product-card"]',
            'title': ['div[data-testid="product-name"]', 'div.product-name'],
            'price': ['div[data-testid="product-price"]', 'span.rupee'],
            'link': None,
            'image': 'img[data-testid="product-image"]'
        },
        'requires_js': True,
        'credits': 25
    },
    'blinkit': {
        'name': 'Blinkit',
        'base_url': 'https://blinkit.com',
        'search_url': 'https://blinkit.com/search?q={query}',
        'selectors': {
            'container': 'div.Product__Container',
            'title': ['div.Product__Title', 'div.Product__UpdatedTitle'],
            'price': ['div.Product__Price', 'div.Product__UpdatedPrice'],
            'link': None,
            'image': 'img.Product__Image'
        },
        'requires_js': True,
        'credits': 25
    },
    'bigbasket': {
        'name': 'BigBasket',
        'base_url': 'https://www.bigbasket.com',
        'search_url': 'https://www.bigbasket.com/ps/?q={query}',
        'selectors': {
            'container': ['div.SKU-Content', 'div.PaginateItems___StyledDiv'],
            'title': ['h3.Description___StyledH', 'a.ng-binding', 'div.Description___StyledDiv'],
            'price': ['div.Pricing___StyledDiv', 'span.discnt-price', 'span.Label-sc-15v1nk5-0'],
            'link': 'a',
            'image': ['img[loading="lazy"]', 'img.ng-isolate-scope']
        },
        'requires_js': True,
        'credits': 15
    }
}

# ===== SCRAPERAPI CONFIGURATION =====

def get_scraperapi_params(platform_key: str, query: str, use_premium: bool = True) -> dict:
    """Get optimized ScraperAPI parameters for Indian platforms"""
    config = PLATFORM_CONFIGS.get(platform_key, {})
    
    # Base parameters for all requests
    params = {
        'api_key': SCRAPER_API_KEY,
        'country_code': 'in',  # CRITICAL: Use Indian IPs
    }
    
    # Add JavaScript rendering if required
    if config.get('requires_js', False):
        params.update({
            'render': 'true',
            'wait_for_selector': config['selectors']['container'][0] if isinstance(config['selectors']['container'], list) else config['selectors']['container']
        })
    
    # Use premium (residential) proxies for better success
    if use_premium and platform_key in ['flipkart', 'myntra', 'ajio']:
        params['premium'] = 'true'
    
    # Session persistence for multi-page scraping
    if platform_key in ['flipkart', 'myntra']:
        params['session_number'] = str(hash(query) % 10000)
    
    # Mobile user agents for grocery platforms
    if platform_key in ['swiggy_instamart', 'blinkit', 'bigbasket']:
        params['device_type'] = 'mobile'
    
    return params

def get_platform_headers(platform_key: str) -> dict:
    """Get platform-specific headers"""
    base_headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',  # Hindi support for Indian sites
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
    }
    
    # Platform-specific user agents
    user_agents = {
        'flipkart': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'myntra': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'ajio': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'swiggy_instamart': 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'blinkit': 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'default': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    base_headers['User-Agent'] = user_agents.get(platform_key, user_agents['default'])
    
    # Add referer for better success
    if platform_key == 'flipkart':
        base_headers['Referer'] = 'https://www.google.com/'
    elif platform_key == 'myntra':
        base_headers['Referer'] = 'https://www.myntra.com/'
    
    return base_headers

# ===== RATE LIMITING AND DELAYS =====

def get_platform_delay(platform_key: str) -> tuple:
    """Get platform-specific delay ranges (min, max) in seconds"""
    delays = {
        'myntra': (12, 20),      # Most restrictive
        'flipkart': (8, 15),      
        'ajio': (8, 12),
        'amazon': (3, 8),
        'croma': (5, 10),
        'reliance_digital': (5, 10),
        'swiggy_instamart': (3, 6),
        'blinkit': (3, 6),
        'bigbasket': (4, 8)
    }
    return delays.get(platform_key, (5, 10))

def apply_rate_limiting(platform_key: str):
    """Apply platform-specific rate limiting"""
    min_delay, max_delay = get_platform_delay(platform_key)
    delay = random.uniform(min_delay, max_delay)
    logger.info(f"Rate limiting for {platform_key}: waiting {delay:.1f}s")
    time.sleep(delay)

# ===== ENHANCED SCRAPING FUNCTIONS =====

def scrape_with_scraperapi(url: str, platform_key: str, query: str) -> requests.Response:
    """Enhanced ScraperAPI request with platform optimization"""
    if not SCRAPER_API_KEY:
        logger.warning("ScraperAPI key not configured, falling back to direct request")
        headers = get_platform_headers(platform_key)
        return requests.get(url, headers=headers, timeout=10)
    
    api_url = "http://api.scraperapi.com"
    params = get_scraperapi_params(platform_key, query)
    params['url'] = url
    
    logger.info(f"ScraperAPI request for {platform_key}: render={params.get('render')}, premium={params.get('premium')}")
    
    try:
        response = requests.get(api_url, params=params, timeout=30)
        
        # Log credit usage
        if 'sa-credit-cost' in response.headers:
            logger.info(f"Credits used for {platform_key}: {response.headers['sa-credit-cost']}")
        
        return response
    except Exception as e:
        logger.error(f"ScraperAPI error for {platform_key}: {e}")
        raise

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

def extract_myntra_json_data(html: str) -> list:
    """Extract product data from Myntra's JSON in script tags"""
    products = []
    soup = BeautifulSoup(html, 'html.parser')
    
    # Look for pdpData in script tags
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and 'pdpData' in script.string:
            try:
                # Extract JSON from JavaScript
                match = re.search(r'window\.__myx\s*=\s*({.*?});', script.string, re.DOTALL)
                if match:
                    data = json.loads(match.group(1))
                    if 'pdpData' in data:
                        pdp = data['pdpData']
                        products.append({
                            'title': pdp.get('name', 'Unknown Product'),
                            'price': pdp.get('price', {}).get('discounted', 0),
                            'brand': pdp.get('brand', {}).get('name', ''),
                            'image': pdp.get('media', {}).get('albums', [{}])[0].get('images', [{}])[0].get('imageURL', '')
                        })
            except Exception as e:
                logger.error(f"Failed to extract Myntra JSON: {e}")
    
    return products

def clean_price(price_text):
    """Extract numeric price from text"""
    if not price_text:
        return 0
    price_text = re.sub(r'[^\d.]', '', str(price_text))
    try:
        price = float(price_text)
        if 0 < price < 10000000:  # Sanity check
            return price
    except:
        pass
    return 0

def scrape_platform(platform_key: str, query: str) -> list:
    """Enhanced platform scraping with proper error handling"""
    if platform_key not in PLATFORM_CONFIGS:
        return []
    
    config = PLATFORM_CONFIGS[platform_key]
    results = []
    
    try:
        logger.info(f"🔍 Scraping {config['name']} for: {query}")
        
        # Format search URL
        search_url = config['search_url'].format(query=query.replace(' ', '+'))
        
        # Apply rate limiting
        apply_rate_limiting(platform_key)
        
        # Scrape with ScraperAPI
        response = scrape_with_scraperapi(search_url, platform_key, query)
        
        if response.status_code == 200:
            # Special handling for Myntra
            if platform_key == 'myntra':
                json_products = extract_myntra_json_data(response.text)
                for prod in json_products[:10]:
                    results.append({
                        'price': prod['price'],
                        'title': f"{prod['brand']} {prod['title']}"[:200],
                        'platform': config['name'],
                        'url': search_url,
                        'image': prod['image']
                    })
                if results:
                    logger.info(f"✅ Extracted {len(results)} products from Myntra JSON")
                    return results
            
            # Regular HTML parsing for other platforms
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find product containers
            containers = []
            container_selectors = config['selectors']['container']
            if isinstance(container_selectors, list):
                for selector in container_selectors:
                    found = soup.select(selector)[:10]
                    if found:
                        containers.extend(found)
                        logger.info(f"Found {len(found)} containers with selector: {selector}")
                        break
            else:
                containers = soup.select(container_selectors)[:10]
            
            logger.info(f"Found {len(containers)} product containers on {config['name']}")
            
            for i, container in enumerate(containers):
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
                        link = search_url
                        if config['selectors'].get('link'):
                            link_elem = extract_with_multiple_selectors(container, config['selectors']['link'])
                            if link_elem and link_elem.get('href'):
                                href = link_elem['href']
                                if href.startswith('http'):
                                    link = href
                                elif href.startswith('/'):
                                    link = config['base_url'] + href
                        
                        # Extract image
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
                        
                        logger.info(f"✅ Scraped: {title[:50]}... - ₹{price} from {config['name']}")
                
                except Exception as e:
                    logger.error(f"Error parsing item {i} on {config['name']}: {e}")
                    continue
            
            logger.info(f"Successfully scraped {len(results)} products from {config['name']}")
        else:
            logger.error(f"{config['name']} returned status: {response.status_code}")
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout scraping {config['name']}")
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error scraping {config['name']}")
    except Exception as e:
        logger.error(f"Failed to scrape {config['name']}: {e}")
    
    return results

def scrape_all_platforms(query: str, platforms: list = None) -> list:
    """Scrape all relevant platforms sequentially with proper delays"""
    if not platforms:
        platforms = get_relevant_platforms(query)
    
    all_results = []
    
    # Scrape platforms sequentially to respect rate limits
    for platform in platforms:
        try:
            results = scrape_platform(platform, query)
            all_results.extend(results)
            logger.info(f"Collected {len(results)} results from {platform}")
        except Exception as e:
            logger.error(f"Platform {platform} scraping failed: {e}")
    
    return all_results

# ===== IMPROVED CATEGORY DETECTION =====

def detect_product_category(query: str) -> str:
    """Enhanced category detection"""
    query_lower = query.lower().strip()
    
    # Remove price-related words
    remove_words = ['price', 'prices', 'cost', 'cheap', 'cheapest', 'find', 'search', 'buy', 'get']
    words = query_lower.split()
    cleaned_words = [w for w in words if w not in remove_words]
    cleaned_query = ' '.join(cleaned_words)
    
    logger.info(f"Category detection - Original: '{query}', Cleaned: '{cleaned_query}'")
    
    # Fashion/Footwear keywords
    fashion_keywords = [
        'shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'slippers', 'heels',
        'nike', 'adidas', 'puma', 'reebok',
        'shirt', 'tshirt', 'jeans', 'pants', 'dress', 'jacket', 'kurta', 'saree'
    ]
    
    # Electronics keywords  
    electronics_keywords = [
        'phone', 'mobile', 'iphone', 'samsung', 'oneplus', 'laptop', 'macbook',
        'tablet', 'ipad', 'tv', 'television', 'headphones', 'earphones', 'camera',
        'watch', 'smartwatch', 'playstation', 'xbox'
    ]
    
    # Grocery keywords
    grocery_keywords = [
        'milk', 'bread', 'rice', 'dal', 'atta', 'oil', 'ghee', 'sugar', 'salt',
        'fruits', 'vegetables', 'apple', 'banana', 'onion', 'potato', 'eggs',
        'biscuits', 'chips', 'chocolate', 'grocery', 'food'
    ]
    
    # Check categories
    if any(keyword in cleaned_query for keyword in fashion_keywords):
        return 'fashion'
    elif any(keyword in cleaned_query for keyword in electronics_keywords):
        return 'electronics'
    elif any(keyword in cleaned_query for keyword in grocery_keywords):
        return 'grocery'
    else:
        return 'general'

def get_relevant_platforms(query: str) -> list:
    """Get platforms based on category with priority order"""
    category = detect_product_category(query)
    logger.info(f"Detected category: {category} for query: {query}")
    
    platform_mapping = {
        'grocery': ['amazon', 'bigbasket', 'blinkit', 'swiggy_instamart'],
        'electronics': ['amazon', 'flipkart', 'croma', 'reliance_digital'],
        'fashion': ['myntra', 'ajio', 'amazon', 'flipkart'],
        'general': ['amazon', 'flipkart', 'myntra']
    }
    
    platforms = platform_mapping.get(category, ['amazon', 'flipkart'])
    logger.info(f"Selected platforms: {platforms}")
    return platforms

# ===== FLASK ROUTES =====

@app.route('/')
def home():
    return jsonify({
        'status': 'active',
        'service': 'Enhanced Multi-Platform Price Scraper',
        'version': '2.0.0',
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
            key: {
                'name': config['name'],
                'requires_js': config.get('requires_js', False),
                'credits': config.get('credits', 1)
            } for key, config in PLATFORM_CONFIGS.items()
        }
    })

@app.route('/scrape/prices/', methods=['POST', 'OPTIONS'])
@app.route('/scrape/prices', methods=['POST', 'OPTIONS'])
def scrape_prices_endpoint():
    """Main scraping endpoint with enhanced error handling"""
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
        
        logger.info(f"📦 Scraping request for: {product_name}")
        
        # Get category and platforms
        category = detect_product_category(product_name)
        platforms = custom_platforms if custom_platforms else get_relevant_platforms(product_name)
        
        # Limit platforms for Railway timeout (max 3 platforms)
        if len(platforms) > 3:
            logger.warning(f"Limiting to 3 platforms due to Railway timeout constraints")
            platforms = platforms[:3]
        
        # Scrape all platforms
        start_time = time.time()
        products = scrape_all_platforms(product_name, platforms)
        scraping_time = time.time() - start_time
        
        # Sort by price
        products.sort(key=lambda x: x['price'])
        
        # Calculate statistics
        platforms_with_results = list(set(p['platform'] for p in products))
        
        # Prepare response
        response_data = {
            'success': len(products) > 0,
            'products': products,
            'product_searched': product_name,
            'category': category,
            'platforms_searched': platforms,
            'platforms_with_results': platforms_with_results,
            'total_results': len(products),
            'cheapest': products[0] if products else None,
            'scraping_time': round(scraping_time, 2),
            'timestamp': time.time()
        }
        
        logger.info(f"✅ Completed: {len(products)} products from {len(platforms_with_results)} platforms in {scraping_time:.2f}s")
        
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
    remove_words = ['find', 'search', 'price', 'prices', 'cost', 'cheap', 'cheapest', 'for', 'of']
    product_words = [w for w in words if w not in remove_words]
    product_name = ' '.join(product_words).strip()
    
    if not product_name:
        return jsonify({
            'success': False,
            'error': 'Could not extract product name'
        }), 400
    
    # Forward to scrape endpoint
    data['product_name'] = product_name
    request.get_json = lambda: data
    return scrape_prices_endpoint()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"""
    🚀 Enhanced Multi-Platform Price Scraper v2.0
    📍 Port: {port}
    🔑 ScraperAPI: {'Configured ✅' if SCRAPER_API_KEY else 'Not configured ❌'}
    
    📋 Enhanced Platform Support:
    • Fashion: Myntra, Ajio, Amazon, Flipkart
    • Electronics: Amazon, Flipkart, Croma, Reliance Digital
    • Grocery: BigBasket, Swiggy Instamart, Blinkit
    
    ✨ New Features:
    • Updated CSS selectors (December 2024)
    • Indian proxy support (country_code=in)
    • JavaScript rendering for dynamic content
    • Platform-specific rate limiting
    • Enhanced error handling
    • Credit usage optimization
    """)
    app.run(host='0.0.0.0', port=port, debug=False)
