// User Model
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session Model
export interface Session {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  videoProvider: 'youtube';
  videoId: string | null;
  videoTitle: string | null;
  videoDuration: number;
  lastAction: 'play' | 'pause' | 'seek';
  lastActionTimeAsSecond: number;
  lastActionTimestamp: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Session Participant Model
export interface SessionParticipant {
  sessionId: string;
  userId: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen: Date;
}

// Video Actions
export type VideoAction = 'play' | 'pause' | 'seek';

// WebSocket Message Types - Client to Server
export interface ClientToServerEvents {
  video_action: {
    action: VideoAction;
    time: number;
  };
  chat: {
    message: string;
  };
  leave: Record<string, never>;
}

// WebSocket Message Types - Server to Client
export interface ServerToClientEvents {
  video_sync: {
    action: VideoAction;
    time: number;
    timestamp: Date;
  };
  chat: {
    id: string;
    userId: string;
    message: string;
    timestamp: Date;
  };
  participants: {
    participants: Array<{
      userId: string;
      name: string;
      avatar: string;
    }>;
  };
  video_update: {
    videoProvider: 'youtube';
    videoId: string;
    videoTitle: string;
    videoDuration: number;
  };
  session_ended: Record<string, never>;
}

// API Request/Response Types
export interface CreateSessionRequest {
  title: string;
  description?: string;
}

export interface SetSessionVideoRequest {
  videoId: string;
}

export interface ApiError {
  error: string;
  message: string;
}

// Common Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
} 