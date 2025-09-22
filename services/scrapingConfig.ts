/**
 * Price Scraping Configuration
 * Centralized configuration for all price scraping services
 */

export const SCRAPING_CONFIG = {
  // Backend URLs - set these environment variables
  REAL_API_BACKEND: process.env.EXPO_PUBLIC_SCRAPER_URL || 'https://your-backend.railway.app',
  PYTHON_SCRAPER_BACKEND: process.env.EXPO_PUBLIC_PYTHON_SCRAPER_URL || 'http://localhost:5000',
  
  // Scraping priorities (1 = highest priority)
  SCRAPER_PRIORITY: [
    'realApi',      // Most accurate - uses real backend scraping
    'python',       // Good fallback - Python scraper
    'realPrice',    // Mock with realistic data
    'smart',        // Enhanced mock data
    'fallback'      // Basic mock data
  ],
  
  // Platform configurations
  PLATFORMS: {
    // Grocery platforms
    GROCERY: [
      { name: 'BigBasket', key: 'bigbasket', color: '#84C225' },
      { name: 'Swiggy Instamart', key: 'swiggy', color: '#FC8019' },
      { name: 'Blinkit', key: 'blinkit', color: '#FFC300' },
      { name: 'Zepto', key: 'zepto', color: '#7C3AED' },
      { name: 'Amazon India', key: 'amazon', color: '#FF9900' }
    ],
    
    // Fashion platforms
    FASHION: [
      { name: 'Myntra', key: 'myntra', color: '#FF3F6C' },
      { name: 'Amazon India', key: 'amazon', color: '#FF9900' },
      { name: 'Flipkart', key: 'flipkart', color: '#2874F0' },
      { name: 'Ajio', key: 'ajio', color: '#D4AF37' }
    ],
    
    // Electronics platforms
    ELECTRONICS: [
      { name: 'Amazon India', key: 'amazon', color: '#FF9900' },
      { name: 'Flipkart', key: 'flipkart', color: '#2874F0' },
      { name: 'Croma', key: 'croma', color: '#1BA1E2' },
      { name: 'Snapdeal', key: 'snapdeal', color: '#E40046' },
      { name: 'Vijay Sales', key: 'vijaysales', color: '#FF6B35' }
    ],
    
    // Default platforms
    DEFAULT: [
      { name: 'Amazon India', key: 'amazon', color: '#FF9900' },
      { name: 'Flipkart', key: 'flipkart', color: '#2874F0' },
      { name: 'Snapdeal', key: 'snapdeal', color: '#E40046' }
    ]
  },
  
  // Realistic price ranges for different product categories
  PRICE_RANGES: {
    // Electronics
    'iphone 15': { min: 75000, max: 85000 },
    'iphone 14': { min: 65000, max: 75000 },
    'samsung galaxy s24': { min: 70000, max: 80000 },
    'macbook air': { min: 110000, max: 120000 },
    'laptop': { min: 35000, max: 80000 },
    'headphones': { min: 2000, max: 15000 },
    'smartphone': { min: 15000, max: 80000 },
    
    // Fashion
    'nike shoes': { min: 5000, max: 12000 },
    'adidas shoes': { min: 4500, max: 10000 },
    'jeans': { min: 1500, max: 5000 },
    'shirt': { min: 800, max: 3000 },
    'dress': { min: 1200, max: 4000 },
    
    // Groceries
    'almonds': { min: 600, max: 1200 },
    'cashews': { min: 900, max: 1500 },
    'walnuts': { min: 800, max: 1300 },
    'milk': { min: 50, max: 80 },
    'bread': { min: 30, max: 60 },
    'rice': { min: 60, max: 120 },
    'dal': { min: 80, max: 200 },
    
    // Default
    'default': { min: 500, max: 50000 }
  },
  
  // Timeout configurations
  TIMEOUTS: {
    REAL_API: 15000,      // 15 seconds for real API calls
    PYTHON_SCRAPER: 20000, // 20 seconds for Python scraper
    FALLBACK: 5000        // 5 seconds for fallback methods
  },
  
  // Retry configurations
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_REAL_API: true,
    ENABLE_PYTHON_SCRAPER: true,
    ENABLE_LOCATION_BASED: true,
    ENABLE_CACHING: true,
    ENABLE_ANALYTICS: true
  }
};

/**
 * Get platforms for a specific product category
 */
export function getPlatformsForCategory(query: string): Array<{name: string, key: string, color: string}> {
  const queryLower = query.toLowerCase();
  
  // Check for grocery items
  const groceryKeywords = ['milk', 'bread', 'rice', 'dal', 'oil', 'almonds', 'nuts', 'grocery', 'food', 'spices'];
  if (groceryKeywords.some(keyword => queryLower.includes(keyword))) {
    return SCRAPING_CONFIG.PLATFORMS.GROCERY;
  }
  
  // Check for fashion items
  const fashionKeywords = ['shirt', 'jeans', 'dress', 'shoes', 'clothing', 'fashion', 'wear'];
  if (fashionKeywords.some(keyword => queryLower.includes(keyword))) {
    return SCRAPING_CONFIG.PLATFORMS.FASHION;
  }
  
  // Check for electronics
  const electronicsKeywords = ['phone', 'laptop', 'tv', 'camera', 'headphones', 'electronics', 'iphone', 'samsung'];
  if (electronicsKeywords.some(keyword => queryLower.includes(keyword))) {
    return SCRAPING_CONFIG.PLATFORMS.ELECTRONICS;
  }
  
  return SCRAPING_CONFIG.PLATFORMS.DEFAULT;
}

/**
 * Get realistic price range for a product
 */
export function getPriceRange(query: string): {min: number, max: number} {
  const queryLower = query.toLowerCase();
  
  // Find exact matches first
  for (const [product, range] of Object.entries(SCRAPING_CONFIG.PRICE_RANGES)) {
    if (product !== 'default' && queryLower.includes(product)) {
      return range;
    }
  }
  
  return SCRAPING_CONFIG.PRICE_RANGES.default;
}

/**
 * Check if a scraping feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof SCRAPING_CONFIG.FEATURES): boolean {
  return SCRAPING_CONFIG.FEATURES[feature] ?? false;
}

/**
 * Get timeout for a specific scraper type
 */
export function getTimeout(scraperType: keyof typeof SCRAPING_CONFIG.TIMEOUTS): number {
  return SCRAPING_CONFIG.TIMEOUTS[scraperType] ?? 10000;
}

export default SCRAPING_CONFIG;