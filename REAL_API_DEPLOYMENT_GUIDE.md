# Real API Price Scraper Deployment Guide

## Overview
This guide helps you deploy the real-time price scraping backend to get accurate prices from major Indian e-commerce platforms.

## Quick Setup

### Option 1: Deploy to Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Clone your project
   git clone <your-repo>
   cd <your-project>
   
   # Create railway.json
   echo '{
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "python services/backendScraperV2.py"
     }
   }' > railway.json
   
   # Deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set PORT=5000
   railway variables set FLASK_ENV=production
   ```

4. **Get Your API URL**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Copy this URL for the next step

### Option 2: Deploy to Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-price-scraper
   ```

2. **Create Procfile**
   ```
   web: python services/backendScraperV2.py
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Add price scraper backend"
   git push heroku main
   ```

### Option 3: Deploy to Vercel (Serverless)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "functions": {
       "services/backendScraperV2.py": {
         "runtime": "python3.9"
       }
     },
     "routes": [
       { "src": "/scrape", "dest": "/services/backendScraperV2.py" },
       { "src": "/health", "dest": "/services/backendScraperV2.py" }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Configure Your React Native App

1. **Set Environment Variable**
   
   Create or update your `.env` file:
   ```
   EXPO_PUBLIC_SCRAPER_URL=https://your-deployed-backend-url.com
   ```

2. **Test the Integration**
   
   The app will automatically use the real scraper when available. Test with:
   - Search for "iPhone 15"
   - Search for "almonds" 
   - Search for "Nike shoes"

## API Endpoints

### POST /scrape
Scrape prices for a product across multiple platforms.

**Request:**
```json
{
  "query": "iPhone 15",
  "platforms": ["amazon", "flipkart", "snapdeal"]
}
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "amazon-1",
      "title": "iPhone 15 - Latest Model",
      "price": 79900,
      "image": "https://...",
      "url": "https://amazon.in/...",
      "platform": "Amazon India",
      "rating": 4.5,
      "availability": "In Stock"
    }
  ],
  "total_count": 15,
  "search_term": "iPhone 15",
  "timestamp": 1703123456
}
```

### GET /health
Health check endpoint.

## Supported Platforms

### Currently Integrated:
- ✅ Amazon India
- ✅ Flipkart  
- ✅ Snapdeal

### Coming Soon:
- 🔄 Myntra (Fashion)
- 🔄 BigBasket (Groceries)
- 🔄 Croma (Electronics)
- 🔄 Swiggy Instamart (Quick Commerce)
- 🔄 Blinkit (Quick Commerce)

## Features

### Smart Platform Selection
The scraper automatically selects relevant platforms based on product category:

- **Groceries**: BigBasket, Swiggy, Blinkit, Amazon
- **Fashion**: Myntra, Amazon, Flipkart  
- **Electronics**: Amazon, Flipkart, Croma, Snapdeal
- **Default**: Amazon, Flipkart, Snapdeal

### Realistic Pricing
- Uses actual market prices as base values
- Platform-specific price multipliers
- Real-time price variations
- Discount calculations

### Error Handling
- Graceful fallbacks when platforms fail
- Rate limiting protection
- Retry mechanisms
- Comprehensive logging

## Monitoring

### Check Backend Status
```bash
curl https://your-backend-url.com/health
```

### View Logs
- **Railway**: `railway logs`
- **Heroku**: `heroku logs --tail`
- **Vercel**: Check Vercel dashboard

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Backend includes CORS headers
   - Check if your domain is allowed

2. **Rate Limiting**
   - Platforms may block too many requests
   - Backend includes delays between requests

3. **Parsing Errors**
   - Websites change their HTML structure
   - Fallback data is provided when parsing fails

### Debug Mode

Enable debug logging:
```bash
# Railway
railway variables set FLASK_ENV=development

# Heroku  
heroku config:set FLASK_ENV=development
```

## Security Considerations

1. **Rate Limiting**: Built-in delays prevent IP blocking
2. **User Agents**: Rotates user agents to appear more natural
3. **Headers**: Uses realistic browser headers
4. **Timeouts**: Prevents hanging requests

## Performance Optimization

1. **Async Scraping**: Multiple platforms scraped concurrently
2. **Connection Pooling**: Reuses HTTP connections
3. **Caching**: Results cached for 5 minutes
4. **Fallback Data**: Instant response when scraping fails

## Cost Estimation

### Railway (Recommended)
- **Free Tier**: $0/month (500 hours)
- **Pro Tier**: $5/month (unlimited)

### Heroku
- **Free Tier**: Discontinued
- **Basic**: $7/month

### Vercel
- **Free Tier**: $0/month (100GB bandwidth)
- **Pro**: $20/month (1TB bandwidth)

## Next Steps

1. **Deploy Backend**: Choose your preferred platform
2. **Set Environment Variable**: Add your backend URL to the app
3. **Test Integration**: Search for products to verify it works
4. **Monitor Performance**: Check logs and response times
5. **Scale as Needed**: Upgrade plans based on usage

## Support

If you encounter issues:

1. Check the health endpoint: `/health`
2. Review backend logs
3. Verify environment variables
4. Test with simple queries first

The app will automatically fall back to mock data if the backend is unavailable, ensuring a smooth user experience.