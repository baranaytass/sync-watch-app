// import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function authenticateJWT(
  request: any,
  reply: any
): Promise<void> {
  // Try to get token from cookie first
  let token = request.cookies.token;
  
  try {
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      console.log('🔴 Auth middleware: No token found');
      console.log('🔴 Auth middleware: Cookies available:', Object.keys(request.cookies));
      console.log('🔴 Auth middleware: Authorization header:', request.headers.authorization);
      return reply.status(401).send({
        error: 'unauthorized',
        message: 'No authentication token provided',
      });
    }
    
    // Verify JWT token
    const decoded = request.server.jwt.verify(token) as JWTPayload;
    
    if (!decoded.userId || !decoded.email) {
      return reply.status(401).send({
        error: 'invalid_token',
        message: 'Invalid token payload',
      });
    }
    
    // Attach user info to request
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
  } catch (error) {
    console.log('🔴 Auth middleware: JWT verification failed');
    console.log('🔴 Auth middleware: Error:', error instanceof Error ? error.message : error);
    console.log('🔴 Auth middleware: Token (first 20 chars):', typeof token === 'string' ? token.substring(0, 20) + '...' : 'undefined');
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return reply.status(401).send({
          error: 'token_expired',
          message: 'Authentication token has expired',
        });
      }
      
      if (error.message.includes('invalid')) {
        return reply.status(401).send({
          error: 'invalid_token',
          message: 'Invalid authentication token',
        });
      }
    }
    
    return reply.status(401).send({
      error: 'authentication_failed',
      message: 'Authentication failed',
    });
  }
} 