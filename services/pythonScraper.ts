import { Platform } from 'react-native';

interface ScrapedProduct {
  title: string;
  price: number;
  formatted_price: string;
  image: string;
  link: string;
  platform: string;
  platform_color: string;
  delivery: string;
  rating?: string;
  is_cheapest?: boolean;
  badge?: string;
  location_based?: boolean;
}

interface ScrapingResult {
  success: boolean;
  products: ScrapedProduct[];
  total_count: number;
  search_term: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  errors: string[];
  cheapest?: ScrapedProduct;
  platforms_searched: string[];
}

interface LocationData {
  latitude: number;
  longitude: number;
}

/**
 * Call the Python scraper via a backend API endpoint
 * This would typically be hosted on your server
 */
export async function callPythonScraper(
  productQuery: string,
  location: LocationData
): Promise<ScrapingResult> {
  console.log('🐍 Calling Python scraper for:', productQuery, 'at location:', location);
  
  try {
    // In a real implementation, you would call your backend API
    // For now, we'll simulate the Python scraper response
    const mockResult = await simulatePythonScraper(productQuery, location);
    return mockResult;
  } catch (error) {
    console.error('Python scraper failed:', error);
    throw error;
  }
}

/**
 * Simulate the Python scraper response for development
 * Replace this with actual API call to your Python backend
 */
async function simulatePythonScraper(
  productQuery: string,
  location: LocationData
): Promise<ScrapingResult> {
  console.log('🔄 Simulating Python scraper...');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock data similar to Python scraper output
  const platforms = [
    { name: 'Amazon', color: '#FF9900', basePrice: 1.0 },
    { name: 'Flipkart', color: '#2874F0', basePrice: 0.95 },
    { name: 'Snapdeal', color: '#E40046', basePrice: 0.90 },
    { name: 'Croma', color: '#1BA1E2', basePrice: 1.05 },
  ];
  
  // Add quick commerce if location is available
  if (location.latitude && location.longitude) {
    platforms.push(
      { name: 'Swiggy Instamart', color: '#FC8019', basePrice: 1.1 },
      { name: 'Zepto', color: '#7C3AED', basePrice: 1.08 },
      { name: 'Blinkit', color: '#FFC300', basePrice: 1.05 }
    );
  }
  
  // Determine base price based on product
  let basePrice = 25000;
  const query = productQuery.toLowerCase();
  
  if (query.includes('iphone')) basePrice = 65000;
  else if (query.includes('laptop')) basePrice = 45000;
  else if (query.includes('headphone') || query.includes('earbuds')) basePrice = 3000;
  else if (query.includes('milk') || query.includes('bread')) basePrice = 60;
  else if (query.includes('shirt')) basePrice = 800;
  
  const products: ScrapedProduct[] = [];
  
  platforms.forEach((platform, index) => {
    // Generate 1-3 products per platform
    const productCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < productCount; i++) {
      const variation = 0.8 + Math.random() * 0.4; // ±20% variation
      const finalPrice = Math.floor(basePrice * platform.basePrice * variation);
      
      const deliveryTimes: Record<string, string> = {
        'Swiggy Instamart': '15-30 mins',
        'Zepto': '10 mins',
        'Blinkit': '10-20 mins',
        'Amazon': 'Free Delivery',
        'Flipkart': 'Free Delivery',
        'Snapdeal': 'Standard Delivery',
        'Croma': 'Store Pickup Available'
      };
      
      products.push({
        title: `${productQuery} - ${['Latest Model', 'Premium Edition', 'Best Seller'][i] || 'Available'}`,
        price: finalPrice,
        formatted_price: `₹${finalPrice.toLocaleString()}`,
        image: `https://images.unsplash.com/photo-${['1511707171634-5f897ff02aa9', '1560472354-b33ff0c44a43', '1526170375885-4d8ecf77b99f'][index % 3]}?w=200&h=200&fit=crop`,
        link: `https://example.com/search?q=${encodeURIComponent(productQuery)}`,
        platform: platform.name,
        platform_color: platform.color,
        delivery: deliveryTimes[platform.name] || '2-3 days',
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        location_based: ['Swiggy Instamart', 'Zepto', 'Blinkit'].includes(platform.name)
      });
    }
  });
  
  // Sort by price and mark cheapest
  products.sort((a, b) => a.price - b.price);
  
  if (products.length > 0) {
    products[0].is_cheapest = true;
    products[0].badge = '🏆 CHEAPEST!';
  }
  
  const result: ScrapingResult = {
    success: products.length > 0,
    products,
    total_count: products.length,
    search_term: productQuery,
    location,
    timestamp: Date.now(),
    errors: [],
    cheapest: products[0],
    platforms_searched: platforms.map(p => p.name)
  };
  
  console.log('✅ Python scraper simulation completed:', {
    productsFound: result.total_count,
    cheapestPrice: result.cheapest?.formatted_price,
    platformsSearched: result.platforms_searched.length
  });
  
  return result;
}

/**
 * Enhanced price service that uses Python scraper
 */
export async function fetchPricesWithPythonScraper(
  query: string,
  location: LocationData | null
): Promise<ScrapedProduct[]> {
  console.log('🔍 Starting enhanced price search with Python scraper...');
  
  if (!query?.trim()) {
    console.error('Invalid query provided');
    return [];
  }
  
  // Use default location if none provided
  const searchLocation = location || {
    latitude: 28.6139, // Delhi
    longitude: 77.2090
  };
  
  try {
    const result = await callPythonScraper(query.trim(), searchLocation);
    
    if (result.success) {
      console.log('✅ Python scraper successful:', {
        totalProducts: result.total_count,
        cheapestPrice: result.cheapest?.formatted_price,
        platformsSearched: result.platforms_searched.length,
        errors: result.errors.length
      });
      
      return result.products;
    } else {
      console.warn('Python scraper returned no results');
      return [];
    }
  } catch (error) {
    console.error('Python scraper failed:', error);
    
    // Fallback to basic mock data
    return generateFallbackProducts(query, searchLocation);
  }
}

/**
 * Fallback product generation if Python scraper fails
 */
function generateFallbackProducts(query: string, location: LocationData): ScrapedProduct[] {
  console.log('⚠️ Using fallback product generation');
  
  const platforms = [
    { name: 'Amazon', color: '#FF9900' },
    { name: 'Flipkart', color: '#2874F0' },
    { name: 'Snapdeal', color: '#E40046' }
  ];
  
  let basePrice = 15000;
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('iphone')) basePrice = 60000;
  else if (queryLower.includes('laptop')) basePrice = 40000;
  else if (queryLower.includes('headphone')) basePrice = 2500;
  
  const products: ScrapedProduct[] = platforms.map((platform, index) => {
    const variation = 0.9 + Math.random() * 0.2;
    const price = Math.floor(basePrice * variation);
    
    return {
      title: `${query} - ${platform.name} Edition`,
      price,
      formatted_price: `₹${price.toLocaleString()}`,
      image: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop`,
      link: `https://example.com/search?q=${encodeURIComponent(query)}`,
      platform: platform.name,
      platform_color: platform.color,
      delivery: 'Free Delivery',
      rating: (3.5 + Math.random() * 1.5).toFixed(1)
    };
  });
  
  products.sort((a, b) => a.price - b.price);
  
  if (products.length > 0) {
    products[0].is_cheapest = true;
    products[0].badge = '🏆 CHEAPEST!';
  }
  
  return products;
}

/**
 * Convert Python scraper products to the format expected by your UI components
 */
export function convertToUIFormat(products: ScrapedProduct[]): any[] {
  return products.map((product, index) => ({
    id: `python-${index + 1}`,
    name: product.title,
    price: product.price,
    originalPrice: undefined,
    image: product.image,
    source: product.platform,
    sourceType: product.location_based ? 'local' : 'online',
    link: product.link,
    stockStatus: 'In Stock',
    deliveryTime: product.delivery,
    rating: parseFloat(product.rating || '4.0'),
    reviewCount: Math.floor(Math.random() * 1000) + 100,
    isHighlighted: product.is_cheapest || false,
    badge: product.badge
  }));
}

export type { ScrapedProduct, ScrapingResult, LocationData };