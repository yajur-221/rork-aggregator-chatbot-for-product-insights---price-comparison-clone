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
    keywords: ['fruits', 'vegetables', 'milk', 'bread', 'rice', 'dal', 'oil', 'spices', 'grocery', 'food', 'snacks', 'beverages'],
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
      }
    ]
  },
  {
    name: 'electronics',
    keywords: ['iphone', 'samsung', 'laptop', 'macbook', 'headphones', 'smartphone', 'tablet', 'camera', 'tv', 'electronics', 'mobile', 'computer'],
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
      }
    ]
  },
  {
    name: 'fashion',
    keywords: ['shirt', 'jeans', 'dress', 'shoes', 'clothing', 'fashion', 'apparel', 'accessories', 'bags', 'watch', 'jewelry'],
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
  
  // Find the best matching category
  let bestMatch: { category: ProductCategory; score: number } | null = null;
  
  for (const category of PRODUCT_CATEGORIES) {
    let score = 0;
    
    for (const keyword of category.keywords) {
      if (normalizedQuery.includes(keyword)) {
        // Exact word match gets higher score
        const words = normalizedQuery.split(/\s+/);
        if (words.includes(keyword)) {
          score += 10;
        } else {
          score += 5; // Partial match
        }
      }
    }
    
    // Apply priority bonus
    score *= (5 - category.priority + 1);
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  
  return bestMatch?.category || null;
}

export function getScrapingSites(query: string): ScrapingSite[] {
  const category = categorizeProduct(query);
  
  if (category) {
    console.log(`Product "${query}" categorized as: ${category.name}`);
    console.log(`Using ${category.sites.length} specialized sites for scraping`);
    return category.sites;
  }
  
  // Fallback to general e-commerce sites
  console.log(`Product "${query}" using general e-commerce sites`);
  return PRODUCT_CATEGORIES.find(cat => cat.name === 'electronics')?.sites || [];
}

export { PRODUCT_CATEGORIES, type ProductCategory, type ScrapingSite };