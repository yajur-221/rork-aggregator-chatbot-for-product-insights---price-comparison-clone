#!/usr/bin/env python3
"""
Intelligent Product Price Scraper
- Automatically detects product category (electronics, grocery, fashion)
- Searches only relevant platforms
- Shows EXACT products only (smart filtering)
- Works with both e-commerce and quick commerce
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
from difflib import SequenceMatcher

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SCRAPER_API_KEY = os.environ.get('SCRAPER_API_KEY', '')

# ===== SMART PRODUCT CATEGORIZER =====

CATEGORY_KEYWORDS = {
    'electronics': [
        'phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'galaxy', 'oneplus', 'xiaomi',
        'laptop', 'macbook', 'computer', 'dell', 'hp', 'lenovo', 'asus',
        'tv', 'television', 'led', 'smart tv', 'sony', 'lg',
        'headphones', 'earphones', 'airpods', 'earbuds', 'speaker', 'jbl', 'boat',
        'camera', 'dslr', 'canon', 'nikon',
        'tablet', 'ipad', 'kindle',
        'smartwatch', 'watch', 'fitness band',
        'charger', 'power bank', 'cable',
        'gaming', 'playstation', 'xbox', 'console',
        'processor', 'gpu', 'ram', 'ssd'
    ],
    'grocery': [
        'milk', 'bread', 'butter', 'cheese', 'yogurt', 'paneer',
        'rice', 'wheat', 'atta', 'flour', 'dal', 'lentils',
        'oil', 'ghee', 'cooking oil', 'olive oil',
        'sugar', 'salt', 'spices', 'masala', 'turmeric', 'chili',
        'tea', 'coffee', 'juice', 'water', 'beverages',
        'biscuits', 'cookies', 'chips', 'snacks', 'chocolate',
        'fruits', 'apple', 'banana', 'orange', 'mango', 'grapes',
        'vegetables', 'onion', 'potato', 'tomato', 'carrot',
        'eggs', 'chicken', 'meat', 'fish',
        'almonds', 'cashews', 'walnuts', 'nuts', 'dry fruits', 'raisins', 'dates',
        'pasta', 'noodles', 'cereals',
        'sauce', 'ketchup', 'mayonnaise', 'jam', 'honey'
    ],
    'fashion': [
        'shirt', 't-shirt', 'tshirt', 'top', 'blouse',
        'jeans', 'pants', 'trousers', 'shorts',
        'dress', 'skirt', 'saree', 'kurta', 'kurti',
        'shoes', 'sneakers', 'sandals', 'boots', 'footwear',
        'bag', 'backpack', 'handbag', 'wallet',
        'jacket', 'coat', 'sweater', 'hoodie',
        'watch', 'sunglasses', 'belt', 'cap', 'hat',
        'nike', 'adidas', 'puma', 'reebok',
        'levis', 'zara', 'h&m', 'uniqlo'
    ]
}

def categorize_product(query):
    """Smart product categorization"""
    query_lower = query.lower().strip()
    
    scores = {category: 0 for category in CATEGORY_KEYWORDS}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                # Exact word match gets higher score
                if keyword in query_lower.split():
                    scores[category] += 10
                else:
                    scores[category] += 5
    
    if max(scores.values()) > 0:
        category = max(scores, key=scores.get)
        logger.info(f"📂 Categorized '{query}' as: {category} (score: {scores[category]})")
        return category
    
    logger.info(f"📂 Categorized '{query}' as: general")
    return 'general'

# ===== PLATFORM SELECTION =====

def get_platforms_for_category(category):
    """Select platforms based on category"""
    platforms = {
        'electronics': ['amazon', 'flipkart', 'croma'],
        'grocery': ['amazon', 'bigbasket', 'blinkit', 'swiggy'],
        'fashion': ['myntra', 'amazon', 'flipkart'],
        'general': ['amazon', 'flipkart']
    }
    
    selected = platforms.get(category, platforms['general'])
    logger.info(f"🎯 Selected platforms for {category}: {selected}")
    return selected

# ===== SMART PRODUCT MATCHING =====

def calculate_similarity(str1, str2):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

def is_exact_product_match(query, product_title, threshold=0.4):
    """
    Smart matching - checks if product title matches the query
    Returns True only if it's the actual product being searched
    """
    query_lower = query.lower().strip()
    title_lower = product_title.lower().strip()
    
    # Extract main keywords from query (ignore common words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'price', 'buy', 'online'}
    query_words = [w for w in query_lower.split() if w not in stop_words and len(w) > 2]
    
    if not query_words:
        return True  # If no meaningful words, accept
    
    # Count how many query words appear in title
    matches = sum(1 for word in query_words if word in title_lower)
    match_ratio = matches / len(query_words)
    
    # Also check overall similarity
    similarity = calculate_similarity(query_lower, title_lower)
    
    # Product matches if:
    # 1. Most query words are in title (>60%), OR
    # 2. High overall similarity (>40%)
    is_match = match_ratio >= 0.6 or similarity >= threshold
    
    if not is_match:
        logger.debug(f"❌ Rejected: '{product_title[:60]}' (match: {match_ratio:.2f}, sim: {similarity:.2f})")
    else:
        logger.debug(f"✅ Accepted: '{product_title[:60]}' (match: {match_ratio:.2f}, sim: {similarity:.2f})")
    
    return is_match

# ===== SCRAPING FUNCTIONS =====

def scrape_with_api(url, platform_key, render_js=False):
    """Scrape using ScraperAPI"""
    if not SCRAPER_API_KEY:
        raise Exception("ScraperAPI key not configured")
    
    params = {
        'api_key': SCRAPER_API_KEY,
        'url': url,
        'country_code': 'in',
    }
    
    if render_js:
        params['render'] = 'true'
    
    try:
        response = requests.get('http://api.scraperapi.com', params=params, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"ScraperAPI failed for {platform_key}: {e}")
        raise

def scrape_direct(url):
    """Direct scraping with proper headers"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"Direct scraping failed: {e}")
        raise

# ===== PLATFORM-SPECIFIC SCRAPERS =====

def scrape_amazon(query):
    """Scrape Amazon India with smart filtering"""
    logger.info(f"🔍 Scraping Amazon for: {query}")
    
    search_url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
    products = []
    
    try:
        # Try with ScraperAPI first
        if SCRAPER_API_KEY:
            html = scrape_with_api(search_url, 'amazon')
        else:
            html = scrape_direct(search_url)
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Try multiple container selectors
        containers = soup.select('div[data-component-type="s-search-result"]')
        if not containers:
            containers = soup.select('div[data-asin][data-index]')
        
        logger.info(f"Found {len(containers)} items on Amazon")
        
        for container in containers[:20]:  # Check more items
            try:
                # Title
                title_elem = container.select_one('h2 span') or container.select_one('span.a-text-normal')
                if not title_elem:
                    continue
                title = title_elem.text.strip()
                
                # Smart filtering - only exact matches
                if not is_exact_product_match(query, title):
                    continue
                
                # Price
                price_elem = container.select_one('span.a-price-whole')
                if not price_elem:
                    price_elem = container.select_one('span.a-offscreen')
                
                if not price_elem:
                    continue
                
                price_text = price_elem.text.replace(',', '').replace('₹', '')
                price = float(re.sub(r'[^\d.]', '', price_text))
                
                if price <= 0:
                    continue
                
                # Link
                link_elem = container.select_one('h2 a')
                link = 'https://www.amazon.in' + link_elem['href'] if link_elem else search_url
                
                # Image
                img_elem = container.select_one('img')
                image = img_elem.get('src', '') if img_elem else ''
                
                products.append({
                    'title': title[:150],
                    'price': price,
                    'url': link,
                    'image': image,
                    'platform': 'Amazon India'
                })
                
                logger.info(f"✅ Amazon: {title[:50]}... - ₹{price}")
                
            except Exception as e:
                logger.debug(f"Error parsing Amazon item: {e}")
                continue
        
        return products[:10]  # Return top 10
        
    except Exception as e:
        logger.error(f"Amazon scraping failed: {e}")
        return []

def scrape_flipkart(query):
    """Scrape Flipkart with smart filtering"""
    logger.info(f"🔍 Scraping Flipkart for: {query}")
    
    search_url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
    products = []
    
    try:
        # Flipkart requires JS rendering
        if SCRAPER_API_KEY:
            html = scrape_with_api(search_url, 'flipkart', render_js=True)
        else:
            logger.warning("Flipkart needs ScraperAPI with JS rendering")
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Multiple selector strategies
        containers = soup.select('div._1AtVbE, div._13oc-S, div._2kHMtA')
        
        logger.info(f"Found {len(containers)} items on Flipkart")
        
        for container in containers[:20]:
            try:
                # Title
                title_elem = (container.select_one('div._4rR01T') or 
                             container.select_one('a.s1Q9rs') or
                             container.select_one('div._2WkVRV'))
                
                if not title_elem:
                    continue
                
                title = title_elem.text.strip()
                
                # Smart filtering
                if not is_exact_product_match(query, title):
                    continue
                
                # Price
                price_elem = container.select_one('div._30jeq3')
                if not price_elem:
                    continue
                
                price_text = price_elem.text.replace(',', '').replace('₹', '')
                price = float(re.sub(r'[^\d.]', '', price_text))
                
                if price <= 0:
                    continue
                
                # Link
                link_elem = container.select_one('a')
                link = 'https://www.flipkart.com' + link_elem['href'] if link_elem else search_url
                
                # Image
                img_elem = container.select_one('img')
                image = img_elem.get('src', '') if img_elem else ''
                
                products.append({
                    'title': title[:150],
                    'price': price,
                    'url': link,
                    'image': image,
                    'platform': 'Flipkart'
                })
                
                logger.info(f"✅ Flipkart: {title[:50]}... - ₹{price}")
                
            except Exception as e:
                logger.debug(f"Error parsing Flipkart item: {e}")
                continue
        
        return products[:10]
        
    except Exception as e:
        logger.error(f"Flipkart scraping failed: {e}")
        return []

def scrape_croma(query):
    """Scrape Croma"""
    logger.info(f"🔍 Scraping Croma for: {query}")
    
    search_url = f"https://www.croma.com/search?q={query.replace(' ', '%20')}"
    products = []
    
    try:
        if SCRAPER_API_KEY:
            html = scrape_with_api(search_url, 'croma')
        else:
            html = scrape_direct(search_url)
        
        soup = BeautifulSoup(html, 'html.parser')
        containers = soup.select('li.product-item, div.product')
        
        logger.info(f"Found {len(containers)} items on Croma")
        
        for container in containers[:20]:
            try:
                title_elem = container.select_one('h3, a.product-title')
                if not title_elem:
                    continue
                
                title = title_elem.text.strip()
                
                if not is_exact_product_match(query, title):
                    continue
                
                price_elem = container.select_one('span.new-price, span.amount')
                if not price_elem:
                    continue
                
                price_text = price_elem.text.replace(',', '').replace('₹', '')
                price = float(re.sub(r'[^\d.]', '', price_text))
                
                if price <= 0:
                    continue
                
                link_elem = container.select_one('a')
                link = 'https://www.croma.com' + link_elem['href'] if link_elem else search_url
                
                img_elem = container.select_one('img')
                image = img_elem.get('src', '') if img_elem else ''
                
                products.append({
                    'title': title[:150],
                    'price': price,
                    'url': link,
                    'image': image,
                    'platform': 'Croma'
                })
                
                logger.info(f"✅ Croma: {title[:50]}... - ₹{price}")
                
            except Exception as e:
                logger.debug(f"Error parsing Croma item: {e}")
                continue
        
        return products[:10]
        
    except Exception as e:
        logger.error(f"Croma scraping failed: {e}")
        return []

def scrape_myntra(query):
    """Scrape Myntra using their API"""
    logger.info(f"🔍 Scraping Myntra for: {query}")
    
    try:
        # Myntra has an undocumented API
        api_url = f"https://www.myntra.com/gateway/v2/search/{query.replace(' ', '%20')}"
        
        headers = {
            'User-Agent': 'Myntra/1.0 (iPhone; iOS 14.0)',
            'Accept': 'application/json'
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if not response.ok:
            return []
        
        data = response.json()
        products = []
        
        for item in data.get('products', [])[:10]:
            try:
                brand = item.get('brand', '')
                product = item.get('product', '')
                title = f"{brand} {product}".strip()
                
                if not is_exact_product_match(query, title):
                    continue
                
                price = item.get('price', 0)
                if price <= 0:
                    continue
                
                products.append({
                    'title': title[:150],
                    'price': price,
                    'url': f"https://www.myntra.com/{item.get('landingPageUrl', '')}",
                    'image': item.get('searchImage', ''),
                    'platform': 'Myntra'
                })
                
                logger.info(f"✅ Myntra: {title[:50]}... - ₹{price}")
                
            except Exception as e:
                logger.debug(f"Error parsing Myntra item: {e}")
                continue
        
        return products
        
    except Exception as e:
        logger.error(f"Myntra scraping failed: {e}")
        return []

def scrape_bigbasket(query):
    """Scrape BigBasket for groceries"""
    logger.info(f"🔍 Scraping BigBasket for: {query}")
    
    search_url = f"https://www.bigbasket.com/ps/?q={query.replace(' ', '%20')}"
    products = []
    
    try:
        if SCRAPER_API_KEY:
            html = scrape_with_api(search_url, 'bigbasket', render_js=True)
        else:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        containers = soup.select('div[qa="product"]')
        
        logger.info(f"Found {len(containers)} items on BigBasket")
        
        for container in containers[:20]:
            try:
                title_elem = container.select_one('h3, a')
                if not title_elem:
                    continue
                
                title = title_elem.text.strip()
                
                if not is_exact_product_match(query, title):
                    continue
                
                price_elem = container.select_one('span[class*="price"]')
                if not price_elem:
                    continue
                
                price_text = price_elem.text.replace(',', '').replace('₹', '')
                price = float(re.sub(r'[^\d.]', '', price_text))
                
                if price <= 0:
                    continue
                
                products.append({
                    'title': title[:150],
                    'price': price,
                    'url': search_url,
                    'image': '',
                    'platform': 'BigBasket'
                })
                
                logger.info(f"✅ BigBasket: {title[:50]}... - ₹{price}")
                
            except Exception as e:
                logger.debug(f"Error parsing BigBasket item: {e}")
                continue
        
        return products[:10]
        
    except Exception as e:
        logger.error(f"BigBasket scraping failed: {e}")
        return []

# Platform mapper
SCRAPERS = {
    'amazon': scrape_amazon,
    'flipkart': scrape_flipkart,
    'croma': scrape_croma,
    'myntra': scrape_myntra,
    'bigbasket': scrape_bigbasket,
}

# ===== MAIN SCRAPING LOGIC =====

def scrape_all(query):
    """Main function to scrape all relevant platforms"""
    logger.info(f"\n{'='*60}")
    logger.info(f"🔍 NEW SEARCH: '{query}'")
    logger.info(f"{'='*60}\n")
    
    # Step 1: Categorize product
    category = categorize_product(query)
    
    # Step 2: Get relevant platforms
    platforms = get_platforms_for_category(category)
    
    # Step 3: Scrape platforms in parallel
    all_products = []
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_platform = {
            executor.submit(SCRAPERS[platform], query): platform 
            for platform in platforms if platform in SCRAPERS
        }
        
        for future in future_to_platform:
            platform = future_to_platform[future]
            try:
                products = future.result(timeout=40)
                if products:
                    all_products.extend(products)
                    logger.info(f"✅ {platform}: Got {len(products)} products")
                else:
                    logger.warning(f"⚠️ {platform}: No products found")
            except Exception as e:
                logger.error(f"❌ {platform} failed: {e}")
    
    # Step 4: Sort by price
    all_products.sort(key=lambda x: x['price'])
    
    logger.info(f"\n📊 TOTAL RESULTS: {len(all_products)} products from {len(set(p['platform'] for p in all_products))} platforms")
    
    return all_products, category

# ===== FLASK API =====

@app.route('/')
def home():
    return jsonify({
        'status': 'active',
        'version': 'Smart Scraper v1.0',
        'features': [
            'Smart product categorization',
            'Exact product matching',
            'Category-aware platform selection',
            'Parallel scraping'
        ]
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

@app.route('/scrape/prices/', methods=['POST', 'OPTIONS'])
def scrape_endpoint():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json() or {}
        query = data.get('product_name', '').strip()
        
        if not query:
            return jsonify({'success': False, 'error': 'Missing product_name'}), 400
        
        start_time = time.time()
        products, category = scrape_all(query)
        scrape_time = time.time() - start_time
        
        platforms_with_results = list(set(p['platform'] for p in products))
        
        response = {
            'success': len(products) > 0,
            'products': products,
            'product_searched': query,
            'category': category,
            'platforms_with_results': platforms_with_results,
            'total_results': len(products),
            'cheapest': products[0] if products else None,
            'scraping_time': round(scrape_time, 2),
            'timestamp': time.time()
        }
        
        logger.info(f"\n✅ API Response: {len(products)} products in {scrape_time:.2f}s\n")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"API Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║     🚀 Smart Product Price Scraper                       ║
    ║     Port: {port}                                           ║
    ║     ScraperAPI: {'✅ Configured' if SCRAPER_API_KEY else '❌ Not configured'}                             ║
    ╚══════════════════════════════════════════════════════════╝
    
    Features:
    ✅ Smart product categorization (electronics/grocery/fashion)
    ✅ Exact product matching (filters irrelevant results)
    ✅ Category-aware platform selection
    ✅ Parallel scraping for speed
    
    Supported Platforms:
    📱 Electronics: Amazon, Flipkart, Croma
    🛒 Groceries: Amazon, BigBasket, Blinkit, Swiggy
    👕 Fashion: Myntra, Amazon, Flipkart
    """)
    
    app.run(host='0.0.0.0', port=port, debug=False)
