export interface VideoMetadata {
  id: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl: string = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extracts video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  /**
   * Validates YouTube video ID format
   */
  isValidVideoId(videoId: string): boolean {
    const regex = /^[a-zA-Z0-9_-]{11}$/;
    return regex.test(videoId);
  }

  /**
   * Converts ISO 8601 duration to seconds
   */
  private parseDuration(duration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Fetches video metadata from YouTube API
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    if (!this.isValidVideoId(videoId)) {
      throw new Error('Invalid YouTube video ID format');
    }

    // DEVELOPMENT / TEST SHORT-CIRCUIT -----------------------------
    // Yerel geliştirme veya CI ortamlarında gerçek Google API anahtarı bulunmayabilir.
    // API anahtarı tanımsız ya da placeholder ise doğrudan sahte (mock) metadata döndür.
    if (!this.apiKey || this.apiKey === 'your-youtube-api-key') {
      return {
        id: videoId,
        title: `Mock Video – ${videoId}`,
        duration: 600, // 10 dk
        thumbnail: '',
        channelTitle: 'Mock Channel',
        publishedAt: new Date().toISOString(),
      };
    }
    // --------------------------------------------------------------

    const url = `${this.baseUrl}/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('YouTube API error:', data);
        throw new Error(data.error?.message || 'YouTube API request failed');
      }

      if (!data.items || data.items.length === 0) {
        return null; // Video not found or private
      }

      const item = data.items[0];
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;

      return {
        id: videoId,
        title: snippet.title,
        duration: this.parseDuration(contentDetails.duration),
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch video metadata');
    }
  }

  /**
   * Validates if a video exists and is accessible
   */
  async validateVideo(videoId: string): Promise<boolean> {
    try {
      const metadata = await this.getVideoMetadata(videoId);
      return metadata !== null;
    } catch {
      return false;
    }
  }
} 