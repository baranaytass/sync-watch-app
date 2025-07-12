import { ref, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
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
  const router = useRouter()
  
  // State
  const connected = ref(false)
  const participants = ref<SessionParticipant[]>([])
  const error = ref<string | null>(null)
  
  // WebSocket instance and connection management
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 3
  let reconnectTimeout: number | null = null
  let isManualDisconnect = false
  let isLeavingSession = false // Prevent multiple leave calls
  
  // Cleanup function
  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    if (ws) {
      isManualDisconnect = true
      ws.close(1000, 'Manual disconnect')
      ws = null
    }
    
    connected.value = false
    participants.value = []
    reconnectAttempts = 0
  }

  // Send message to server
  const sendMessage = (type: string, data: any = {}) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type, data })
        ws.send(message)
      } catch (err) {
        console.error(`WebSocket: Failed to send ${type}:`, err)
      }
    }
  }

  // Handle incoming messages
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'participants':
        updateParticipants(message.data.participants)
        break
        
      case 'user_joined':
        addParticipant(message.data)
        break
        
      case 'user_left':
        removeParticipant(message.data.userId)
        break
        
      case 'video_sync':
        handleVideoSync(message.data)
        break
        
      case 'video_sync_authoritative':
        handleVideoSyncAuthoritative(message.data)
        break
        
      case 'video_update':
        handleVideoUpdate(message.data)
        break
        
      case 'session_ended':
        handleSessionEnded(message.data)
        break
        
      case 'error':
        console.error('WebSocket: Server error:', message.data)
        error.value = message.data.message || 'Server error'
        break
        
      default:
        console.warn(`WebSocket: Unknown message type: ${message.type}`)
    }
  }

  // Message handlers
  const updateParticipants = (newParticipants: any[]) => {
    const participantsList: SessionParticipant[] = newParticipants.map(p => ({
      sessionId,
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      joinedAt: new Date(),
      isOnline: true,
      lastSeen: new Date()
    }))
    
    participants.value = participantsList
    sessionsStore.updateParticipants(participantsList)
  }

  const addParticipant = (userData: any) => {
    const newParticipant: SessionParticipant = {
      sessionId,
      userId: userData.userId,
      name: userData.name,
      avatar: userData.avatar,
      joinedAt: new Date(),
      isOnline: true,
      lastSeen: new Date()
    }
    
    if (!participants.value.some(p => p.userId === newParticipant.userId)) {
      participants.value.push(newParticipant)
      sessionsStore.updateParticipants(participants.value)
    }
  }

  const removeParticipant = (userId: string) => {
    participants.value = participants.value.filter(p => p.userId !== userId)
    sessionsStore.updateParticipants(participants.value)
  }

  const handleVideoSync = (data: any) => {
    videoSyncStore.syncVideo({
      action: data.action,
      time: data.time,
      timestamp: new Date(data.timestamp)
    })
  }

  const handleVideoSyncAuthoritative = (data: any) => {
    videoSyncStore.syncVideoAuthoritative({
      action: data.action,
      time: data.time,
      timestamp: new Date(data.timestamp),
      sourceUserId: data.sourceUserId
    })
  }

  const handleVideoUpdate = (data: any) => {
    if (sessionsStore.currentSession) {
      sessionsStore.updateCurrentSession({
        videoProvider: data.videoProvider,
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        videoDuration: data.videoDuration
      })
    }
  }

  const handleSessionEnded = (data: any) => {
    error.value = data.message || 'Session ended'
    sessionsStore.leaveSession()
    cleanup()
    router.push('/sessions')
  }

  // Connection management
  const connect = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        error.value = null
        isManualDisconnect = false
        
        const wsUrl = `ws://localhost:3000/ws/session/${sessionId}`
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          connected.value = true
          reconnectAttempts = 0
          resolve()
        }
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            handleMessage(message)
          } catch (err) {
            console.error('WebSocket: Failed to parse message:', err)
          }
        }
        
        ws.onclose = (event) => {
          connected.value = false
          
          // Auto-reconnect if not manual disconnect and within retry limits
          if (!isManualDisconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            
            reconnectTimeout = setTimeout(() => {
              connect().catch(console.error)
            }, Math.pow(2, reconnectAttempts) * 1000)
          }
        }
        
        ws.onerror = (event) => {
          console.error('WebSocket: Connection error:', event)
          error.value = 'Connection error'
          reject(new Error('WebSocket connection failed'))
        }
        
      } catch (err) {
        console.error('WebSocket: Failed to create connection:', err)
        error.value = 'Failed to create connection'
        reject(err)
      }
    })
  }

  // Leave session gracefully by closing WebSocket connection
  const leaveSession = async () => {
    if (isLeavingSession) {
      return
    }
    
    isLeavingSession = true
    
    try {
      cleanup()
    } catch (error) {
      console.error(`WebSocket: Error leaving session:`, error)
      cleanup()
    } finally {
      isLeavingSession = false
    }
  }

  // Page lifecycle handlers
  const handlePageHide = () => {
    leaveSession()
  }

  const handleBeforeUnload = () => {
    leaveSession()
  }

  // Setup page lifecycle listeners
  const setupPageLifecycle = () => {
    // Only handle page unload (closing tab/browser) - not visibility changes
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Handle page freeze (mobile browsers)
    window.addEventListener('pagehide', handlePageHide)
  }

  // Cleanup page lifecycle listeners
  const cleanupPageLifecycle = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('pagehide', handlePageHide)
  }

  // Generate unique message ID for deduplication
  const generateMessageId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API
  const sendVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
    const messageId = generateMessageId()
    sendMessage('video_action', { action, time, messageId })
  }

  const sendChatMessage = (message: string) => {
    sendMessage('chat', { message })
  }

  // Lifecycle hooks
  onBeforeUnmount(() => {
    cleanupPageLifecycle()
    cleanup()
  })

  onUnmounted(() => {
    cleanupPageLifecycle()
    cleanup()
  })

  // Setup page lifecycle on composable creation
  setupPageLifecycle()

  return {
    // State
    connected,
    participants,
    error,
    
    // Actions
    connect,
    leaveSession,
    sendVideoAction,
    sendChatMessage
  }
} 