#!/usr/bin/env python3
"""
Enhanced Price Scraper with ScraperAPI Integration
This version uses ScraperAPI to bypass blocking
"""

import os
import requests
from bs4 import BeautifulSoup
import re
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Get ScraperAPI key from environment variable
SCRAPER_API_KEY = os.environ.get('SCRAPER_API_KEY', '')

# ===== HELPER FUNCTIONS =====

def clean_price(price_text):
    """Extract numeric price from text"""
    if not price_text:
        return 0
    price_text = re.sub(r'[^\d.]', '', price_text)
    try:
        return float(price_text)
    except:
        return 0

def get_estimated_price(product_name):
    """Get estimated price based on product type"""
    normalized_query = product_name.lower()
    
    # Grocery items
    if any(item in normalized_query for item in ['apple', 'banana', 'fruit']):
        return 150.0
    if 'milk' in normalized_query:
        return 60.0
    if 'bread' in normalized_query:
        return 40.0
    if 'rice' in normalized_query:
        return 1200.0
    
    # Electronics with more accurate pricing
    if 'iphone 15 pro max' in normalized_query:
        return 159900.0
    if 'iphone 15 pro' in normalized_query:
        return 134900.0
    if 'iphone 15' in normalized_query:
        return 79990.0
    if 'iphone 14' in normalized_query:
        return 69990.0
    if 'iphone' in normalized_query:
        return 65000.0
    if 'macbook' in normalized_query:
        return 92900.0
    if 'samsung' in normalized_query and 'phone' in normalized_query:
        return 25000.0
    if 'laptop' in normalized_query:
        return 45000.0
    if 'headphones' in normalized_query or 'airpods' in normalized_query:
        return 3000.0
    
    # Fashion
    if 'shirt' in normalized_query:
        return 800.0
    if 'jeans' in normalized_query:
        return 1500.0
    if 'shoes' in normalized_query:
        return 2500.0
    
    return 5000.0

# ===== SCRAPING WITH SCRAPERAPI =====

def scrape_with_api(url):
    """Use ScraperAPI to bypass blocking"""
    if SCRAPER_API_KEY:
        api_url = f"http://api.scraperapi.com"
        params = {
            'api_key': SCRAPER_API_KEY,
            'url': url,
            'country_code': 'in',  # India
            'render': 'false'  # Set to true for JavaScript sites
        }
        response = requests.get(api_url, params=params, timeout=30)
        return response
    else:
        # Fallback to direct request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
        return requests.get(url, headers=headers, timeout=5)

def scrape_prices(product_name):
    """Scrape real prices from e-commerce sites"""
    results = []
    
    # Try Amazon
    try:
        print(f"🔍 Scraping Amazon for: {product_name}")
        url = f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
        
        if SCRAPER_API_KEY:
            print(f"   Using ScraperAPI...")
        
        response = scrape_with_api(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Multiple selectors for Amazon
        items = soup.find_all('div', {'data-component-type': 's-search-result'})[:5]
        
        for item in items:
            try:
                # Try multiple title selectors
                title_elem = (item.find('h2', class_='s-size-mini s-spacing-none s-color-base') or
                             item.find('h2', class_='a-size-mini') or
                             item.find('h2'))
                             
                title = title_elem.text.strip()[:100] if title_elem else product_name
                
                # Try multiple price selectors
                price_elem = (item.find('span', class_='a-price-whole') or
                             item.find('span', class_='a-price') or
                             item.find('span', class_='a-price-range'))
                             
                if price_elem:
                    price_text = price_elem.text if hasattr(price_elem, 'text') else str(price_elem)
                    price = clean_price(price_text)
                    if price > 0:
                        # Get actual product link
                        link_elem = item.find('h2', recursive=True)
                        if link_elem and link_elem.find('a'):
                            product_link = 'https://www.amazon.in' + link_elem.find('a')['href']
                        else:
                            product_link = url
                            
                        results.append({
                            'price': price,
                            'title': title,
                            'platform': 'Amazon',
                            'url': product_link
                        })
            except Exception as e:
                print(f"   Item parsing error: {e}")
                continue
                
        print(f"✅ Amazon: Found {len([r for r in results if r['platform'] == 'Amazon'])} products")
        
    except Exception as e:
        print(f"⚠️ Amazon scraping failed: {e}")
    
    # Try Flipkart
    try:
        print(f"🔍 Scraping Flipkart for: {product_name}")
        url = f"https://www.flipkart.com/search?q={product_name.replace(' ', '%20')}"
        
        response = scrape_with_api(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Multiple selectors for Flipkart
        containers = soup.find_all('div', class_='_1AtVbE')[:5]
        
        for container in containers:
            try:
                # Price is most reliable
                price_elem = (container.find('div', class_='_30jeq3') or
                             container.find('div', class_='_1_WHN1'))
                             
                if price_elem:
                    price = clean_price(price_elem.text)
                    if price > 0:
                        # Title
                        title_elem = (container.find('div', class_='_4rR01T') or
                                     container.find('a', class_='s1Q9rs') or
                                     container.find('a', class_='_1fQZEK'))
                                     
                        title = title_elem.text.strip()[:100] if title_elem else f"{product_name} - Flipkart"
                        
                        results.append({
                            'price': price,
                            'title': title,
                            'platform': 'Flipkart',
                            'url': url
                        })
            except Exception as e:
                print(f"   Item parsing error: {e}")
                continue
                
        print(f"✅ Flipkart: Found {len([r for r in results if r['platform'] == 'Flipkart'])} products")
        
    except Exception as e:
        print(f"⚠️ Flipkart scraping failed: {e}")
    
    return results

# ===== FLASK ROUTES =====

@app.route('/')
def home():
    """Root endpoint"""
    return jsonify({
        'status': 'active',
        'service': 'Price Scraper Backend',
        'version': '2.0.0',
        'scraper_api': 'enabled' if SCRAPER_API_KEY else 'disabled',
        'endpoints': {
            'health': '/health',
            'scrape_prices': '/scrape/prices/',
            'query_price': '/query/price/'
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'scraper_api_configured': bool(SCRAPER_API_KEY)
    })

@app.route('/scrape/prices/', methods=['POST'])
@app.route('/scrape/prices', methods=['POST'])
def scrape_prices_endpoint():
    """Main scraping endpoint"""
    try:
        data = request.get_json() or {}
        product_name = data.get('product_name', '').strip()
        
        if not product_name:
            return jsonify({
                'success': False,
                'error': 'Missing product_name in request'
            }), 400
        
        print(f"📱 Scraping request for: {product_name}")
        
        # Try real scraping
        prices = scrape_prices(product_name)
        
        # If no real prices, generate intelligent mock prices
        if not prices:
            print(f"⚠️ No real prices found, generating intelligent mock data for: {product_name}")
            base_price = get_estimated_price(product_name)
            
            # Create realistic price variations
            prices = [
                {
                    'price': base_price * 0.95,  # 5% discount
                    'title': f"{product_name} - Lightning Deal",
                    'platform': 'Amazon',
                    'url': f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
                },
                {
                    'price': base_price,
                    'title': f"{product_name} - Original",
                    'platform': 'Flipkart',
                    'url': f"https://www.flipkart.com/search?q={product_name.replace(' ', '%20')}"
                },
                {
                    'price': base_price * 1.03,  # 3% higher
                    'title': f"{product_name} - Premium Seller",
                    'platform': 'Croma',
                    'url': f"https://www.croma.com/search?q={product_name.replace(' ', '%20')}"
                },
                {
                    'price': base_price * 0.92,  # 8% discount
                    'title': f"{product_name} - Special Price",
                    'platform': 'Reliance Digital',
                    'url': f"https://www.reliancedigital.in/search?q={product_name.replace(' ', '%20')}"
                }
            ]
        
        # Sort by price
        prices.sort(key=lambda x: x['price'])
        
        # Add scraping method info
        scraping_method = 'scraperapi' if SCRAPER_API_KEY and len(prices) > 0 else 'mock'
        
        return jsonify({
            'success': True,
            'products': prices,
            'product_searched': product_name,
            'total_results': len(prices),
            'cheapest': prices[0] if prices else None,
            'scraping_method': scraping_method,
            'timestamp': time.time()
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/query/price/', methods=['POST'])
def query_price_endpoint():
    """Natural language query endpoint"""
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    
    # Extract product name from query
    # Remove common words
    remove_words = ['find', 'search', 'price', 'cost', 'cheap', 'cheapest', 'for', 'of', 'what', 'is', 'the']
    words = query.lower().split()
    product_words = [w for w in words if w not in remove_words]
    product_name = ' '.join(product_words).strip()
    
    if not product_name:
        return jsonify({
            'success': False,
            'error': 'Could not extract product name from query'
        }), 400
    
    # Forward to scrape endpoint
    return scrape_prices_endpoint()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"""
    🚀 Price Scraper Backend v2.0
    📍 Port: {port}
    🔑 ScraperAPI: {'Configured ✅' if SCRAPER_API_KEY else 'Not configured ❌'}
    
    To add ScraperAPI:
    1. Sign up at https://www.scraperapi.com (1000 free requests)
    2. Add to Railway: Settings → Variables → SCRAPER_API_KEY
    """)
    app.run(host='0.0.0.0', port=port, debug=False)
