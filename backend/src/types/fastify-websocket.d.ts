declare module '@fastify/websocket' {
  export interface SocketStream {
    socket: import('ws').WebSocket
  }
}

// Extend FastifyInstance for WebSocket support
declare module 'fastify' {
  interface FastifyInstance {
    websocketServer: import('ws').Server
  }
} 