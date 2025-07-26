import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
// SocketStream is no longer imported directly
import { SessionService } from '../services/SessionService';
import { UserModel } from '../models/User';
import { WebSocket } from 'ws';

interface WebSocketParams {
  sessionId: string;
}

// AuthenticatedRequest interface removed as it's not used in WebSocket routes

export default async function websocketRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const sessionService = new SessionService(fastify.pg);
  const userModel = new UserModel(fastify.pg);

  // Connection storage - Use 'any' for the connection object as the exact type from fastify-websocket is tricky
  const connections = new Map<string, any[]>();
  const socketToSession = new Map<any, string>();
  const socketToUser = new Map<any, string>();

  // Helper functions - Operate directly on the connection object
  const sendMessage = (connection: any, type: string, data: any): void => {
    try {
      // readyState is on the raw socket, which is the connection object itself in this plugin's context
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify({ type, data }));
      }
    } catch (error) {
      console.error('❌ WebSocket: Error sending message:', error);
    }
  };

  const broadcastToSession = (sessionId: string, type: string, data: any, excludeConnection?: any): void => {
    const sessionConnections = connections.get(sessionId);
    if (!sessionConnections) return;

    const message = JSON.stringify({ type, data });
    sessionConnections.forEach(connection => {
      if (connection !== excludeConnection) {
        try {
          if (connection.readyState === WebSocket.OPEN) {
            connection.send(message);
          }
        } catch (error) {
          console.error('❌ WebSocket: Error broadcasting message:', error);
        }
      }
    });
  };

  // Connection cleanup
  const cleanupConnection = (connection: any): void => {
    const sessionId = socketToSession.get(connection);
    if (sessionId) {
      const sessionConnections = connections.get(sessionId);
      if (sessionConnections) {
        const index = sessionConnections.indexOf(connection);
        if (index > -1) {
          sessionConnections.splice(index, 1);
        }
        
        if (sessionConnections.length === 0) {
          connections.delete(sessionId);
        }
      }
    }

    socketToSession.delete(connection);
    socketToUser.delete(connection);
  };

  // Handle user disconnection from session
  const handleUserLeave = async (connection: any): Promise<void> => {
    const sessionId = socketToSession.get(connection);
    const userId = socketToUser.get(connection);

    console.log(`🚪 handleUserLeave called - sessionId: ${sessionId}, userId: ${userId}`);

    if (!sessionId || !userId) {
      console.log(`⚠️ handleUserLeave: Missing sessionId or userId`);
      return;
    }

    try {
      console.log(`🧹 Cleaning up connection for user ${userId} in session ${sessionId}`);
      
      // Clean up connection mapping first
      cleanupConnection(connection);

      console.log(`📤 Calling sessionService.leaveSession(${sessionId}, ${userId})`);
      
      // Remove user from session in database
      const sessionDeleted = await sessionService.leaveSession(sessionId, userId);

      if (sessionDeleted) {
        console.log(`🔚 Session ${sessionId} was DELETED - no participants remaining`);
        
        broadcastToSession(sessionId, 'session_ended', {
          reason: 'no_participants',
          message: 'Session ended - no participants remaining'
        });
      } else {
        console.log(`✅ Session ${sessionId} still active - updating participants`);
        
        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          console.log(`📤 Broadcasting updated participants to session ${sessionId}`);
          broadcastToSession(sessionId, 'participants', {
            participants: session.participants.map((p: any) => ({
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

  // Message handlers
  const messageHandlers = {
    video_action: async (connection: any, data: any, userId: string, sessionId: string) => {
      const isHost = await sessionService.isUserSessionHost(sessionId, userId);
      if (isHost) {
        broadcastToSession(sessionId, 'video_sync', {
          action: data.action,
          time: data.time,
          timestamp: new Date(),
        }, connection);
      }
    },

    chat: async (connection: any, data: any, userId: string, sessionId: string) => {
      console.log(`💬 WebSocket: Received chat message from user ${userId} in session ${sessionId}:`, data);
      
      if (data.message && data.message.trim().length > 0) {
        const user = await userModel.findById(userId);
        console.log(`👤 WebSocket: Found user for chat:`, user ? user.name : 'NOT FOUND');
        
        if (user) {
          const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            message: data.message.trim(),
            timestamp: new Date(),
          };

          console.log(`📤 WebSocket: Broadcasting chat message to all users including sender:`, chatMessage);
          // Chat messages should be sent to ALL users including the sender - don't exclude anyone
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            const message = JSON.stringify({ type: 'chat', data: chatMessage });
            sessionConnections.forEach(conn => {
              try {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(message);
                }
              } catch (error) {
                console.error('❌ WebSocket: Error sending chat message:', error);
              }
            });
          }
        }
      } else {
        console.log(`⚠️ WebSocket: Invalid chat message data:`, data);
      }
    }
  };

  // WebSocket endpoint
  fastify.route({
    method: 'GET',
    url: '/ws/session/:sessionId',
    handler: (_request: any, reply: any) => {
      // This handler is called before the websocket connection is established
      // You can perform initial checks here, but the main logic is in the wsHandler
      reply.send({ status: 'upgrading' });
    },
    wsHandler: async (connection: any, request: FastifyRequest) => {
      const { sessionId } = request.params as WebSocketParams;
    
      let user: { userId: string; email: string } | null = null;
      let decoded: any = null;
    
      try {
        const query = request.query as { token?: string };
        const token = query.token || 
                     request.headers.authorization?.replace('Bearer ', '') ||
                     request.cookies?.token;
        
        if (!token) {
          throw new Error('No token provided');
        }
        
        decoded = fastify.jwt.verify(token) as any;
        user = { userId: decoded.userId, email: decoded.email };
        
        console.log(`🔐 WebSocket auth successful for user ${user.userId} (guest: ${!!decoded.isGuest})`);
        
      } catch (error) {
        console.log(`❌ WebSocket auth failed:`, error);
        sendMessage(connection, 'error', { message: 'Authentication required' });
        if (connection.close) {
          connection.close();
        } else {
          connection.end();
        }
        return;
      }
  
      let userDetails: any = null;
  
      try {
        const hasAccess = await sessionService.validateUserSessionAccess(sessionId, user.userId);
        if (!hasAccess) {
          sendMessage(connection, 'error', { message: 'You do not have access to this session' });
          if (connection.close) {
            connection.close();
          } else {
            connection.end();
          }
          return;
        }
  
        userDetails = await userModel.findById(user.userId);
        if (!userDetails) {
          console.log(`❌ WebSocket: User ${user.userId} not found in database`);
          sendMessage(connection, 'error', { message: 'User not found' });
          if (connection.close) {
            connection.close();
          } else {
            connection.end();
          }
          return;
        }
  
        if (!connections.has(sessionId)) {
          connections.set(sessionId, []);
        }
        connections.get(sessionId)!.push(connection);
        socketToSession.set(connection, sessionId);
        socketToUser.set(connection, user.userId);
  
        await sessionService.joinSession(sessionId, user.userId);
  
        const session = await sessionService.getSessionById(sessionId);
        if (!session) {
          sendMessage(connection, 'error', { message: 'Session not found' });
          if (connection.close) {
            connection.close();
          } else {
            connection.end();
          }
          return;
        }
  
        if (session.videoId) {
          sendMessage(connection, 'video_update', {
            videoProvider: session.videoProvider,
            videoId: session.videoId,
            videoTitle: session.videoTitle,
            videoDuration: session.videoDuration,
          });
  
          sendMessage(connection, 'video_sync', {
            action: session.lastAction,
            time: session.lastActionTimeAsSecond,
            timestamp: session.lastActionTimestamp,
          });
        }
  
        broadcastToSession(sessionId, 'participants', {
          participants: session.participants.map((p: any) => ({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
          })),
        });
  
        console.log(`✅ User ${userDetails.name} (${user.userId}) connected to session ${sessionId}`);
  
        connection.on('message', async (message: Buffer) => {
          try {
            console.log(`📨 WebSocket: Raw message received:`, message.toString());
            const parsedMessage = JSON.parse(message.toString());
            console.log(`📨 WebSocket: Parsed message:`, parsedMessage);
            const handler = messageHandlers[parsedMessage.type as keyof typeof messageHandlers];
            
            if (handler) {
              const currentUserId = socketToUser.get(connection);
              const currentSessionId = socketToSession.get(connection);
              console.log(`📨 WebSocket: Handler found for ${parsedMessage.type}, user: ${currentUserId}, session: ${currentSessionId}`);
              if (currentUserId && currentSessionId) {
                await handler(connection, parsedMessage.data, currentUserId, currentSessionId);
              } else {
                console.log(`❌ WebSocket: Missing userId or sessionId for message ${parsedMessage.type}`);
              }
            } else {
              console.log(`❌ WebSocket: No handler found for message type: ${parsedMessage.type}`);
            }
          } catch (err) {
            console.error('❌ WebSocket: Error processing message:', err);
          }
        });
  
        connection.on('close', () => {
          console.log(`🔌 WebSocket connection closed for user ${socketToUser.get(connection)}`);
          handleUserLeave(connection);
        });
  
        connection.on('error', (error: Error) => {
          console.error('❌ WebSocket error on socket:', error);
          handleUserLeave(connection);
        });
  
      } catch (error) {
        console.error(`❌ WebSocket: Fatal error during connection setup for session ${sessionId}:`, error);
        if (socketToSession.has(connection)) {
          handleUserLeave(connection);
        }
        if (connection.close) {
          connection.close();
        } else {
          connection.end();
        }
      }
    }
  } as any);
} 