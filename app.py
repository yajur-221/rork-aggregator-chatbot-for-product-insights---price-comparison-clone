#!/usr/bin/env python3
"""
Enhanced Multi-Platform Price Scraper with Multiple Strategies
Supports: Amazon, Flipkart, Croma, Myntra, Ajio, BigBasket, and more
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
from functools import lru_cache
import hashlib

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Multiple scraping service keys for redundancy
SCRAPER_SERVICES = {
    'scraperapi': os.environ.get('SCRAPER_API_KEY', ''),
    'scrapingbee': os.environ.get('SCRAPINGBEE_API_KEY', ''),
    'brightdata': os.environ.get('BRIGHTDATA_API_KEY', ''),
}

# Simple in-memory cache (use Redis in production)
CACHE = {}
CACHE_TTL = 3600  # 1 hour

print(f"🚀 Starting Enhanced Price Scraper v3.0")
print(f"🔑 Services: ScraperAPI={'✅' if SCRAPER_SERVICES['scraperapi'] else '❌'}, "
      f"ScrapingBee={'✅' if SCRAPER_SERVICES['scrapingbee'] else '❌'}")

# ===== PLATFORM CONFIGURATIONS =====

PLATFORMS = {
    'amazon': {
        'name': 'Amazon India',
        'base_url': 'https://www.amazon.in',
        'search_url': 'https://www.amazon.in/s?k={query}',
        'selectors': [
            {
                'container': 'div[data-component-type="s-search-result"]',
                'title': ['h2 a span', 'h2 span.a-text-normal'],
                'price': ['span.a-price-whole', 'span.a-offscreen'],
                'image': 'img.s-image',
                'link': 'h2 a',
            },
            {
                'container': 'div[data-asin][data-index]',
                'title': ['h2', 'span.a-size-medium'],
                'price': ['span.a-price', 'span.a-color-price'],
                'image': 'img',
                'link': 'a.a-link-normal',
            }
        ],
        'requires_js': False,
        'priority': 1
    },
    'flipkart': {
        'name': 'Flipkart',
        'base_url': 'https://www.flipkart.com',
        'search_url': 'https://www.flipkart.com/search?q={query}',
        'selectors': [
            {
                'container': 'div._1AtVbE',
                'title': ['div._4rR01T', 'a.s1Q9rs', 'a.IRpwTa'],
                'price': ['div._30jeq3', 'div._1_WHN1'],
                'image': ['img._396cs4', 'img._2r_T1I'],
                'link': ['a._1fQZEK', 'a.IRpwTa'],
            },
            {
                'container': 'div._2kHMtA',
                'title': ['div._2WkVRV', 'a.s1Q9rs'],
                'price': ['div._30jeq3'],
                'image': 'img',
                'link': 'a',
            }
        ],
        'requires_js': True,
        'priority': 1
    },
    'myntra': {
        'name': 'Myntra',
        'base_url': 'https://www.myntra.com',
        'search_url': 'https://www.myntra.com/{query}',
        'api_url': 'https://www.myntra.com/gateway/v2/search/{query}',
        'selectors': [
            {
                'container': 'li.product-base',
                'title': ['h3.product-brand', 'h4.product-product'],
                'price': ['span.product-discountedPrice'],
                'image': 'img.img-responsive',
                'link': 'a',
            }
        ],
        'requires_js': True,
        'use_api': True,
        'priority': 2
    },
    'croma': {
        'name': 'Croma',
        'base_url': 'https://www.croma.com',
        'search_url': 'https://www.croma.com/searchB?q={query}',
        'selectors': [
            {
                'container': 'li.product-item',
                'title': ['h3.product-title', 'a.product-title'],
                'price': ['span.new-price', 'span.amount'],
                'image': 'img.product-img',
                'link': 'a.product-title',
            }
        ],
        'requires_js': False,
        'priority': 2
    },
}

# ===== CACHING =====

def get_cache_key(platform, query):
    """Generate cache key"""
    key = f"{platform}:{query}"
    return hashlib.md5(key.encode()).hexdigest()

def get_cached(platform, query):
    """Get cached results"""
    key = get_cache_key(platform, query)
    if key in CACHE:
        data, timestamp = CACHE[key]
        if time.time() - timestamp < CACHE_TTL:
            logger.info(f"Cache hit for {platform}:{query}")
            return data
    return None

def set_cache(platform, query, data):
    """Set cache"""
    key = get_cache_key(platform, query)
    CACHE[key] = (data, time.time())
    logger.info(f"Cached results for {platform}:{query}")

# ===== SCRAPING SERVICES =====

def scrape_with_scraperapi(url, platform_key, query, use_premium=False):
    """ScraperAPI with enhanced parameters"""
    if not SCRAPER_SERVICES['scraperapi']:
        raise Exception("ScraperAPI key not configured")
    
    config = PLATFORMS[platform_key]
    
    params = {
        'api_key': SCRAPER_SERVICES['scraperapi'],
        'url': url,
        'country_code': 'in',
        'device_type': 'desktop',
    }
    
    if config.get('requires_js'):
        params['render'] = 'true'
        params['wait_for_selector'] = config['selectors'][0]['container']
    
    if use_premium:
        params['premium'] = 'true'
        params['session_number'] = str(hash(query) % 10000)
    
    logger.info(f"ScraperAPI request: {platform_key}, JS={params.get('render')}, Premium={use_premium}")
    
    try:
        response = requests.get('http://api.scraperapi.com', params=params, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"ScraperAPI failed: {e}")
        raise

def scrape_with_scrapingbee(url, platform_key):
    """ScrapingBee as fallback"""
    if not SCRAPER_SERVICES['scrapingbee']:
        raise Exception("ScrapingBee key not configured")
    
    config = PLATFORMS[platform_key]
    
    params = {
        'api_key': SCRAPER_SERVICES['scrapingbee'],
        'url': url,
        'country_code': 'in',
        'render_js': 'true' if config.get('requires_js') else 'false',
        'wait': '2000' if config.get('requires_js') else '0',
    }
    
    try:
        response = requests.get('https://app.scrapingbee.com/api/v1/', params=params, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"ScrapingBee failed: {e}")
        raise

def scrape_direct(url, platform_key):
    """Direct scraping as last resort"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"Direct scraping failed: {e}")
        raise

def scrape_with_fallback(url, platform_key, query):
    """Try multiple scraping methods"""
    methods = [
        ('ScraperAPI', lambda: scrape_with_scraperapi(url, platform_key, query)),
        ('ScraperAPI Premium', lambda: scrape_with_scraperapi(url, platform_key, query, use_premium=True)),
        ('ScrapingBee', lambda: scrape_with_scrapingbee(url, platform_key)),
        ('Direct', lambda: scrape_direct(url, platform_key)),
    ]
    
    for method_name, method in methods:
        try:
            logger.info(f"Trying {method_name} for {platform_key}")
            html = method()
            if html and len(html) > 1000:
                logger.info(f"✅ {method_name} succeeded for {platform_key}")
                return html
        except Exception as e:
            logger.warning(f"❌ {method_name} failed: {e}")
            continue
    
    raise Exception(f"All scraping methods failed for {platform_key}")

# ===== PARSING =====

def try_selectors(container, selectors):
    """Try multiple selectors"""
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

def clean_price(price_text):
    """Extract numeric price"""
    if not price_text:
        return 0
    price_text = re.sub(r'[^\d.]', '', str(price_text))
    try:
        price = float(price_text)
        if 0 < price < 10000000:
            return price
    except:
        pass
    return 0

def parse_products(html, platform_key):
    """Parse products from HTML with multiple selector strategies"""
    config = PLATFORMS[platform_key]
    soup = BeautifulSoup(html, 'html.parser')
    products = []
    
    for selector_set in config['selectors']:
        containers = soup.select(selector_set['container'])[:15]
        
        if not containers:
            continue
        
        logger.info(f"Found {len(containers)} containers with selector: {selector_set['container']}")
        
        for i, container in enumerate(containers):
            try:
                title_elem = try_selectors(container, selector_set['title'])
                title = title_elem.text.strip()[:200] if title_elem else None
                
                price_elem = try_selectors(container, selector_set['price'])
                price = clean_price(price_elem.text) if price_elem else 0
                
                if not title or price <= 0:
                    continue
                
                link_elem = try_selectors(container, selector_set['link'])
                link = config['base_url']
                if link_elem and link_elem.get('href'):
                    href = link_elem['href']
                    if href.startswith('http'):
                        link = href
                    elif href.startswith('/'):
                        link = config['base_url'] + href
                
                img_elem = try_selectors(container, selector_set['image'])
                image = None
                if img_elem:
                    image = img_elem.get('src') or img_elem.get('data-src')
                
                products.append({
                    'title': title,
                    'price': price,
                    'url': link,
                    'image': image,
                    'platform': config['name']
                })
                
                logger.info(f"✅ Parsed: {title[:50]}... - ₹{price}")
            
            except Exception as e:
                logger.error(f"Error parsing item {i}: {e}")
                continue
        
        if products:
            break
    
    return products

# ===== MYNTRA API =====

def scrape_myntra_api(query):
    """Use Myntra's API directly"""
    try:
        api_url = f"https://www.myntra.com/gateway/v2/search/{query.replace(' ', '%20')}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        if response.ok:
            data = response.json()
            products = []
            
            for item in data.get('products', [])[:10]:
                try:
                    products.append({
                        'title': f"{item.get('brand', '')} {item.get('product', '')}",
                        'price': item.get('price', 0),
                        'url': f"https://www.myntra.com/{item.get('landingPageUrl', '')}",
                        'image': item.get('searchImage', ''),
                        'platform': 'Myntra'
                    })
                except:
                    continue
            
            if products:
                logger.info(f"✅ Myntra API returned {len(products)} products")
                return products
    except Exception as e:
        logger.error(f"Myntra API failed: {e}")
    
    return []

# ===== MAIN SCRAPING =====

def scrape_platform(platform_key, query):
    """Scrape a single platform with caching"""
    # Check cache first
    cached = get_cached(platform_key, query)
    if cached:
        return cached
    
    config = PLATFORMS[platform_key]
    results = []
    
    try:
        logger.info(f"🔍 Scraping {config['name']} for: {query}")
        
        # Special case: Myntra API
        if platform_key == 'myntra' and config.get('use_api'):
            results = scrape_myntra_api(query)
            if results:
                set_cache(platform_key, query, results)
                return results
        
        # Regular scraping
        search_url = config['search_url'].format(query=query.replace(' ', '+'))
        
        # Rate limiting
        time.sleep(random.uniform(2, 5))
        
        # Scrape with fallback
        html = scrape_with_fallback(search_url, platform_key, query)
        
        # Parse
        results = parse_products(html, platform_key)
        
        if results:
            logger.info(f"✅ {config['name']}: {len(results)} products")
            set_cache(platform_key, query, results)
        else:
            logger.warning(f"⚠️ {config['name']}: No products found")
    
    except Exception as e:
        logger.error(f"❌ {config['name']} failed: {e}")
    
    return results

def scrape_all_platforms(query, requested_platforms=None):
    """Scrape all relevant platforms in parallel"""
    if not requested_platforms:
        requested_platforms = get_relevant_platforms(query)
    
    # Sort by priority
    sorted_platforms = sorted(
        requested_platforms,
        key=lambda p: PLATFORMS.get(p, {}).get('priority', 99)
    )
    
    all_results = []
    
    # Use ThreadPoolExecutor for parallel scraping
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_platform = {
            executor.submit(scrape_platform, platform, query): platform
            for platform in sorted_platforms
        }
        
        for future in as_completed(future_to_platform):
            platform = future_to_platform[future]
            try:
                results = future.result(timeout=40)
                all_results.extend(results)
            except Exception as e:
                logger.error(f"Platform {platform} failed: {e}")
    
    return all_results

def get_relevant_platforms(query):
    """Determine relevant platforms based on query"""
    query_lower = query.lower()
    
    # Fashion
    if any(k in query_lower for k in ['shirt', 'jeans', 'dress', 'shoes', 'clothing']):
        return ['myntra', 'amazon', 'flipkart']
    
    # Electronics
    if any(k in query_lower for k in ['phone', 'laptop', 'tv', 'camera', 'headphone']):
        return ['amazon', 'flipkart', 'croma']
    
    # Default
    return ['amazon', 'flipkart']

# ===== API ENDPOINTS =====

@app.route('/')
def home():
    return jsonify({
        'status': 'active',
        'version': '3.0',
        'platforms': list(PLATFORMS.keys()),
        'services': {
            'scraperapi': bool(SCRAPER_SERVICES['scraperapi']),
            'scrapingbee': bool(SCRAPER_SERVICES['scrapingbee']),
        }
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

@app.route('/scrape/prices/', methods=['POST', 'OPTIONS'])
def scrape_prices():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json() or {}
        product_name = data.get('product_name', '').strip()
        platforms = data.get('platforms')
        
        if not product_name:
            return jsonify({'success': False, 'error': 'Missing product_name'}), 400
        
        logger.info(f"📦 Request: {product_name}")
        
        start_time = time.time()
        products = scrape_all_platforms(product_name, platforms)
        scraping_time = time.time() - start_time
        
        products.sort(key=lambda x: x['price'])
        
        platforms_searched = platforms or get_relevant_platforms(product_name)
        platforms_with_results = list(set(p['platform'] for p in products))
        
        response = {
            'success': len(products) > 0,
            'products': products,
            'product_searched': product_name,
            'platforms_searched': platforms_searched,
            'platforms_with_results': platforms_with_results,
            'total_results': len(products),
            'cheapest': products[0] if products else None,
            'scraping_time': round(scraping_time, 2),
            'timestamp': time.time()
        }
        
        logger.info(f"✅ Completed: {len(products)} products from {len(platforms_with_results)} platforms")
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
