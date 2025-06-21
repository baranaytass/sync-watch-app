import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from '../services/SessionService';
import { CreateSessionRequest, SetSessionVideoRequest, ApiResponse } from '@sync-watch-app/shared-types';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export class SessionController {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  // GET /api/sessions
  async getSessions(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const sessions = await this.sessionService.getActiveSessionsForUser(request.user.userId);
      
      const response: ApiResponse = {
        success: true,
        data: sessions,
      };

      reply.code(200).send(response);
    } catch (error) {
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

  // POST /api/sessions
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
      
      const response: ApiResponse = {
        success: true,
        data: session,
      };

      reply.code(201).send(response);
    } catch (error) {
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

  // POST /api/sessions/:id/join
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

      const result = await this.sessionService.joinSession(id, request.user.userId);
      
      const response: ApiResponse = {
        success: true,
        data: result,
      };

      reply.code(200).send(response);
    } catch (error) {
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



  // POST /api/sessions/:id/video
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

      // Basic YouTube video ID validation
      const youtubeVideoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
      if (!youtubeVideoIdRegex.test(body.videoId)) {
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

      // For now, we'll set default values for video title and duration
      // TODO: Implement YouTube API integration to fetch video metadata
      const videoData = {
        videoId: body.videoId,
        videoTitle: `Video ${body.videoId}`, // Placeholder
        videoDuration: 0, // Placeholder
      };

      const session = await this.sessionService.setSessionVideo(id, request.user.userId, videoData);
      
      const response: ApiResponse = {
        success: true,
        data: session,
      };

      reply.code(200).send(response);
    } catch (error) {
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



  // GET /api/sessions/:id
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

      const session = await this.sessionService.getSessionById(id, request.user.userId);
      
      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: {
            error: 'session_not_found',
            message: 'Session not found',
          },
        };
        reply.code(404).send(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: session,
      };

      reply.code(200).send(response);
    } catch (error) {
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
} 