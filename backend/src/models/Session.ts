import { Pool } from 'pg';
import { Session } from '@sync-watch-app/shared-types';

export class SessionModel {
  constructor(private db: Pool) {}

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
    
    return result.rows[0];
  }

  async findById(id: string): Promise<Session | null> {
    const query = `
      SELECT 
        id, title, description, host_id as "hostId", 
        video_provider as "videoProvider", video_id as "videoId", 
        video_title as "videoTitle", video_duration as "videoDuration",
        last_action as "lastAction", last_action_time_as_second as "lastActionTimeAsSecond",
        last_action_timestamp as "lastActionTimestamp", is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM sessions 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    const query = `
      SELECT DISTINCT 
        s.id, s.title, s.description, s.host_id as "hostId", 
        s.video_provider as "videoProvider", s.video_id as "videoId", 
        s.video_title as "videoTitle", s.video_duration as "videoDuration",
        s.last_action as "lastAction", s.last_action_time_as_second as "lastActionTimeAsSecond",
        s.last_action_timestamp as "lastActionTimestamp", s.is_active as "isActive",
        s.created_at as "createdAt", s.updated_at as "updatedAt"
      FROM sessions s
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      WHERE s.is_active = true 
        AND (s.host_id = $1 OR (sp.user_id = $1 AND sp.is_online = true))
      ORDER BY s.updated_at DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

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
      ORDER BY updated_at DESC
    `;
    
    const result = await this.db.query(query);
    return result.rows;
  }

  async updateVideo(id: string, videoData: {
    videoProvider: 'youtube';
    videoId: string;
    videoTitle: string;
    videoDuration: number;
  }): Promise<Session | null> {
    const query = `
      UPDATE sessions 
      SET 
        video_provider = $2,
        video_id = $3,
        video_title = $4,
        video_duration = $5,
        last_action = 'pause',
        last_action_time_as_second = 0,
        last_action_timestamp = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING 
        id, title, description, host_id as "hostId", 
        video_provider as "videoProvider", video_id as "videoId", 
        video_title as "videoTitle", video_duration as "videoDuration",
        last_action as "lastAction", last_action_time_as_second as "lastActionTimeAsSecond",
        last_action_timestamp as "lastActionTimestamp", is_active as "isActive",
        created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await this.db.query(query, [
      id,
      videoData.videoProvider,
      videoData.videoId,
      videoData.videoTitle,
      videoData.videoDuration,
    ]);
    
    return result.rows[0] || null;
  }

  async addParticipant(sessionId: string, userId: string): Promise<void> {
    const query = `
      INSERT INTO session_participants (session_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (session_id, user_id) 
      DO UPDATE SET 
        is_online = true,
        last_seen = NOW()
    `;
    
    await this.db.query(query, [sessionId, userId]);
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const query = `
      UPDATE session_participants 
      SET is_online = false, last_seen = NOW()
      WHERE session_id = $1 AND user_id = $2
    `;
    
    await this.db.query(query, [sessionId, userId]);
  }

  async getParticipants(sessionId: string): Promise<Array<{
    userId: string;
    name: string;
    avatar: string;
    joinedAt: Date;
    isOnline: boolean;
  }>> {
    const query = `
      SELECT 
        sp.user_id as "userId",
        u.name,
        u.avatar,
        sp.joined_at as "joinedAt",
        sp.is_online as "isOnline"
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = $1 AND sp.is_online = true
      ORDER BY sp.joined_at ASC
    `;
    
    const result = await this.db.query(query, [sessionId]);
    return result.rows;
  }

  async isUserParticipant(sessionId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM sessions s
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      WHERE s.id = $1 
        AND s.is_active = true
        AND (s.host_id = $2 OR (sp.user_id = $2 AND sp.is_online = true))
    `;
    
    const result = await this.db.query(query, [sessionId, userId]);
    return result.rows.length > 0;
  }

  async deactivate(id: string): Promise<void> {
    const query = `
      UPDATE sessions 
      SET is_active = false
      WHERE id = $1
    `;
    
    await this.db.query(query, [id]);
  }
} 