import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useVideoSyncStore } from '@/stores/videoSync'
import { useSessionsStore } from '@/stores/sessions'
import type { SessionParticipant } from '@sync-watch-app/shared-types'

interface WebSocketMessage {
  type: string
  data: any
}

export const useWebSocket = (sessionId: string) => {
  const authStore = useAuthStore()
  const videoSyncStore = useVideoSyncStore()
  const sessionsStore = useSessionsStore()
  
  // Reactive state
  const connected = ref(false)
  const participants = ref<SessionParticipant[]>([])
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
        console.log(`🔌 WebSocket: Connecting to session ${sessionId}`)
        
        // WebSocket URL - using HTTP host but WS protocol
        const wsUrl = `ws://localhost:3000/ws/session/${sessionId}`
        
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ WebSocket: Connected to session ${sessionId}`)
          connected.value = true
          reconnectAttempts = 0
          
          // Send authentication if available
          if (authStore.user) {
            console.log(`🔐 WebSocket: Sending auth for user ${authStore.user.id}`)
            sendMessage('auth', { userId: authStore.user.id })
          }
          
          resolve()
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            handleMessage(message)
          } catch (err) {
            console.error('❌ WebSocket: Failed to parse message:', err)
          }
        }
        
        ws.onclose = (event) => {
          console.log(`🔌 WebSocket: Disconnected from session ${sessionId}:`, event.code, event.reason)
          connected.value = false
          
          // Auto-reconnect if not a normal closure
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            console.log(`🔄 WebSocket: Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`)
            
            reconnectTimeout = setTimeout(() => {
              connect().catch(console.error)
            }, Math.pow(2, reconnectAttempts) * 1000) // Exponential backoff
          }
        }
        
        ws.onerror = (event) => {
          console.error('❌ WebSocket: Connection error:', event)
          error.value = 'WebSocket bağlantı hatası'
          reject(new Error('WebSocket connection failed'))
        }
        
      } catch (err) {
        console.error('❌ WebSocket: Failed to create connection:', err)
        error.value = 'WebSocket bağlantısı oluşturulamadı'
        reject(err)
      }
    })
  }
  
  const disconnect = () => {
    console.log(`🔌 WebSocket: Disconnecting from session ${sessionId}`)
    
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
      console.log(`📤 WebSocket: Sending ${type} message:`, data)
      ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('⚠️ WebSocket: Cannot send message, not connected')
    }
  }
  
  const handleMessage = (message: WebSocketMessage) => {
    console.log(`📥 WebSocket: Received ${message.type} message:`, message.data)
    
    switch (message.type) {
      case 'participants':
        // Update participants list from server
        const participantsList: SessionParticipant[] = message.data.participants.map((p: any) => ({
          sessionId: sessionId,
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
          joinedAt: new Date(), // Will be updated with real data from backend
          isOnline: true,
          lastSeen: new Date()
        }))
        
        participants.value = participantsList
        sessionsStore.updateParticipants(participantsList)
        console.log(`👥 WebSocket: Updated participants list: ${participantsList.length} participants`)
        break
        
      case 'user_joined':
        // Handle new user joining
        const newParticipant: SessionParticipant = {
          sessionId: sessionId,
          userId: message.data.userId,
          name: message.data.name,
          avatar: message.data.avatar,
          joinedAt: new Date(),
          isOnline: true,
          lastSeen: new Date()
        }
        
        // Add if not already in list
        if (!participants.value.some(p => p.userId === newParticipant.userId)) {
          participants.value.push(newParticipant)
          sessionsStore.updateParticipants(participants.value)
          console.log(`👤 WebSocket: User joined: ${newParticipant.name}`)
        }
        break
        
      case 'user_left':
        // Handle user leaving
        participants.value = participants.value.filter(
          p => p.userId !== message.data.userId
        )
        sessionsStore.updateParticipants(participants.value)
        console.log(`👤 WebSocket: User left: ${message.data.userId}`)
        break
        
      case 'video_sync':
        // Handle video synchronization
        console.log(`🎥 WebSocket: Video sync - ${message.data.action} at ${message.data.time}s`)
        videoSyncStore.syncVideo({
          action: message.data.action,
          time: message.data.time,
          timestamp: new Date(message.data.timestamp)
        })
        break
        
      case 'video_update':
        // Handle video metadata update
        console.log(`🎥 WebSocket: Video updated: ${message.data.videoTitle}`)
        if (sessionsStore.currentSession) {
          sessionsStore.updateCurrentSession({
            videoProvider: message.data.videoProvider,
            videoId: message.data.videoId,
            videoTitle: message.data.videoTitle,
            videoDuration: message.data.videoDuration
          })
        }
        break
        
      case 'session_update':
        // Handle session info update (host change, etc.)
        console.log(`👑 WebSocket: Session updated - new host: ${message.data.hostId}`)
        if (sessionsStore.currentSession) {
          sessionsStore.updateCurrentSession({
            hostId: message.data.hostId
          })
        }
        break
        
      case 'session_ended':
        // Handle session termination
        console.log(`❌ WebSocket: Session ${sessionId} ended - ${message.data.reason}: ${message.data.message}`)
        error.value = message.data.message || 'Oturum sona erdi'
        disconnect()
        // Could trigger navigation back to sessions list or show a modal
        break
        
      case 'chat':
        // This will be handled by chat store later
        console.log('💬 WebSocket: Chat message:', message.data)
        break
        
      case 'error':
        console.error('❌ WebSocket: Server error:', message.data)
        error.value = message.data.message || 'Sunucu hatası'
        break
        
      case 'pong':
        // Handle ping response
        console.log('🏓 WebSocket: Pong received')
        break
        
      default:
        console.warn(`⚠️ WebSocket: Unknown message type: ${message.type}`)
    }
  }
  
  // Actions
  const sendVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
    console.log(`🎥 WebSocket: Sending video action: ${action} at ${time}s`)
    sendMessage('video_action', { action, time })
  }
  
  const sendChatMessage = (message: string) => {
    console.log(`💬 WebSocket: Sending chat message`)
    sendMessage('chat', { message })
  }
  
  const leaveSession = () => {
    console.log(`🚪 WebSocket: Leaving session ${sessionId}`)
    sendMessage('leave', {})
    disconnect()
  }
  
  const startPing = () => {
    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (connected.value) {
        sendMessage('ping', { timestamp: new Date() })
      } else {
        clearInterval(pingInterval)
      }
    }, 30000)
    
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
    
    // Actions
    connect,
    disconnect,
    sendVideoAction,
    sendChatMessage,
    leaveSession,
    startPing
  }
} 