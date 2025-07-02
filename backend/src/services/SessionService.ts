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
    // Validate host exists (skip for guest users)
    if (!sessionData.hostId.startsWith('guest-')) {
      const host = await this.userModel.findById(sessionData.hostId);
      if (!host) {
        throw new Error('Host user not found');
      }
    } else {
      console.log('👤 Guest user creating session, skipping DB validation');
    }

    // Create session
    const session = await this.sessionModel.create(sessionData);
    
    // Add host as participant and get updated session
    const sessionWithParticipants = await this.sessionModel.addParticipant(session.id, sessionData.hostId);

    return sessionWithParticipants;
  }

  /**
   * Get all active sessions (public listing without participants)
   */
  async getAllActiveSessions(): Promise<Session[]> {
    const sessions = await this.sessionModel.findActiveSessions();
    return sessions;
  }

  /**
   * Get session by ID with access control and participants
   */
  async getSessionById(sessionId: string, userId?: string): Promise<Session | null> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    // If userId provided, check if user has access to this session
    if (userId) {
      const hasAccess = await this.sessionModel.isUserParticipant(sessionId, userId);
      if (!hasAccess) {
        throw new Error('You do not have access to this session');
      }
    }

    return session;
  }

  /**
   * Join a session as participant
   */
  async joinSession(sessionId: string, userId: string): Promise<Session> {
    // Check if session exists and is active
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or not active');
    }

    // Check if user exists (skip for guest users)
    if (!userId.startsWith('guest-')) {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
    } else {
      console.log('👤 Guest user joining session, skipping DB validation');
    }

    // Add user as participant and get updated session
    const updatedSession = await this.sessionModel.addParticipant(sessionId, userId);

    return updatedSession;
  }

  /**
   * Leave a session (simple participant removal)
   * Returns true if session was deactivated due to no remaining participants
   */
  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    console.log(`🚪 SessionService.leaveSession: User ${userId} leaving session ${sessionId}`);
    
    // Check if session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      console.log(`❌ SessionService.leaveSession: Session ${sessionId} not found`);
      throw new Error('Session not found');
    }

    console.log(`📊 SessionService.leaveSession: Session ${sessionId} has ${session.participants.length} participants before leave`);

    // Remove user from participants
    console.log(`🗑️ SessionService.leaveSession: Removing participant ${userId} from session ${sessionId}`);
    await this.sessionModel.removeParticipant(sessionId, userId);

    // Check if any participants remain
    const activeParticipantCount = await this.sessionModel.getActiveParticipantCount(sessionId);
    console.log(`📊 SessionService.leaveSession: Session ${sessionId} has ${activeParticipantCount} participants after leave`);
    
    if (activeParticipantCount === 0) {
      console.log(`🔚 SessionService.leaveSession: Session ${sessionId} will be DELETED (no participants)`);
      await this.sessionModel.deleteSession(sessionId);
      return true; // Session was deleted
    } else {
      console.log(`✅ SessionService.leaveSession: Session ${sessionId} remains active with ${activeParticipantCount} participants`);
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
    // Check if session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or not active');
    }

    // Check if user is the host
    if (session.hostId !== userId) {
      throw new Error('Only the host can set the video');
    }

    // Update session video
    const updatedSession = await this.sessionModel.updateVideo(sessionId, {
      videoProvider: 'youtube',
      ...videoData,
    });

    if (!updatedSession) {
      throw new Error('Failed to update session video');
    }

    return updatedSession;
  }

  /**
   * Check if user is session host
   */
  async isUserSessionHost(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    const isHost = session?.hostId === userId;
    return isHost;
  }

  /**
   * Validate user access to session
   */
  async validateUserSessionAccess(sessionId: string, userId: string): Promise<boolean> {
    const hasAccess = await this.sessionModel.isUserParticipant(sessionId, userId);
    return hasAccess;
  }

  /**
   * Cleanup empty sessions (no active participants)
   */
  async cleanupEmptySessions(): Promise<number> {
    return await this.sessionModel.cleanupEmptySessions();
  }

  /**
   * Cleanup inactive sessions (older than specified time)
   */
  async cleanupInactiveSessions(maxAgeMinutes: number = 30): Promise<number> {
    return await this.sessionModel.cleanupInactiveSessions(maxAgeMinutes);
  }
} 