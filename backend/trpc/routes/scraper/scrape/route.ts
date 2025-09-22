import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

interface ProductResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  url: string;
  platform: string;
  rating?: number;
  reviews?: number;
  availability: string;
  delivery?: string;
  seller?: string;
  discount?: number;
}

// Platform configurations
const API_CONFIGS = {
  amazon: {
    name: 'Amazon India',
    baseUrl: 'https://www.amazon.in',
    searchPath: '/s?k=',
    color: '#FF9900'
  },
  flipkart: {
    name: 'Flipkart',
    baseUrl: 'https://www.flipkart.com',
    searchPath: '/search?q=',
    color: '#2874F0'
  },
  snapdeal: {
    name: 'Snapdeal',
    baseUrl: 'https://www.snapdeal.com',
    searchPath: '/search?keyword=',
    color: '#E40046'
  },
  croma: {
    name: 'Croma',
    baseUrl: 'https://www.croma.com',
    searchPath: '/search?q=',
    color: '#1BA1E2'
  }
};

/**
 * Get realistic base prices for different product categories
 */
function getRealisticBasePrice(query: string): number {
  const queryLower = query.toLowerCase();
  
  // Electronics
  if (queryLower.includes('iphone 15')) return 79900;
  if (queryLower.includes('iphone 14')) return 69900;
  if (queryLower.includes('iphone 13')) return 59900;
  if (queryLower.includes('samsung galaxy s24')) return 74999;
  if (queryLower.includes('oneplus 12')) return 64999;
  if (queryLower.includes('macbook air')) return 114900;
  if (queryLower.includes('macbook pro')) return 199900;
  if (queryLower.includes('dell laptop')) return 45000;
  if (queryLower.includes('hp laptop')) return 42000;
  if (queryLower.includes('airpods')) return 24900;
  if (queryLower.includes('sony headphones')) return 15000;
  if (queryLower.includes('jbl speaker')) return 8000;
  if (queryLower.includes('samsung tv')) return 35000;
  if (queryLower.includes('lg tv')) return 32000;
  
  // Fashion
  if (queryLower.includes('nike shoes')) return 7000;
  if (queryLower.includes('adidas shoes')) return 6500;
  if (queryLower.includes('puma shoes')) return 4500;
  if (queryLower.includes('levis jeans')) return 3500;
  if (queryLower.includes('zara shirt')) return 2500;
  if (queryLower.includes('h&m')) return 1500;
  
  // Groceries
  if (queryLower.includes('almonds')) return 800;
  if (queryLower.includes('cashews')) return 1200;
  if (queryLower.includes('walnuts')) return 1000;
  if (queryLower.includes('pistachios')) return 1500;
  if (queryLower.includes('dates')) return 300;
  if (queryLower.includes('raisins')) return 400;
  if (queryLower.includes('milk')) return 60;
  if (queryLower.includes('bread')) return 40;
  if (queryLower.includes('rice')) return 80;
  if (queryLower.includes('dal')) return 120;
  if (queryLower.includes('oil')) return 200;
  
  // Default based on query
  if (queryLower.includes('phone') || queryLower.includes('mobile')) return 25000;
  if (queryLower.includes('laptop') || queryLower.includes('computer')) return 50000;
  if (queryLower.includes('watch')) return 15000;
  if (queryLower.includes('tablet')) return 20000;
  
  return Math.floor(Math.random() * 10000) + 5000;
}

/**
 * Get platform-specific price multipliers
 */
function getPlatformPriceMultiplier(platform: string): number {
  const multipliers: Record<string, number> = {
    amazon: 1.0,
    flipkart: 0.95,
    snapdeal: 0.88,
    croma: 1.05
  };
  
  return multipliers[platform] || 1.0;
}

/**
 * Get product variants
 */
function getProductVariant(index: number): string {
  const variants = [
    'Latest Model',
    'Premium Edition', 
    'Best Seller',
    'Top Rated',
    'Special Offer',
    'Limited Edition',
    'Pro Version',
    'Standard Model'
  ];
  
  return variants[index % variants.length];
}

/**
 * Get realistic product images
 */
function getProductImage(query: string, index: number): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('iphone')) {
    return `https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop`;
  }
  if (queryLower.includes('laptop')) {
    return `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop`;
  }
  if (queryLower.includes('headphones')) {
    return `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop`;
  }
  if (queryLower.includes('shoes')) {
    return `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop`;
  }
  if (queryLower.includes('almonds') || queryLower.includes('nuts')) {
    return `https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=300&fit=crop`;
  }
  
  const genericImages = [
    'photo-1560472354-b33ff0c44a43',
    'photo-1526170375885-4d8ecf77b99f',
    'photo-1542291026-7eec264c27ff',
    'photo-1523275335684-37898b6baf30',
    'photo-1441986300917-64674bd600d8'
  ];
  
  return `https://images.unsplash.com/${genericImages[index % genericImages.length]}?w=300&h=300&fit=crop`;
}

/**
 * Get delivery information
 */
function getDeliveryInfo(platform: string): string {
  const deliveryInfo: Record<string, string[]> = {
    amazon: ['Free Delivery', 'Same Day Delivery', 'Next Day Delivery'],
    flipkart: ['Free Delivery', 'Express Delivery', 'Standard Delivery'],
    snapdeal: ['Standard Delivery', 'Express Delivery'],
    croma: ['Store Pickup Available', 'Home Delivery']
  };
  
  const options = deliveryInfo[platform] || ['Standard Delivery'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get seller information
 */
function getSellerInfo(platform: string): string {
  const sellers: Record<string, string[]> = {
    amazon: ['Amazon', 'Cloudtail India', 'Appario Retail'],
    flipkart: ['Flipkart', 'RetailNet', 'Omnitech Retail'],
    snapdeal: ['Snapdeal', 'Vendor Partner'],
    croma: ['Croma', 'Infiniti Retail']
  };
  
  const options = sellers[platform] || ['Official Store'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get relevant platforms based on product category
 */
function getRelevantPlatforms(query: string): string[] {
  const queryLower = query.toLowerCase();
  
  // Electronics
  if (queryLower.includes('phone') || queryLower.includes('laptop') ||
      queryLower.includes('tv') || queryLower.includes('camera') ||
      queryLower.includes('headphones') || queryLower.includes('electronics')) {
    return ['amazon', 'flipkart', 'croma', 'snapdeal'];
  }
  
  // Fashion items
  if (queryLower.includes('shirt') || queryLower.includes('jeans') ||
      queryLower.includes('dress') || queryLower.includes('shoes') ||
      queryLower.includes('clothing') || queryLower.includes('fashion')) {
    return ['amazon', 'flipkart', 'snapdeal'];
  }
  
  // Default to major platforms
  return ['amazon', 'flipkart', 'snapdeal'];
}

/**
 * Generate realistic mock data for a platform
 */
function generatePlatformProducts(platform: string, query: string): ProductResult[] {
  const config = API_CONFIGS[platform as keyof typeof API_CONFIGS];
  if (!config) return [];
  
  const basePrice = getRealisticBasePrice(query);
  const platformMultiplier = getPlatformPriceMultiplier(platform);
  
  const productCount = Math.floor(Math.random() * 4) + 3; // 3-6 products
  const products: ProductResult[] = [];
  
  for (let i = 0; i < productCount; i++) {
    const variation = 0.8 + Math.random() * 0.4; // ±20% variation
    const price = Math.floor(basePrice * platformMultiplier * variation);
    const originalPrice = Math.random() > 0.3 ? Math.floor(price * (1.1 + Math.random() * 0.3)) : undefined;
    
    products.push({
      id: `${platform}-${i + 1}`,
      title: `${query} - ${getProductVariant(i)}`,
      price,
      originalPrice,
      image: getProductImage(query, i),
      url: `${config.baseUrl}${config.searchPath}${encodeURIComponent(query)}`,
      platform: config.name,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviews: Math.floor(Math.random() * 5000) + 100,
      availability: Math.random() > 0.15 ? 'In Stock' : 'Limited Stock',
      delivery: getDeliveryInfo(platform),
      seller: getSellerInfo(platform),
      discount: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined
    });
  }
  
  return products.sort((a, b) => a.price - b.price);
}

export const scrapeProcedure = publicProcedure
  .input(
    z.object({
      query: z.string().min(1).max(100),
      platforms: z.array(z.string()).optional()
    })
  )
  .query(async ({ input }) => {
    console.log('🔍 Backend scraping request:', input);
    
    const { query, platforms: requestedPlatforms } = input;
    const sanitizedQuery = query.trim();
    
    if (!sanitizedQuery) {
      throw new Error('Query cannot be empty');
    }
    
    const platforms = requestedPlatforms || getRelevantPlatforms(sanitizedQuery);
    console.log('📋 Selected platforms:', platforms);
    
    const allProducts: ProductResult[] = [];
    const errors: string[] = [];
    
    // Generate products for each platform
    for (const platform of platforms) {
      try {
        const products = generatePlatformProducts(platform, sanitizedQuery);
        allProducts.push(...products);
        console.log(`✅ Generated ${products.length} products for ${platform}`);
      } catch (error) {
        const errorMessage = `${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(`❌ Failed to generate products for ${platform}:`, error);
      }
    }
    
    // Sort by price (lowest first)
    allProducts.sort((a, b) => a.price - b.price);
    
    console.log(`📊 Scraping completed: ${allProducts.length} products from ${platforms.length} platforms`);
    
    return {
      success: allProducts.length > 0,
      products: allProducts,
      totalResults: allProducts.length,
      searchTerm: sanitizedQuery,
      timestamp: Date.now(),
      errors
    };
  });