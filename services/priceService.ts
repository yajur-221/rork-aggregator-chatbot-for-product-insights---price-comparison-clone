import { smartScrapeProducts } from './smartScraper';
import { fetchPricesWithPythonScraper } from './pythonScraper';
import type { LocationData } from './pythonScraper';

interface PriceItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  source: string;
  sourceType: 'online' | 'local';
  link?: string;
  phone?: string;
  address?: string;
  distance?: number;
  stockStatus?: string;
  deliveryTime?: string;
  rating?: number;
  reviewCount?: number;
}



function generateLocalStores(query: string, location: LocationData & { city?: string; state?: string }, basePrice: number): PriceItem[] {
  if (!query.trim() || query.length > 100) return [];
  const sanitizedQuery = query.trim();
  
  const localStoreNames = [
    'Tech World Electronics',
    'Digital Plaza', 
    'Wholesale Electronics Hub',
    'City Electronics Store',
    'Mobile Point'
  ];

  return localStoreNames.slice(0, Math.floor(Math.random() * 2) + 2).map((storeName, index) => {
    const localDiscount = 0.05 + (Math.random() * 0.15);
    const localPrice = Math.floor(basePrice * (1 - localDiscount));
    
    return {
      id: `local-${index + 1}`,
      name: `${sanitizedQuery} - Local Store`,
      price: localPrice,
      originalPrice: basePrice,
      image: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop`,
      source: storeName,
      sourceType: 'local' as const,
      phone: `+91 ${Math.floor(Math.random() * 90000) + 10000} ${Math.floor(Math.random() * 90000) + 10000}`,
      address: `Shop ${Math.floor(Math.random() * 50) + 1}, ${location.city || 'Mumbai'}, ${location.state || 'Maharashtra'}`,
      distance: Math.round((Math.random() * 8 + 1) * 10) / 10,
      stockStatus: 'In Stock',
      deliveryTime: 'Available Now',
      rating: Math.round((Math.random() * 1.2 + 3.8) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 50
    };
  }).filter(Boolean) as PriceItem[];
}

export async function fetchPriceComparison(query: string, location: (LocationData & { city?: string; state?: string }) | null): Promise<PriceItem[]> {
  if (!query?.trim() || query.length > 500) {
    console.error('Invalid query provided');
    return [];
  }

  const sanitizedQuery = query.trim();
  console.log('🔍 Starting price comparison for:', sanitizedQuery);
  
  // PRIORITY 1: Try tRPC backend scraper
  try {
    console.log('🔧 Attempting tRPC backend scraper...');
    const { trpcClient } = await import('@/lib/trpc');
    
    const backendResult = await trpcClient.scraper.scrape.query({
      query: sanitizedQuery,
      platforms: undefined
    });
    
    if (backendResult.success && backendResult.products.length > 0) {
      console.log('✅ tRPC backend successful:', {
        totalProducts: backendResult.totalResults,
        cheapestPrice: `₹${backendResult.products[0]?.price}`
      });
      
      const backendItems: PriceItem[] = backendResult.products.map((product: any) => ({
        id: product.id,
        name: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        source: product.platform,
        sourceType: 'online' as const,
        link: product.url,
        stockStatus: product.availability,
        deliveryTime: product.delivery,
        rating: product.rating,
        reviewCount: product.reviews
      }));
      
      if (location) {
        const localStores = generateLocalStores(sanitizedQuery, location, backendItems[0]?.price || 1000);
        backendItems.push(...localStores);
      }
      
      return backendItems.sort((a, b) => a.price - b.price);
    }
  } catch (error) {
    console.log('⚠️ tRPC backend failed:', error);
  }
  
  // PRIORITY 3: Try Python scraper
  try {
    console.log('🐍 Attempting Python scraper...');
    const pythonScrapedProducts = await fetchPricesWithPythonScraper(sanitizedQuery, location);
    
    if (pythonScrapedProducts.length > 0) {
      console.log('✅ Python scraper successful');
      
      const pythonItems: PriceItem[] = pythonScrapedProducts.map((product, index) => ({
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
        reviewCount: Math.floor(Math.random() * 1000) + 100
      }));
      
      return pythonItems.sort((a, b) => a.price - b.price);
    }
  } catch (error) {
    console.log('⚠️ Python scraper failed:', error);
  }
  
  // PRIORITY 4: Use smart scraping as final fallback
  try {
    console.log('🤖 Using smart scraping fallback...');
    const scrapingResult = await smartScrapeProducts(sanitizedQuery);
    
    if (scrapingResult.success && scrapingResult.products.length > 0) {
      const scrapedItems: PriceItem[] = scrapingResult.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        source: product.source,
        sourceType: product.sourceType,
        link: product.link,
        stockStatus: 'In Stock',
        deliveryTime: '2-3 days',
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 5000) + 100
      }));
      
      return scrapedItems.sort((a, b) => a.price - b.price);
    }
  } catch (error) {
    console.log('❌ All scraping methods failed:', error);
  }
  
  return [];
}
