import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    console.log(`🔐 Auth: Checking authentication for ${request.method} ${request.url}`);
    
    // Try to get token from cookie first
    let token = request.cookies.token;
    console.log(`🔐 Auth: Cookie token: ${token ? 'YES (length=' + token.length + ')' : 'NO'}`);
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      console.log(`🔐 Auth: Authorization header: ${authHeader || 'NO'}`);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log(`🔐 Auth: Bearer token: ${token ? 'YES (length=' + token.length + ')' : 'NO'}`);
      }
    }
    
    if (!token) {
      console.log(`🔐 Auth: No token found - sending 401`);
      return reply.status(401).send({
        error: 'unauthorized',
        message: 'No authentication token provided',
      });
    }
    
    console.log(`🔐 Auth: Verifying token: ${token.substring(0, 20)}...`);
    // Verify JWT token
    const decoded = request.server.jwt.verify(token) as JWTPayload;
    console.log(`🔐 Auth: Token verified successfully for user: ${decoded.userId}`);
    
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