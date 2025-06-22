import { Pool } from 'pg';
import { Session, SessionParticipant } from '@sync-watch-app/shared-types';

export class SessionModel {
  constructor(private db: Pool) {}

  /**
   * Create new session (without participants initially)
   */
  async create(sessionData: {
    title: string;
    description?: string;
    hostId: string;
  }): Promise<Session> {
    const query = `
      INSERT INTO sessions (title, description, host_id)
      VALUES ($1, $2, $3)
      RETURNING 
        id, title, description, host_id as "hostId", 
        video_provider as "videoProvider", video_id as "videoId", 
        video_title as "videoTitle", video_duration as "videoDuration",
        last_action as "lastAction", last_action_time_as_second as "lastActionTimeAsSecond",
        last_action_timestamp as "lastActionTimestamp", is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await this.db.query(query, [
      sessionData.title,
      sessionData.description || null,
      sessionData.hostId,
    ]);
    
    return {
      ...result.rows[0],
      participants: []
    };
  }

  /**
   * Find session by ID with participants
   */
  async findById(id: string): Promise<Session | null> {
    const query = `
      SELECT 
        s.id, s.title, s.description, s.host_id as "hostId", 
        s.video_provider as "videoProvider", s.video_id as "videoId", 
        s.video_title as "videoTitle", s.video_duration as "videoDuration",
        s.last_action as "lastAction", s.last_action_time_as_second as "lastActionTimeAsSecond",
        s.last_action_timestamp as "lastActionTimestamp", s.is_active as "isActive",
        s.created_at as "createdAt", s.updated_at as "updatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'sessionId', sp.session_id,
              'userId', sp.user_id,
              'name', u.name,
              'avatar', u.avatar,
              'joinedAt', sp.joined_at,
              'isOnline', true,
              'lastSeen', sp.last_seen
            ) ORDER BY sp.joined_at
          ) FILTER (WHERE sp.user_id IS NOT NULL), 
          '[]'
        ) as participants
      FROM sessions s
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE s.id = $1
      GROUP BY s.id, s.title, s.description, s.host_id, s.video_provider, s.video_id, 
               s.video_title, s.video_duration, s.last_action, s.last_action_time_as_second, 
               s.last_action_timestamp, s.is_active, s.created_at, s.updated_at
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      participants: Array.isArray(row.participants) ? row.participants : []
    };
  }

  /**
   * Find all active sessions with participants (for public listing)
   */
  async findActiveSessions(): Promise<Session[]> {
    const query = `
      SELECT 
        id, title, description, host_id as "hostId", 
        video_provider as "videoProvider", video_id as "videoId", 
        video_title as "videoTitle", video_duration as "videoDuration",
        last_action as "lastAction", last_action_time_as_second as "lastActionTimeAsSecond",
        last_action_timestamp as "lastActionTimestamp", is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM sessions 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(query);
    
    // Load participants for each session
    const sessions: Session[] = [];
    for (const sessionRow of result.rows) {
      const participants = await this.getParticipants(sessionRow.id);
      sessions.push({
        ...sessionRow,
        participants
      });
    }
    
    return sessions;
  }

  /**
   * Update session video and return updated session with participants
   */
  async updateVideo(id: string, videoData: {
    videoProvider: 'youtube';
    videoId: string;
    videoTitle: string;
    videoDuration: number;
  }): Promise<Session | null> {
    const updateQuery = `
      UPDATE sessions 
      SET 
        video_provider = $2,
        video_id = $3,
        video_title = $4,
        video_duration = $5,
        last_action = 'pause',
        last_action_time_as_second = 0,
        last_action_timestamp = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await this.db.query(updateQuery, [
      id,
      videoData.videoProvider,
      videoData.videoId,
      videoData.videoTitle,
      videoData.videoDuration,
    ]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    // Return updated session with participants
    return this.findById(id);
  }

  /**
   * Add participant to session and return updated session
   */
  async addParticipant(sessionId: string, userId: string): Promise<Session> {
    const query = `
      INSERT INTO session_participants (session_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (session_id, user_id) 
      DO UPDATE SET 
        is_online = true,
        last_seen = NOW()
    `;
    
    await this.db.query(query, [sessionId, userId]);
    
    // Return updated session with participants
    const updatedSession = await this.findById(sessionId);
    if (!updatedSession) {
      throw new Error('Failed to get updated session after adding participant');
    }
    
    return updatedSession;
  }

  /**
   * Remove participant from session (delete completely to avoid ghost records)
   */
  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    console.log(`👤 SessionModel: Removing participant ${userId} from session ${sessionId}`);
    const query = `
      DELETE FROM session_participants 
      WHERE session_id = $1 AND user_id = $2
    `;
    
    const result = await this.db.query(query, [sessionId, userId]);
    console.log(`👤 SessionModel: Participant removal affected ${result.rowCount} rows`);
  }

  /**
   * Get participants list for session (used for host assignment)
   */
  async getParticipants(sessionId: string): Promise<SessionParticipant[]> {
    console.log(`👥 SessionModel: Getting participants for session ${sessionId}`);
    const query = `
      SELECT 
        sp.session_id as "sessionId",
        sp.user_id as "userId",
        u.name,
        u.avatar,
        sp.joined_at as "joinedAt",
        true as "isOnline",
        sp.last_seen as "lastSeen"
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = $1
      ORDER BY sp.joined_at ASC
    `;
    
    const result = await this.db.query(query, [sessionId]);
    console.log(`👥 SessionModel: Found ${result.rows.length} participants for session ${sessionId}`);
    return result.rows;
  }

  /**
   * Check if user is participant in session
   */
  async isUserParticipant(sessionId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM sessions s
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      WHERE s.id = $1 
        AND s.is_active = true
        AND (s.host_id = $2 OR sp.user_id = $2)
    `;
    
    const result = await this.db.query(query, [sessionId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get participant count for session
   */
  async getActiveParticipantCount(sessionId: string): Promise<number> {
    console.log(`🔢 SessionModel: Getting participant count for session ${sessionId}`);
    const query = `
      SELECT COUNT(*) as count
      FROM session_participants 
      WHERE session_id = $1
    `;
    
    const result = await this.db.query(query, [sessionId]);
    const count = parseInt(result.rows[0].count, 10);
    console.log(`🔢 SessionModel: Session ${sessionId} has ${count} participants`);
    return count;
  }

  /**
   * Delete session completely (including participants)
   */
  async deleteSession(sessionId: string): Promise<void> {
    console.log(`🗑️ SessionModel: Deleting session ${sessionId} completely`);
    
    // First delete all participants
    const deleteParticipantsQuery = `
      DELETE FROM session_participants 
      WHERE session_id = $1
    `;
    
    const participantsResult = await this.db.query(deleteParticipantsQuery, [sessionId]);
    console.log(`🗑️ SessionModel: Deleted ${participantsResult.rowCount} participants from session ${sessionId}`);
    
    // Then delete the session
    const deleteSessionQuery = `
      DELETE FROM sessions 
      WHERE id = $1
    `;
    
    const sessionResult = await this.db.query(deleteSessionQuery, [sessionId]);
    console.log(`🗑️ SessionModel: Session deletion affected ${sessionResult.rowCount} sessions`);
  }

  /**
   * Clean up sessions with no participants (for maintenance)
   */
  async cleanupEmptySessions(): Promise<number> {
    console.log('🧹 SessionModel: Starting cleanup of empty sessions');
    
    const query = `
      DELETE FROM sessions 
      WHERE is_active = true
      AND id NOT IN (
        SELECT DISTINCT session_id 
        FROM session_participants 
        WHERE session_id IS NOT NULL
      )
    `;
    
    const result = await this.db.query(query);
    const deletedCount = result.rowCount || 0;
    console.log(`🧹 SessionModel: Cleaned up ${deletedCount} empty sessions`);
    return deletedCount;
  }

  /**
   * Clean up sessions older than specified minutes with no activity
   */
  async cleanupInactiveSessions(maxAgeMinutes: number = 30): Promise<number> {
    console.log(`🧹 SessionModel: Starting cleanup of sessions inactive for ${maxAgeMinutes} minutes`);
    
    // Delete sessions that are old and have no participants
    const query = `
      DELETE FROM sessions 
      WHERE (
        updated_at < NOW() - INTERVAL '${maxAgeMinutes} minutes'
        OR created_at < NOW() - INTERVAL '${maxAgeMinutes * 2} minutes'
      )
      AND id NOT IN (
        SELECT DISTINCT session_id 
        FROM session_participants 
        WHERE session_id IS NOT NULL
      )
    `;
    
    const result = await this.db.query(query);
    const deletedCount = result.rowCount || 0;
    console.log(`🧹 SessionModel: Cleaned up ${deletedCount} inactive sessions`);
    return deletedCount;
  }
} 