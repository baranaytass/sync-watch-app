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
      socket.socket.send(JSON.stringify({ type, data }));
    } catch (error) {
      fastify.log.error('Error sending message:', error);
    }
  };

  const broadcastToSession = (sessionId: string, type: string, data: any): void => {
    const sockets = connections.get(sessionId);
    if (!sockets) return;

    const message = JSON.stringify({ type, data });
          sockets.forEach(socket => {
        try {
          socket.socket.send(message);
        } catch (error) {
          fastify.log.error('Error broadcasting message:', error);
        }
      });
  };

  const handleDisconnection = async (socket: SocketStream): Promise<void> => {
    const sessionId = socketToSession.get(socket);
    const userId = socketToUser.get(socket);

    if (sessionId && userId) {
      try {
        // Remove from connections first
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

        // Clean up mappings
        socketToSession.delete(socket);
        socketToUser.delete(socket);

        // Leave session in database and check if session was deactivated
        const sessionDeactivated = await sessionService.leaveSession(sessionId, userId);

        if (sessionDeactivated) {
          // Session was deactivated due to no participants
          console.log(`🔚 WebSocket: Session ${sessionId} was deactivated due to no remaining participants`);
          
          // If there are still WebSocket connections for some reason, notify them
          if (sessionSockets && sessionSockets.length > 0) {
            broadcastToSession(sessionId, 'session_ended', {
              reason: 'no_participants',
              message: 'Session ended - no participants remaining'
            });
          }
        } else {
          // Session still active, broadcast updated participants
          if (sessionSockets && sessionSockets.length > 0) {
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
        }

        console.log(`🚪 WebSocket: User ${userId} disconnected from session ${sessionId}`);

      } catch (error) {
        fastify.log.error('Disconnection handling error:', error);
      }
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

    try {
      // Validate session access
      const hasAccess = await sessionService.validateUserSessionAccess(sessionId, user.userId);
      if (!hasAccess) {
        sendMessage(connection, 'error', { message: 'You do not have access to this session' });
        connection.end();
        return;
      }

      // Get user details
      const userDetails = await userModel.findById(user.userId);
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

      // Send current session state
      const session = await sessionService.getSessionById(sessionId);
      if (session && session.videoId) {
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

      // Broadcast updated participants
      if (session) {
        broadcastToSession(sessionId, 'participants', {
          participants: session.participants.map(p => ({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
          })),
        });
      }

      // Set up message handler
      connection.on('message', async (rawMessage) => {
        try {
          const message = JSON.parse(rawMessage.toString());

          switch (message.type) {
            case 'video_action':
              // Check if user is host
              const isHost = await sessionService.isUserSessionHost(sessionId, user.userId);
              if (isHost) {
                broadcastToSession(sessionId, 'video_sync', {
                  action: message.data.action,
                  time: message.data.time,
                  timestamp: new Date(),
                });
              }
              break;

            case 'chat':
              if (message.data.message && message.data.message.trim().length > 0) {
                const chatMessage = {
                  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  userId: userDetails.id,
                  userName: userDetails.name,
                  message: message.data.message.trim(),
                  timestamp: new Date(),
                };
                broadcastToSession(sessionId, 'chat', chatMessage);
              }
              break;

            case 'leave':
              // Manually leave session
              await handleDisconnection(connection);
              connection.end();
              break;

            case 'ping':
              sendMessage(connection, 'pong', { timestamp: new Date() });
              break;

            default:
              sendMessage(connection, 'error', { message: `Unknown message type: ${message.type}` });
          }
        } catch (error) {
          fastify.log.error('Message handling error:', error);
          sendMessage(connection, 'error', { message: 'Invalid message format' });
        }
      });

      // Set up close handler
      connection.on('close', () => {
        handleDisconnection(connection);
      });

      console.log(`🔌 WebSocket: User ${user.userId} connected to session ${sessionId}`);

    } catch (error) {
      fastify.log.error('WebSocket connection error:', error);
      sendMessage(connection, 'error', { message: 'Connection failed' });
      connection.end();
    }
  });
} 