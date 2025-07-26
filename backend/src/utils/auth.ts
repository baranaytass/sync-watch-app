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
  try {
    // Try to get token from cookie first
    let token = request.cookies.token;
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
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