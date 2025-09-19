interface ProductCategory {
  name: string;
  keywords: string[];
  sites: ScrapingSite[];
  priority: number;
}

interface ScrapingSite {
  name: string;
  baseUrl: string;
  searchPath: string;
  selectors: {
    productName: string;
    price: string;
    image: string;
    rating?: string;
    availability?: string;
  };
  headers?: Record<string, string>;
  delay?: number;
}

// Product categories with their associated scraping sites
const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    name: 'groceries',
    keywords: ['fruits', 'vegetables', 'milk', 'bread', 'rice', 'dal', 'oil', 'spices', 'grocery', 'food', 'snacks', 'beverages', 'butter', 'cheese', 'yogurt', 'eggs', 'meat', 'chicken', 'fish', 'flour', 'sugar', 'salt', 'tea', 'coffee', 'juice', 'water', 'biscuits', 'cookies', 'chocolate', 'candy', 'cereals', 'pasta', 'noodles', 'sauce', 'ketchup', 'pickle', 'jam', 'honey', 'nuts', 'dry fruits', 'onion', 'potato', 'tomato', 'apple', 'banana', 'orange', 'mango', 'grapes', 'carrot', 'cabbage', 'spinach', 'paneer', 'ghee', 'atta', 'wheat', 'pulses', 'lentils', 'masala', 'turmeric', 'chili', 'garam masala', 'cumin', 'coriander', 'almonds', 'cashews', 'walnuts', 'pistachios', 'raisins', 'dates', 'figs', 'peanuts', 'groundnuts', 'badam', 'kaju', 'akhrot', 'pista', 'kishmish', 'khajur', 'anjeer', 'moongfali', 'dry fruit', 'mixed nuts', 'trail mix', 'organic', 'fresh', 'frozen', 'canned', 'packaged', 'instant', 'ready to eat', 'cooking', 'baking', 'condiments', 'dairy', 'beverages', 'health food', 'baby food', 'pet food'],
    priority: 1,
    sites: [
      {
        name: 'Swiggy Instamart',
        baseUrl: 'https://www.swiggy.com',
        searchPath: '/instamart/search?query=',
        selectors: {
          productName: '[data-testid="product-name"]',
          price: '[data-testid="product-price"]',
          image: '[data-testid="product-image"] img',
          availability: '[data-testid="add-to-cart"]'
        },
        delay: 2000
      },
      {
        name: 'Blinkit',
        baseUrl: 'https://blinkit.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '.Product__UpdatedTitle',
          price: '.Product__UpdatedPrice',
          image: '.Product__UpdatedImageContainer img',
          availability: '.AddToCart'
        },
        delay: 1500
      },
      {
        name: 'Zepto',
        baseUrl: 'https://www.zepto.com',
        searchPath: '/search?query=',
        selectors: {
          productName: '[data-testid="product-card-name"]',
          price: '[data-testid="product-card-price"]',
          image: '[data-testid="product-card-image"]'
        },
        delay: 2000
      },
      {
        name: 'BigBasket',
        baseUrl: 'https://www.bigbasket.com',
        searchPath: '/ps/?q=',
        selectors: {
          productName: '.Description___StyledDescription',
          price: '.Pricing___StyledDiscountedPrice',
          image: '.ProductImage___StyledImg'
        },
        delay: 3000
      },
      {
        name: 'Amazon Fresh',
        baseUrl: 'https://www.amazon.in',
        searchPath: '/s?k=',
        selectors: {
          productName: '[data-component-type="s-search-result"] h2 a span',
          price: '.a-price-whole',
          image: '[data-component-type="s-search-result"] img'
        },
        delay: 2000
      }
    ]
  },
  {
    name: 'electronics',
    keywords: ['iphone', 'samsung', 'laptop', 'macbook', 'headphones', 'smartphone', 'tablet', 'camera', 'tv', 'electronics', 'mobile', 'computer', 'phone', 'earphones', 'speaker', 'keyboard', 'mouse', 'monitor', 'processor', 'gpu', 'ram', 'ssd', 'hard drive', 'charger', 'cable', 'adapter', 'power bank', 'smartwatch', 'fitness tracker', 'gaming', 'console', 'xbox', 'playstation', 'nintendo'],
    priority: 2,
    sites: [
      {
        name: 'Amazon India',
        baseUrl: 'https://www.amazon.in',
        searchPath: '/s?k=',
        selectors: {
          productName: '[data-component-type="s-search-result"] h2 a span',
          price: '.a-price-whole',
          image: '[data-component-type="s-search-result"] img',
          rating: '.a-icon-alt'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        delay: 2000
      },
      {
        name: 'Flipkart',
        baseUrl: 'https://www.flipkart.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '._4rR01T',
          price: '._30jeq3',
          image: '._396cs4 img',
          rating: '._3LWZlK'
        },
        delay: 2500
      },
      {
        name: 'Croma',
        baseUrl: 'https://www.croma.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '.product-title',
          price: '.new-price',
          image: '.product-image img'
        },
        delay: 2000
      },
      {
        name: 'Vijay Sales',
        baseUrl: 'https://www.vijaysales.com',
        searchPath: '/search/',
        selectors: {
          productName: '.pname',
          price: '.price-new',
          image: '.product-image img'
        },
        delay: 3000
      },
      {
        name: 'Reliance Digital',
        baseUrl: 'https://www.reliancedigital.in',
        searchPath: '/search?q=',
        selectors: {
          productName: '.sp__name',
          price: '.TextWeb__Text',
          image: '.sp__image img'
        },
        delay: 2500
      }
    ]
  },
  {
    name: 'fashion',
    keywords: ['shirt', 't-shirt', 'tshirt', 'jeans', 'dress', 'shoes', 'clothing', 'fashion', 'apparel', 'accessories', 'bags', 'watch', 'jewelry', 'pants', 'trousers', 'shorts', 'skirt', 'top', 'blouse', 'jacket', 'coat', 'sweater', 'hoodie', 'cap', 'hat', 'belt', 'sunglasses', 'footwear', 'sandals', 'sneakers', 'boots', 'saree', 'kurta', 'lehenga', 'salwar', 'kameez', 'ethnic wear', 'formal wear', 'casual wear', 'sportswear', 'innerwear', 'lingerie', 'socks', 'tie', 'scarf', 'gloves', 'wallet', 'purse', 'backpack', 'handbag'],
    priority: 3,
    sites: [
      {
        name: 'Myntra',
        baseUrl: 'https://www.myntra.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '.product-productMetaInfo h4',
          price: '.product-discountedPrice',
          image: '.product-imageSlider img'
        },
        delay: 2000
      },
      {
        name: 'Ajio',
        baseUrl: 'https://www.ajio.com',
        searchPath: '/search/?text=',
        selectors: {
          productName: '.nameCls',
          price: '.price-new',
          image: '.rilrtl-lazy-img'
        },
        delay: 2500
      },
      {
        name: 'Nykaa Fashion',
        baseUrl: 'https://www.nykaafashion.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '.product-title',
          price: '.css-1d0jf8e',
          image: '.product-image img'
        },
        delay: 2000
      },
      {
        name: 'Amazon Fashion',
        baseUrl: 'https://www.amazon.in',
        searchPath: '/s?k=',
        selectors: {
          productName: '[data-component-type="s-search-result"] h2 a span',
          price: '.a-price-whole',
          image: '[data-component-type="s-search-result"] img',
          rating: '.a-icon-alt'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        delay: 2000
      },
      {
        name: 'Flipkart Fashion',
        baseUrl: 'https://www.flipkart.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '._4rR01T',
          price: '._30jeq3',
          image: '._396cs4 img',
          rating: '._3LWZlK'
        },
        delay: 2500
      }
    ]
  },
  {
    name: 'books',
    keywords: ['book', 'novel', 'textbook', 'magazine', 'ebook', 'literature', 'education', 'study'],
    priority: 4,
    sites: [
      {
        name: 'Amazon Books',
        baseUrl: 'https://www.amazon.in',
        searchPath: '/s?k=',
        selectors: {
          productName: '[data-component-type="s-search-result"] h2 a span',
          price: '.a-price-whole',
          image: '[data-component-type="s-search-result"] img'
        },
        delay: 2000
      },
      {
        name: 'Flipkart Books',
        baseUrl: 'https://www.flipkart.com',
        searchPath: '/search?q=',
        selectors: {
          productName: '._4rR01T',
          price: '._30jeq3',
          image: '._396cs4 img'
        },
        delay: 2000
      }
    ]
  },
  {
    name: 'home_appliances',
    keywords: ['refrigerator', 'washing machine', 'microwave', 'ac', 'air conditioner', 'fan', 'cooler', 'heater', 'appliances'],
    priority: 2,
    sites: [
      {
        name: 'Amazon Appliances',
        baseUrl: 'https://www.amazon.in',
        searchPath: '/s?k=',
        selectors: {
          productName: '[data-component-type="s-search-result"] h2 a span',
          price: '.a-price-whole',
          image: '[data-component-type="s-search-result"] img'
        },
        delay: 2000
      },
      {
        name: 'Reliance Digital',
        baseUrl: 'https://www.reliancedigital.in',
        searchPath: '/search?q=',
        selectors: {
          productName: '.sp__name',
          price: '.TextWeb__Text',
          image: '.sp__image img'
        },
        delay: 2500
      }
    ]
  }
];

export function categorizeProduct(query: string): ProductCategory | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  console.log('Categorizing product:', normalizedQuery);
  
  // Handle image-based queries that might have generic names
  if (normalizedQuery.includes('product from image') || normalizedQuery.includes('identified from your image')) {
    console.log('Image-based query detected, using enhanced keyword matching');
    // For image queries, we'll be more lenient and try to extract meaningful keywords
    const extractedKeywords = normalizedQuery.split(/\s+/).filter(word => 
      word.length > 3 && 
      !['product', 'from', 'image', 'identified', 'your'].includes(word)
    );
    console.log('Extracted keywords from image query:', extractedKeywords);
    
    if (extractedKeywords.length > 0) {
      // Re-run categorization with extracted keywords
      const enhancedQuery = extractedKeywords.join(' ');
      if (enhancedQuery !== normalizedQuery) {
        console.log('Re-categorizing with enhanced query:', enhancedQuery);
        return categorizeProduct(enhancedQuery);
      }
    }
  }
  
  // Find the best matching category
  let bestMatch: { category: ProductCategory; score: number } | null = null;
  
  for (const category of PRODUCT_CATEGORIES) {
    let score = 0;
    
    for (const keyword of category.keywords) {
      if (normalizedQuery.includes(keyword)) {
        // Exact word match gets higher score
        const words = normalizedQuery.split(/\s+/);
        if (words.includes(keyword)) {
          score += 20; // Increased score for exact matches
          console.log(`Exact match found: "${keyword}" in category "${category.name}" (+20 points)`);
        } else {
          score += 10; // Increased score for partial matches
          console.log(`Partial match found: "${keyword}" in category "${category.name}" (+10 points)`);
        }
      }
    }
    
    // Special handling for brand names and specific product types
    if (category.name === 'electronics') {
      const electronicsBrands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'google', 'oneplus', 'xiaomi', 'realme', 'oppo', 'vivo', 'nokia', 'motorola', 'huawei'];
      const electronicsTypes = ['phone', 'laptop', 'tablet', 'tv', 'monitor', 'headphone', 'earphone', 'speaker', 'camera', 'gaming', 'console', 'processor', 'graphics', 'memory', 'storage'];
      
      for (const brand of electronicsBrands) {
        if (normalizedQuery.includes(brand)) {
          score += 15;
          console.log(`Electronics brand match: "${brand}" (+15 points)`);
        }
      }
      
      for (const type of electronicsTypes) {
        if (normalizedQuery.includes(type)) {
          score += 12;
          console.log(`Electronics type match: "${type}" (+12 points)`);
        }
      }
    }
    
    if (category.name === 'groceries') {
      const groceryIndicators = ['organic', 'fresh', 'kg', 'gram', 'liter', 'pack', 'packet', 'box'];
      for (const indicator of groceryIndicators) {
        if (normalizedQuery.includes(indicator)) {
          score += 8;
          console.log(`Grocery indicator match: "${indicator}" (+8 points)`);
        }
      }
    }
    
    // Apply priority bonus (higher priority = higher multiplier)
    const priorityMultiplier = (6 - category.priority) * 0.8; // Reduced multiplier impact
    score *= priorityMultiplier;
    
    console.log(`Category "${category.name}" final score: ${score} (priority multiplier: ${priorityMultiplier})`);
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  
  if (bestMatch && bestMatch.score >= 8) { // Adjusted threshold
    console.log(`Best match: "${bestMatch.category.name}" with score ${bestMatch.score}`);
    console.log(`Available platforms for this category:`, bestMatch.category.sites.map(s => s.name));
    return bestMatch.category;
  } else {
    console.log('No strong category match found, will use general e-commerce sites');
    console.log('Scores:', PRODUCT_CATEGORIES.map(c => ({ name: c.name, score: bestMatch && bestMatch.category === c ? bestMatch.score : 0 })));
    return null;
  }
}

export function getScrapingSites(query: string): ScrapingSite[] {
  const category = categorizeProduct(query);
  
  if (category) {
    console.log(`Product "${query}" categorized as: ${category.name}`);
    console.log(`Using ${category.sites.length} specialized sites for scraping`);
    return category.sites;
  }
  
  // Fallback to general e-commerce sites - prioritize major platforms
  console.log(`Product "${query}" using general e-commerce sites`);
  const generalSites: ScrapingSite[] = [
    {
      name: 'Amazon India',
      baseUrl: 'https://www.amazon.in',
      searchPath: '/s?k=',
      selectors: {
        productName: '[data-component-type="s-search-result"] h2 a span',
        price: '.a-price-whole',
        image: '[data-component-type="s-search-result"] img',
        rating: '.a-icon-alt'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      delay: 2000
    },
    {
      name: 'Flipkart',
      baseUrl: 'https://www.flipkart.com',
      searchPath: '/search?q=',
      selectors: {
        productName: '._4rR01T',
        price: '._30jeq3',
        image: '._396cs4 img',
        rating: '._3LWZlK'
      },
      delay: 2500
    },
    {
      name: 'Meesho',
      baseUrl: 'https://www.meesho.com',
      searchPath: '/search?q=',
      selectors: {
        productName: '.product-title',
        price: '.product-price',
        image: '.product-image img'
      },
      delay: 2000
    }
  ];
  
  return generalSites;
}

export { PRODUCT_CATEGORIES, type ProductCategory, type ScrapingSite };