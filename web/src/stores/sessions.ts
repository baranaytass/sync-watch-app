import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { User } from './auth'

export interface Session {
  id: string
  title: string
  description?: string
  hostId: string
  videoProvider: 'youtube' | null
  videoId: string | null
  videoTitle: string | null
  videoDuration: number
  lastAction: 'play' | 'pause' | 'seek'
  lastActionTimeAsSecond: number
  lastActionTimestamp: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSessionRequest {
  title: string
  description?: string
}

export interface SetVideoRequest {
  videoProvider: 'youtube'
  videoId: string
}

export const useSessionsStore = defineStore('sessions', () => {
  // State
  const sessions = ref<Session[]>([])
  const currentSession = ref<Session | null>(null)
  const participants = ref<User[]>([])
  const isHost = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const fetchSessions = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sessions`, {
        withCredentials: true
      })
      sessions.value = response.data.data
    } catch (err) {
      error.value = 'Failed to fetch sessions'
      console.error('Fetch sessions error:', err)
    } finally {
      loading.value = false
    }
  }

  const createSession = async (sessionData: CreateSessionRequest) => {
    try {
      loading.value = true
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sessions`, sessionData, {
        withCredentials: true
      })
      const newSession = response.data.data
      sessions.value.unshift(newSession)
      return newSession
    } catch (err) {
      error.value = 'Failed to create session'
      console.error('Create session error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const joinSession = async (sessionId: string) => {
    try {
      loading.value = true
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sessions/${sessionId}/join`, {}, {
        withCredentials: true
      })
      currentSession.value = response.data.data
      // Check if current user is host
      // This will be set when user data is available
    } catch (err) {
      error.value = 'Failed to join session'
      console.error('Join session error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const leaveSession = () => {
    currentSession.value = null
    participants.value = []
    isHost.value = false
  }

  const setSessionVideo = async (sessionId: string, videoData: SetVideoRequest) => {
    try {
      loading.value = true
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sessions/${sessionId}/video`, videoData, {
        withCredentials: true
      })
      if (currentSession.value?.id === sessionId) {
        currentSession.value = response.data.data
      }
    } catch (err) {
      error.value = 'Failed to set video'
      console.error('Set video error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateParticipants = (participantsList: User[]) => {
    participants.value = participantsList
  }

  const setCurrentSession = (session: Session) => {
    currentSession.value = session
  }

  const setIsHost = (host: boolean) => {
    isHost.value = host
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    sessions,
    currentSession,
    participants,
    isHost,
    loading,
    error,
    // Actions
    fetchSessions,
    createSession,
    joinSession,
    leaveSession,
    setSessionVideo,
    updateParticipants,
    setCurrentSession,
    setIsHost,
    clearError
  }
}) 