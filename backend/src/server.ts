import Fastify from 'fastify';
import { EnvSchema } from './config/env';
import { DatabaseConfig } from './config/database';
import { authenticateJWT } from './utils/auth';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import websocketRoutes from './routes/websocket';
import { SessionService } from './services/SessionService';

const server = Fastify({
  logger: false,
});

// Session cleanup job
let cleanupInterval: NodeJS.Timeout | null = null;

function startSessionCleanupJob(sessionService: SessionService): void {
  console.log('🧹 Starting session cleanup job (runs every 10 minutes)');
  
  const runCleanup = async (): Promise<void> => {
    try {
      // Clean up empty sessions
      const emptySessionsDeleted = await sessionService.cleanupEmptySessions();
      
      // Clean up sessions inactive for more than 30 minutes
      const inactiveSessionsDeleted = await sessionService.cleanupInactiveSessions(30);
      
      const totalDeleted = emptySessionsDeleted + inactiveSessionsDeleted;
      if (totalDeleted > 0) {
        console.log(`🧹 Cleanup completed: ${totalDeleted} sessions deleted`);
      }
    } catch (error) {
      console.error('❌ Session cleanup job failed:', error);
    }
  };

  // Run cleanup immediately on startup
  runCleanup();
  
  // Schedule cleanup every 10 minutes
  cleanupInterval = setInterval(runCleanup, 10 * 60 * 1000);
}

function stopSessionCleanupJob(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🧹 Session cleanup job stopped');
  }
}

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
    
    // Add database to server instance
    server.decorate('pg', db.getPool());

    // Register plugins
    await server.register(require('@fastify/cors'), {
      origin: server.config.FRONTEND_URL,
      credentials: true,
    });

    await server.register(require('@fastify/cookie'));
    await server.register(require('@fastify/jwt'), {
      secret: server.config.JWT_SECRET,
    });
    await server.register(require('@fastify/websocket'));

    // Register authentication middleware
    server.decorate('authenticate', authenticateJWT);

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(sessionRoutes, { prefix: '/api/sessions' });
    await server.register(websocketRoutes);

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

    // Start session cleanup job
    const sessionService = new SessionService(db.getPool());
    startSessionCleanupJob(sessionService);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  stopSessionCleanupJob();
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  stopSessionCleanupJob();
  await server.close();
  process.exit(0);
});

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 