import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize auth service
  const authService = new AuthService(fastify.pg);
  const authController = new AuthController(fastify, authService);

  // Google OAuth initialization
  await fastify.register(require('@fastify/oauth2'), {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: fastify.config.GOOGLE_CLIENT_ID,
        secret: fastify.config.GOOGLE_CLIENT_SECRET,
      },
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://www.googleapis.com',
        tokenPath: '/oauth2/v4/token',
      },
    },
    startRedirectPath: '/google',
    callbackUri: 'http://localhost:3000/api/auth/google/callback',
  });

  // Google OAuth callback route - this is where OAuth2 plugin redirects after auth
  fastify.get('/google/callback', async (request, reply) => 
    authController.googleAuth(request, reply)
  );

  // Auth routes
  fastify.post('/logout', async (request, reply) => 
    authController.logout(request, reply)
  );

  // Protected route - requires authentication
  fastify.get('/me', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => 
    authController.me(request, reply)
  );

  // Guest user login - create JWT token for guest users
  fastify.post('/guest', async (request, reply) => {
    try {
      const body = request.body as { 
        name?: string; 
        email?: string; 
        guestId?: string 
      }
      
      // Create guest user data
      const guestUser = {
        id: body.guestId || `guest-${Date.now()}`,
        googleId: 'guest',
        email: body.email || 'guest@example.com',
        name: body.name || 'Misafir Kullanıcı',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Generate JWT token for guest user
      const token = fastify.jwt.sign({ 
        userId: guestUser.id, 
        email: guestUser.email,
        isGuest: true 
      })

      reply
        .setCookie('token', token, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours for guests
        })
      
      return reply.send({ 
        success: true, 
        data: guestUser,
        token // Also return token for WebSocket use
      })
        
    } catch (error) {
      console.error('Guest auth error:', error)
      return reply.status(500).send({ 
        success: false, 
        error: { message: 'Guest authentication failed' } 
      })
    }
  })
} 