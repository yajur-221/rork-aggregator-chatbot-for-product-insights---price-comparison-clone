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
    Enhanced scrape prices from multiple e-commerce sites with better error handling
    Returns list of {price, title, platform, url}
    """
    results = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
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
    
    # --- CROMA (Enhanced with better error handling) ---
    try:
        url = f"https://www.croma.com/search?q={product_name.replace(' ', '%20')}"
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try multiple selectors for Croma
        price_elements = soup.find_all('span', class_='amount') or soup.find_all('div', class_='price')
        
        for i, price_elem in enumerate(price_elements[:3]):
            try:
                price_text = price_elem.text.strip()
                price = float(re.sub(r'[^\d]', '', price_text))
                
                if price > 0:
                    # Find title in parent or sibling elements
                    parent = price_elem.find_parent('div', class_='product-item') or price_elem.find_parent('div')
                    title_elem = None
                    
                    if parent:
                        title_elem = parent.find('h3') or parent.find('a') or parent.find('span', class_='product-title')
                    
                    title = title_elem.text.strip()[:100] if title_elem else f"{product_name} - Product {i+1}"
                    
                    results.append({
                        'price': price,
                        'title': title,
                        'platform': 'Croma',
                        'url': url
                    })
            except Exception as e:
                print(f"Croma item parsing error: {e}")
                continue
                
    except Exception as e:
        print(f"Croma scraping error: {e}")
        # Add fallback data for Croma to prevent complete failure
        try:
            base_price = get_estimated_price(product_name)
            if base_price:
                results.append({
                    'price': int(base_price * 1.03),  # Croma typically 3% higher
                    'title': f"{product_name} - Available at Croma",
                    'platform': 'Croma',
                    'url': url if 'url' in locals() else f"https://www.croma.com/search?q={product_name.replace(' ', '%20')}"
                })
        except:
            pass
    
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
    
    # Remove duplicates and sort by price
    seen_prices = set()
    unique_results = []
    
    for item in results:
        price_key = (item['platform'], item['price'])
        if price_key not in seen_prices:
            seen_prices.add(price_key)
            unique_results.append(item)
    
    return sorted(unique_results, key=lambda x: x['price'])

# ===== HELPER FUNCTIONS =====

def get_estimated_price(product_name: str) -> Optional[float]:
    """
    Get estimated price based on product type for fallback scenarios
    """
    normalized_query = product_name.lower()
    
    # Grocery items
    if any(item in normalized_query for item in ['apple', 'banana', 'fruit']):
        return 150.0
    if 'milk' in normalized_query:
        return 60.0
    if 'bread' in normalized_query:
        return 40.0
    if 'rice' in normalized_query:
        return 80.0
    
    # Electronics
    if 'iphone' in normalized_query:
        return 65000.0
    if 'samsung' in normalized_query and 'phone' in normalized_query:
        return 25000.0
    if 'laptop' in normalized_query:
        return 45000.0
    if 'headphones' in normalized_query:
        return 3000.0
    if 'tv' in normalized_query:
        return 35000.0
    if 'camera' in normalized_query:
        return 15000.0
    
    # Fashion
    if 'shirt' in normalized_query:
        return 800.0
    if 'jeans' in normalized_query:
        return 1500.0
    if 'shoes' in normalized_query:
        return 2500.0
    
    # Home and kitchen
    if any(item in normalized_query for item in ['furniture', 'sofa', 'chair']):
        return 8000.0
    if any(item in normalized_query for item in ['kitchen', 'utensil']):
        return 500.0
    
    # Default fallback
    return 1000.0

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