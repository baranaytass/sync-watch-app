declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayerConfig {
  height: string | number;
  width: string | number;
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    loop?: 0 | 1;
    playlist?: string;
    start?: number;
    end?: number;
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onPlaybackQualityChange?: (event: YTPlayerEvent) => void;
    onPlaybackRateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
    onApiChange?: (event: YTPlayerEvent) => void;
  };
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  loadVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(suggestedRate: number): void;
  getAvailablePlaybackRates(): number[];
  getPlaybackQuality(): string;
  setPlaybackQuality(suggestedQuality: string): void;
  getAvailableQualityLevels(): string[];
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

export {}; 