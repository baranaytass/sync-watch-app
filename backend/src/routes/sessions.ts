// import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SessionController } from '../controllers/SessionController';
import { SessionService } from '../services/SessionService';
import { YouTubeService } from '../services/YouTubeService';

export default async function sessionRoutes(
  fastify: any
): Promise<void> {
  // Initialize services
  const sessionService = new SessionService(fastify.pg);
  const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY!);
  const sessionController = new SessionController(sessionService, youtubeService);

  // GET /api/sessions - Get all active sessions (public listing)
  fastify.get('/', {
    // No authentication required for public session listing
    handler: async (request: any, reply: any) => {
      return sessionController.getSessions(request as any, reply);
    },
  });

  // POST /api/sessions - Create new session
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      return sessionController.createSession(request as any, reply);
    },
  });

  // GET /api/sessions/:id - Get specific session
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      return sessionController.getSession(request as any, reply);
    },
  });

  // POST /api/sessions/:id/join - Join session
  fastify.post('/:id/join', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      return sessionController.joinSession(request as any, reply);
    },
  });

  // POST /api/sessions/:id/video - Set session video
  fastify.post('/:id/video', {
    preHandler: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      return sessionController.setSessionVideo(request as any, reply);
    },
  });
} 