const YOUTUBE_API_KEY = 'AIzaSyD5WuFY2ZVScGzRqnFwKnmM3ITaP3c877A';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
  viewCount?: string;
  duration?: string;
}

interface YouTubeSearchResponse {
  items: {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        medium: {
          url: string;
        };
        high?: {
          url: string;
        };
      };
      channelTitle: string;
      publishedAt: string;
    };
  }[];
}

interface YouTubeVideoDetailsResponse {
  items: {
    statistics: {
      viewCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }[];
}

/**
 * Search for YouTube videos using the YouTube Data API v3
 */
export async function searchYouTubeVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
  try {
    console.log('🎥 Searching YouTube for:', query);
    
    // Create search queries for different types of content
    const searchQueries = [
      `${query} review 2024`,
      `${query} unboxing`,
      `how to use ${query}`,
      `${query} buying guide`,
      `${query} comparison`
    ];
    
    const allVideos: YouTubeVideo[] = [];
    
    // Search for each query type to get diverse content
    for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      try {
        const searchUrl = `${YOUTUBE_API_BASE_URL}/search?` +
          `part=snippet&` +
          `q=${encodeURIComponent(searchQuery)}&` +
          `type=video&` +
          `maxResults=2&` + // 2 results per query type
          `order=relevance&` +
          `regionCode=IN&` + // Focus on Indian content
          `relevanceLanguage=en&` +
          `key=${YOUTUBE_API_KEY}`;
        
        console.log('🔍 Fetching from YouTube API:', searchQuery);
        
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          console.error('YouTube API error:', response.status, response.statusText);
          continue;
        }
        
        const data: YouTubeSearchResponse = await response.json();
        
        if (!data.items || data.items.length === 0) {
          console.log('No videos found for query:', searchQuery);
          continue;
        }
        
        // Get video IDs for additional details
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        
        // Fetch video statistics and duration
        let videoDetails: YouTubeVideoDetailsResponse | null = null;
        try {
          const detailsUrl = `${YOUTUBE_API_BASE_URL}/videos?` +
            `part=statistics,contentDetails&` +
            `id=${videoIds}&` +
            `key=${YOUTUBE_API_KEY}`;
          
          const detailsResponse = await fetch(detailsUrl);
          if (detailsResponse.ok) {
            videoDetails = await detailsResponse.json();
          }
        } catch (error) {
          console.log('Could not fetch video details:', error);
        }
        
        // Process videos
        const videos: YouTubeVideo[] = data.items.map((item, index) => {
          const videoId = item.id.videoId;
          const snippet = item.snippet;
          const details = videoDetails?.items?.[index];
          
          return {
            title: snippet.title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId,
            thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.medium.url,
            channelTitle: snippet.channelTitle,
            publishedAt: snippet.publishedAt,
            description: snippet.description,
            viewCount: details?.statistics?.viewCount,
            duration: details?.contentDetails?.duration
          };
        });
        
        allVideos.push(...videos);
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Error searching YouTube for query:', searchQuery, error);
        continue;
      }
    }
    
    // Remove duplicates and limit results
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.videoId === video.videoId)
    );
    
    console.log('✅ Found', uniqueVideos.length, 'unique YouTube videos');
    
    return uniqueVideos.slice(0, maxResults);
    
  } catch (error) {
    console.error('YouTube API search failed:', error);
    
    // Fallback to search URLs if API fails
    console.log('🔄 Falling back to YouTube search URLs');
    return generateFallbackYouTubeLinks(query);
  }
}

/**
 * Fallback function to generate YouTube search links when API fails
 */
function generateFallbackYouTubeLinks(query: string): YouTubeVideo[] {
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
      thumbnail: getThumbnail(index),
      channelTitle: 'YouTube Search',
      publishedAt: new Date().toISOString(),
      description: `Search results for ${searchQuery}`
    };
  });
}

/**
 * Format duration from YouTube API format (PT4M13S) to readable format (4:13)
 */
export function formatYouTubeDuration(duration?: string): string {
  if (!duration) return '';
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format view count to readable format (1.2M, 45K, etc.)
 */
export function formatViewCount(viewCount?: string): string {
  if (!viewCount) return '';
  
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  } else {
    return `${count} views`;
  }
}