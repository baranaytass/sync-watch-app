import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { SessionController } from '../controllers/SessionController';
import { SessionService } from '../services/SessionService';

export default async function sessionRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Initialize SessionService with database connection
  const sessionService = new SessionService(fastify.pg);
  const sessionController = new SessionController(sessionService);

  // GET /api/sessions - Get user's sessions
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return sessionController.getSessions(request as any, reply);
    },
  });

  // POST /api/sessions - Create new session
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return sessionController.createSession(request as any, reply);
    },
  });

  // GET /api/sessions/:id - Get specific session
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return sessionController.getSession(request as any, reply);
    },
  });

  // POST /api/sessions/:id/join - Join session
  fastify.post('/:id/join', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return sessionController.joinSession(request as any, reply);
    },
  });



  // POST /api/sessions/:id/video - Set session video
  fastify.post('/:id/video', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return sessionController.setSessionVideo(request as any, reply);
    },
  });


} 