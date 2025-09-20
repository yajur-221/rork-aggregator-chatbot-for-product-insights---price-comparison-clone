import os
import sys
from pathlib import Path

# Add services directory to path so we can import your existing scraper
sys.path.append(str(Path(services/backendScraper.py).parent))

# Import your existing backend scraper
from services.backendScraper import app

# Railway sets PORT environment variable
port = int(os.environ.get('PORT', 5000))

if __name__ == '__main__':
    # For local testing
    app.run(host='0.0.0.0', port=port, debug=False)
else:
    # For production (gunicorn will use this)
    print(f"🚀 Price Scraper Backend starting on port {port}")
    print(f"📋 Available endpoints:")
    print(f"  GET  /health - Health check")
    print(f"  POST /scrape/prices/ - Scrape prices for a product")
    print(f"  POST /query/price/ - Handle natural language price queries")
