import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(
    private fastify: FastifyInstance,
    private authService: AuthService
  ) {}

  async googleAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { token } = await this.fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      
      // Get user info from Google
      const googleUserInfo = await this.authService.getGoogleUserInfo(token.access_token);
      
      // Find or create user in our database
      const user = await this.authService.findOrCreateUser(googleUserInfo);
      
      // Generate JWT token
      const jwtToken = this.fastify.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      
      // Set HTTP-only cookie
      await reply.setCookie('token', jwtToken, {
        httpOnly: true,
        secure: this.fastify.config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });
      
      // Redirect to frontend
      await reply.redirect(`${this.fastify.config.FRONTEND_URL}/dashboard`);
    } catch (error) {
      this.fastify.log.error('Google OAuth error:', error);
      await reply.redirect(`${this.fastify.config.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await reply.clearCookie('token', {
      path: '/',
    });
    
    return reply.send({ success: true, message: 'Logged out successfully' });
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // JWT middleware should have already verified the token
      const userId = (request.user as { userId: string }).userId;
      
      const user = await this.authService.getUserById(userId);
      
      if (!user) {
        return reply.status(404).send({
          error: 'user_not_found',
          message: 'User not found',
        });
      }
      
      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      this.fastify.log.error('Get user error:', error);
      return reply.status(500).send({
        error: 'internal_server_error',
        message: 'Failed to get user information',
      });
    }
  }
}

 