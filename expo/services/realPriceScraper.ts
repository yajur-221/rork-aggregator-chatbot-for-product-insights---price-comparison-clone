/**
 * Clean Real Price Scraper Service
 * Only shows actual scraped prices - no mock or hardcoded data
 */

interface ScrapedPrice {
  price: number;
  title: string;
  platform: string;
  url: string;
  image?: string;
}

interface PriceQueryResult {
  success: boolean;
  message: string;
  data: {
    product_searched: string;
    cheapest: ScrapedPrice;
    all_prices: ScrapedPrice[];
    total_results: number;
    category?: string;
    platforms_searched?: string[];
    platforms_with_results?: string[];
  } | null;
}

interface BackendScrapingResponse {
  success: boolean;
  products: ScrapedPrice[];
  product_searched: string;
  total_results: number;
  cheapest?: ScrapedPrice;
  category?: string;
  platforms_searched?: string[];
  platforms_with_results?: string[];
  scraping_time?: number;
  timestamp?: number;
}

/**
 * Extract product name from user's natural language input
 */
export function extractProductFromPrompt(userInput: string): string | null {
  const text = userInput.toLowerCase().trim();
  
  // If it's already a clean product name, return it
  if (text.length < 50 && !text.includes('find') && !text.includes('search')) {
    return text;
  }
  
  // Remove common query words
  const removeWords = [
    'find', 'search', 'get', 'show', 'tell', 'what', 'whats', "what's",
    'price', 'cost', 'cheap', 'cheapest', 'best', 'lowest', 'for',
    'of', 'the', 'me', 'a', 'an', 'is', 'are', 'please', 'can', 'you',
    'i', 'want', 'need', 'looking', 'buy', 'purchase', 'deal', 'on'
  ];
  
  const words = text.split(/\s+/);
  const productWords = words.filter(w => !removeWords.includes(w));
  
  let product = productWords.join(' ').trim();
  
  // If too short, try pattern matching
  if (product.length < 3 && words.length > 2) {
    const patterns = [
      /price of (.+)/,
      /price for (.+)/,
      /search for (.+)/,
      /find (.+)/,
      /cheapest (.+)/,
      /best price on (.+)/,
      /cost of (.+)/,
      /buy (.+)/,
      /looking for (.+)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        product = match[1].trim();
        break;
      }
    }
  }
  
  return product || null;
}

/**
 * Call backend scraping service - NO FALLBACK
 */
async function callBackendScraper(productName: string): Promise<BackendScrapingResponse | null> {
  try {
    console.log('🌐 Calling Railway backend for real prices:', productName);
    
    const backendUrl = process.env.EXPO_PUBLIC_SCRAPER_BACKEND_URL || 
                      'https://rork-aggregator-chatbot-for-product-insights-p-production.up.railway.app';
    
    const endpoint = `${backendUrl}/scrape/prices/`;
    
    console.log('🔗 Backend endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        product_name: productName
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend response:', {
        success: data.success,
        productsFound: data.products?.length || 0,
        category: data.category,
        platformsSearched: data.platforms_searched,
        platformsWithResults: data.platforms_with_results,
        scrapingTime: data.scraping_time
      });
      
      // Only return if we have actual products
      if (data.success && data.products && data.products.length > 0) {
        return data;
      } else {
        console.log('⚠️ No products found in scraping');
        return null;
      }
    } else {
      console.error('❌ Backend returned error:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Backend scraper error:', error);
    return null;
  }
}

/**
 * Try query endpoint as alternative
 */
async function callBackendQueryEndpoint(query: string): Promise<BackendScrapingResponse | null> {
  try {
    console.log('🔄 Trying query endpoint:', query);
    
    const backendUrl = process.env.EXPO_PUBLIC_SCRAPER_BACKEND_URL || 
                      'https://rork-aggregator-chatbot-for-product-insights-p-production.up.railway.app';
    
    const endpoint = `${backendUrl}/query/price/`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.products && data.products.length > 0) {
        return data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Query endpoint error:', error);
    return null;
  }
}

/**
 * Main function to handle price queries - NO MOCK DATA
 */
export async function handlePriceQuery(userInput: string): Promise<PriceQueryResult> {
  console.log('🚀 Starting real price scraping for:', userInput);
  
  // Extract product name
  const product = extractProductFromPrompt(userInput);
  
  if (!product) {
    return {
      success: false,
      message: "I couldn't understand what product you're looking for. Please specify the product name.",
      data: null
    };
  }
  
  console.log('🔍 Extracted product:', product);
  
  // Try backend scraping
  let backendResult = await callBackendScraper(product);
  
  // If direct scraping fails, try query endpoint
  if (!backendResult) {
    console.log('⚠️ Direct scraping failed, trying query endpoint...');
    backendResult = await callBackendQueryEndpoint(`find prices for ${product}`);
  }
  
  // NO FALLBACK - If backend fails, return no results
  if (!backendResult || !backendResult.success || !backendResult.products || backendResult.products.length === 0) {
    return {
      success: false,
      message: `Sorry, I couldn't find any prices for "${product}". This could be due to:
• The product name might need to be more specific
• The platforms might be temporarily unavailable
• The product might not be available online

Please try:
• A more specific product name (e.g., "iPhone 15" instead of "phone")
• Checking your internet connection
• Trying again in a moment`,
      data: null
    };
  }
  
  // We have real data!
  const allPrices = backendResult.products;
  const platformsSearched = backendResult.platforms_searched || [];
  const platformsWithResults = backendResult.platforms_with_results || [];
  const category = backendResult.category || 'general';
  
  // Sort by price
  allPrices.sort((a, b) => a.price - b.price);
  const cheapest = allPrices[0];
  
  // Create platform summary
  const platformSummary = platformsWithResults.map(platform => {
    const platformPrices = allPrices.filter(p => p.platform === platform);
    if (platformPrices.length === 0) return null;
    
    const minPrice = Math.min(...platformPrices.map(p => p.price));
    const maxPrice = Math.max(...platformPrices.map(p => p.price));
    
    if (minPrice === maxPrice) {
      return `${platform}: ₹${minPrice.toLocaleString()}`;
    } else {
      return `${platform}: ₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`;
    }
  }).filter(Boolean);
  
  // Format response message
  const message = `✅ Found real prices for **${product}**!

📊 **Category**: ${category.charAt(0).toUpperCase() + category.slice(1)}
🔍 **Platforms checked**: ${platformsSearched.join(', ')}
✅ **Found prices on**: ${platformsWithResults.join(', ')}

🏆 **CHEAPEST OPTION:**
• Product: ${cheapest.title}
• Price: **₹${cheapest.price.toLocaleString()}**
• Platform: ${cheapest.platform}
• [View Product](${cheapest.url})

📈 **PRICE COMPARISON BY PLATFORM:**
${platformSummary.join('\n')}

💡 **Total products found**: ${allPrices.length}
⏱️ **Scraping time**: ${backendResult.scraping_time ? `${backendResult.scraping_time}s` : 'N/A'}`;
  
  return {
    success: true,
    message,
    data: {
      product_searched: product,
      cheapest,
      all_prices: allPrices,
      total_results: allPrices.length,
      category,
      platforms_searched: platformsSearched,
      platforms_with_results: platformsWithResults
    }
  };
}

/**
 * Enhanced price data for AI integration - NO MOCK DATA
 */
export async function getEnhancedPriceData(query: string) {
  try {
    const result = await handlePriceQuery(query);
    
    if (result.success && result.data) {
      const platformStats = result.data.platforms_with_results?.map(platform => ({
        platform,
        products: result.data.all_prices.filter(p => p.platform === platform).length,
        minPrice: Math.min(...result.data.all_prices.filter(p => p.platform === platform).map(p => p.price)),
        maxPrice: Math.max(...result.data.all_prices.filter(p => p.platform === platform).map(p => p.price))
      }));
      
      return {
        success: true,
        product: result.data.product_searched,
        prices: result.data.all_prices,
        cheapest: result.data.cheapest,
        category: result.data.category,
        platformStats,
        summary: {
          averagePrice: Math.round(result.data.all_prices.reduce((sum, p) => sum + p.price, 0) / result.data.all_prices.length),
          priceRange: `₹${Math.min(...result.data.all_prices.map(p => p.price)).toLocaleString()} - ₹${Math.max(...result.data.all_prices.map(p => p.price)).toLocaleString()}`,
          totalResults: result.data.total_results,
          platformsChecked: result.data.platforms_searched?.length || 0,
          platformsWithResults: result.data.platforms_with_results?.length || 0
        }
      };
    }
  } catch (error) {
    console.error('Enhanced price data failed:', error);
  }
  
  return {
    success: false,
    error: 'Could not fetch price data'
  };
}

/**
 * Simple function for AI integration
 */
export async function getPriceForAI(productName: string): Promise<string> {
  const result = await handlePriceQuery(productName);
  
  if (result.success && result.data) {
    const { cheapest, all_prices, platforms_with_results } = result.data;
    
    return `Found ${all_prices.length} prices across ${platforms_with_results?.length || 0} platforms. 
Cheapest: ₹${cheapest.price.toLocaleString()} on ${cheapest.platform} for "${cheapest.title}".`;
  }
  
  return `No prices found for ${productName}. Try a more specific product name.`;
}

export type { PriceQueryResult, ScrapedPrice, BackendScrapingResponse };
