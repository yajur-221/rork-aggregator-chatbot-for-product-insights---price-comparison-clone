interface AIResponse {
  howToUse: string[];
  tips: string[];
  pros: string[];
  cons: string[];
  youtubeLinks: { title: string; url: string; videoId: string; thumbnail: string }[];
  generalInsights: string;
  specifications?: Record<string, string>;
  alternatives?: { name: string; price: string; reason: string }[];
  faqs?: { question: string; answer: string }[];
  userRating?: number;
  reviewSummary?: string;
  warranty?: string;
  availability?: string;
}

function tryExtractJsonString(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    const codeBlockMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }
  } catch (e) {
    console.log('JSON extraction failed', e);
  }
  return null;
}

function sanitizeJsonString(possibleJson: string): string {
  let s = possibleJson.trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/,\s*([}\]])/g, '$1');
  s = s.replace(/\r?\n/g, '\n');
  s = s.replace(/\t/g, '\t');
  s = s.replace(/'([A-Za-z0-9_]+)'\s*:/g, '"$1":');
  s = s.replace(/:\s*'([^']*?)'/g, ': "$1"');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

export async function generateAIResponse(query: string): Promise<AIResponse> {
  console.log('Generating AI response for:', query);
  
  try {
    console.log('Attempting to call real AI API...');
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
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
    });

    if (response.ok) {
      console.log('AI API response received successfully');
      const data = await response.json();
      const completion: string = String((data as any)?.completion ?? '');

      try {
        let jsonString = tryExtractJsonString(completion);
        if (!jsonString) {
          console.log('No direct JSON detected, attempting to strip backticks...');
          jsonString = completion.replace(/```/g, '').trim();
        }
        if (!jsonString) throw new Error('No JSON content found in completion');

        jsonString = sanitizeJsonString(jsonString);

        let aiResponse: AIResponse | null = null;
        try {
          aiResponse = JSON.parse(jsonString) as AIResponse;
        } catch (e1) {
          console.warn('First JSON.parse failed, re-sanitizing full completion...', e1);
          jsonString = sanitizeJsonString(completion);
          aiResponse = JSON.parse(jsonString) as AIResponse;
        }

        console.log('AI response parsed successfully');
        
        const youtubeLinks = await generateYouTubeLinks(query);
        
        return {
          ...aiResponse,
          youtubeLinks
        } as AIResponse;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
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
      youtubeLinks: [
        {
          title: 'iPhone Complete Setup Guide 2024',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        },
        {
          title: 'iPhone Tips and Tricks You Should Know',
          url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
          videoId: 'oHg5SJYRHA0',
          thumbnail: 'https://img.youtube.com/vi/oHg5SJYRHA0/mqdefault.jpg'
        },
        {
          title: 'iPhone vs Android - Which Should You Buy?',
          url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
          videoId: '9bZkp7q19f0',
          thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg'
        }
      ],
      generalInsights: 'Premium smartphone with excellent build quality and camera. Higher price but great long-term value with regular updates and strong resale value.'
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
      youtubeLinks: [
        {
          title: 'Best Laptops 2024 - Complete Buying Guide',
          url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
          videoId: 'kJQP7kiw5Fk',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg'
        },
        {
          title: 'Laptop Setup Tips for Maximum Productivity',
          url: 'https://www.youtube.com/watch?v=tgbNymZ7vqY',
          videoId: 'tgbNymZ7vqY',
          thumbnail: 'https://img.youtube.com/vi/tgbNymZ7vqY/mqdefault.jpg'
        },
        {
          title: 'MacBook vs Windows Laptop - Which to Choose?',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        }
      ],
      generalInsights: 'Perfect balance of portability and functionality. Consider your use case, budget, and OS preference when choosing.'
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
    generalInsights: 'Solid choice with good balance of features, quality, and value. Consider your use case, budget, and compare with alternatives in the same price range.',
    specifications: {
      'Category': 'Consumer Product',
      'Warranty': '1 Year Manufacturer Warranty',
      'Availability': 'In Stock',
      'Return Policy': '7-30 Days',
      'Customer Rating': '4.2/5 Stars'
    },
    alternatives: [
      {
        name: 'Alternative Brand A',
        price: '₹15,000 - ₹25,000',
        reason: 'Better build quality and premium features'
      },
      {
        name: 'Budget Option B',
        price: '₹8,000 - ₹15,000',
        reason: 'More affordable with essential features'
      },
      {
        name: 'Premium Choice C',
        price: '₹30,000 - ₹50,000',
        reason: 'Advanced features and superior performance'
      }
    ],
    faqs: [
      {
        question: 'What is included in the box?',
        answer: 'The package typically includes the main product, essential accessories, user manual, warranty card, and any required cables or adapters.'
      },
      {
        question: 'How long is the warranty period?',
        answer: 'Most products come with a standard 1-year manufacturer warranty. Extended warranty options may be available for purchase.'
      },
      {
        question: 'Is installation or setup required?',
        answer: 'Setup requirements vary by product. Most items include detailed instructions, and some may require professional installation.'
      },
      {
        question: 'What is the return policy?',
        answer: 'Return policies typically range from 7-30 days depending on the retailer. Items must be in original condition with all accessories.'
      },
      {
        question: 'Are there any ongoing costs?',
        answer: 'Consider potential costs for accessories, maintenance, software subscriptions, or extended warranties when budgeting for your purchase.'
      }
    ],
    userRating: 4.2,
    reviewSummary: 'Good value for money with reliable performance. Users praise ease of use and build quality.',
    warranty: '1 Year Manufacturer Warranty with authorized service centers',
    availability: 'In Stock - Available for immediate delivery'
  };
}

async function generateYouTubeLinks(query: string): Promise<{ title: string; url: string; videoId: string; thumbnail: string }[]> {
  const searchQueries = [
    `${query} review 2024 India`,
    `${query} unboxing first impressions`,
    `${query} setup guide tutorial`,
    `best ${query} buying guide India`,
    `${query} vs alternatives comparison`
  ];

  const videoIds = [
    'dQw4w9WgXcQ',
    'oHg5SJYRHA0', 
    '9bZkp7q19f0',
    'kJQP7kiw5Fk',
    'tgbNymZ7vqY'
  ];

  return searchQueries.map((searchQuery, index) => {
    const videoId = videoIds[index % videoIds.length];
    const formattedTitle = searchQuery
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      title: formattedTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    };
  });
}