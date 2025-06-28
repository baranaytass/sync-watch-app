<template>
  <div class="w-full h-full bg-black relative">
    <!-- Loading -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-white z-10">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p class="text-sm">Video yükleniyor...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center text-white p-4 z-10">
      <div class="text-center max-w-md">
        <p class="text-red-400 mb-2">❌ Video yüklenemedi</p>
        <p class="text-sm text-gray-300 mb-4">{{ error }}</p>
        <button 
          @click="retry" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>

    <!-- YouTube Iframe -->
    <iframe
      v-else
      :src="iframeUrl"
      class="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      @load="onIframeLoad"
      @error="onIframeError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

interface Props {
  videoId: string
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
  'video-error': [message: string]
  'time-update': [currentTime: number]
  'duration-change': [duration: number]
}>()

// State
const loading = ref(true)
const error = ref<string | null>(null)
let loadTimeout: number | null = null
let readyTimeout: number | null = null

// Computed iframe URL - parametreler ile düzeltilmiş
const iframeUrl = computed(() => {
  if (!props.videoId) return ''
  
  const params = new URLSearchParams({
    enablejsapi: '1',
    controls: props.showControls ? '1' : '0',
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    fs: '1',
    origin: window.location.origin
  })
  
  return `https://www.youtube.com/embed/${props.videoId}?${params.toString()}`
})

// Handlers
const onIframeLoad = () => {
  console.log('✅ YouTube iframe yüklendi')
  
  // Clear load timeout
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  
  // Set a small delay to ensure iframe is fully ready
  readyTimeout = window.setTimeout(() => {
    loading.value = false
    emit('video-ready')
    
    // Emit duration change after video is ready
    setTimeout(() => {
      emit('duration-change', 180) // 3 dakika default
    }, 500)
  }, 1000)
}

const onIframeError = () => {
  console.error('❌ YouTube iframe yükleme hatası')
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  loading.value = false
  error.value = 'Video yüklenirken bir hata oluştu'
  emit('video-error', 'Video yüklenirken bir hata oluştu')
}

const startLoadTimeout = () => {
  if (loadTimeout) clearTimeout(loadTimeout)
  
  loadTimeout = window.setTimeout(() => {
    console.log('⏰ YouTube iframe yükleme timeout')
    loading.value = false
    error.value = 'Video yükleme zaman aşımı'
    emit('video-error', 'Video yükleme zaman aşımı')
  }, 15000) // 15 saniye timeout (biraz daha uzun)
}

const retry = () => {
  console.log('🔄 YouTube player retry')
  loading.value = true
  error.value = null
  
  // Clear any existing timeouts
  if (loadTimeout) clearTimeout(loadTimeout)
  if (readyTimeout) clearTimeout(readyTimeout)
  
  startLoadTimeout()
}

// Watch for video changes
watch(() => props.videoId, (newVideoId, oldVideoId) => {
  if (newVideoId && newVideoId !== oldVideoId) {
    console.log('🎬 YouTube Player: Video değişti:', newVideoId)
    loading.value = true
    error.value = null
    
    // Clear existing timeouts
    if (loadTimeout) clearTimeout(loadTimeout)
    if (readyTimeout) clearTimeout(readyTimeout)
    
    startLoadTimeout()
  }
}, { immediate: true })

// Expose methods for VideoPlayer compatibility
const syncVideo = (action: 'play' | 'pause' | 'seek', time: number) => {
  console.log(`🎮 YouTube Player: syncVideo ${action} at ${time}s`)
  // Note: iframe API doesn't allow direct control without postMessage
}

const play = () => {
  console.log('▶️ YouTube Player: play')
}

const pause = () => {
  console.log('⏸️ YouTube Player: pause')
}

const seekTo = (time: number) => {
  console.log(`⏭️ YouTube Player: seekTo ${time}s`)
}

const getCurrentTime = (): number => {
  console.log('⏰ YouTube Player: getCurrentTime')
  return 0
}

const getDuration = (): number => {
  console.log('⏱️ YouTube Player: getDuration')
  return 180
}

// Cleanup
onUnmounted(() => {
  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }
  if (readyTimeout) {
    clearTimeout(readyTimeout)
  }
})

defineExpose({
  syncVideo,
  play,
  pause,
  seekTo,
  getCurrentTime,
  getDuration
})
</script> 