import Fastify from 'fastify';
import { EnvSchema } from './config/env';
import { DatabaseConfig } from './config/database';

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function start(): Promise<void> {
  try {
    // Register environment variables
    await server.register(require('@fastify/env'), {
      schema: EnvSchema,
      dotenv: true,
    });

    // Initialize database
    const db = new DatabaseConfig(server.config);
    await db.testConnection();

    // Register plugins
    await server.register(require('@fastify/cors'), {
      origin: server.config.FRONTEND_URL,
      credentials: true,
    });

    await server.register(require('@fastify/cookie'));
    await server.register(require('@fastify/jwt'), {
      secret: server.config.JWT_SECRET,
    });

    // Health check endpoint
    server.get('/health', async () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
    }));

    // Start server
    const port = parseInt(server.config.PORT);
    const host = server.config.HOST;
    
    await server.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 