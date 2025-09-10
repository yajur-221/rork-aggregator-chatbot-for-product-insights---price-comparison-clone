interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

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
}

export async function fetchPriceComparison(query: string, location: LocationData | null): Promise<PriceItem[]> {
  console.log('Fetching price comparison for:', query, 'Location:', location);
  
  // Simulate real-time web scraping delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  const productName = query.toLowerCase();
  let basePrice = 25000; // Default base price
  
  console.log('Determining base price for product type...');
  
  // Set realistic base prices based on product type
  if (productName.includes('iphone') || productName.includes('smartphone')) {
    basePrice = Math.floor(Math.random() * 40000) + 30000; // ₹30,000-₹70,000
  } else if (productName.includes('laptop') || productName.includes('macbook')) {
    basePrice = Math.floor(Math.random() * 60000) + 40000; // ₹40,000-₹100,000
  } else if (productName.includes('headphone') || productName.includes('earphone')) {
    basePrice = Math.floor(Math.random() * 8000) + 2000; // ₹2,000-₹10,000
  } else if (productName.includes('watch') || productName.includes('smartwatch')) {
    basePrice = Math.floor(Math.random() * 15000) + 5000; // ₹5,000-₹20,000
  } else {
    basePrice = Math.floor(Math.random() * 30000) + 10000; // ₹10,000-₹40,000
  }

  console.log('Base price determined:', basePrice);
  
  // Enhanced online stores with realistic pricing and better images
  const onlineStores = [
    {
      name: 'Amazon India',
      link: 'https://www.amazon.in/s?k=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop',
      discount: 0.15, // 15% discount
      reliability: 0.95 // 95% stock availability
    },
    {
      name: 'Flipkart',
      link: 'https://www.flipkart.com/search?q=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop',
      discount: 0.12, // 12% discount
      reliability: 0.92
    },
    {
      name: 'Snapdeal',
      link: 'https://www.snapdeal.com/search?keyword=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop',
      discount: 0.20, // 20% discount
      reliability: 0.85
    },
    {
      name: 'Croma',
      link: 'https://www.croma.com/search?q=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
      discount: 0.08, // 8% discount
      reliability: 0.88
    },
    {
      name: 'Vijay Sales',
      link: 'https://www.vijaysales.com/search/' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
      discount: 0.10, // 10% discount
      reliability: 0.82
    },
    {
      name: 'Reliance Digital',
      link: 'https://www.reliancedigital.in/search?q=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
      discount: 0.07, // 7% discount
      reliability: 0.90
    },
    {
      name: 'Paytm Mall',
      link: 'https://paytmmall.com/shop/search?q=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop',
      discount: 0.18, // 18% discount
      reliability: 0.75
    },
    {
      name: 'Tata CLiQ',
      link: 'https://www.tatacliq.com/search/?searchCategory=all&text=' + encodeURIComponent(query),
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      discount: 0.09, // 9% discount
      reliability: 0.87
    }
  ];
  
  console.log('Processing', onlineStores.length, 'online stores...');

  // Generate product images based on query
  const getProductImage = (index: number) => {
    const imageQueries = [
      'photo-1511707171634-5f897ff02aa9', // tech product
      'photo-1560472354-b33ff0c44a43', // electronics
      'photo-1526170375885-4d8ecf77b99f', // gadget
      'photo-1542291026-7eec264c27ff', // device
      'photo-1523275335684-37898b6baf30', // product
      'photo-1441986300917-64674bd600d8', // store
      'photo-1560472355-536de3962603', // shopping
      'photo-1556742049-0cfed4f6a45d' // retail
    ];
    return `https://images.unsplash.com/${imageQueries[index % imageQueries.length]}?w=200&h=200&fit=crop`;
  };

  const mockData: PriceItem[] = onlineStores.map((store, index) => {
    // Simulate real-time price fluctuations
    const marketVariation = Math.random() * 0.1 - 0.05; // ±5% market variation
    const adjustedBasePrice = Math.floor(basePrice * (1 + marketVariation));
    
    const discountedPrice = Math.floor(adjustedBasePrice * (1 - store.discount));
    const variation = Math.floor(Math.random() * 2000) - 1000; // ±₹1000 variation
    const finalPrice = Math.max(discountedPrice + variation, 1000); // Minimum ₹1000
    
    // Simulate stock availability
    const isInStock = Math.random() < store.reliability;
    
    return {
      id: `online-${index + 1}`,
      name: `${query} - ${['Latest Model', 'Premium Edition', 'Standard Model', 'Official Store', 'Best Buy', 'Special Offer', 'Limited Edition', 'Pro Version'][index] || 'Available'}`,
      price: finalPrice,
      originalPrice: isInStock ? adjustedBasePrice + Math.floor(Math.random() * 5000) : undefined,
      image: getProductImage(index),
      source: store.name,
      sourceType: 'online' as const,
      link: store.link,
      stockStatus: isInStock ? (Math.random() > 0.8 ? 'Limited Stock' : 'In Stock') : 'Out of Stock',
      deliveryTime: isInStock ? `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 4} days` : 'Not Available',
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0 rating
      reviewCount: Math.floor(Math.random() * 5000) + 100
    };
  }).filter(item => item.stockStatus !== 'Out of Stock'); // Filter out out-of-stock items
  
  console.log('Online stores processed. Available items:', mockData.length);

  // Add enhanced local stores if location is available
  if (location) {
    console.log('Adding local stores for location:', location.city, location.state);
    
    const localStoreNames = [
      'Tech World Electronics',
      'Digital Plaza', 
      'Wholesale Electronics Hub',
      'City Electronics Store',
      'Mobile Point',
      'Gadget Galaxy',
      'Electronics Bazaar',
      'Smart Tech Solutions',
      'Metro Electronics',
      'Prime Tech Store'
    ];

    const localStores: PriceItem[] = localStoreNames.slice(0, Math.floor(Math.random() * 4) + 3).map((storeName, index) => {
      // Local stores often have different pricing strategies
      const localDiscount = 0.05 + (Math.random() * 0.15); // 5-20% discount
      const marketVariation = Math.random() * 0.08 - 0.04; // ±4% local market variation
      const adjustedBasePrice = Math.floor(basePrice * (1 + marketVariation));
      
      const localPrice = Math.floor(adjustedBasePrice * (1 - localDiscount));
      const variation = Math.floor(Math.random() * 3000) - 1500; // ±₹1500 variation
      const finalPrice = Math.max(localPrice + variation, 1000);
      
      // Local stores have different availability patterns
      const hasStock = Math.random() > 0.15; // 85% chance of having stock
      
      if (!hasStock) return null;
      
      return {
        id: `local-${index + 1}`,
        name: `${query} - ${['In Stock', 'Display Model', 'Wholesale Price', 'Cash Discount', 'Special Deal', 'Demo Unit', 'Floor Model', 'Bulk Price'][index] || 'Available'}`,
        price: finalPrice,
        originalPrice: index % 2 === 0 ? adjustedBasePrice + Math.floor(Math.random() * 3000) : undefined,
        image: getProductImage(index + 8),
        source: storeName,
        sourceType: 'local' as const,
        phone: `+91 ${Math.floor(Math.random() * 90000) + 10000} ${Math.floor(Math.random() * 90000) + 10000}`,
        address: `${['Shop', 'Store', 'Block', 'Unit', 'Floor'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 50) + 1}, ${['Electronics Market', 'City Mall', 'Tech Complex', 'Shopping Center', 'Commercial Plaza'][Math.floor(Math.random() * 5)]}, ${location.city || 'Mumbai'}, ${location.state || 'Maharashtra'}`,
        distance: Math.round((Math.random() * 8 + 1) * 10) / 10, // 1-9 km with 1 decimal
        stockStatus: Math.random() > 0.7 ? 'Limited Stock' : 'In Stock',
        deliveryTime: 'Available Now',
        rating: Math.round((Math.random() * 1.2 + 3.8) * 10) / 10, // 3.8-5.0 rating (local stores often have higher ratings)
        reviewCount: Math.floor(Math.random() * 500) + 50
      };
    }).filter(Boolean) as PriceItem[];

    mockData.push(...localStores);
    console.log('Local stores added:', localStores.length);
  }

  // Add timestamp to simulate real-time data
  const timestamp = new Date().toISOString();
  console.log('Price comparison completed at:', timestamp);
  console.log('Total items found:', mockData.length);
  
  // Return sorted by price (lowest first) with real-time timestamp
  const sortedData = mockData.sort((a, b) => a.price - b.price);
  
  // Add some metadata to simulate real scraping
  console.log('Price range: ₹' + sortedData[0]?.price + ' - ₹' + sortedData[sortedData.length - 1]?.price);
  console.log('Average price: ₹' + Math.round(sortedData.reduce((sum, item) => sum + item.price, 0) / sortedData.length));
  
  return sortedData;
}