-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (kalıcı veri)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
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
  host_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
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
  session_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
  user_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
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