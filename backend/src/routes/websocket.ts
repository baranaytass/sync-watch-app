// import { FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { SessionService } from '../services/SessionService';
import { UserModel } from '../models/User';

interface WebSocketParams {
  sessionId: string;
}

// AuthenticatedRequest interface removed as it's not used in WebSocket routes

export default async function websocketRoutes(
  fastify: any,
  _options: any
): Promise<void> {
  const sessionService = new SessionService(fastify.pg);
  const userModel = new UserModel(fastify.pg);

  // Use global connections from server instance
  const connections = (fastify as any).globalConnections as Map<string, SocketStream[]>;
  const socketToSession = new Map<SocketStream, string>(); // socket -> sessionId
  const socketToUser = new Map<SocketStream, string>(); // socket -> userId

  // Helper functions
  const sendMessage = (socket: SocketStream, type: string, data: any): void => {
    try {
      // Some Fastify versions expose underlying ws instance via socket, others via the stream itself.
      const ws: any = (socket as any).socket ?? socket;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type, data }));
      }
    } catch (error) {
      console.error('❌ WebSocket: Error sending message:', error);
    }
  };

  // Use global broadcastToSession function
  const broadcastToSession = (fastify as any).broadcastToSession as (sessionId: string, type: string, data: any, excludeSocket?: SocketStream) => void;

  console.log('🔧 WebSocket: Using global broadcastToSession decorator');
  console.log('✅ WebSocket: Global broadcastToSession is available:', typeof broadcastToSession === 'function');

  // Connection cleanup
  const cleanupConnection = (socket: SocketStream): void => {
    const sessionId = socketToSession.get(socket);
    if (sessionId) {
      const sessionSockets = connections.get(sessionId);
      if (sessionSockets) {
        const index = sessionSockets.indexOf(socket);
        if (index > -1) {
          sessionSockets.splice(index, 1);
        }
        
        if (sessionSockets.length === 0) {
          connections.delete(sessionId);
        }
      }
    }

    socketToSession.delete(socket);
    socketToUser.delete(socket);
  };

  // Handle user disconnection from session
  const handleUserLeave = async (socket: SocketStream): Promise<void> => {
    const sessionId = socketToSession.get(socket);
    const userId = socketToUser.get(socket);

    console.log(`🚪 handleUserLeave called - sessionId: ${sessionId}, userId: ${userId}`);

    if (!sessionId || !userId) {
      console.log(`⚠️ handleUserLeave: Missing sessionId or userId`);
      return;
    }

    try {
      console.log(`🧹 Cleaning up connection for user ${userId} in session ${sessionId}`);
      
      // Clean up connection mapping first
      cleanupConnection(socket);

      console.log(`📤 Calling sessionService.leaveSession(${sessionId}, ${userId})`);
      
      // Remove user from session in database
      const sessionDeleted = await sessionService.leaveSession(sessionId, userId);

      if (sessionDeleted) {
        console.log(`🔚 Session ${sessionId} was DELETED - no participants remaining`);
        
        // Clean up server video state
        sessionVideoStates.delete(sessionId);
        console.log(`🗑️ Removed video state for deleted session ${sessionId}`);
        
        // Notify any remaining connections (shouldn't be any, but just in case)
        broadcastToSession(sessionId, 'session_ended', {
          reason: 'no_participants',
          message: 'Session ended - no participants remaining'
        });
      } else {
        console.log(`✅ Session ${sessionId} still active - updating participants`);
        
        // Update participant list for remaining users
        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          console.log(`📤 Broadcasting updated participants to session ${sessionId}`);
          broadcastToSession(sessionId, 'participants', {
            participants: session.participants.map(p => ({
              userId: p.userId,
              name: p.name,
              avatar: p.avatar,
            })),
          });
        } else {
          console.log(`⚠️ Could not get session ${sessionId} after leave`);
        }
      }

    } catch (error) {
      console.error('❌ WebSocket: Error handling user leave:', error);
    }
  };

  // Server-side session video states (in-memory cache)
  const sessionVideoStates = new Map<string, {
    action: 'play' | 'pause' | 'seek';
    time: number;
    timestamp: Date;
    lastMessageId?: string;
  }>();

  // Message handlers
  const messageHandlers: Record<string, any> = {
    video_action: async (_socket: SocketStream, data: any, userId: string, sessionId: string) => {
      // Server-Authoritative State Pattern: Server validates and broadcasts state
      const { action, time, messageId } = data;
      
      if (!action || typeof time !== 'number') {
        console.log(`❌ WebSocket: Invalid video_action data from ${userId}`);
        return;
      }
      
      console.log(`📨 WebSocket: Processing video_action from ${userId}: ${action} at ${time}s (messageId: ${messageId})`);
      
      // Get current server state
      const currentState = sessionVideoStates.get(sessionId);
      
      // Deduplication: Skip if same messageId already processed
      if (messageId && currentState?.lastMessageId === messageId) {
        console.log(`🔄 WebSocket: Duplicate messageId ${messageId}, skipping`);
        return;
      }
      
      // Update server authoritative state
      const newState = {
        action: action as 'play' | 'pause' | 'seek',
        time: Math.max(0, time), // Ensure non-negative time
        timestamp: new Date(),
        lastMessageId: messageId,
      };
      
      sessionVideoStates.set(sessionId, newState);
      console.log(`📊 WebSocket: Server state updated for session ${sessionId}: ${action} at ${time}s`);
      
      // Broadcast authoritative state to ALL participants (including sender)
      // This ensures everyone has the same state, preventing echo loops
      broadcastToSession(sessionId, 'video_sync_authoritative', {
        action: newState.action,
        time: newState.time,
        timestamp: newState.timestamp,
        sourceUserId: userId, // For UI feedback
      }); // NOTE: No excludeSocket - everyone gets authoritative state
      
      console.log(`✅ WebSocket: Authoritative state broadcasted to session ${sessionId}`);
    },
    chat: async (_socket: SocketStream, data: any, userId: string, sessionId: string) => {
      if (data.message && data.message.trim().length > 0) {
        const user = await userModel.findById(userId);
        if (user) {
          const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name,
            message: data.message.trim(),
            timestamp: new Date(),
          };
          broadcastToSession(sessionId, 'chat', chatMessage);
        }
      }
    },
  };

  // WebSocket endpoint
  fastify.get('/ws/session/:sessionId', {
    websocket: true,
  }, async (socket: SocketStream, request: any) => {
    const { sessionId } = request.params as WebSocketParams;
    let user: { userId: string; email: string } | null = null;

    try {
      const query = request.query as { token?: string };
      const token = query.token || request.headers.authorization?.replace('Bearer ', '') || request.cookies?.token;
      if (!token) throw new Error('No token provided');
      const decoded = fastify.jwt.verify(token) as any;
      user = { userId: decoded.userId, email: decoded.email };
      console.log(`🔐 WebSocket auth successful for user ${user.userId} in session ${sessionId}`);
    } catch (err) {
      console.log('❌ WebSocket auth failed');
      sendMessage(socket, 'error', { message: 'Authentication required' });
      // Use socket.destroy() instead of connection.end()
      const ws: any = (socket as any).socket ?? socket;
      if (ws && ws.close) {
        ws.close();
      }
      return;
    }

    const userId = user.userId;

    try {
      // Check if session exists and user can join
      const session = await sessionService.getSessionById(sessionId, userId);
      if (!session) {
        console.log(`❌ WebSocket: Session ${sessionId} not found or not accessible`);
        sendMessage(socket, 'error', { message: 'Session not found or not accessible' });
        const ws: any = (socket as any).socket ?? socket;
        if (ws && ws.close) {
          ws.close();
        }
        return;
      }

      // Add user to session if not already a participant
      await sessionService.joinSession(sessionId, userId);

      // Store connection mappings
      if (!connections.has(sessionId)) {
        connections.set(sessionId, []);
      }
      connections.get(sessionId)!.push(socket);
      socketToSession.set(socket, sessionId);
      socketToUser.set(socket, userId);

      console.log(`✅ WebSocket: User ${userId} connected to session ${sessionId}`);

      // Send current session state to new connection
      const updatedSession = await sessionService.getSessionById(sessionId, userId);
      if (updatedSession) {
        // Send current participants
        sendMessage(socket, 'participants', {
          participants: updatedSession.participants.map(p => ({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
          })),
        });

        // Send current video state if available
        if (updatedSession.videoProvider && updatedSession.videoId) {
          sendMessage(socket, 'video_update', {
            videoProvider: updatedSession.videoProvider,
            videoId: updatedSession.videoId,
            videoTitle: updatedSession.videoTitle,
            videoDuration: updatedSession.videoDuration,
          });

          // Initialize server video state if not exists and send authoritative state
          if (!sessionVideoStates.has(sessionId)) {
            sessionVideoStates.set(sessionId, {
              action: updatedSession.lastAction as 'play' | 'pause' | 'seek',
              time: updatedSession.lastActionTimeAsSecond,
              timestamp: updatedSession.lastActionTimestamp || new Date(),
            });
          }
          
          const currentVideoState = sessionVideoStates.get(sessionId)!;
          sendMessage(socket, 'video_sync_authoritative', {
            action: currentVideoState.action,
            time: currentVideoState.time,
            timestamp: currentVideoState.timestamp,
            sourceUserId: null, // Initial state, no source user
          });
        }

        // Notify other participants about new user
        broadcastToSession(sessionId, 'participants', {
          participants: updatedSession.participants.map(p => ({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
          })),
        }, socket);
      }

      // Handle incoming messages
      const ws: any = (socket as any).socket ?? socket;
      if (ws) {
        ws.on('message', async (message: string) => {
          try {
            const parsed = JSON.parse(message);
            const { type, data } = parsed;

            console.log(`📨 WebSocket: Received message from ${userId} in session ${sessionId}:`, { type, data });

            if (messageHandlers[type]) {
              await messageHandlers[type](socket, data, userId, sessionId);
            } else {
              console.log(`⚠️ WebSocket: Unknown message type: ${type}`);
            }
          } catch (error) {
            console.error('❌ WebSocket: Error handling message:', error);
            sendMessage(socket, 'error', { message: 'Invalid message format' });
          }
        });

        ws.on('close', async () => {
          console.log(`🔌 WebSocket: Connection closed for user ${userId} in session ${sessionId}`);
          await handleUserLeave(socket);
        });

        ws.on('error', async (error: any) => {
          console.error('❌ WebSocket: Connection error:', error);
          await handleUserLeave(socket);
        });
      }

    } catch (error) {
      console.error('❌ WebSocket: Error setting up connection:', error);
      sendMessage(socket, 'error', { message: 'Connection setup failed' });
      const ws: any = (socket as any).socket ?? socket;
      if (ws && ws.close) {
        ws.close();
      }
    }
  });

  // Add broadcastToSession as a decorator to fastify instance so SessionController can use it
  // fastify.decorate('broadcastToSession', broadcastToSession); // Already decorated above

  // prevent TS unused variable errors in strict mode
  void messageHandlers;
  void handleUserLeave;
}