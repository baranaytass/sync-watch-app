<template>
  <div class="w-full h-full bg-black dark:bg-gray-900">
    <!-- Provider specific players -->
    <YouTubePlayer
      v-if="provider === 'youtube'"
      :video-id="videoId"
      :is-host="isHost"
      :show-controls="showControls"
      @video-action="handleVideoAction"
      @video-ready="$emit('video-ready')"
      @video-error="$emit('video-error', $event)"
      @duration-change="$emit('duration-change', $event)"
      @time-update="$emit('time-update', $event)"
      ref="playerRef"
    />
    
    <!-- Placeholder for other providers -->
    <div v-else-if="provider === 'vimeo'" class="w-full h-full flex items-center justify-center text-white">
      <div class="text-center">
        <p class="text-lg mb-2">Vimeo Player</p>
        <p class="text-sm text-gray-400">Henüz desteklenmiyor</p>
      </div>
    </div>
    
    <!-- Unknown provider -->
    <div v-else class="w-full h-full flex items-center justify-center text-white">
      <div class="text-center">
        <svg class="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg mb-2">Desteklenmeyen Video Sağlayıcısı</p>
        <p class="text-sm text-gray-400">{{ provider }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import YouTubePlayer from './YouTubePlayer.vue'

interface Props {
  videoUrl: string
  isHost?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHost: false,
  showControls: true
})

const emit = defineEmits<{
  'video-action': [action: 'play' | 'pause' | 'seek', time: number]
  'video-ready': []
  'video-error': [error: string]
  'duration-change': [duration: number]
  'time-update': [currentTime: number]
}>()

// Player reference
const playerRef = ref<InstanceType<typeof YouTubePlayer> | null>(null)

// Event handlers
const handleVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
  console.log(`🎬 VideoPlayer: Received video action from YouTubePlayer - ${action} at ${time}s`)
  console.log(`🎬 VideoPlayer: Forwarding video action to parent - ${action} at ${time}s`)
  emit('video-action', action, time)
}

// Extract provider and video ID from URL - FIX: Case-sensitive video ID
const providerInfo = computed(() => {
  const originalUrl = props.videoUrl
  const urlForMatching = props.videoUrl.toLowerCase() // Sadece domain check için
  

  
  // YouTube detection
  if (urlForMatching.includes('youtube.com') || urlForMatching.includes('youtu.be')) {
    let id = ''
    
    // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    const youtubeMatch = originalUrl.match(/[?&]v=([^&]+)/) // Original URL kullan!
    if (youtubeMatch) {
      id = youtubeMatch[1]
    }
    
    // Short YouTube URL: https://youtu.be/VIDEO_ID
    const shortMatch = originalUrl.match(/youtu\.be\/([^?&]+)/) // Original URL kullan!
    if (shortMatch) {
      id = shortMatch[1]
    }
    
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = originalUrl.match(/\/embed\/([^?&]+)/) // Original URL kullan!
    if (embedMatch) {
      id = embedMatch[1]
    }
    

    return { provider: 'youtube', videoId: id }
  }
  
  // Vimeo detection
  if (urlForMatching.includes('vimeo.com')) {
    const vimeoMatch = originalUrl.match(/vimeo\.com\/(?:.*\/)?(\d+)/) // Original URL kullan!
    const id = vimeoMatch ? vimeoMatch[1] : ''
    return { provider: 'vimeo', videoId: id }
  }
  
  // Unknown provider
  return { provider: 'unknown', videoId: '' }
})

const provider = computed(() => providerInfo.value.provider)
const videoId = computed(() => providerInfo.value.videoId)

// Expose player methods
const syncVideo = (action: 'play' | 'pause' | 'seek', time: number) => {
  if (playerRef.value && 'syncVideo' in playerRef.value) {
    playerRef.value.syncVideo(action, time)
  }
}

const play = () => {
  if (playerRef.value && 'play' in playerRef.value) {
    playerRef.value.play()
  }
}

const pause = () => {
  if (playerRef.value && 'pause' in playerRef.value) {
    playerRef.value.pause()
  }
}

const seekTo = (time: number) => {
  if (playerRef.value && 'seekTo' in playerRef.value) {
    playerRef.value.seekTo(time)
  }
}

const getCurrentTime = (): number => {
  if (playerRef.value && 'getCurrentTime' in playerRef.value) {
    return playerRef.value.getCurrentTime()
  }
  return 0
}

const getDuration = (): number => {
  if (playerRef.value && 'getDuration' in playerRef.value) {
    return playerRef.value.getDuration()
  }
  return 0
}

defineExpose({
  syncVideo,
  play,
  pause,
  seekTo,
  getCurrentTime,
  getDuration,
  provider,
  videoId
})
</script>

<style scoped>
/* Player specific styles handled by individual player components */
</style> 