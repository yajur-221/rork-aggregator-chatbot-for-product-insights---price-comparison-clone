# Price Scraper Backend Deployment Guide

## Overview
This guide helps you deploy the Python price scraping backend that integrates with your React Native app.

## Quick Setup

### 1. Local Development
```bash
# Install dependencies
pip install flask requests beautifulsoup4 flask-cors

# Run the server
python services/backendScraper.py

# Test the endpoints
curl -X POST http://localhost:5000/scrape/prices/ \
  -H 'Content-Type: application/json' \
  -d '{"product_name": "iPhone 15"}'

curl -X POST http://localhost:5000/query/price/ \
  -H 'Content-Type: application/json' \
  -d '{"query": "find cheapest iPhone 15"}'
```

### 2. Deploy to Railway (Recommended)
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create `requirements.txt`:
```
flask==2.3.3
requests==2.31.0
beautifulsoup4==4.12.2
flask-cors==4.0.0
```
4. Create `Procfile`:
```
web: python services/backendScraper.py
```
5. Deploy and get your URL (e.g., `https://your-app.railway.app`)

### 3. Deploy to Heroku
1. Install Heroku CLI
2. Create `requirements.txt` (same as above)
3. Create `Procfile`:
```
web: python services/backendScraper.py
```
4. Deploy:
```bash
heroku create your-price-scraper
git add .
git commit -m "Deploy price scraper"
git push heroku main
```

### 4. Deploy to Vercel (Serverless)
1. Create `api/scrape.py`:
```python
from flask import Flask, request, jsonify
# Copy the scraping functions from backendScraper.py
# Export as Vercel function
```

## Integration with React Native

### Update the endpoint URL
In `services/realPriceScraper.ts`, update line 281:
```typescript
// Replace this URL with your deployed backend URL
const response = await fetch('https://your-deployed-backend.com/scrape/prices/', {
```

### Environment Variables
Create `.env` file:
```
SCRAPER_BACKEND_URL=https://your-deployed-backend.com
```

## API Endpoints

### POST /scrape/prices/
Scrape prices for a specific product.

**Request:**
```json
{
  "product_name": "iPhone 15"
}
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "price": 65000,
      "title": "iPhone 15 - Latest Model",
      "platform": "Amazon",
      "url": "https://amazon.in/..."
    }
  ],
  "product_searched": "iPhone 15",
  "total_results": 5,
  "cheapest": {
    "price": 65000,
    "title": "iPhone 15 - Latest Model",
    "platform": "Amazon",
    "url": "https://amazon.in/..."
  }
}
```

### POST /query/price/
Handle natural language price queries.

**Request:**
```json
{
  "query": "find cheapest iPhone 15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Found best prices for iPhone 15!...",
  "products": [...],
  "data": {
    "product_searched": "iPhone 15",
    "cheapest": {...},
    "all_prices": [...],
    "total_results": 5
  }
}
```

## Smart Product Categorization

The backend automatically selects appropriate sites based on product type:

- **Groceries** (apple, milk, bread) → Swiggy Instamart, Blinkit, Zepto, BigBasket
- **Electronics** (iPhone, laptop) → Amazon, Flipkart, Croma, Vijay Sales  
- **Fashion** (shirt, shoes) → Myntra, Amazon, Flipkart
- **Default** → Amazon, Flipkart, Snapdeal

## Error Handling

The backend handles:
- Network timeouts
- Site structure changes
- Invalid product names
- Rate limiting
- CORS for React Native

## Monitoring

Add logging and monitoring:
```python
import logging
logging.basicConfig(level=logging.INFO)

# Add to each endpoint
app.logger.info(f"Scraping request: {product_name}")
```

## Security

- Input validation (length limits, sanitization)
- Rate limiting (add Flask-Limiter)
- CORS configuration
- Environment variables for sensitive data

## Scaling

For high traffic:
1. Add Redis caching
2. Use Celery for background tasks
3. Deploy multiple instances
4. Add load balancer

## Testing

Test the integration:
1. Deploy backend
2. Update React Native app with new URL
3. Test price queries in your app
4. Monitor logs for errors

## Troubleshooting

**Common Issues:**
- CORS errors → Check Flask-CORS configuration
- Timeout errors → Increase timeout values
- No results → Check site selectors (they change frequently)
- Rate limiting → Add delays between requests

**Debug Mode:**
```python
app.run(host='0.0.0.0', port=5000, debug=True)
```