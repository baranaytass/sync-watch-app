declare module 'fastify' {
  interface FastifyInstance {
    broadcastToSession?: (sessionId: string, type: string, data: any, excludeSocket?: any) => void
  }
} 