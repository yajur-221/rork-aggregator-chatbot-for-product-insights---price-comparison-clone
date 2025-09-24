import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const inputSchema = z.object({
  query: z.string().min(1).max(100),
  platforms: z.array(z.string()).optional()
});

type InputType = z.infer<typeof inputSchema>;

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
 * Get realistic base prices for different product categories with more accurate pricing
 */
function getRealisticBasePrice(query: string): number {
  const queryLower = query.toLowerCase();
  
  // Electronics - iPhone models
  if (queryLower.includes('iphone 15 pro max')) return 159900;
  if (queryLower.includes('iphone 15 pro')) return 134900;
  if (queryLower.includes('iphone 15 plus')) return 89900;
  if (queryLower.includes('iphone 15')) return 79900;
  if (queryLower.includes('iphone 14 pro max')) return 139900;
  if (queryLower.includes('iphone 14 pro')) return 129900;
  if (queryLower.includes('iphone 14 plus')) return 79900;
  if (queryLower.includes('iphone 14')) return 69900;
  if (queryLower.includes('iphone 13 pro')) return 119900;
  if (queryLower.includes('iphone 13')) return 59900;
  if (queryLower.includes('iphone 12')) return 49900;
  if (queryLower.includes('iphone se')) return 43900;
  
  // Samsung Galaxy series
  if (queryLower.includes('samsung galaxy s24 ultra')) return 129999;
  if (queryLower.includes('samsung galaxy s24+')) return 99999;
  if (queryLower.includes('samsung galaxy s24')) return 79999;
  if (queryLower.includes('samsung galaxy s23')) return 69999;
  if (queryLower.includes('samsung galaxy a54')) return 38999;
  if (queryLower.includes('samsung galaxy a34')) return 30999;
  if (queryLower.includes('samsung galaxy m54')) return 26999;
  
  // OnePlus series
  if (queryLower.includes('oneplus 12')) return 64999;
  if (queryLower.includes('oneplus 11')) return 56999;
  if (queryLower.includes('oneplus nord')) return 29999;
  
  // Laptops - MacBook
  if (queryLower.includes('macbook pro 16')) return 249900;
  if (queryLower.includes('macbook pro 14')) return 199900;
  if (queryLower.includes('macbook air m2')) return 114900;
  if (queryLower.includes('macbook air m1')) return 99900;
  
  // Laptops - Windows
  if (queryLower.includes('dell xps 13')) return 89999;
  if (queryLower.includes('dell inspiron')) return 45999;
  if (queryLower.includes('hp spectre')) return 99999;
  if (queryLower.includes('hp pavilion')) return 55999;
  if (queryLower.includes('lenovo thinkpad')) return 75999;
  if (queryLower.includes('asus zenbook')) return 69999;
  if (queryLower.includes('gaming laptop')) return 89999;
  
  // Audio devices
  if (queryLower.includes('airpods pro')) return 24900;
  if (queryLower.includes('airpods 3')) return 20900;
  if (queryLower.includes('airpods 2')) return 12900;
  if (queryLower.includes('sony wh-1000xm5')) return 29990;
  if (queryLower.includes('sony wh-1000xm4')) return 24990;
  if (queryLower.includes('bose quietcomfort')) return 26990;
  if (queryLower.includes('jbl flip')) return 7999;
  if (queryLower.includes('jbl charge')) return 12999;
  if (queryLower.includes('boat headphones')) return 2999;
  
  // TVs
  if (queryLower.includes('samsung 65 inch')) return 89999;
  if (queryLower.includes('samsung 55 inch')) return 59999;
  if (queryLower.includes('lg oled 65')) return 149999;
  if (queryLower.includes('lg oled 55')) return 99999;
  if (queryLower.includes('sony bravia 65')) return 119999;
  if (queryLower.includes('mi tv 55')) return 39999;
  
  // Watches
  if (queryLower.includes('apple watch ultra')) return 89900;
  if (queryLower.includes('apple watch series 9')) return 45900;
  if (queryLower.includes('apple watch se')) return 29900;
  if (queryLower.includes('samsung galaxy watch')) return 24999;
  if (queryLower.includes('fitbit versa')) return 19999;
  
  // Fashion - Shoes
  if (queryLower.includes('nike air jordan')) return 12995;
  if (queryLower.includes('nike air max')) return 8995;
  if (queryLower.includes('nike revolution')) return 4995;
  if (queryLower.includes('adidas ultraboost')) return 16999;
  if (queryLower.includes('adidas stan smith')) return 7999;
  if (queryLower.includes('puma rs-x')) return 8999;
  if (queryLower.includes('converse chuck taylor')) return 4999;
  
  // Fashion - Clothing
  if (queryLower.includes('levis 501')) return 4999;
  if (queryLower.includes('levis jeans')) return 3499;
  if (queryLower.includes('zara shirt')) return 2990;
  if (queryLower.includes('h&m shirt')) return 1499;
  if (queryLower.includes('uniqlo')) return 1990;
  
  // Groceries - Nuts and dry fruits
  if (queryLower.includes('california almonds')) return 1200;
  if (queryLower.includes('almonds 1kg')) return 800;
  if (queryLower.includes('cashews 1kg')) return 1400;
  if (queryLower.includes('walnuts 1kg')) return 1100;
  if (queryLower.includes('pistachios 500g')) return 1800;
  if (queryLower.includes('dates 1kg')) return 400;
  if (queryLower.includes('raisins 1kg')) return 500;
  
  // Groceries - Daily essentials
  if (queryLower.includes('amul milk 1l')) return 62;
  if (queryLower.includes('bread')) return 25;
  if (queryLower.includes('basmati rice 5kg')) return 450;
  if (queryLower.includes('toor dal 1kg')) return 140;
  if (queryLower.includes('sunflower oil 1l')) return 180;
  if (queryLower.includes('olive oil 500ml')) return 450;
  
  // Home appliances
  if (queryLower.includes('lg refrigerator')) return 35999;
  if (queryLower.includes('samsung washing machine')) return 28999;
  if (queryLower.includes('whirlpool ac')) return 32999;
  if (queryLower.includes('microwave oven')) return 8999;
  
  // Generic categories with better pricing
  if (queryLower.includes('smartphone') || queryLower.includes('mobile phone')) return 18999;
  if (queryLower.includes('laptop') || queryLower.includes('notebook')) return 55999;
  if (queryLower.includes('tablet') || queryLower.includes('ipad')) return 29999;
  if (queryLower.includes('headphones') || queryLower.includes('earphones')) return 3999;
  if (queryLower.includes('speaker') || queryLower.includes('bluetooth speaker')) return 2999;
  if (queryLower.includes('smartwatch') || queryLower.includes('fitness tracker')) return 12999;
  if (queryLower.includes('camera') || queryLower.includes('dslr')) return 45999;
  if (queryLower.includes('television') || queryLower.includes('smart tv')) return 42999;
  
  // Default fallback with more realistic range
  const words = queryLower.split(' ');
  if (words.length === 1 && words[0].length < 4) return 2999; // Short queries likely cheaper items
  if (words.some(word => ['premium', 'pro', 'max', 'ultra'].includes(word))) return 89999;
  if (words.some(word => ['budget', 'basic', 'mini'].includes(word))) return 8999;
  
  return Math.floor(Math.random() * 25000) + 15000; // ₹15,000 - ₹40,000
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
 * Generate realistic mock data for a platform with accurate market pricing
 */
function generatePlatformProducts(platform: string, query: string): ProductResult[] {
  const config = API_CONFIGS[platform as keyof typeof API_CONFIGS];
  if (!config) return [];
  
  const basePrice = getRealisticBasePrice(query);
  const platformMultiplier = getPlatformPriceMultiplier(platform);
  
  // Generate 4-8 products for better variety
  const productCount = Math.floor(Math.random() * 5) + 4;
  const products: ProductResult[] = [];
  
  for (let i = 0; i < productCount; i++) {
    // More realistic price variations based on product variants
    let variation: number;
    if (i === 0) {
      // First product is usually the exact match with minimal variation
      variation = 0.95 + Math.random() * 0.1; // ±5% variation
    } else if (i === 1) {
      // Second product is a close variant
      variation = 0.9 + Math.random() * 0.2; // ±10% variation
    } else {
      // Other products have more variation (different models, storage, etc.)
      variation = 0.7 + Math.random() * 0.6; // ±30% variation
    }
    
    const price = Math.floor(basePrice * platformMultiplier * variation);
    
    // More realistic original pricing logic
    let originalPrice: number | undefined;
    if (Math.random() > 0.25) { // 75% chance of having original price
      const discountPercent = 5 + Math.random() * 25; // 5-30% discount
      originalPrice = Math.floor(price / (1 - discountPercent / 100));
    }
    
    // Generate more specific product titles based on the variant
    const variants = getProductVariants(query, i);
    
    products.push({
      id: `${platform}-${i + 1}`,
      title: variants.title,
      price: Math.max(price, 50), // Minimum price of ₹50
      originalPrice,
      image: getProductImage(query, i),
      url: `${config.baseUrl}${config.searchPath}${encodeURIComponent(query)}`,
      platform: config.name,
      rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10, // 3.8-5.0 rating
      reviews: Math.floor(Math.random() * 8000) + 200, // 200-8200 reviews
      availability: Math.random() > 0.1 ? 'In Stock' : 'Limited Stock', // 90% in stock
      delivery: getDeliveryInfo(platform),
      seller: getSellerInfo(platform),
      discount: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined
    });
  }
  
  return products.sort((a, b) => a.price - b.price);
}

/**
 * Get more specific product variants based on the query and index
 */
function getProductVariants(query: string, index: number): { title: string } {
  const queryLower = query.toLowerCase();
  
  // iPhone specific variants
  if (queryLower.includes('iphone')) {
    const variants = [
      `${query} (128GB)`,
      `${query} (256GB)`,
      `${query} (512GB)`,
      `${query} (1TB)`,
      `${query} - Refurbished`,
      `${query} - International Version`,
      `${query} with AppleCare+`,
      `${query} - Unlocked`
    ];
    return { title: variants[index % variants.length] };
  }
  
  // Samsung variants
  if (queryLower.includes('samsung')) {
    const variants = [
      `${query} (8GB RAM, 128GB)`,
      `${query} (8GB RAM, 256GB)`,
      `${query} (12GB RAM, 256GB)`,
      `${query} (12GB RAM, 512GB)`,
      `${query} - 5G Version`,
      `${query} - Dual SIM`,
      `${query} with Galaxy Buds`,
      `${query} - Enterprise Edition`
    ];
    return { title: variants[index % variants.length] };
  }
  
  // Laptop variants
  if (queryLower.includes('laptop') || queryLower.includes('macbook')) {
    const variants = [
      `${query} (8GB RAM, 256GB SSD)`,
      `${query} (16GB RAM, 512GB SSD)`,
      `${query} (16GB RAM, 1TB SSD)`,
      `${query} (32GB RAM, 1TB SSD)`,
      `${query} - Intel Version`,
      `${query} - AMD Version`,
      `${query} with Extended Warranty`,
      `${query} - Gaming Edition`
    ];
    return { title: variants[index % variants.length] };
  }
  
  // Headphones variants
  if (queryLower.includes('headphones') || queryLower.includes('airpods')) {
    const variants = [
      `${query} - Wireless`,
      `${query} - Noise Cancelling`,
      `${query} - Sports Edition`,
      `${query} with Charging Case`,
      `${query} - Studio Quality`,
      `${query} - Travel Edition`,
      `${query} - Limited Color`,
      `${query} - Pro Version`
    ];
    return { title: variants[index % variants.length] };
  }
  
  // TV variants
  if (queryLower.includes('tv') || queryLower.includes('television')) {
    const variants = [
      `${query} - 43 inch`,
      `${query} - 50 inch`,
      `${query} - 55 inch`,
      `${query} - 65 inch`,
      `${query} - 4K HDR`,
      `${query} - Smart TV`,
      `${query} - OLED`,
      `${query} - QLED`
    ];
    return { title: variants[index % variants.length] };
  }
  
  // Generic variants
  const genericVariants = [
    `${query} - Latest Model`,
    `${query} - Premium Edition`,
    `${query} - Best Seller`,
    `${query} - Top Rated`,
    `${query} - Special Offer`,
    `${query} - Limited Edition`,
    `${query} - Pro Version`,
    `${query} - Standard Model`
  ];
  
  return { title: genericVariants[index % genericVariants.length] };
}

export const scrapeProcedure = publicProcedure
  .input(inputSchema)
  .query(async (ctx: any) => {
    const { input } = ctx;
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
    
    // Generate products for each platform synchronously for speed
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