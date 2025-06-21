import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Participant {
  userId: string
  name: string
  avatar: string
  isOnline: boolean
  joinedAt: Date
}

interface WebSocketMessage {
  type: string
  data: any
}

export const useWebSocket = (sessionId: string) => {
  const authStore = useAuthStore()
  
  // Reactive state
  const connected = ref(false)
  const participants = ref<Participant[]>([])
  const error = ref<string | null>(null)
  
  // WebSocket instance
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimeout: number | null = null

  // Connection methods
  const connect = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        error.value = null
        
        // WebSocket URL - using HTTP host but WS protocol
        const wsUrl = `ws://localhost:3000/ws/session/${sessionId}`
        
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`WebSocket connected to session ${sessionId}`)
          connected.value = true
          reconnectAttempts = 0
          
          // Send authentication if available
          if (authStore.user) {
            sendMessage('auth', { userId: authStore.user.id })
          }
          
          resolve()
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            handleMessage(message)
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }
        
        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          connected.value = false
          
          // Auto-reconnect if not a normal closure
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            console.log(`Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`)
            
            reconnectTimeout = setTimeout(() => {
              connect().catch(console.error)
            }, Math.pow(2, reconnectAttempts) * 1000) // Exponential backoff
          }
        }
        
        ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          error.value = 'WebSocket bağlantı hatası'
          reject(new Error('WebSocket connection failed'))
        }
        
      } catch (err) {
        console.error('Failed to create WebSocket:', err)
        error.value = 'WebSocket bağlantısı oluşturulamadı'
        reject(err)
      }
    })
  }
  
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    if (ws) {
      ws.close(1000, 'User disconnected')
      ws = null
    }
    
    connected.value = false
    participants.value = []
  }
  
  // Message handling
  const sendMessage = (type: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('WebSocket is not connected')
    }
  }
  
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'participants':
        participants.value = message.data.participants.map((p: any) => ({
          ...p,
          joinedAt: new Date(p.joinedAt),
          isOnline: true // All participants in the message are online
        }))
        break
        
      case 'user_joined':
        const newParticipant = {
          ...message.data,
          joinedAt: new Date(message.data.joinedAt),
          isOnline: true
        }
        
        // Add if not already in list
        if (!participants.value.some(p => p.userId === newParticipant.userId)) {
          participants.value.push(newParticipant)
        }
        break
        
      case 'user_left':
        participants.value = participants.value.filter(
          p => p.userId !== message.data.userId
        )
        break
        
      case 'video_sync':
        // This will be handled by video sync store later
        console.log('Video sync event:', message.data)
        break
        
      case 'video_update':
        // This will be handled by session store
        console.log('Video update event:', message.data)
        break
        
      case 'chat':
        // This will be handled by chat store later
        console.log('Chat message:', message.data)
        break
        
      case 'error':
        console.error('WebSocket error message:', message.data)
        error.value = message.data.message || 'WebSocket hatası'
        break
        
      case 'pong':
        // Keep-alive response
        break
        
      default:
        console.log('Unknown WebSocket message type:', message.type)
    }
  }
  
  // Public API
  const sendVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
    sendMessage('video_action', { action, time })
  }
  
  const sendChatMessage = (message: string) => {
    sendMessage('chat', { message })
  }
  
  const leaveSession = () => {
    sendMessage('leave', {})
  }
  
  // Ping to keep connection alive
  const startPing = () => {
    const pingInterval = setInterval(() => {
      if (connected.value) {
        sendMessage('ping', {})
      } else {
        clearInterval(pingInterval)
      }
    }, 30000) // Every 30 seconds
    
    return pingInterval
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    // State
    connected,
    participants,
    error,
    
    // Methods
    connect,
    disconnect,
    sendVideoAction,
    sendChatMessage,
    leaveSession
  }
} 