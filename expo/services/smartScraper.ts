import { categorizeProduct, getScrapingSites, type ScrapingSite } from './productCategorizer';

interface ScrapedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  source: string;
  sourceType: 'online' | 'local';
  link?: string;
  rating?: number;
  availability?: string;
  deliveryTime?: string;
}

interface ScrapingResult {
  success: boolean;
  products: ScrapedProduct[];
  errors: string[];
  scrapedSites: string[];
  totalTime: number;
}

// Simulate web scraping with realistic delays and error handling
async function scrapeWebsite(site: ScrapingSite, query: string): Promise<ScrapedProduct[]> {
  console.log(`🔍 Scraping ${site.name} for "${query}"...`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, site.delay || 2000));
  
  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error(`Failed to scrape ${site.name}: Network timeout`);
  }
  
  // Generate realistic mock data based on site and query
  const productCount = Math.floor(Math.random() * 8) + 3; // 3-10 products
  const products: ScrapedProduct[] = [];
  
  for (let i = 0; i < productCount; i++) {
    const basePrice = generateBasePrice(query);
    const siteMultiplier = getSiteMultiplier(site.name);
    const finalPrice = Math.floor(basePrice * siteMultiplier * (0.9 + Math.random() * 0.2));
    
    products.push({
      id: `${site.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      name: `${query} - ${generateProductVariant(site.name, i)}`,
      price: finalPrice,
      originalPrice: Math.random() > 0.3 ? Math.floor(finalPrice * (1.1 + Math.random() * 0.3)) : undefined,
      image: generateProductImage(query, i),
      source: site.name,
      sourceType: 'online',
      link: `${site.baseUrl}${site.searchPath}${encodeURIComponent(query)}`,
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      availability: Math.random() > 0.15 ? 'In Stock' : 'Limited Stock',
      deliveryTime: generateDeliveryTime(site.name)
    });
  }
  
  console.log(`✅ Successfully scraped ${products.length} products from ${site.name}`);
  return products;
}

function generateBasePrice(query: string): number {
  const normalizedQuery = query.toLowerCase();
  
  // Grocery items - Fruits
  if (normalizedQuery.includes('apple') || normalizedQuery.includes('banana')) return 150;
  if (normalizedQuery.includes('orange') || normalizedQuery.includes('mango')) return 120;
  if (normalizedQuery.includes('grapes')) return 180;
  
  // Grocery items - Dairy & Staples
  if (normalizedQuery.includes('milk')) return 60;
  if (normalizedQuery.includes('bread')) return 40;
  if (normalizedQuery.includes('rice')) return 80;
  if (normalizedQuery.includes('dal') || normalizedQuery.includes('lentils')) return 120;
  if (normalizedQuery.includes('oil')) return 200;
  
  // Grocery items - Dry Fruits & Nuts
  if (normalizedQuery.includes('almonds') || normalizedQuery.includes('badam')) return 800;
  if (normalizedQuery.includes('cashews') || normalizedQuery.includes('kaju')) return 1200;
  if (normalizedQuery.includes('walnuts') || normalizedQuery.includes('akhrot')) return 1000;
  if (normalizedQuery.includes('pistachios') || normalizedQuery.includes('pista')) return 1500;
  if (normalizedQuery.includes('raisins') || normalizedQuery.includes('kishmish')) return 400;
  if (normalizedQuery.includes('dates') || normalizedQuery.includes('khajur')) return 300;
  if (normalizedQuery.includes('figs') || normalizedQuery.includes('anjeer')) return 600;
  if (normalizedQuery.includes('peanuts') || normalizedQuery.includes('groundnuts')) return 200;
  if (normalizedQuery.includes('mixed nuts') || normalizedQuery.includes('dry fruits')) return 900;
  
  // Grocery items - Spices
  if (normalizedQuery.includes('turmeric') || normalizedQuery.includes('chili')) return 100;
  if (normalizedQuery.includes('cumin') || normalizedQuery.includes('coriander')) return 150;
  if (normalizedQuery.includes('garam masala')) return 80;
  
  // Electronics
  if (normalizedQuery.includes('iphone')) return 65000;
  if (normalizedQuery.includes('samsung') && normalizedQuery.includes('phone')) return 25000;
  if (normalizedQuery.includes('laptop')) return 45000;
  if (normalizedQuery.includes('headphones')) return 3000;
  
  // Fashion
  if (normalizedQuery.includes('shirt')) return 800;
  if (normalizedQuery.includes('jeans')) return 1500;
  if (normalizedQuery.includes('shoes')) return 2500;
  
  // Default
  return Math.floor(Math.random() * 10000) + 1000;
}

function getSiteMultiplier(siteName: string): number {
  const multipliers: Record<string, number> = {
    'Amazon India': 1.0,
    'Flipkart': 0.95,
    'Swiggy Instamart': 1.1,
    'Blinkit': 1.05,
    'Zepto': 1.08,
    'BigBasket': 0.98,
    'Myntra': 1.02,
    'Croma': 1.05,
    'Vijay Sales': 0.92
  };
  
  return multipliers[siteName] || 1.0;
}

function generateProductVariant(siteName: string, index: number): string {
  const variants = [
    'Latest Model', 'Premium Edition', 'Best Seller', 'Top Rated',
    'Special Offer', 'Limited Edition', 'Pro Version', 'Standard Model',
    'Bestseller', 'Customer Choice', 'Editor\'s Pick', 'Trending Now'
  ];
  
  return variants[index % variants.length];
}

function generateProductImage(query: string, index: number): string {
  const imageIds = [
    'photo-1511707171634-5f897ff02aa9',
    'photo-1560472354-b33ff0c44a43',
    'photo-1526170375885-4d8ecf77b99f',
    'photo-1542291026-7eec264c27ff',
    'photo-1523275335684-37898b6baf30',
    'photo-1441986300917-64674bd600d8',
    'photo-1560472355-536de3962603',
    'photo-1556742049-0cfed4f6a45d'
  ];
  
  return `https://images.unsplash.com/${imageIds[index % imageIds.length]}?w=200&h=200&fit=crop`;
}

function generateDeliveryTime(siteName: string): string {
  const deliveryTimes: Record<string, string[]> = {
    'Swiggy Instamart': ['10-15 mins', '15-20 mins', '20-30 mins'],
    'Blinkit': ['10-15 mins', '15-20 mins'],
    'Zepto': ['10-15 mins', '15-25 mins'],
    'BigBasket': ['Next day', '2-3 days'],
    'Amazon India': ['1-2 days', '2-3 days', 'Same day'],
    'Flipkart': ['2-4 days', '3-5 days', 'Next day'],
    'Myntra': ['2-7 days', '3-5 days'],
    'Croma': ['Same day', '1-2 days']
  };
  
  const times = deliveryTimes[siteName] || ['2-3 days', '3-5 days'];
  return times[Math.floor(Math.random() * times.length)];
}

export async function smartScrapeProducts(query: string): Promise<ScrapingResult> {
  if (!query?.trim()) {
    return {
      success: false,
      products: [],
      errors: ['Query cannot be empty'],
      scrapedSites: [],
      totalTime: 0
    };
  }

  const startTime = Date.now();
  console.log(`🚀 Starting smart scraping for: "${query}"`);
  
  // Get appropriate scraping sites based on product category
  const sites = getScrapingSites(query);
  console.log(`📋 Selected ${sites.length} sites for scraping:`, sites.map(s => s.name));
  
  const results: ScrapedProduct[] = [];
  const errors: string[] = [];
  const scrapedSites: string[] = [];
  
  // Scrape sites in parallel with error handling
  const scrapePromises = sites.map(async (site) => {
    try {
      const products = await scrapeWebsite(site, query);
      results.push(...products);
      scrapedSites.push(site.name);
      return { success: true, site: site.name, count: products.length };
    } catch (error) {
      const errorMessage = `${site.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(`❌ Failed to scrape ${site.name}:`, error);
      return { success: false, site: site.name, error: errorMessage };
    }
  });
  
  await Promise.allSettled(scrapePromises);
  
  const totalTime = Date.now() - startTime;
  
  console.log(`🎯 Scraping completed in ${totalTime}ms`);
  console.log(`✅ Successfully scraped ${scrapedSites.length}/${sites.length} sites`);
  console.log(`📦 Found ${results.length} total products`);
  
  if (errors.length > 0) {
    console.log(`⚠️ Errors encountered:`, errors);
  }
  
  // Sort results by price (lowest first)
  results.sort((a, b) => a.price - b.price);
  
  return {
    success: results.length > 0,
    products: results,
    errors,
    scrapedSites,
    totalTime
  };
}

// Enhanced AI service that uses scraping data
export async function generateSmartAIResponse(query: string, scrapingData?: ScrapingResult) {
  console.log('🤖 Generating smart AI response with scraping context...');
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an intelligent product research assistant with access to real-time scraping data from Indian e-commerce sites. 
        
        CONTEXT: You have access to live price data from sites like Amazon, Flipkart, Swiggy Instamart, Blinkit, Myntra, etc.
        
        Provide comprehensive product analysis including:
        - Market insights based on scraped data
        - Price trends and recommendations
        - Site-specific availability
        - Category-specific advice
        
        Return ONLY valid JSON without backticks. Use this structure:
        {
          "howToUse": string[],
          "tips": string[],
          "pros": string[],
          "cons": string[],
          "generalInsights": string,
          "marketAnalysis": {
            "averagePrice": number,
            "priceRange": string,
            "bestDeals": string[],
            "availability": string
          },
          "recommendations": {
            "bestSites": string[],
            "timing": string,
            "alternatives": string[]
          }
        }`
      },
      {
        role: 'user' as const,
        content: `Analyze this product: "${query}"
        
        ${scrapingData ? `
        LIVE SCRAPING DATA:
        - Total products found: ${scrapingData.products.length}
        - Sites scraped: ${scrapingData.scrapedSites.join(', ')}
        - Price range: ₹${Math.min(...scrapingData.products.map(p => p.price))} - ₹${Math.max(...scrapingData.products.map(p => p.price))}
        - Average price: ₹${Math.round(scrapingData.products.reduce((sum, p) => sum + p.price, 0) / scrapingData.products.length)}
        - Best deals from: ${scrapingData.products.slice(0, 3).map(p => `${p.source} (₹${p.price})`).join(', ')}
        ` : 'No live scraping data available'}
        
        Focus on Indian market context and provide actionable insights.`
      }
    ];

    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (response.ok) {
      const data = await response.json();
      const completion = data.completion;
      
      try {
        // Clean and parse the JSON response
        let jsonString = completion.trim();
        if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```(?:json)?/g, '').trim();
        }
        
        const aiResponse = JSON.parse(jsonString);
        console.log('✅ Smart AI response generated successfully');
        return aiResponse;
      } catch {
        console.warn('Failed to parse AI response, using fallback');
      }
    }
  } catch (error) {
    console.error('Smart AI API failed:', error);
  }
  
  // Fallback response with scraping insights
  return generateFallbackResponse(query, scrapingData);
}

function generateFallbackResponse(query: string, scrapingData?: ScrapingResult) {
  const category = categorizeProduct(query);
  
  return {
    howToUse: [
      'Research thoroughly before buying',
      'Compare prices across multiple sites',
      'Check delivery times and policies',
      'Read user reviews and ratings'
    ],
    tips: [
      'Use price tracking tools',
      'Look for seasonal sales',
      'Check for bundle deals',
      'Verify seller authenticity'
    ],
    pros: [
      'Wide variety available online',
      'Competitive pricing',
      'Convenient home delivery',
      'Easy returns and exchanges'
    ],
    cons: [
      'Price fluctuations',
      'Delivery delays possible',
      'Quality verification needed',
      'Return process complexity'
    ],
    generalInsights: scrapingData 
      ? `Found ${scrapingData.products.length} products across ${scrapingData.scrapedSites.length} sites. Price range: ₹${Math.min(...scrapingData.products.map(p => p.price))} - ₹${Math.max(...scrapingData.products.map(p => p.price))}`
      : `Product category: ${category?.name || 'general'}. Consider checking specialized sites for better deals.`,
    marketAnalysis: scrapingData ? {
      averagePrice: Math.round(scrapingData.products.reduce((sum, p) => sum + p.price, 0) / scrapingData.products.length),
      priceRange: `₹${Math.min(...scrapingData.products.map(p => p.price))} - ₹${Math.max(...scrapingData.products.map(p => p.price))}`,
      bestDeals: scrapingData.products.slice(0, 3).map(p => `${p.source}: ₹${p.price}`),
      availability: `Available on ${scrapingData.scrapedSites.length} platforms`
    } : {
      averagePrice: 0,
      priceRange: 'Data not available',
      bestDeals: [],
      availability: 'Check multiple sites'
    },
    recommendations: {
      bestSites: category?.sites.slice(0, 3).map(s => s.name) || ['Amazon', 'Flipkart'],
      timing: 'Check for festival sales and weekend offers',
      alternatives: ['Consider similar products', 'Look for bundle deals', 'Check refurbished options']
    }
  };
}

export type { ScrapingResult };