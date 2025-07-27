import { Pool, PoolConfig } from 'pg';
import { EnvConfig } from './env';

export class DatabaseConfig {
  private pool: Pool;

  constructor(env: EnvConfig) {
    const config: PoolConfig = {
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('Database connected successfully:', result.rows[0]);
      client.release();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🔧 Running database migrations...');
      
      const client = await this.pool.connect();
      
      // Check if tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'session_participants')
      `);
      
      if (tablesResult.rows.length === 0) {
        console.log('🔧 Tables not found, creating schema...');
        
        // Read and execute init.sql
        const initSQL = `
          -- Enable UUID extension
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          -- Create users table (kalıcı veri)
          CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            google_id VARCHAR(255) UNIQUE,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          -- Create sessions table (cache data - UNLOGGED)
          CREATE UNLOGGED TABLE sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            host_id UUID NOT NULL,
            video_provider VARCHAR(50),
            video_id VARCHAR(255),
            video_title VARCHAR(500),
            video_duration INTEGER DEFAULT 0,
            last_action VARCHAR(20) DEFAULT 'pause',
            last_action_time_as_second INTEGER DEFAULT 0,
            last_action_timestamp TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          -- Create session_participants table (cache data - UNLOGGED)
          CREATE UNLOGGED TABLE session_participants (
            session_id UUID NOT NULL,
            user_id UUID NOT NULL,
            joined_at TIMESTAMP DEFAULT NOW(),
            is_online BOOLEAN DEFAULT TRUE,
            last_seen TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (session_id, user_id)
          );
          
          -- Create indexes for better performance
          CREATE INDEX idx_users_google_id ON users(google_id);
          CREATE INDEX idx_users_email ON users(email);
          CREATE INDEX idx_sessions_host_id ON sessions(host_id);
          CREATE INDEX idx_sessions_active ON sessions(is_active);
          CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
          CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
          CREATE INDEX idx_session_participants_online ON session_participants(is_online);
          
          -- Create trigger to update updated_at timestamp
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          -- Apply trigger to users table
          CREATE TRIGGER update_users_updated_at 
              BEFORE UPDATE ON users 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();
          
          -- Apply trigger to sessions table
          CREATE TRIGGER update_sessions_updated_at 
              BEFORE UPDATE ON sessions 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();
        `;
        
        await client.query(initSQL);
        console.log('✅ Database schema created successfully');
      } else {
        console.log('✅ Database schema already exists');
      }
      
      client.release();
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 