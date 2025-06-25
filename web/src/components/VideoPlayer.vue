<template>
  <div class="w-full h-full bg-black">
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center z-10">
      <div class="text-center text-white">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p class="text-sm">Video yükleniyor...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center z-10">
      <div class="text-center text-white">
        <svg class="h-12 w-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- YouTube Player Container -->
    <div
      :id="playerId"
      class="youtube-player-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useVideoSyncStore } from '@/stores/videoSync'

interface Props {
  videoId: string
  isHost?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHost: false
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

// YouTube IFrame API initialization
const initializeYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

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
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        cc_load_policy: 0,
        loop: 0,
        start: 0,
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
  isReady.value = true
  loading.value = false
  
  // Ensure iframe is properly displayed
  const container = document.getElementById(playerId)
  const iframe = container?.querySelector('iframe')
  if (iframe) {
    iframe.style.display = 'block'
    iframe.style.visibility = 'visible'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
  }
  
  emit('video-ready')
}

const onPlayerStateChange = (event: any) => {
  const state = event.data
  
  if (!props.isHost) return
  
  switch (state) {
    case window.YT.PlayerState.PLAYING:
      emit('video-action', 'play', player.value.getCurrentTime())
      break
    case window.YT.PlayerState.PAUSED:
      emit('video-action', 'pause', player.value.getCurrentTime())
      break
  }
}

const onPlayerError = (event: any) => {
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

// Public methods for synchronization
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

// Expose methods
defineExpose({
  syncVideo,
})
</script>

<style scoped>
.youtube-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: black;
  overflow: hidden;
}

.youtube-player-container :deep(iframe) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  background: black !important;
}
</style> 