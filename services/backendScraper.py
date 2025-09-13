#!/usr/bin/env python3
"""
Backend Price Scraper Service
This is your Python scraping code adapted for deployment as a web service

To deploy this:
1. Save this file as backend_scraper.py
2. Install dependencies: pip install flask requests beautifulsoup4 flask-cors
3. Run: python backend_scraper.py
4. Deploy to your preferred cloud service (Heroku, Railway, etc.)
"""

import requests
from bs4 import BeautifulSoup
import re
import json
from typing import Dict, List, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native

# ===== CORE SCRAPING FUNCTIONS =====

def scrape_prices(product_name: str) -> List[Dict]:
    """
    Scrape prices from multiple e-commerce sites
    Returns list of {price, title, platform, url}
    """
    results = []
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    # Clean product name
    product_name = product_name.strip()
    
    # --- AMAZON ---
    try:
        url = f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
        response = requests.get(url, headers=headers, timeout=8)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items = soup.find_all('div', {'data-component-type': 's-search-result'})[:5]
        for item in items:
            try:
                title = item.find('h2').text.strip()[:100] if item.find('h2') else ""
                price_elem = item.find('span', class_='a-price-whole')
                if price_elem:
                    price = float(re.sub(r'[^\d]', '', price_elem.text))
                    link = item.find('h2').find('a')['href'] if item.find('h2') else ""
                    if link and not link.startswith('http'):
                        link = 'https://www.amazon.in' + link
                    
                    results.append({
                        'price': price,
                        'title': title,
                        'platform': 'Amazon',
                        'url': link
                    })
            except:
                continue
    except Exception as e:
        print(f"Amazon error: {e}")
    
    # --- FLIPKART ---
    try:
        url = f"https://www.flipkart.com/search?q={product_name.replace(' ', '%20')}"
        response = requests.get(url, headers=headers, timeout=8)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Flipkart has different layouts
        price_elements = soup.find_all('div', class_='_30jeq3')[:5]
        for price_elem in price_elements:
            try:
                price = float(re.sub(r'[^\d]', '', price_elem.text))
                # Find parent container
                parent = price_elem.find_parent('div', class_='_1AtVbE')
                if parent:
                    title_elem = parent.find('div', class_='_4rR01T') or parent.find('a', class_='s1Q9rs')
                    title = title_elem.text.strip()[:100] if title_elem else "Product"
                    
                    results.append({
                        'price': price,
                        'title': title,
                        'platform': 'Flipkart',
                        'url': url
                    })
            except:
                continue
    except Exception as e:
        print(f"Flipkart error: {e}")
    
    # --- SNAPDEAL (Optional) ---
    try:
        url = f"https://www.snapdeal.com/search?keyword={product_name.replace(' ', '%20')}"
        response = requests.get(url, headers=headers, timeout=8)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items = soup.find_all('div', class_='product-tuple-listing')[:3]
        for item in items:
            try:
                title = item.find('p', class_='product-title').text.strip()[:100]
                price_text = item.find('span', class_='product-price').text
                price = float(re.sub(r'[^\d]', '', price_text))
                
                results.append({
                    'price': price,
                    'title': title,
                    'platform': 'Snapdeal',
                    'url': url
                })
            except:
                continue
    except:
        pass  # Snapdeal is optional
    
    return results

# ===== AI INTEGRATION FUNCTIONS =====

def extract_product_from_prompt(user_input: str) -> Optional[str]:
    """
    Extract product name from user's natural language input
    """
    # Convert to lowercase for easier parsing
    text = user_input.lower()
    
    # Remove common query words
    remove_words = [
        'find', 'search', 'get', 'show', 'tell', 'what', 'whats', "what's",
        'price', 'cost', 'cheap', 'cheapest', 'best', 'lowest', 'for',
        'of', 'the', 'me', 'a', 'an', 'is', 'are', 'please', 'can', 'you',
        'i', 'want', 'need', 'looking', 'buy', 'purchase', 'deal', 'on'
    ]
    
    # Remove these words
    words = text.split()
    product_words = [w for w in words if w not in remove_words]
    
    # Rejoin to get product name
    product = ' '.join(product_words).strip()
    
    # If too short, might have removed too much
    if len(product) < 3 and len(words) > 2:
        # Try a simpler approach - take everything after key phrases
        patterns = [
            r'price of (.+)',
            r'price for (.+)',
            r'search for (.+)',
            r'find (.+)',
            r'cheapest (.+)',
            r'best price on (.+)',
            r'cost of (.+)',
            r'buy (.+)',
            r'looking for (.+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                product = match.group(1).strip()
                break
    
    return product if product else None

def handle_price_query(user_input: str) -> Dict:
    """
    Main function to handle price queries from your AI app
    
    Args:
        user_input: Natural language query from user
        
    Returns:
        Dictionary with response data and formatted message
    """
    
    # Extract product name
    product = extract_product_from_prompt(user_input)
    
    if not product:
        return {
            'success': False,
            'message': "I couldn't understand what product you're looking for. Please specify the product name.",
            'data': None
        }
    
    # Get prices
    print(f"🔍 Searching for: {product}")
    prices = scrape_prices(product)
    
    if not prices:
        return {
            'success': False,
            'message': f"Sorry, I couldn't find prices for '{product}'. Try being more specific or check if the product name is correct.",
            'data': None
        }
    
    # Sort by price
    prices.sort(key=lambda x: x['price'])
    cheapest = prices[0]
    
    # Format response message
    message = f"""
✅ Found best prices for **{product}**!

🏆 **CHEAPEST OPTION:**
• Product: {cheapest['title']}
• Price: **₹{cheapest['price']:,.0f}**
• Platform: {cheapest['platform']}
• [View Product]({cheapest['url']})

📊 **PRICE COMPARISON:**"""
    
    for i, item in enumerate(prices[:5], 1):
        message += f"\n{i}. {item['platform']}: ₹{item['price']:,.0f}"
    
    return {
        'success': True,
        'message': message,
        'products': prices[:10],  # Return top 10 results
        'product_searched': product,
        'total_results': len(prices),
        'cheapest': cheapest
    }

# ===== FLASK API ENDPOINTS =====

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

@app.route('/scrape/prices/', methods=['POST'])
def scrape_prices_endpoint():
    """Main scraping endpoint for React Native app"""
    try:
        data = request.get_json()
        
        if not data or 'product_name' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing product_name in request'
            }), 400
        
        product_name = data['product_name']
        
        # Validate input
        if not product_name or len(product_name.strip()) == 0:
            return jsonify({
                'success': False,
                'error': 'Product name cannot be empty'
            }), 400
        
        if len(product_name) > 100:
            return jsonify({
                'success': False,
                'error': 'Product name too long'
            }), 400
        
        print(f"Scraping request for: {product_name}")
        
        # Scrape prices
        prices = scrape_prices(product_name)
        
        if not prices:
            return jsonify({
                'success': False,
                'message': f"No prices found for '{product_name}'",
                'products': []
            })
        
        # Sort by price
        prices.sort(key=lambda x: x['price'])
        
        return jsonify({
            'success': True,
            'products': prices,
            'product_searched': product_name,
            'total_results': len(prices),
            'cheapest': prices[0] if prices else None
        })
        
    except Exception as e:
        print(f"Error in scrape_prices_endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/query/price/', methods=['POST'])
def handle_price_query_endpoint():
    """Handle natural language price queries"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing query in request'
            }), 400
        
        user_query = data['query']
        
        # Validate input
        if not user_query or len(user_query.strip()) == 0:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        if len(user_query) > 200:
            return jsonify({
                'success': False,
                'error': 'Query too long'
            }), 400
        
        print(f"Price query: {user_query}")
        
        # Handle the query
        result = handle_price_query(user_query)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in handle_price_query_endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Price Scraper Backend Service")
    print("📋 Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /scrape/prices/ - Scrape prices for a product")
    print("  POST /query/price/ - Handle natural language price queries")
    print("")
    print("🔧 To test:")
    print("  curl -X POST http://localhost:5000/scrape/prices/ -H 'Content-Type: application/json' -d '{\"product_name\": \"iPhone 15\"}'")
    print("  curl -X POST http://localhost:5000/query/price/ -H 'Content-Type: application/json' -d '{\"query\": \"find cheapest iPhone 15\"}'")
    print("")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)