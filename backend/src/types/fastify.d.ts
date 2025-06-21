import { EnvConfig } from '../config/env';
import { Pool } from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
    pg: Pool;
    jwt: {
      sign: (payload: object, options?: object) => string;
      verify: (token: string) => object;
    };
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (request: FastifyRequest) => Promise<{
        token: {
          access_token: string;
          refresh_token?: string;
          token_type: string;
          expires_in: number;
        };
      }>;
    };
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
    cookies: {
      [key: string]: string;
    };
  }

  interface FastifyReply {
    setCookie: (name: string, value: string, options?: object) => Promise<this>;
    clearCookie: (name: string, options?: object) => Promise<this>;
  }
} 