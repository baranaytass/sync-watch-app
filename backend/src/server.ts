// import { FastifyInstance } from 'fastify';
import { EnvSchema } from './config/env';
import { DatabaseConfig } from './config/database';
import { authenticateJWT } from './utils/auth';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import websocketRoutes from './routes/websocket';
import { SessionService } from './services/SessionService';

const server: any = require('fastify')({
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
    
    // Purge leftover in-memory session cache tables on each cold start
    try {
      console.log('🧹 Purging existing sessions on startup...')
      const pool = db.getPool()
      console.log('🧹 Got database pool')
      // Remove participants first to avoid potential FK issues (even though UNLOGGED tables have no FK)
      await pool.query('TRUNCATE TABLE session_participants')
      console.log('🧹 Truncated session_participants')
      await pool.query('TRUNCATE TABLE sessions')
      console.log('🧹 Truncated sessions')
      console.log('🧹 Session tables truncated successfully')
    } catch (purgeErr) {
      console.error('❌ Failed to purge session tables:', purgeErr)
      console.error('❌ Error stack:', (purgeErr as Error).stack)
    }
    
    // Add database to server instance
    console.log('🔧 Adding database to server instance...')
    server.decorate('pg', db.getPool());
    console.log('🔧 Database added to server instance')

    // Register plugins
    console.log('🔧 Registering CORS plugin...')
    await server.register(require('@fastify/cors'), {
      origin: server.config.FRONTEND_URL,
      credentials: true,
    });
    console.log('🔧 CORS plugin registered')

    console.log('🔧 Registering Cookie plugin...')
    await server.register(require('@fastify/cookie'));
    console.log('🔧 Cookie plugin registered')
    
    console.log('🔧 Registering JWT plugin...')
    await server.register(require('@fastify/jwt'), {
      secret: server.config.JWT_SECRET,
    });
    console.log('🔧 JWT plugin registered')
    
    console.log('🔧 Registering WebSocket plugin...')
    await server.register(require('@fastify/websocket'));
    console.log('🔧 WebSocket plugin registered')

    // Register authentication middleware
    console.log('🔧 Registering authentication middleware...')
    server.decorate('authenticate', authenticateJWT);
    console.log('🔧 Authentication middleware registered')

    // Register routes
    console.log('🔧 Registering Auth routes...')
    await server.register(authRoutes, { prefix: '/api/auth' });
    console.log('🔧 Auth routes registered')
    
    console.log('🔧 Registering Session routes...')
    await server.register(sessionRoutes, { prefix: '/api/sessions' });
    console.log('🔧 Session routes registered')
    
    console.log('🔧 Registering WebSocket routes...')
    await server.register(websocketRoutes);
    console.log('🔧 WebSocket routes registered')

    // Health check endpoint
    console.log('🔧 Adding health check endpoint...')
    server.get('/health', async () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
    }));
    console.log('🔧 Health check endpoint added')

    // Start server
    console.log('🔧 Starting server...')
    const port = parseInt(server.config.PORT);
    const host = server.config.HOST;
    console.log(`🔧 Server config: ${host}:${port}`)
    
    await server.listen({ port, host });
    console.log(`🚀 Server listening on ${host}:${port}`);

    // Start session cleanup job
    console.log('🔧 Starting session cleanup job...')
    const sessionService = new SessionService(db.getPool());
    startSessionCleanupJob(sessionService);
    console.log('🔧 Session cleanup job started')
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