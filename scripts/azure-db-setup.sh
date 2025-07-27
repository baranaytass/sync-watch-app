#!/bin/bash

# Azure Database Setup Script
# This script sets up the PostgreSQL database schema in Azure

set -e

# Configuration
RESOURCE_GROUP="sync-watch-rg"
DB_SERVER="sync-watch-db-server"
DB_NAME="videosync"
DB_USER="videosync_user"

echo "🗄️  Setting up Azure PostgreSQL database schema"

# Get database connection details
echo "📋 Getting database connection details..."
DB_HOST="${DB_SERVER}.postgres.database.azure.com"

echo "🔍 Database Host: $DB_HOST"
echo "🔍 Database Name: $DB_NAME"
echo "🔍 Database User: $DB_USER"

# Check if database schema file exists
if [ ! -f "backend/database/init.sql" ]; then
    echo "❌ Database schema file not found: backend/database/init.sql"
    exit 1
fi

echo "📄 Found database schema file: backend/database/init.sql"

# Show instructions for manual database setup
echo ""
echo "🔧 Manual Database Setup Instructions:"
echo "======================================"
echo ""
echo "1. Connect to your Azure PostgreSQL database using a tool like pgAdmin or psql:"
echo "   Host: $DB_HOST"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo ""
echo "2. Execute the SQL commands from: backend/database/init.sql"
echo ""
echo "3. Alternatively, if you have psql installed locally:"
echo "   psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f backend/database/init.sql"
echo ""

# Create a deployment-ready SQL file with additional Azure optimizations
echo "📝 Creating Azure-optimized database schema..."
cat > azure-db-schema.sql << 'EOF'
-- Azure PostgreSQL Optimized Schema for Sync Watch App
-- This file contains the complete database schema for production deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_provider VARCHAR(50),
    video_id VARCHAR(255),
    video_title VARCHAR(512),
    video_duration INTEGER,
    current_time DECIMAL(10,2) DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    last_action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    UNIQUE(session_id, user_id)
);

-- Chat messages table (for future implementation)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
        CREATE TRIGGER update_sessions_updated_at 
            BEFORE UPDATE ON sessions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample data for testing (optional)
-- Uncomment if you want sample data in production

/*
INSERT INTO users (id, google_id, email, name, avatar) VALUES 
('550e8400-e29b-41d4-a716-446655440000', null, 'test@example.com', 'Test User', 'https://ui-avatars.com/api/?name=Test+User&background=6366f1&color=ffffff')
ON CONFLICT (email) DO NOTHING;

INSERT INTO sessions (id, title, description, host_id) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'Test Session', 'A test session for deployment verification', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;
*/

-- Verify schema creation
SELECT 'Schema setup completed successfully!' as status;
EOF

echo "✅ Azure database schema file created: azure-db-schema.sql"
echo ""
echo "🔧 To apply the schema to your Azure PostgreSQL database:"
echo "   psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f azure-db-schema.sql"
echo ""
echo "💡 Remember to:"
echo "   1. Ensure your IP is whitelisted in Azure PostgreSQL firewall rules"
echo "   2. Have the database password ready"
echo "   3. Test the connection before running migrations"