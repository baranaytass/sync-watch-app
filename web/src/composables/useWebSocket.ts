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
        console.log(`📤 WebSocket: Sent ${type}`, data)
      } catch (err) {
        console.error(`❌ WebSocket: Failed to send ${type}:`, err)
      }
    } else {
      console.warn(`⚠️ WebSocket: Cannot send ${type}, not connected`)
    }
  }

  // Handle incoming messages
  const handleMessage = (message: WebSocketMessage) => {
    console.log(`📥 WebSocket: ${message.type}`, message.data)
    
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
        
      case 'video_update':
        handleVideoUpdate(message.data)
        break
        
      case 'session_ended':
        handleSessionEnded(message.data)
        break
        
      case 'error':
        console.error('❌ WebSocket: Server error:', message.data)
        error.value = message.data.message || 'Server error'
        break
        
      case 'pong':
        // Keep-alive response
        break
        
      default:
        console.warn(`⚠️ WebSocket: Unknown message type: ${message.type}`)
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
    console.log(`👥 WebSocket: Updated participants: ${participantsList.length} users`)
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
      console.log(`👤 WebSocket: User joined: ${newParticipant.name}`)
    }
  }

  const removeParticipant = (userId: string) => {
    participants.value = participants.value.filter(p => p.userId !== userId)
    sessionsStore.updateParticipants(participants.value)
    console.log(`👤 WebSocket: User left: ${userId}`)
  }

  const handleVideoSync = (data: any) => {
    console.log(`🎥 WebSocket: Video sync - ${data.action} at ${data.time}s`)
    videoSyncStore.syncVideo({
      action: data.action,
      time: data.time,
      timestamp: new Date(data.timestamp)
    })
  }

  const handleVideoUpdate = (data: any) => {
    console.log(`🎥 WebSocket: Video updated: ${data.videoTitle}`)
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
    console.log(`🔚 WebSocket: Session ended - ${data.reason}`)
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
        
        console.log(`🔌 WebSocket: Connecting to session ${sessionId}`)
        
        const wsUrl = `ws://localhost:3000/ws/session/${sessionId}`
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ WebSocket: Connected to session ${sessionId}`)
          connected.value = true
          reconnectAttempts = 0
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
          
          // Auto-reconnect if not manual disconnect and within retry limits
          if (!isManualDisconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            console.log(`🔄 WebSocket: Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`)
            
            reconnectTimeout = setTimeout(() => {
              connect().catch(console.error)
            }, Math.pow(2, reconnectAttempts) * 1000)
          }
        }
        
        ws.onerror = (event) => {
          console.error('❌ WebSocket: Connection error:', event)
          error.value = 'Connection error'
          reject(new Error('WebSocket connection failed'))
        }
        
      } catch (err) {
        console.error('❌ WebSocket: Failed to create connection:', err)
        error.value = 'Failed to create connection'
        reject(err)
      }
    })
  }

  // Leave session gracefully
  const leaveSession = async () => {
    console.log(`🚪 WebSocket: Leaving session ${sessionId}`)
    console.log(`🚪 WebSocket: Connection state - connected: ${connected.value}, readyState: ${ws?.readyState}`)
    
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`📤 WebSocket: Sending leave message to server`)
        // Send leave message and wait briefly for it to be processed
        sendMessage('leave', {})
        
        // Wait for message to be sent
        console.log(`⏳ WebSocket: Waiting 200ms for leave message to be processed`)
        await new Promise(resolve => setTimeout(resolve, 200))
        console.log(`✅ WebSocket: Leave message processing time completed`)
      } else {
        console.warn(`⚠️ WebSocket: Cannot send leave message - connection not open`)
      }
      
      console.log(`🧹 WebSocket: Cleaning up connection`)
      cleanup()
      console.log(`✅ WebSocket: Leave session completed`)
    } catch (error) {
      console.error(`❌ WebSocket: Error during leave session:`, error)
      cleanup() // Still cleanup even if there's an error
    }
  }

  // Page lifecycle handlers
  const handlePageHide = () => {
    console.log('🔄 WebSocket: Page hidden, leaving session')
    leaveSession()
  }

  const handleBeforeUnload = () => {
    console.log('🔄 WebSocket: Page unloading, leaving session')
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Synchronous leave for page unload
      sendMessage('leave', {})
    }
  }

  // Setup page lifecycle listeners
  const setupPageLifecycle = () => {
    // Handle page visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handlePageHide()
      }
    })
    
    // Handle page unload (closing tab/browser)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Handle page freeze (mobile browsers)
    window.addEventListener('pagehide', handlePageHide)
  }

  // Cleanup page lifecycle listeners
  const cleanupPageLifecycle = () => {
    document.removeEventListener('visibilitychange', handlePageHide)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('pagehide', handlePageHide)
  }

  // Public API
  const sendVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
    console.log(`🎥 WebSocket: Sending video action: ${action} at ${time}s`)
    sendMessage('video_action', { action, time })
  }

  const sendChatMessage = (message: string) => {
    console.log(`💬 WebSocket: Sending chat message`)
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