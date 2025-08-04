// import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { SessionService } from '../services/SessionService';
import { YouTubeService } from '../services/YouTubeService';
import { CreateSessionRequest, SetSessionVideoRequest, ApiResponse } from '@sync-watch-app/shared-types';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
  params: any;
  body: any;
}

export class SessionController {
  private sessionService: SessionService;
  private youtubeService: YouTubeService;
  private fastify: any;

  constructor(fastify: any, sessionService: SessionService, youtubeService: YouTubeService) {
    console.log('🏗️ SessionController: Constructor called');
    console.log('🏗️ SessionController: fastify instance decorators:', Object.keys(fastify));
    console.log('🏗️ SessionController: hasDecorator broadcastToSession:', fastify.hasDecorator('broadcastToSession'));
    this.fastify = fastify;
    this.sessionService = sessionService;
    this.youtubeService = youtubeService;
  }

  // GET /api/sessions - Get active sessions (both user's sessions and public listing)
  async getSessions(_request: AuthenticatedRequest, reply: any): Promise<void> {
    try {
      const sessions = await this.sessionService.getAllActiveSessions();
      
      const response: ApiResponse = {
        success: true,
        data: sessions,
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error('❌ SessionController: Error fetching sessions:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          error: 'sessions_fetch_error',
          message: error instanceof Error ? error.message : 'Failed to fetch sessions',
        },
      };

      reply.code(500).send(response);
    }
  }

  // POST /api/sessions - Create new session
  async createSession(request: AuthenticatedRequest, reply: any): Promise<void> {
    try {
      const body = request.body as CreateSessionRequest;
      
      console.log(`📋 SessionController: User ${request.user.userId} creating session: "${body.title}"`);
      
      if (!body.title || body.title.trim().length === 0) {
        console.log(`❌ SessionController: Session creation failed - empty title`);
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_input',
            message: 'Session title is required',
          },
        };
        reply.code(400).send(response);
        return;
      }

      const sessionData: {
        title: string;
        description?: string;
        hostId: string;
      } = {
        title: body.title.trim(),
        hostId: request.user.userId,
      };

      if (body.description?.trim()) {
        sessionData.description = body.description.trim();
      }

      const session = await this.sessionService.createSession(sessionData);
      
      console.log(`✅ SessionController: Session created successfully - ID: ${session.id}, Title: "${session.title}"`);
      
      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(201).send(response);
    } catch (error) {
      console.error('❌ SessionController: Error creating session:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          error: 'session_create_error',
          message: error instanceof Error ? error.message : 'Failed to create session',
        },
      };

      reply.code(500).send(response);
    }
  }

  // GET /api/sessions/:id - Get specific session
  async getSession(request: AuthenticatedRequest, reply: any): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_input',
            message: 'Session ID is required',
          },
        };
        reply.code(400).send(response);
        return;
      }

      const session = await this.sessionService.getSessionById(id, request.user.userId);
      
      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'session_not_found',
            message: 'Session not found or not accessible',
          },
        };
        reply.code(404).send(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error('📋 SessionController: Error fetching session:', error);
      let statusCode = 500;
      let errorCode = 'session_fetch_error';

      if (error instanceof Error && error.message.includes('do not have access')) {
        statusCode = 403;
        errorCode = 'unauthorized';
      }

      const response: ApiResponse = {
        success: false,
        error: {
          error: errorCode,
          message: error instanceof Error ? error.message : 'Failed to fetch session',
        },
      };

      reply.code(statusCode).send(response);
    }
  }

  // POST /api/sessions/:id/join - Join session
  async joinSession(request: AuthenticatedRequest, reply: any): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      
      console.log(`📋 SessionController: User ${request.user.userId} joining session ${id}`);
      
      if (!id) {
        console.log(`❌ SessionController: Session join failed - no session ID provided`);
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_input',
            message: 'Session ID is required',
          },
        };
        reply.code(400).send(response);
        return;
      }

      const session = await this.sessionService.joinSession(id, request.user.userId);
      
      console.log(`✅ SessionController: User successfully joined session ${id} - "${session.title}"`);
      
      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error(`❌ SessionController: Error joining session ${request.params?.id}:`, error);
      let statusCode = 500;
      let errorCode = 'session_join_error';

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('not active')) {
          statusCode = 404;
          errorCode = 'session_not_found';
        } else if (error.message.includes('User not found')) {
          statusCode = 404;
          errorCode = 'user_not_found';
        }
      }

      const response: ApiResponse = {
        success: false,
        error: {
          error: errorCode,
          message: error instanceof Error ? error.message : 'Failed to join session',
        },
      };

      reply.code(statusCode).send(response);
    }
  }

  // POST /api/sessions/:id/video - Set session video
  async setSessionVideo(request: AuthenticatedRequest, reply: any): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as SetSessionVideoRequest;
      
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_input',
            message: 'Session ID is required',
          },
        };
        reply.code(400).send(response);
        return;
      }

      if (!body.videoId || body.videoId.trim().length === 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_input',
            message: 'Video ID is required',
          },
        };
        reply.code(400).send(response);
        return;
      }

      console.log(`📋 SessionController: User ${request.user.userId} setting video for session ${id}: ${body.videoId}`);

      // Extract video ID from URL if provided
      const videoId = this.youtubeService.extractVideoId(body.videoId) || body.videoId;
      
      if (!this.youtubeService.isValidVideoId(videoId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_video_id',
            message: 'Invalid YouTube video ID format',
          },
        };
        reply.code(400).send(response);
        return;
      }

      // Fetch video metadata from YouTube API
      const videoMetadata = await this.youtubeService.getVideoMetadata(videoId);
      
      if (!videoMetadata) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'invalid_video_id',
            message: 'YouTube video not found or private',
          },
        };
        reply.code(400).send(response);
        return;
      }

      const videoData = {
        videoId: videoMetadata.id,
        videoTitle: videoMetadata.title,
        videoDuration: videoMetadata.duration,
      };

      const session = await this.sessionService.setSessionVideo(id, request.user.userId, videoData);
      
      console.log(`📋 SessionController: Video set successfully for session ${id}: "${videoMetadata.title}"`);
      
      // Broadcast video update & sync to all session participants via WebSocket if decorator exists
      const broadcaster = (this.fastify as any).broadcastToSession;
      console.log(`📡 SessionController: broadcastToSession exists: ${typeof broadcaster}`);
      console.log(`📡 SessionController: fastify decorators:`, Object.keys(this.fastify));
      console.log(`📡 SessionController: fastify hasDecorator broadcastToSession:`, this.fastify.hasDecorator('broadcastToSession'));
      
      if (typeof broadcaster === 'function') {
        console.log(`📡 Broadcasting video_update to session ${id}`);
        try {
          broadcaster(id, 'video_update', {
            videoProvider: 'youtube',
            videoId: videoData.videoId,
            videoTitle: videoData.videoTitle,
            videoDuration: videoData.videoDuration,
          });
          console.log(`✅ video_update broadcast successful`);
        } catch (error) {
          console.error(`❌ video_update broadcast failed:`, error);
        }

        console.log(`📡 Broadcasting video_sync to session ${id}`);
        try {
          broadcaster(id, 'video_sync', {
            action: 'pause',
            time: 0,
            timestamp: new Date(),
          });
          console.log(`✅ video_sync broadcast successful`);
        } catch (error) {
          console.error(`❌ video_sync broadcast failed:`, error);
        }
      } else {
        console.log(`❌ SessionController: broadcastToSession decorator not available`);
      }

      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error('📋 SessionController: Error setting session video:', error);
      let statusCode = 500;
      let errorCode = 'session_video_update_error';

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('not active')) {
          statusCode = 404;
          errorCode = 'session_not_found';
        } else if (error.message.includes('Only the host')) {
          statusCode = 403;
          errorCode = 'not_session_host';
        }
      }

      const response: ApiResponse = {
        success: false,
        error: {
          error: errorCode,
          message: error instanceof Error ? error.message : 'Failed to update session video',
        },
      };

      reply.code(statusCode).send(response);
    }
  }
} 