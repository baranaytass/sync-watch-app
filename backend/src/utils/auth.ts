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
    
    // Verify JWT token or fallback token
    let decoded: JWTPayload;
    
    try {
      // Try to verify as JWT first
      decoded = request.server.jwt.verify(token) as JWTPayload;
    } catch (jwtError) {
      // If JWT verification fails, try fallback JWT format
      try {
        // Check if it's a fallback JWT structure (header.payload.signature)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.userId && payload.email && payload.exp) {
            // Check if token is not expired
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp > now) {
              decoded = {
                userId: payload.userId,
                email: payload.email
              };
              console.log('🔧 Auth middleware: Using fallback JWT token for user:', payload.userId);
            } else {
              throw new Error('Fallback token expired');
            }
          } else {
            throw new Error('Invalid fallback token payload');
          }
        } else {
          // Try legacy temporary token format
          const tempTokenData = JSON.parse(atob(token));
          if (tempTokenData.userId && tempTokenData.email && tempTokenData.timestamp) {
            const tokenAge = Date.now() - tempTokenData.timestamp;
            if (tokenAge < 60 * 60 * 1000) { // 1 hour
              decoded = {
                userId: tempTokenData.userId,
                email: tempTokenData.email
              };
              console.log('🔧 Auth middleware: Using legacy temporary token for user:', tempTokenData.userId);
            } else {
              throw new Error('Temporary token expired');
            }
          } else {
            throw new Error('Invalid temporary token format');
          }
        }
      } catch (fallbackError) {
        // Neither JWT nor fallback token worked
        throw jwtError; // Throw original JWT error
      }
    }
    
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