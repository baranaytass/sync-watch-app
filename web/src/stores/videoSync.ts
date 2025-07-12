import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type VideoAction = 'play' | 'pause' | 'seek'

export interface VideoSyncEvent {
  action: VideoAction
  time: number
  timestamp: Date
}

export interface VideoSyncAuthoritativeEvent {
  action: VideoAction
  time: number
  timestamp: Date
  sourceUserId?: string | null
}

export const useVideoSyncStore = defineStore('videoSync', () => {
  // State
  const currentAction = ref<VideoAction>('pause')
  const currentTime = ref(0)
  const lastActionTimestamp = ref<Date | null>(null)
  const loading = ref(false)

  // Getters
  const isPlaying = computed(() => currentAction.value === 'play')

  // Actions
  const syncVideo = (event: VideoSyncEvent) => {
    currentAction.value = event.action
    currentTime.value = event.time
    lastActionTimestamp.value = event.timestamp
  }

  const syncVideoAuthoritative = (event: VideoSyncAuthoritativeEvent) => {
    console.log(`🎯 VideoSync: Applying authoritative state - ${event.action} at ${event.time}s`)
    currentAction.value = event.action
    currentTime.value = event.time
    lastActionTimestamp.value = event.timestamp
    
    // This is the authoritative state from server, always apply it
    // No need to emit any WebSocket messages - this prevents loops
  }

  const calculateCurrentTime = (): number => {
    if (!lastActionTimestamp.value || currentAction.value !== 'play') {
      return currentTime.value
    }

    const now = new Date()
    const elapsedSeconds = (now.getTime() - lastActionTimestamp.value.getTime()) / 1000
    return currentTime.value + elapsedSeconds
  }

  const setCurrentTime = (time: number) => {
    currentTime.value = time
  }

  const setAction = (action: VideoAction) => {
    currentAction.value = action
    lastActionTimestamp.value = new Date()
  }

  const reset = () => {
    currentAction.value = 'pause'
    currentTime.value = 0
    lastActionTimestamp.value = null
  }

  return {
    // State
    currentAction,
    currentTime,
    lastActionTimestamp,
    loading,
    // Getters
    isPlaying,
    // Actions
    syncVideo,
    syncVideoAuthoritative,
    calculateCurrentTime,
    setCurrentTime,
    setAction,
    reset
  }
}) 