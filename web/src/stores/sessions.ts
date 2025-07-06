import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, SessionParticipant, CreateSessionRequest, SetSessionVideoRequest, ApiResponse } from '@sync-watch-app/shared-types'
import { useAuthStore } from './auth'

export const useSessionsStore = defineStore('sessions', () => {
  // State
  const sessions = ref<Session[]>([])
  const currentSession = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Auth store for user info
  const authStore = useAuthStore()

  // Computed properties
  const isHost = computed(() => {
    return currentSession.value?.hostId === authStore.user?.id
  })

  const currentUser = computed(() => authStore.user)

  const isParticipant = computed(() => {
    if (!currentSession.value || !currentUser.value) return false
    return currentSession.value.participants.some(p => p.userId === currentUser.value!.id)
  })

  const participants = computed(() => {
    return currentSession.value?.participants || []
  })

  // Helper function to create request headers with auth token
  const createAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add Authorization header if token exists in localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  // Helper function to transform date strings
  const transformDates = (session: any): Session => ({
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    lastActionTimestamp: new Date(session.lastActionTimestamp),
    participants: session.participants?.map((p: any) => ({
      ...p,
      joinedAt: new Date(p.joinedAt),
      lastSeen: new Date(p.lastSeen),
    })) || []
  })

  // Actions
  const fetchSessions = async (): Promise<void> => {
    console.log('📋 Sessions Store: Fetching sessions')
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/sessions', {
        method: 'GET',
        headers: createAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && Array.isArray(result.data)) {
        sessions.value = result.data.map(transformDates)
        console.log(`📋 Sessions Store: Loaded ${sessions.value.length} sessions`)
        sessions.value.forEach(session => {
          console.log(`📋 Sessions Store: - Session ${session.id}: "${session.title}" (${session.participants.length} participants)`)
        })
      } else {
        throw new Error(result.error?.message || 'Failed to fetch sessions')
      }
    } catch (err: any) {
      console.error('📋 Sessions Store: Error fetching sessions:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch sessions'
      sessions.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchSession = async (sessionId: string): Promise<void> => {
    console.log(`📋 Sessions Store: Fetching session ${sessionId}`)
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: createAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        currentSession.value = transformDates(result.data)
        console.log(`📋 Sessions Store: Loaded session ${sessionId} with ${currentSession.value.participants.length} participants`)
      } else {
        throw new Error(result.error?.message || 'Failed to fetch session')
      }
    } catch (err: any) {
      console.error(`📋 Sessions Store: Error fetching session ${sessionId}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch session'
      currentSession.value = null
    } finally {
      loading.value = false
    }
  }

  const createSession = async (data: CreateSessionRequest): Promise<Session | null> => {
    console.log('➕ Sessions Store: Creating new session:', data.title)
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: createAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        const newSession = transformDates(result.data)
        console.log(`➕ Sessions Store: Created session ${newSession.id}: "${newSession.title}"`)
        
        // Add to sessions list
        sessions.value.unshift(newSession)
        
        return newSession
      } else {
        throw new Error(result.error?.message || 'Failed to create session')
      }
    } catch (err: any) {
      console.error('➕ Sessions Store: Error creating session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create session'
      return null
    } finally {
      loading.value = false
    }
  }

  const joinSession = async (sessionId: string): Promise<Session | null> => {
    console.log(`🚪 Sessions Store: Joining session ${sessionId}`)
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: createAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        const joinedSession = transformDates(result.data)
        console.log(`🚪 Sessions Store: Joined session ${sessionId} with ${joinedSession.participants.length} participants`)
        
        // Update current session
        currentSession.value = joinedSession
        
        // Update in sessions list if exists
        const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
        if (sessionIndex >= 0) {
          sessions.value[sessionIndex] = joinedSession
        }
        
        return joinedSession
      } else {
        throw new Error(result.error?.message || 'Failed to join session')
      }
    } catch (err: any) {
      console.error(`🚪 Sessions Store: Error joining session ${sessionId}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to join session'
      return null
    } finally {
      loading.value = false
    }
  }

  const setSessionVideo = async (sessionId: string, data: SetSessionVideoRequest): Promise<Session | null> => {
    console.log(`🎥 Sessions Store: Setting video for session ${sessionId}:`, data.videoId)
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/sessions/${sessionId}/video`, {
        method: 'POST',
        headers: createAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        const updatedSession = transformDates(result.data)
        console.log(`🎥 Sessions Store: Video set for session ${sessionId}: "${updatedSession.videoTitle}"`)
        
        // Update current session
        if (currentSession.value && currentSession.value.id === sessionId) {
          currentSession.value = updatedSession
        }
        
        // Update in sessions list if exists
        const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
        if (sessionIndex >= 0) {
          sessions.value[sessionIndex] = updatedSession
        }
        
        return updatedSession
      } else {
        throw new Error(result.error?.message || 'Failed to set session video')
      }
    } catch (err: any) {
      console.error(`🎥 Sessions Store: Error setting video for session ${sessionId}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to set session video'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateCurrentSession = (updatedSession: Partial<Session>): void => {
    if (currentSession.value) {
      console.log(`🔄 Sessions Store: Updating current session ${currentSession.value.id}`)
      currentSession.value = { ...currentSession.value, ...updatedSession }
      
      // Also update in sessions list if exists
      const sessionIndex = sessions.value.findIndex(s => s.id === currentSession.value!.id)
      if (sessionIndex >= 0) {
        sessions.value[sessionIndex] = currentSession.value
      }
    }
  }

  const updateParticipants = (participantsList: Array<{ userId: string; name: string; avatar: string }>): void => {
    if (currentSession.value) {
      console.log(`👥 Sessions Store: Updating participants (${participantsList.length} users)`)
      
      // Convert WebSocket participant format to SessionParticipant format
      const updatedParticipants: SessionParticipant[] = participantsList.map(p => {
        // Find existing participant to preserve their data
        const existing = currentSession.value!.participants.find(ep => ep.userId === p.userId)
        return {
          sessionId: currentSession.value!.id,
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
          joinedAt: existing?.joinedAt || new Date(),
          isOnline: true,
          lastSeen: new Date(),
        }
      })
      
      updateCurrentSession({ participants: updatedParticipants })
    }
  }

  const leaveSession = (): void => {
    console.log('🚪 Sessions Store: Leaving current session')
    currentSession.value = null
    error.value = null
  }

  const clearSessions = (): void => {
    console.log('🗑️ Sessions Store: Clearing all sessions')
    sessions.value = []
    currentSession.value = null
    error.value = null
  }

  // Guest user için direct set metodları
  const setCurrentSession = (session: any): void => {
    console.log('👤 Sessions Store: Setting current session (guest mode)')
    currentSession.value = session
  }

  const setParticipants = (participantsList: any[]): void => {
    console.log('👤 Sessions Store: Setting participants (guest mode)')
    if (currentSession.value) {
      // Create new participants array to trigger reactivity
      const newParticipants = participantsList.map(p => ({
        sessionId: currentSession.value!.id,
        userId: p.id || p.userId,
        name: p.name,
        avatar: p.avatar || '',
        joinedAt: new Date(p.joinedAt || new Date()),
        isOnline: true,
        lastSeen: new Date(),
      }))
      
      // Force reactive update by creating new session object
      currentSession.value = {
        ...currentSession.value,
        participants: newParticipants
      }
      
      console.log(`👤 Sessions Store: Set ${newParticipants.length} participants for session ${currentSession.value.id}`)
    }
  }

  return {
    // State
    sessions,
    currentSession,
    loading,
    error,
    // Computed
    isHost,
    isParticipant,
    currentUser,
    participants,
    // Actions
    fetchSessions,
    fetchSession,
    createSession,
    joinSession,
    setSessionVideo,
    updateCurrentSession,
    updateParticipants,
    leaveSession,
    clearSessions,
    // Guest helper methods
    setCurrentSession,
    setParticipants,
  }
}) 