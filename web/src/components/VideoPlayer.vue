<template>
  <div class="relative w-full h-full bg-black">
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center text-white">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p class="text-lg">Video yükleniyor...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center text-white">
        <svg class="h-16 w-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium mb-2">Video Yüklenemedi</p>
        <p class="text-sm opacity-75">{{ error }}</p>
      </div>
    </div>

    <!-- YouTube Player -->
    <div
      v-show="!loading && !error"
      :id="playerId"
      class="w-full h-full min-h-[400px]"
      style="position: relative; background: black; overflow: hidden;"
    ></div>

    <!-- Video Controls Overlay -->
    <div v-if="showControls && !loading && !error" class="absolute bottom-4 left-4 right-4">
      <div class="bg-black bg-opacity-50 rounded-lg p-3">
        <div class="flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <button
              @click="togglePlayPause"
              :disabled="!isReady"
              class="flex items-center justify-center w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg v-if="isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <svg v-else class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            
            <span class="text-sm">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
          </div>

          <div class="text-sm opacity-75">
            {{ isHost ? 'Host kontrolü' : 'Otomatik senkronizasyon' }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-3">
          <div class="relative h-1 bg-white bg-opacity-20 rounded-full">
            <div 
              class="absolute left-0 top-0 h-full bg-red-500 rounded-full transition-all duration-300"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useVideoSyncStore } from '@/stores/videoSync'

interface Props {
  videoId: string
  isHost?: boolean
  autoPlay?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHost: false,
  autoPlay: false,
  showControls: true
})

const emit = defineEmits<{
  'video-action': [action: 'play' | 'pause' | 'seek', time: number]
  'video-ready': []
  'video-error': [error: string]
}>()

// Stores
const videoSyncStore = useVideoSyncStore()

// State
const playerId = `youtube-player-${Math.random().toString(36).substr(2, 9)}`
const loading = ref(true)
const error = ref<string | null>(null)
const isReady = ref(false)
const player = ref<any>(null)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)

// Computed
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// YouTube IFrame API
let playerReadyPromise: Promise<void>

const initializeYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Set global callback
    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })
}

const createPlayer = async () => {
  try {
    loading.value = true
    error.value = null

    await initializeYouTubeAPI()
    await nextTick()

    player.value = new window.YT.Player(playerId, {
      height: '100%',
      width: '100%',
      videoId: props.videoId,
      playerVars: {
        autoplay: props.autoPlay ? 1 : 0,
        controls: 0, // Hide default controls
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        playsinline: 1,
        origin: window.location.origin,
        enablejsapi: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    })
  } catch (err) {
    console.error('Failed to create YouTube player:', err)
    error.value = 'Video player oluşturulamadı'
    loading.value = false
  }
}

const onPlayerReady = (event: any) => {
  console.log('YouTube player ready')
  isReady.value = true
  loading.value = false
  duration.value = event.target.getDuration()
  
  // Start time tracking
  startTimeTracking()
  
  emit('video-ready')
}

const onPlayerStateChange = (event: any) => {
  const state = event.data
  
  switch (state) {
    case window.YT.PlayerState.PLAYING:
      isPlaying.value = true
      if (props.isHost) {
        emit('video-action', 'play', player.value.getCurrentTime())
      }
      break
      
    case window.YT.PlayerState.PAUSED:
      isPlaying.value = false
      if (props.isHost) {
        emit('video-action', 'pause', player.value.getCurrentTime())
      }
      break
      
    case window.YT.PlayerState.ENDED:
      isPlaying.value = false
      break
  }
}

const onPlayerError = (event: any) => {
  console.error('YouTube player error:', event.data)
  const errorMessages = {
    2: 'Geçersiz video ID',
    5: 'HTML5 player hatası',
    100: 'Video bulunamadı veya kaldırıldı',
    101: 'Video sahibi tarafından gömme devre dışı bırakıldı',
    150: 'Video sahibi tarafından gömme devre dışı bırakıldı'
  }
  
  error.value = errorMessages[event.data as keyof typeof errorMessages] || 'Video oynatılamadı'
  loading.value = false
  emit('video-error', error.value)
}

// Time tracking
let timeTrackingInterval: number | null = null

const startTimeTracking = () => {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval)
  }
  
  timeTrackingInterval = setInterval(() => {
    if (player.value && isReady.value) {
      currentTime.value = player.value.getCurrentTime()
    }
  }, 1000)
}

const stopTimeTracking = () => {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval)
    timeTrackingInterval = null
  }
}

// Public methods
const togglePlayPause = () => {
  if (!player.value || !isReady.value) return
  
  if (isPlaying.value) {
    player.value.pauseVideo()
  } else {
    player.value.playVideo()
  }
}

const seekTo = (time: number) => {
  if (!player.value || !isReady.value) return
  player.value.seekTo(time)
}

const syncVideo = (action: 'play' | 'pause' | 'seek', time: number) => {
  if (!player.value || !isReady.value) return
  
  switch (action) {
    case 'play':
      player.value.seekTo(time)
      player.value.playVideo()
      break
    case 'pause':
      player.value.seekTo(time)
      player.value.pauseVideo()
      break
    case 'seek':
      player.value.seekTo(time)
      break
  }
}

// Utility functions
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Watch for video sync events (for non-host users)
watch(
  () => videoSyncStore.currentAction,
  () => {
    if (!props.isHost && videoSyncStore.lastActionTimestamp) {
      const calculatedTime = videoSyncStore.calculateCurrentTime()
      syncVideo(videoSyncStore.currentAction, calculatedTime)
    }
  }
)

// Lifecycle
onMounted(() => {
  createPlayer()
})

onUnmounted(() => {
  stopTimeTracking()
  if (player.value && typeof player.value.destroy === 'function') {
    player.value.destroy()
  }
})

// Watch for video ID changes
watch(
  () => props.videoId,
  (newVideoId) => {
    if (newVideoId && player.value && isReady.value) {
      player.value.loadVideoById(newVideoId)
    }
  }
)

// Expose public methods
defineExpose({
  seekTo,
  syncVideo,
  togglePlayPause,
})
</script>

<style scoped>
/* Custom styles for YouTube player container */
</style> 