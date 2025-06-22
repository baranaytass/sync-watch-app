import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/SessionService';
import { YouTubeService } from '../services/YouTubeService';
import { CreateSessionRequest, SetSessionVideoRequest, ApiResponse } from '@sync-watch-app/shared-types';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export class SessionController {
  private sessionService: SessionService;
  private youtubeService: YouTubeService;

  constructor(sessionService: SessionService, youtubeService: YouTubeService) {
    this.sessionService = sessionService;
    this.youtubeService = youtubeService;
  }

  // GET /api/sessions - Get active sessions (both user's sessions and public listing)
  async getSessions(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      console.log(`📋 SessionController: User ${request.user.userId} requesting sessions`);
      
      // Get all active sessions (this serves both user's sessions and public listing)
      const sessions = await this.sessionService.getAllActiveSessions();
      
      console.log(`📋 SessionController: Found ${sessions.length} active sessions`);
      sessions.forEach(session => {
        console.log(`📋 SessionController: - Session ${session.id}: "${session.title}" (${session.participants.length} participants)`);
      });
      
      const response: ApiResponse = {
        success: true,
        data: sessions,
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error('📋 SessionController: Error fetching sessions:', error);
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
  async createSession(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as CreateSessionRequest;
      
      if (!body.title || body.title.trim().length === 0) {
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

      console.log(`📋 SessionController: User ${request.user.userId} creating session: "${body.title}"`);

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
      
      console.log(`📋 SessionController: Session created successfully: ${session.id} with ${session.participants.length} participants`);
      
      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(201).send(response);
    } catch (error) {
      console.error('📋 SessionController: Error creating session:', error);
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
  async getSession(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
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

      console.log(`📋 SessionController: User ${request.user.userId} requesting session: ${id}`);

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

      console.log(`📋 SessionController: Session found: ${session.id} with ${session.participants.length} participants`);

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
  async joinSession(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
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

      console.log(`📋 SessionController: User ${request.user.userId} joining session: ${id}`);

      const session = await this.sessionService.joinSession(id, request.user.userId);
      
      console.log(`📋 SessionController: User successfully joined session ${id}, now has ${session.participants.length} participants`);
      
      const response: ApiResponse = {
        success: true,
        data: session
      };

      reply.code(200).send(response);
    } catch (error) {
      console.error('📋 SessionController: Error joining session:', error);
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
  async setSessionVideo(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
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