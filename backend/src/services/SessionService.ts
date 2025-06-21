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

  async createSession(sessionData: {
    title: string;
    description?: string;
    hostId: string;
  }): Promise<Session> {
    // Validate host exists
    const host = await this.userModel.findById(sessionData.hostId);
    if (!host) {
      throw new Error('Host user not found');
    }

    // Create session
    const session = await this.sessionModel.create(sessionData);
    
    // Add host as participant
    await this.sessionModel.addParticipant(session.id, sessionData.hostId);

    return session;
  }

  async getActiveSessionsForUser(userId: string): Promise<Session[]> {
    return this.sessionModel.findActiveSessionsByUserId(userId);
  }

  async getAllActiveSessions(): Promise<Session[]> {
    return this.sessionModel.findActiveSessions();
  }

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

  async joinSession(sessionId: string, userId: string): Promise<{
    session: Session;
    participants: Array<{
      userId: string;
      name: string;
      avatar: string;
      joinedAt: Date;
      isOnline: boolean;
    }>;
  }> {
    // Check if session exists and is active
    const session = await this.sessionModel.findById(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or not active');
    }

    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Add user as participant
    await this.sessionModel.addParticipant(sessionId, userId);

    // Get updated participants list
    const participants = await this.sessionModel.getParticipants(sessionId);

    return { session, participants };
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    // Check if session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Remove user from participants
    await this.sessionModel.removeParticipant(sessionId, userId);

    // If user is the host and no other participants, deactivate session
    if (session.hostId === userId) {
      const participants = await this.sessionModel.getParticipants(sessionId);
      if (participants.length === 0) {
        await this.sessionModel.deactivate(sessionId);
      }
    }
  }

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

  // Internal method for WebSocket usage
  async getSessionParticipants(sessionId: string, userId?: string): Promise<Array<{
    userId: string;
    name: string;
    avatar: string;
    joinedAt: Date;
    isOnline: boolean;
  }>> {
    // If userId provided, check if user has access to this session
    if (userId) {
      const hasAccess = await this.sessionModel.isUserParticipant(sessionId, userId);
      if (!hasAccess) {
        throw new Error('You do not have access to this session');
      }
    }

    return this.sessionModel.getParticipants(sessionId);
  }

  async isUserSessionHost(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionModel.findById(sessionId);
    return session?.hostId === userId;
  }

  async validateUserSessionAccess(sessionId: string, userId: string): Promise<boolean> {
    return this.sessionModel.isUserParticipant(sessionId, userId);
  }
} 