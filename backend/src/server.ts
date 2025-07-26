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
      console.log('🧹 Running cleanup job...');
      
      // Clean up empty sessions
      console.log('🗑️ Cleaning up empty sessions...');
      const emptySessionsDeleted = await sessionService.cleanupEmptySessions();
      console.log(`🗑️ Empty sessions deleted: ${emptySessionsDeleted}`);
      
      // Clean up sessions inactive for more than 30 minutes
      console.log('⏰ Cleaning up inactive sessions...');
      const inactiveSessionsDeleted = await sessionService.cleanupInactiveSessions(30);
      console.log(`⏰ Inactive sessions deleted: ${inactiveSessionsDeleted}`);
      
      // Clean up guest users older than 24 hours
      console.log('👤 Cleaning up old guest users...');
      const guestUsersDeleted = await cleanupGuestUsers();
      console.log(`👤 Guest users deleted: ${guestUsersDeleted}`);
      
      const totalDeleted = emptySessionsDeleted + inactiveSessionsDeleted;
      console.log(`🧹 Cleanup completed: ${totalDeleted} sessions deleted, ${guestUsersDeleted} guest users deleted`);
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

// Database startup cleanup function
async function cleanupDatabaseOnStartup(dbPool: any): Promise<void> {
  try {
    console.log('🧹 Starting database cleanup on server startup...');
    
    // Clean session_participants first (foreign key dependency)
    const participantsResult = await dbPool.query('DELETE FROM session_participants');
    const participantsDeleted = participantsResult.rowCount || 0;
    console.log(`🗑️ Deleted ${participantsDeleted} session participants`);
    
    // Clean sessions
    const sessionsResult = await dbPool.query('DELETE FROM sessions');
    const sessionsDeleted = sessionsResult.rowCount || 0;
    console.log(`🗑️ Deleted ${sessionsDeleted} sessions`);
    
    // Clean ALL users (including guest and non-guest users)
    const allUsersResult = await dbPool.query('DELETE FROM users');
    const allUsersDeleted = allUsersResult.rowCount || 0;
    console.log(`👤 Deleted ${allUsersDeleted} users (all users including guests)`);
    
    console.log('✅ Database startup cleanup completed successfully');
  } catch (error) {
    console.error('❌ Database startup cleanup failed:', error);
  }
}

// Guest user cleanup function
async function cleanupGuestUsers(): Promise<number> {
  try {
    const deleteQuery = `
      DELETE FROM users 
      WHERE is_guest = TRUE 
      AND created_at < NOW() - INTERVAL '24 hours'
    `;
    
    const result = await server.pg.query(deleteQuery);
    return result.rowCount || 0;
  } catch (error) {
    console.error('❌ Guest user cleanup failed:', error);
    return 0;
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

    // Clean all tables on startup
    await cleanupDatabaseOnStartup(db.getPool());

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