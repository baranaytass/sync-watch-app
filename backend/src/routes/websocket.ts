import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { SessionService } from '../services/SessionService';
import { UserModel } from '../models/User';

interface WebSocketParams {
  sessionId: string;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export default async function websocketRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const sessionService = new SessionService(fastify.pg);
  const userModel = new UserModel(fastify.pg);

  // Connection storage
  const connections = new Map<string, SocketStream[]>(); // sessionId -> sockets
  const socketToSession = new Map<SocketStream, string>(); // socket -> sessionId
  const socketToUser = new Map<SocketStream, string>(); // socket -> userId

  // Helper functions
  const sendMessage = (socket: SocketStream, type: string, data: any): void => {
    try {
      if (socket.socket.readyState === 1) { // WebSocket.OPEN
        socket.socket.send(JSON.stringify({ type, data }));
      }
    } catch (error) {
      console.error('❌ WebSocket: Error sending message:', error);
    }
  };

  const broadcastToSession = (sessionId: string, type: string, data: any, excludeSocket?: SocketStream): void => {
    const sockets = connections.get(sessionId);
    if (!sockets) return;

    const message = JSON.stringify({ type, data });
    sockets.forEach(socket => {
      if (socket !== excludeSocket) {
        try {
          if (socket.socket.readyState === 1) { // WebSocket.OPEN
            socket.socket.send(message);
          }
        } catch (error) {
          console.error('❌ WebSocket: Error broadcasting message:', error);
        }
      }
    });
  };

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

    console.log(`🚪 WebSocket: handleUserLeave - sessionId: ${sessionId}, userId: ${userId}`);

    if (!sessionId || !userId) {
      console.log(`⚠️ WebSocket: handleUserLeave called but missing sessionId or userId`);
      return;
    }

    try {
      // Clean up connection mapping first
      cleanupConnection(socket);

      // Remove user from session in database
      const sessionDeleted = await sessionService.leaveSession(sessionId, userId);

      if (sessionDeleted) {
        console.log(`🔚 WebSocket: Session ${sessionId} was deleted - no participants remaining`);
        
        // Notify any remaining connections (shouldn't be any, but just in case)
        broadcastToSession(sessionId, 'session_ended', {
          reason: 'no_participants',
          message: 'Session ended - no participants remaining'
        });
      } else {
        console.log(`✅ WebSocket: User ${userId} left session ${sessionId}, session still active`);
        
        // Update participant list for remaining users
        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          broadcastToSession(sessionId, 'participants', {
            participants: session.participants.map(p => ({
              userId: p.userId,
              name: p.name,
              avatar: p.avatar,
            })),
          });
        }
      }

    } catch (error) {
      console.error('❌ WebSocket: Error handling user leave:', error);
    }
  };

  // Message handlers
  const messageHandlers = {
    leave: async (socket: SocketStream, _data: any, userId: string, sessionId: string) => {
      console.log(`🚪 WebSocket: User ${userId} manually leaving session ${sessionId}`);
      await handleUserLeave(socket);
      socket.end();
    },

    video_action: async (socket: SocketStream, data: any, userId: string, sessionId: string) => {
      // Check if user is host
      const isHost = await sessionService.isUserSessionHost(sessionId, userId);
      if (isHost) {
        console.log(`🎥 WebSocket: Host ${userId} sent video action: ${data.action} at ${data.time}s`);
        broadcastToSession(sessionId, 'video_sync', {
          action: data.action,
          time: data.time,
          timestamp: new Date(),
        }, socket);
      } else {
        console.log(`⚠️ WebSocket: Non-host ${userId} tried to send video action`);
      }
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
          console.log(`💬 WebSocket: Chat message from ${user.name} in session ${sessionId}`);
          broadcastToSession(sessionId, 'chat', chatMessage);
        }
      }
    },

    ping: async (socket: SocketStream, _data: any, _userId: string, _sessionId: string) => {
      sendMessage(socket, 'pong', { timestamp: new Date() });
    }
  };

  // WebSocket endpoint
  fastify.get('/ws/session/:sessionId', {
    websocket: true,
    preHandler: [fastify.authenticate],
  }, async (connection: SocketStream, request: FastifyRequest) => {
    const { sessionId } = request.params as WebSocketParams;
    const authRequest = request as AuthenticatedRequest;
    
    if (!authRequest.user) {
      sendMessage(connection, 'error', { message: 'Authentication required' });
      connection.end();
      return;
    }

    const user = authRequest.user;
    let userDetails: any = null;

    try {
      // Validate session access
      const hasAccess = await sessionService.validateUserSessionAccess(sessionId, user.userId);
      if (!hasAccess) {
        sendMessage(connection, 'error', { message: 'You do not have access to this session' });
        connection.end();
        return;
      }

      // Get user details
      userDetails = await userModel.findById(user.userId);
      if (!userDetails) {
        sendMessage(connection, 'error', { message: 'User not found' });
        connection.end();
        return;
      }

      // Store connection mappings
      if (!connections.has(sessionId)) {
        connections.set(sessionId, []);
      }
      connections.get(sessionId)!.push(connection);
      socketToSession.set(connection, sessionId);
      socketToUser.set(connection, user.userId);

      // Join session in database
      await sessionService.joinSession(sessionId, user.userId);

      // Get updated session state
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        sendMessage(connection, 'error', { message: 'Session not found' });
        connection.end();
        return;
      }

      // Send current video state if available
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

      // Broadcast updated participants to all users in session
      broadcastToSession(sessionId, 'participants', {
        participants: session.participants.map(p => ({
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
        })),
      });

      console.log(`🔌 WebSocket: User ${userDetails.name} (${user.userId}) connected to session ${sessionId}`);

      // Set up message handler
      connection.on('message', async (rawMessage) => {
        try {
          const message = JSON.parse(rawMessage.toString());
          console.log(`📨 WebSocket: Message from ${userDetails.name}: ${message.type}`, message.data);

          const handler = messageHandlers[message.type as keyof typeof messageHandlers];
          if (handler) {
            console.log(`🔄 WebSocket: Processing ${message.type} message for user ${user.userId}`);
            await handler(connection, message.data, user.userId, sessionId);
            console.log(`✅ WebSocket: Completed ${message.type} message for user ${user.userId}`);
          } else {
            console.warn(`⚠️ WebSocket: Unknown message type: ${message.type}`);
            sendMessage(connection, 'error', { message: `Unknown message type: ${message.type}` });
          }
        } catch (error) {
          console.error('❌ WebSocket: Message handling error:', error);
          sendMessage(connection, 'error', { message: 'Invalid message format' });
        }
      });

      // Set up close handler
      connection.on('close', async () => {
        console.log(`🔌 WebSocket: Connection closed for user ${userDetails?.name || user.userId} in session ${sessionId}`);
        await handleUserLeave(connection);
      });

    } catch (error) {
      console.error('❌ WebSocket: Connection setup error:', error);
      sendMessage(connection, 'error', { message: 'Connection failed' });
      connection.end();
    }
  });
} 