import { smartScrapeProducts, generateSmartAIResponse } from './smartScraper';
import type { ScrapingResult } from './smartScraper';
import { getEnhancedPriceData, handlePriceQuery } from './realPriceScraper';
import { searchYouTubeVideos } from './youtubeService';
import * as FileSystem from 'expo-file-system';

interface AIResponse {
  summary?: string;
  keyFeatures?: string[];
  pros?: string[];
  cons?: string[];
  recommendation?: string;
  priceRange?: string;
  bestTime?: string;
  alternatives?: string[];
  howToUse?: string[];
  tips?: string[];
  youtubeLinks?: { title: string; url: string; videoId: string; thumbnail: string }[];
  generalInsights?: string;
  specifications?: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  userRating?: number;
  reviewSummary?: string;
  warranty?: string;
  availability?: string;
}

function tryExtractJsonString(input: string): string | null {
  try {
    const trimmed = input.trim();
    
    // Handle empty or invalid input
    if (!trimmed || trimmed.length < 2) {
      console.log('Input too short or empty:', trimmed);
      return null;
    }
    
    // Check if it's already valid JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        JSON.parse(trimmed); // Test if it's valid
        return trimmed;
      } catch (e) {
        console.log('Direct JSON parse failed, trying extraction');
      }
    }
    
    // Try to extract from code blocks
    const codeBlockMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const extracted = codeBlockMatch[1].trim();
      if (extracted.startsWith('{') && extracted.endsWith('}')) {
        return extracted;
      }
    }
    
    // Find JSON object boundaries
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(extracted); // Test if it's valid
        return extracted;
      } catch (e) {
        console.log('Extracted JSON is invalid:', e);
      }
    }
    
    console.log('No valid JSON found in input');
  } catch (e) {
    console.log('JSON extraction failed:', e);
  }
  return null;
}

function sanitizeJsonString(possibleJson: string): string {
  let s = possibleJson.trim();
  s = s.replace(/\uFEFF/g, '');
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\r?\n/g, '\n');
  s = s.replace(/\t/g, '\t');
  s = s.replace(/\bNaN\b/g, '0');
  s = s.replace(/\bundefined\b/g, 'null');
  s = s.replace(/,\s*([}\]])/g, '$1');
  s = s.replace(/'([A-Za-z0-9_]+)'\s*:/g, '"$1":');
  s = s.replace(/:\s*'([^']*?)'/g, ': "$1"');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

function balanceJsonBrackets(s: string): string {
  let openCurly = 0;
  let openSquare = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openCurly++;
    else if (ch === '}') openCurly = Math.max(0, openCurly - 1);
    else if (ch === '[') openSquare++;
    else if (ch === ']') openSquare = Math.max(0, openSquare - 1);
  }
  while (openSquare > 0) { s += ']'; openSquare--; }
  while (openCurly > 0) { s += '}'; openCurly--; }
  return s;
}

export async function generateAIResponse(query: string, imageUri?: string): Promise<AIResponse> {
  try {
    console.log('🤖 Generating enhanced AI response for:', query, imageUri ? 'with image' : 'text only');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI service timeout')), 12000); // 12 second timeout
    });

    const response = await Promise.race([
      fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a smart shopping assistant. Analyze the product query and provide helpful insights in JSON format with these fields:
        - summary: Brief overview of the product
        - keyFeatures: Array of key features to look for
        - pros: Array of advantages
        - cons: Array of potential drawbacks
        - recommendation: Your buying recommendation
        - priceRange: Expected price range in INR
        - bestTime: Best time to buy (seasonal advice)
        - alternatives: Array of alternative products to consider
        
        Keep responses concise and practical for Indian consumers.`
            },
            imageUri ? {
              role: 'user',
              content: [
                { type: 'text', text: `Analyze this product image and the query: "${query}". Provide shopping insights.` },
                { type: 'image', image: imageUri }
              ]
            } : {
              role: 'user',
              content: `Provide shopping insights for: "${query}"`
            }
          ]
        })
      }),
      timeoutPromise
    ]);

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    console.log('🤖 AI response received:', data.completion ? 'Success' : 'No completion');
    
    if (!data.completion) {
      throw new Error('No completion in AI response');
    }

    // Try to parse JSON from the completion
    try {
      const jsonMatch = data.completion.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ AI insights parsed successfully');
        return parsed;
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, using fallback');
    }

    // Fallback: create structured response from text
    return {
      summary: data.completion.substring(0, 200) + '...',
      keyFeatures: ['Check product reviews', 'Compare prices across platforms', 'Verify seller ratings'],
      pros: ['Multiple options available', 'Price comparison possible'],
      cons: ['Prices may vary', 'Check delivery times'],
      recommendation: 'Compare prices and read reviews before purchasing.',
      priceRange: 'Varies by model and seller',
      bestTime: 'Check for seasonal sales and offers',
      alternatives: ['Similar products from other brands']
    };

  } catch (error) {
    console.error('❌ AI service error:', error);
    
    // Return fallback insights
    return {
      summary: `Here's what you should know about "${query}". We're having trouble connecting to our AI service right now, but here are some general insights.`,
      keyFeatures: ['Check product specifications', 'Read customer reviews', 'Compare prices'],
      pros: ['Multiple purchasing options', 'Price comparison available'],
      cons: ['Prices may fluctuate', 'Delivery times vary'],
      recommendation: 'Compare prices across different platforms and read reviews before making a purchase.',
      priceRange: 'Check current market prices',
      bestTime: 'Look for seasonal sales and discount periods',
      alternatives: ['Consider similar products from different brands']
    };
  }
}

// Legacy function for backward compatibility
export async function generateAIResponseLegacy(query: string, imageUri?: string): Promise<AIResponse> {
  console.log('🤖 Generating enhanced AI response for:', query, imageUri ? 'with image' : 'text only');
  
  // If image is provided, analyze it first
  if (imageUri) {
    console.log('📸 Analyzing image for product identification...');
    try {
      const imageAnalysisResult = await analyzeProductImage(imageUri, query);
      if (imageAnalysisResult) {
        console.log('✅ Image analysis successful, using identified product:', imageAnalysisResult.productName);
        // Use the identified product name for further processing
        query = imageAnalysisResult.productName;
      }
    } catch (error) {
      console.log('⚠️ Image analysis failed, proceeding with original query:', error);
    }
  }
  
  // Check if this is a price query first
  const isPriceQuery = /\b(price|cost|cheap|find|search|buy|purchase)\b/i.test(query);
  
  if (isPriceQuery) {
    console.log('💰 Detected price query, using handle_price_query function');
    try {
      const priceResult = await handlePriceQuery(query);
      if (priceResult.success && priceResult.data) {
        console.log('✅ Price query successful, integrating with AI response');
        
        // Generate AI insights with price context
        const aiResponse = await generateAIResponseWithPriceContext(query, priceResult.data);
        return aiResponse;
      }
    } catch (error) {
      console.log('⚠️ Price query failed, falling back to standard AI response:', error);
    }
  }
  
  // Try to get real price data for context
  let realPriceData: any = null;
  try {
    console.log('🌐 Attempting to get real price data for AI insights...');
    realPriceData = await getEnhancedPriceData(query);
    if (realPriceData.success) {
      console.log('✅ Got real price data for AI analysis:', {
        product: realPriceData.product,
        prices: realPriceData.prices.length,
        sitesChecked: realPriceData.summary.sitesChecked
      });
    }
  } catch (error) {
    console.log('⚠️ Could not get real price data, trying smart scraping:', error);
  }
  
  // Try to get smart scraping data as fallback
  let scrapingData: ScrapingResult | null = null;
  if (!realPriceData?.success) {
    try {
      console.log('🔍 Attempting to get scraping data for AI insights...');
      scrapingData = await smartScrapeProducts(query);
      if (scrapingData.success) {
        console.log('✅ Got scraping data for AI analysis:', {
          products: scrapingData.products.length,
          sites: scrapingData.scrapedSites.length
        });
      }
    } catch (error) {
      console.log('⚠️ Could not get scraping data for AI, proceeding with standard analysis:', error);
    }
  }
  
  // Try smart AI response with real price or scraping context
  try {
    let contextData: ScrapingResult | undefined = undefined;
    if (realPriceData?.success) {
      // Convert real price data to scraping format for compatibility
      contextData = {
        success: true,
        products: realPriceData.prices.map((p: any) => ({
          id: `real-${p.platform}`,
          name: p.title,
          price: p.price,
          source: p.platform,
          sourceType: 'online' as const,
          link: p.url
        })),
        scrapedSites: [...new Set(realPriceData.prices.map((p: any) => p.platform))] as string[],
        errors: [],
        totalTime: 0
      };
    } else if (scrapingData) {
      contextData = scrapingData;
    }
    
    const smartResponse = await generateSmartAIResponse(query, contextData);
    if (smartResponse) {
      console.log('✅ Smart AI response generated successfully');
      const youtubeLinks = await generateYouTubeLinks(query);
      const response = {
        ...smartResponse,
        youtubeLinks
      } as AIResponse;
      
      // Add image context if available
      if (imageUri) {
        response.generalInsights = `Product identified from your image: ${query}. ${response.generalInsights}`;
      }
      
      return response;
    }
  } catch (error) {
    console.log('⚠️ Smart AI response failed, falling back to standard response:', error);
  }
  
  // Fallback to standard AI API
  try {
    console.log('📡 Attempting to call standard AI API...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI service timeout')), 12000); // 12 second timeout
    });

    const response = await Promise.race([
      fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a product research assistant specializing in the Indian market. Provide CRISP, SHORT, and CONCISE information about products. Keep all responses brief and to the point. Return ONLY valid JSON. Do not include backticks or code fences. Use this shape: {"howToUse": string[], "tips": string[], "pros": string[], "cons": string[], "generalInsights": string, "specifications": Record<string,string>, "alternatives": Array<{"name":string,"price":string,"reason":string}>, "faqs": Array<{"question":string,"answer":string}>, "userRating": number, "reviewSummary": string, "warranty": string, "availability": string }'
            },
            {
              role: 'user',
              content: `Provide comprehensive information about: ${query}. Focus on the Indian market context, pricing, availability, and user experience.`
            }
          ]
        })
      }),
      timeoutPromise
    ]);

    if (response.ok) {
      console.log('AI API response received successfully');
      let data: any;
      let completion: string = '';
      
      try {
        const responseText = await response.text();
        console.log('Raw response (first 200 chars):', responseText.slice(0, 200));
        
        // Try to parse as JSON
        try {
          data = JSON.parse(responseText);
          completion = String(data?.completion ?? '');
        } catch (jsonError) {
          console.log('Response is not valid JSON, treating as plain text');
          completion = responseText;
        }
      } catch (textError) {
        console.error('Failed to read response text:', textError);
        throw new Error('Failed to read API response');
      }
      
      if (!completion || completion.trim().length === 0) {
        console.log('Empty completion received');
        throw new Error('Empty response from AI API');
      }

      try {
        let jsonString = tryExtractJsonString(completion);
        if (!jsonString) {
          console.log('No direct JSON detected, attempting to strip backticks...');
          const stripped = completion.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          jsonString = tryExtractJsonString(stripped);
        }
        if (!jsonString) {
          console.log('No JSON found, completion content:', completion.slice(0, 500));
          throw new Error('No JSON content found in completion');
        }

        jsonString = sanitizeJsonString(jsonString);
        jsonString = balanceJsonBrackets(jsonString);

        let aiResponse: AIResponse | null = null;
        let lastErr: unknown = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            aiResponse = JSON.parse(jsonString) as AIResponse;
            break;
          } catch (e1) {
            lastErr = e1;
            console.warn(`JSON.parse attempt ${attempt + 1} failed, repairing...`);
            if (attempt === 0) {
              jsonString = balanceJsonBrackets(sanitizeJsonString(completion));
            } else if (attempt === 1) {
              jsonString = jsonString.replace(/(\{|,|\n)\s*([A-Za-z0-9_]+)\s*:/g, '$1 "$2":');
              jsonString = balanceJsonBrackets(jsonString);
            }
          }
        }

        if (!aiResponse) {
          console.warn('Failed to parse AI response after repairs', lastErr);
        } else {
          console.log('AI response parsed successfully');
          const youtubeLinks = await generateYouTubeLinks(query);
          const response = {
            ...aiResponse,
            youtubeLinks
          } as AIResponse;
          
          // Add image context if available
          if (imageUri) {
            response.generalInsights = `Product identified from your image: ${query}. ${response.generalInsights || 'Analysis based on your uploaded image.'}`;
          }
          
          return response;
        }
      } catch (parseError) {
        console.warn('Gracefully handling AI response parse issue');
        console.log('Raw AI response (first 500 chars):', completion.slice(0, 500));
      }
    } else {
      console.log('AI API returned non-OK status:', response.status);
    }
  } catch (error) {
    console.log('AI API call failed, using enhanced mock data:', error);
  }

  const productName = query.toLowerCase();
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (productName.includes('iphone') || productName.includes('phone') || productName.includes('smartphone')) {
    return {
      howToUse: [
        'Set up Face ID/Touch ID',
        'Configure Apple ID and iCloud',
        'Download essential apps',
        'Add payment methods to Wallet'
      ],
      tips: [
        'Enable Low Power Mode for battery',
        'Use Screen Time for app limits',
        'Set up automatic iCloud backups',
        'Enable Find My iPhone'
      ],
      pros: [
        'Premium build quality',
        'Regular iOS updates',
        'Great ecosystem integration',
        'Excellent camera',
        'Strong resale value'
      ],
      cons: [
        'Higher price than Android',
        'Limited customization',
        'No expandable storage',
        'Expensive repairs'
      ],
      youtubeLinks: await generateYouTubeLinks(query),
      generalInsights: imageUri ? `Product identified from your image. Premium smartphone with excellent build quality and camera. Higher price but great long-term value with regular updates and strong resale value.` : 'Premium smartphone with excellent build quality and camera. Higher price but great long-term value with regular updates and strong resale value.'
    };
  }

  if (productName.includes('laptop') || productName.includes('macbook') || productName.includes('computer')) {
    return {
      howToUse: [
        'Set up user account',
        'Install essential software',
        'Configure backups',
        'Set up cloud storage'
      ],
      tips: [
        'Keep system updated',
        'Use external monitor',
        'Get a laptop stand',
        'Use SSD for speed'
      ],
      pros: [
        'Portable and convenient',
        'All-in-one design',
        'Good battery life',
        'Wide price range'
      ],
      cons: [
        'Limited upgradeability',
        'Smaller screen',
        'Can overheat',
        'Battery degrades over time'
      ],
      youtubeLinks: await generateYouTubeLinks(query),
      generalInsights: imageUri ? `Product identified from your image. Perfect balance of portability and functionality. Consider your use case, budget, and OS preference when choosing.` : 'Perfect balance of portability and functionality. Consider your use case, budget, and OS preference when choosing.'
    };
  }

  const youtubeLinks = await generateYouTubeLinks(query);
  
  return {
    howToUse: [
      'Unbox and inspect for damage',
      'Read user manual',
      'Follow setup instructions',
      'Test all functions',
      'Register for warranty'
    ],
    tips: [
      'Compare prices across platforms',
      'Look for seasonal sales',
      'Read verified reviews',
      'Check bundle deals',
      'Verify seller reputation'
    ],
    pros: [
      'Good quality and performance',
      'Wide availability',
      'Positive user feedback',
      'Competitive pricing',
      'Standard warranty included'
    ],
    cons: [
      'Lacks some premium features',
      'Strong competition',
      'Regional price variations',
      'Limited customization options'
    ],
    youtubeLinks,
    generalInsights: imageUri ? `Product identified from your image. Solid choice with good balance of features, quality, and value. Consider your use case, budget, and compare with alternatives in the same price range.` : 'Solid choice with good balance of features, quality, and value. Consider your use case, budget, and compare with alternatives in the same price range.'
  };
}

/**
 * Generate AI response with price context from handle_price_query
 */
async function generateAIResponseWithPriceContext(query: string, priceData: any): Promise<AIResponse> {
  console.log('🤖 Generating AI response with price context for:', query);
  
  const productName = priceData.product_searched;
  const cheapestPrice = priceData.cheapest;
  const allPrices = priceData.all_prices;
  
  // Generate contextual insights based on price data
  const priceRange = `₹${Math.min(...allPrices.map((p: any) => p.price)).toLocaleString()} - ₹${Math.max(...allPrices.map((p: any) => p.price)).toLocaleString()}`;
  const avgPrice = Math.round(allPrices.reduce((sum: number, p: any) => sum + p.price, 0) / allPrices.length);
  const platforms = [...new Set(allPrices.map((p: any) => p.platform))];
  
  const youtubeLinks = await generateYouTubeLinks(query);
  
  return {
    howToUse: [
      'Research and compare prices across platforms',
      'Check seller ratings and reviews',
      'Look for deals and discounts',
      'Verify product authenticity',
      'Consider delivery time and costs'
    ],
    tips: [
      `Best price found: ₹${cheapestPrice.price.toLocaleString()} on ${cheapestPrice.platform}`,
      `Price range: ${priceRange} across ${platforms.length} platforms`,
      `Average price: ₹${avgPrice.toLocaleString()}`,
      'Check for seasonal sales and festive offers',
      'Compare warranty and return policies'
    ],
    pros: [
      'Multiple platform availability',
      'Competitive pricing options',
      'Wide price range to choose from',
      'Real-time price comparison available',
      'Verified seller options'
    ],
    cons: [
      'Price variations across platforms',
      'Delivery charges may apply',
      'Stock availability varies',
      'Return policies differ by seller'
    ],
    youtubeLinks,
    generalInsights: `Found ${allPrices.length} options for ${productName} with prices ranging from ${priceRange}. The cheapest option is available on ${cheapestPrice.platform} for ₹${cheapestPrice.price.toLocaleString()}. Consider factors like delivery time, seller reputation, and return policy when making your decision.`
  };
}

async function generateYouTubeLinks(query: string): Promise<{ title: string; url: string; videoId: string; thumbnail: string }[]> {
  console.log('🎥 Generating YouTube links using API for:', query);
  
  try {
    // Use the YouTube API service to get real videos
    const videos = await searchYouTubeVideos(query, 5);
    
    if (videos.length > 0) {
      console.log('✅ Got real YouTube videos from API:', videos.length);
      return videos.map(video => ({
        title: video.title,
        url: video.url,
        videoId: video.videoId,
        thumbnail: video.thumbnail
      }));
    }
  } catch (error) {
    console.error('❌ YouTube API failed, using fallback:', error);
  }
  
  // Fallback to search URLs if API fails
  console.log('🔄 Using fallback YouTube search links');
  const searchQueries = [
    `${query} review 2024`,
    `${query} unboxing`,
    `how to use ${query}`,
    `${query} buying guide`,
    `${query} comparison`
  ];

  const getThumbnail = (index: number) => {
    const thumbnails = [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=180&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=320&h=180&fit=crop',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=320&h=180&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=320&h=180&fit=crop',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=320&h=180&fit=crop'
    ];
    return thumbnails[index % thumbnails.length];
  };

  return searchQueries.map((searchQuery, index) => {
    const encodedQuery = encodeURIComponent(searchQuery);
    const formattedTitle = searchQuery
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      title: formattedTitle,
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      videoId: `search-${index}`,
      thumbnail: getThumbnail(index)
    };
  });
}

/**
 * Analyze product image using AI to identify the product
 */
async function analyzeProductImage(imageUri: string, fallbackQuery: string): Promise<{ productName: string; confidence: number } | null> {
  try {
    console.log('🔍 Sending image to AI for product identification...');
    console.log('📸 Image URI:', imageUri);
    
    // Convert image to base64 if it's a local URI
    let base64Image: string;
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      console.log('📱 Converting local image to base64...');
      try {
        // For React Native, we need to use FileSystem to read the image
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = `data:image/jpeg;base64,${base64Data}`;
        console.log('✅ Image converted to base64 successfully');
      } catch (fsError) {
        console.log('⚠️ FileSystem conversion failed, trying direct URI:', fsError);
        base64Image = imageUri;
      }
    } else if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
    } else {
      // Assume it's already a valid image URL or base64
      base64Image = imageUri;
    }
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Image analysis timeout')), 20000); // 20 second timeout
    });

    const response = await Promise.race([
      fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a product identification expert specializing in Indian e-commerce. Analyze the image and identify the specific product for price comparison. Return ONLY a JSON object with "productName" (specific product name suitable for shopping searches in India) and "confidence" (0-1 score). Be very specific - include brand, model, size, color if visible. Focus on making the product name perfect for finding exact matches on Indian shopping sites like Amazon, Flipkart, etc.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Identify this product for price comparison on Indian e-commerce sites. Be very specific with brand, model, and key features. If you can't identify it clearly, use this fallback: "${fallbackQuery}". Make sure the product name is searchable on sites like Amazon India, Flipkart, etc.`
                },
                {
                  type: 'image',
                  image: base64Image
                }
              ]
            }
          ]
        })
      }),
      timeoutPromise
    ]);

    if (response.ok) {
      const data = await response.json();
      const completion = data.completion;
      console.log('🤖 AI response for image analysis:', completion);
      
      try {
        const jsonString = tryExtractJsonString(completion);
        if (jsonString) {
          const result = JSON.parse(sanitizeJsonString(jsonString));
          if (result.productName && typeof result.confidence === 'number') {
            console.log('✅ Product identified:', result.productName, 'confidence:', result.confidence);
            
            // Only use the AI result if confidence is reasonable
            if (result.confidence >= 0.3) {
              return {
                productName: result.productName.trim(),
                confidence: result.confidence
              };
            } else {
              console.log('⚠️ Low confidence result, using fallback');
            }
          }
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse image analysis result:', parseError);
      }
    } else {
      console.log('❌ AI API returned error status:', response.status);
    }
  } catch (error) {
    console.log('❌ Image analysis API call failed:', error);
  }
  
  // Return fallback result
  console.log('🔄 Using fallback query for image analysis');
  return {
    productName: fallbackQuery || 'Product from image',
    confidence: 0.1
  };
}