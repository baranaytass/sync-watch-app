import { Pool } from 'pg';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import { Session } from '@sync-watch-app/shared-types';

export class SessionService {
  private sessionModel: SessionModel;
  private userModel: UserModel;

  constructor(db: Pool) {
    this.sessionModel = new SessionModel(db);
    this.userModel = new UserModel(db);
  }

  /**
   * Create a new session and add creator as host participant
   */
  async createSession(sessionData: {
    title: string;
    description?: string;
    hostId: string;
  }): Promise<Session> {
    console.log(`🆕 SessionService: Creating session "${sessionData.title}" for host ${sessionData.hostId}`);
    
    // Validate host exists
    const host = await this.userModel.findById(sessionData.hostId);
    if (!host) {
      throw new Error('Host user not found');
    }

    console.log(`✅ SessionService: Host user validated: ${host.name} (${host.email})`);

    // Create session
    const session = await this.sessionModel.create(sessionData);
    console.log(`🆕 SessionService: Session created with ID: ${session.id}`);
    
    // Add host as participant and get updated session
    const sessionWithParticipants = await this.sessionModel.addParticipant(session.id, sessionData.hostId);
    console.log(`👤 SessionService: Host added as participant to session ${session.id}`);

    console.log(`✅ SessionService: Session creation completed: ${sessionWithParticipants.id} with ${sessionWithParticipants.participants.length} participants`);
    return sessionWithParticipants;
  }

  /**
   * Get all active sessions (public listing without participants)
   */
  async getAllActiveSessions(): Promise<Session[]> {
    console.log('📋 SessionService: Fetching all active sessions for public listing');
    
    const sessions = await this.sessionModel.findActiveSessions();
    
    console.log(`📋 SessionService: Found ${sessions.length} active sessions for public listing`);
    sessions.forEach(session => {
      console.log(`📋 SessionService: - Session ${session.id}: "${session.title}"`);
      console.log(`📋 SessionService:   - Total participants: ${session.participants.length}`);
      console.log(`📋 SessionService:   - Online participants: ${session.participants.filter(p => p.isOnline).length}`);
      session.participants.forEach(p => {
        console.log(`📋 SessionService:     * ${p.name} (${p.userId}) - Online: ${p.isOnline}, LastSeen: ${p.lastSeen}`);
      });
    });
    
    return sessions;
  }

  /**
   * Get session by ID with access control and participants
   */
  async getSessionById(sessionId: string, userId?: string): Promise<Session | null> {
    console.log(`📋 SessionService: Fetching session ${sessionId} for user ${userId || 'anonymous'}`);
    
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      console.log(`❌ SessionService: Session ${sessionId} not found or not active`);
      return null;
    }

    // If userId provided, check if user has access to this session
    if (userId) {
      const hasAccess = await this.sessionModel.isUserParticipant(sessionId, userId);
      if (!hasAccess) {
        console.log(`🚫 SessionService: User ${userId} does not have access to session ${sessionId}`);
        throw new Error('You do not have access to this session');
      }
      console.log(`✅ SessionService: User ${userId} has access to session ${sessionId}`);
    }

    console.log(`📋 SessionService: Session ${sessionId} retrieved with ${session.participants.length} participants`);
    return session;
  }

  /**
   * Join a session as participant
   */
  async joinSession(sessionId: string, userId: string): Promise<Session> {
    console.log(`🚪 SessionService: User ${userId} attempting to join session ${sessionId}`);
    
    // Check if session exists and is active
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      console.log(`❌ SessionService: Session ${sessionId} not found or not active`);
      throw new Error('Session not found or not active');
    }

    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.log(`❌ SessionService: User ${userId} not found`);
      throw new Error('User not found');
    }

    console.log(`✅ SessionService: User validated: ${user.name} (${user.email})`);

    // Add user as participant and get updated session
    const updatedSession = await this.sessionModel.addParticipant(sessionId, userId);
    console.log(`👤 SessionService: User ${userId} added as participant to session ${sessionId}`);

    console.log(`✅ SessionService: Join completed - Session ${sessionId} now has ${updatedSession.participants.length} participants`);

    return updatedSession;
  }

  /**
   * Leave a session (simple participant removal)
   * Returns true if session was deactivated due to no remaining participants
   */
  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    console.log(`🚪 SessionService: User ${userId} leaving session ${sessionId}`);
    
    // Check if session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      console.log(`❌ SessionService: Session ${sessionId} not found`);
      throw new Error('Session not found');
    }

    console.log(`📊 SessionService: Session ${sessionId} found, current participants: ${session.participants.length}`);
    session.participants.forEach(p => {
      console.log(`📊 SessionService:   - ${p.name} (${p.userId}) - Online: ${p.isOnline}`);
    });

    // Remove user from participants
    console.log(`🗑️ SessionService: Removing user ${userId} from session ${sessionId} participants`);
    await this.sessionModel.removeParticipant(sessionId, userId);
    console.log(`👤 SessionService: User ${userId} removed from session ${sessionId}`);

    // Check if any participants remain
    const activeParticipantCount = await this.sessionModel.getActiveParticipantCount(sessionId);
    console.log(`📊 SessionService: Active participant count after removal: ${activeParticipantCount}`);
    
    if (activeParticipantCount === 0) {
      console.log(`🔚 SessionService: No participants remaining in session ${sessionId}, deleting session`);
      await this.sessionModel.deleteSession(sessionId);
      console.log(`✅ SessionService: Session ${sessionId} deleted successfully`);
      return true; // Session was deleted
    } else {
      console.log(`✅ SessionService: Session ${sessionId} still has ${activeParticipantCount} active participants`);
      return false; // Session remains active
    }
  }

  /**
   * Set video for a session (host only)
   */
  async setSessionVideo(
    sessionId: string, 
    userId: string, 
    videoData: {
      videoId: string;
      videoTitle: string;
      videoDuration: number;
    }
  ): Promise<Session> {
    console.log(`🎥 SessionService: User ${userId} setting video for session ${sessionId}: "${videoData.videoTitle}"`);
    
    // Check if session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      console.log(`❌ SessionService: Session ${sessionId} not found or not active`);
      throw new Error('Session not found or not active');
    }

    // Check if user is the host
    if (session.hostId !== userId) {
      console.log(`🚫 SessionService: User ${userId} is not the host of session ${sessionId} (host: ${session.hostId})`);
      throw new Error('Only the host can set the video');
    }

    console.log(`✅ SessionService: User ${userId} is host, proceeding with video update`);

    // Update session video
    const updatedSession = await this.sessionModel.updateVideo(sessionId, {
      videoProvider: 'youtube',
      ...videoData,
    });

    if (!updatedSession) {
      throw new Error('Failed to update session video');
    }

    console.log(`✅ SessionService: Video updated for session ${sessionId}: "${videoData.videoTitle}" (${videoData.videoDuration}s)`);
    return updatedSession;
  }

  /**
   * Check if user is session host
   */
  async isUserSessionHost(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    const isHost = session?.hostId === userId;
    console.log(`👑 SessionService: User ${userId} is ${isHost ? '' : 'not '}host of session ${sessionId}`);
    return isHost;
  }

  /**
   * Validate user access to session
   */
  async validateUserSessionAccess(sessionId: string, userId: string): Promise<boolean> {
    const hasAccess = await this.sessionModel.isUserParticipant(sessionId, userId);
    console.log(`🔐 SessionService: User ${userId} ${hasAccess ? 'has' : 'does not have'} access to session ${sessionId}`);
    return hasAccess;
  }

  /**
   * Cleanup empty sessions (no active participants)
   */
  async cleanupEmptySessions(): Promise<number> {
    console.log('🧹 SessionService: Running cleanup for empty sessions');
    return await this.sessionModel.cleanupEmptySessions();
  }

  /**
   * Cleanup inactive sessions (older than specified time)
   */
  async cleanupInactiveSessions(maxAgeMinutes: number = 30): Promise<number> {
    console.log(`🧹 SessionService: Running cleanup for sessions inactive for ${maxAgeMinutes} minutes`);
    return await this.sessionModel.cleanupInactiveSessions(maxAgeMinutes);
  }
} 