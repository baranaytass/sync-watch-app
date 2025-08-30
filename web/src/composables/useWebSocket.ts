import { ref, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useVideoSyncHandlers } from './useVideoSync'
import { useSessionsStore } from '@/stores/sessions'
import { useChatStore, type ChatMessage } from '@/stores/chat'
import type { SessionParticipant } from '@sync-watch-app/shared-types'

interface WebSocketMessage {
  type: string
  data: any
}

export const useWebSocket = (sessionId: string) => {
  const authStore = useAuthStore()
  const { handleVideoSync, handleVideoSyncAuthoritative } = useVideoSyncHandlers()
  const sessionsStore = useSessionsStore()
  const chatStore = useChatStore()
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
        console.log(`📤 WebSocket: Sent ${type}`)
      } catch (err) {
        console.error(`❌ WebSocket: Failed to send ${type}:`, err)
      }
    } else {
      console.warn(`⚠️ WebSocket: Cannot send ${type}, not connected`)
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
        
      case 'chat_message':
        handleChatMessage(message.data)
        break
        
      case 'chat':
        handleChatMessage(message.data)
        break
        
      case 'error':
        console.error('❌ WebSocket: Server error:', message.data)
        error.value = message.data.message || 'Server error'
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


  const handleVideoUpdate = (data: any) => {
    console.log(`🎥 WebSocket: Video updated: ${data.videoTitle}`)
    if (sessionsStore.currentSession) {
      sessionsStore.updateCurrentSession({
        videoProvider: data.videoProvider,
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        videoDuration: data.videoDuration
      })
    } else {
      console.warn(`⚠️ WebSocket: Cannot update video - currentSession is null`)
      // Try to find session in sessions list and set as current
      const sessionFromList = sessionsStore.sessions.find(s => s.id === sessionId)
      if (sessionFromList) {
        console.log(`🔧 WebSocket: Setting session from list as current`)
        sessionsStore.setCurrentSession(sessionFromList)
        sessionsStore.updateCurrentSession({
          videoProvider: data.videoProvider,
          videoId: data.videoId,
          videoTitle: data.videoTitle,
          videoDuration: data.videoDuration
        })
      } else {
        console.error(`❌ WebSocket: Session ${sessionId} not found in sessions list`)
      }
    }
  }

  const handleSessionEnded = (data: any) => {
    console.log(`🔚 WebSocket: Session ended - ${data.reason}`)
    error.value = data.message || 'Session ended'
    sessionsStore.leaveSession()
    cleanup()
    router.push('/')
  }

  const handleChatMessage = (data: any) => {
    console.log('💬 WebSocket: Received chat message:', data)
    const chatMessage: ChatMessage = {
      id: data.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar || '',
      message: data.message,
      timestamp: new Date(data.timestamp || Date.now())
    }
    chatStore.addMessage(chatMessage)
  }

  // Connection management
  const connect = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        error.value = null
        isManualDisconnect = false
        
        // Use correct WebSocket URL for production
        const API_BASE_URL = import.meta.env.VITE_API_URL || 
          (window.location.hostname.includes('onrender.com') || window.location.hostname === 'staysync.baranaytas.com' 
            ? 'https://staysync-api.baranaytas.com' 
            : 'http://localhost:3000')
        
        // Get JWT token for WebSocket authentication
        let wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + `/ws/session/${sessionId}`
        
        // Add JWT token as query parameter for WebSocket authentication
        const token = authStore.getToken()
        if (token) {
          wsUrl += `?token=${encodeURIComponent(token)}`
        } else {
          console.warn('⚠️ WebSocket: No JWT token found for authentication')
        }
        ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`✅ WebSocket: Connected to session ${sessionId}`)
          connected.value = true
          reconnectAttempts = 0
          
          // Expose WebSocket for testing purposes
          if (import.meta.env.DEV || (window as any).playwright) {
            (window as any).testWebSocket = ws;
            (window as any).sendVideoActionTest = (action: string, time: number) => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                const message = {
                  type: 'video_action',
                  data: { action, time }
                }
                ws.send(JSON.stringify(message))
                console.log(`🎯 TEST: Sent ${action} action via WebSocket`)
              } else {
                console.log(`🎯 TEST: WebSocket not ready for action ${action}`)
              }
            }
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

  // Leave session gracefully by closing WebSocket connection
  const leaveSession = async () => {
    if (isLeavingSession) {
      return
    }
    
    isLeavingSession = true
    console.log(`🚪 WebSocket: Leaving session ${sessionId}`)
    
    try {
      // Simply close the WebSocket connection - backend will handle the disconnect
      cleanup()
      console.log(`✅ WebSocket: Left session ${sessionId}`)
    } catch (error) {
      console.error(`❌ WebSocket: Error leaving session:`, error)
      cleanup()
    } finally {
      isLeavingSession = false
    }
  }

  // Page lifecycle handlers
  const handlePageHide = () => {
    console.log('🔄 WebSocket: Page closing, leaving session')
    leaveSession()
  }

  const handleBeforeUnload = () => {
    console.log('🔄 WebSocket: Page unloading, leaving session')
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