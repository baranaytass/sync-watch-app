// import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(
    private fastify: any,
    private authService: AuthService
  ) {}

  async googleAuth(request: any, reply: any): Promise<void> {
    try {
      console.log('🔵 Starting Google OAuth flow...');
      
      const { token } = await this.fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      console.log('🔵 Got access token:', token ? 'SUCCESS' : 'FAILED');
      
      // Get user info from Google
      console.log('🔵 Fetching Google user info...');
      const googleUserInfo = await this.authService.getGoogleUserInfo(token.access_token);
      console.log('🔵 Google user info:', googleUserInfo);
      
      // Find or create user in our database
      console.log('🔵 Finding or creating user in database...');
      const user = await this.authService.findOrCreateUser(googleUserInfo);
      console.log('🔵 User in database:', user);
      
      // Generate JWT token
      console.log('🔵 Generating JWT token...');
      const jwtToken = this.fastify.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '7d' }
      );
      console.log('🔵 JWT token generated:', jwtToken ? 'SUCCESS' : 'FAILED');
      
      // Set HTTP-only cookie and redirect
      console.log('🔵 Setting cookie and redirecting...');
      reply.setCookie('token', jwtToken, {
        httpOnly: true,
        secure: this.fastify.config.NODE_ENV === 'production',
        sameSite: this.fastify.config.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: this.fastify.config.NODE_ENV === 'production' ? '.onrender.com' : undefined,
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });
      
      // Redirect to frontend
      console.log('🔵 Redirecting to frontend...');
      return reply.redirect(`${this.fastify.config.FRONTEND_URL}/`);
    } catch (error) {
      console.error('🔴 Google OAuth error step by step:', error);
      console.error('🔴 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown'
      });
      this.fastify.log.error('Google OAuth error:', error);
      await reply.redirect(`${this.fastify.config.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  async logout(_request: any, reply: any): Promise<void> {
    console.log('🔵 Logging out user...');
    
    // Fastify clearCookie sometimes fails if attributes mismatch; therefore we
    // first overwrite the cookie with an empty value and immediate expiry, then
    // call clearCookie as fallback.

    reply.setCookie('token', '', {
      path: '/',
      httpOnly: true,
      secure: this.fastify.config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    // Additional clear (safety net)
    reply.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: this.fastify.config.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    console.log('🔵 Cookie cleared, logout successful');
    return reply.send({ success: true, message: 'Logged out successfully' });
  }

  async guestAuth(request: any, reply: any): Promise<void> {
    try {
      console.log('🟢 Guest auth request received');

      // Extract name from body if provided
      const { name } = (request.body as { name?: string }) || {};

      // Create guest user in DB
      const guestUser = await this.authService.createGuestUser(name || 'Guest User');

      console.log('🟢 Guest user created:', guestUser.id);

      // Generate JWT token
      const jwtToken = this.fastify.jwt.sign(
        { userId: guestUser.id, email: guestUser.email },
        { expiresIn: '1d' } // shorter expiry for guest accounts
      );

      // Set HTTP-only cookie
      reply.setCookie('token', jwtToken, {
        httpOnly: true,
        secure: this.fastify.config.NODE_ENV === 'production',
        sameSite: this.fastify.config.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: this.fastify.config.NODE_ENV === 'production' ? '.onrender.com' : undefined,
        maxAge: 24 * 60 * 60, // 1 day
        path: '/',
      });

      return reply.send({ success: true, data: guestUser });
    } catch (error) {
      console.error('🔴 Guest auth error:', error);
      return reply.status(500).send({ error: 'guest_auth_error', message: 'Failed to create guest user' });
    }
  }

  async me(request: any, reply: any): Promise<void> {
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

 