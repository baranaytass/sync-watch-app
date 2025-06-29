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

    <!-- YouTube Iframe - DENEME #4: Key ile force reload -->
    <iframe
      :key="props.videoId"
      :src="iframeUrl"
      class="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      @load="onIframeLoad"
      @error="onIframeError"
    />
    
    <!-- Loading overlay -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-white z-10">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p class="text-sm">Video yükleniyor...</p>
      </div>
    </div>
    
    <!-- Error overlay -->
    <div v-if="error" class="absolute inset-0 flex items-center justify-center text-white p-4 z-20">
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
  

  
  // Try different YouTube domains if normal one fails
  const isLocalhost = window.location.hostname === 'localhost'
  const currentDomain = isLocalhost ? 'localhost' : window.location.hostname
  
  // DENEME #2: Regular youtube.com domain
  const baseUrl = 'https://www.youtube.com/embed'
  
  const params = new URLSearchParams({
    enablejsapi: '0',
    controls: props.showControls ? '1' : '0',
    autoplay: '0',
    rel: '0'
  })
  
  const finalUrl = `${baseUrl}/${props.videoId}?${params.toString()}`
  
  return finalUrl
})

// Handlers
const onIframeLoad = () => {
  
  // Clear load timeout
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  
  // Daha uzun delay - YouTube Player'ın tamamen yüklenmesi için
  readyTimeout = window.setTimeout(() => {
    loading.value = false
    emit('video-ready')
    
    // Emit duration change after video is ready
    setTimeout(() => {
      emit('duration-change', 180) // 3 dakika default
    }, 500)
  }, 2500) // 1 saniye → 2.5 saniye artırdık
}

const onIframeError = () => {
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
    loading.value = false
    error.value = 'Video yükleme zaman aşımı'
    emit('video-error', 'Video yükleme zaman aşımı')
  }, 15000)
}

const retry = () => {
  loading.value = true
  error.value = null
  
  // Clear any existing timeouts
  if (loadTimeout) clearTimeout(loadTimeout)
  if (readyTimeout) clearTimeout(readyTimeout)
  
  startLoadTimeout()
}

// Watch for video changes - DENEME #4: Key ile iframe reset olacak
watch(() => props.videoId, (newVideoId, oldVideoId) => {
  if (newVideoId && newVideoId !== oldVideoId) {
    loading.value = true
    error.value = null
    
    // Clear existing timeouts
    if (loadTimeout) clearTimeout(loadTimeout)
    if (readyTimeout) clearTimeout(readyTimeout)
    
    // Start timeout for new video
    startLoadTimeout()
  }
}, { immediate: true })

// Expose methods for VideoPlayer compatibility
const syncVideo = (action: 'play' | 'pause' | 'seek', time: number) => {
  // Note: iframe API doesn't allow direct control without postMessage
}

const play = () => {
  // YouTube iframe play control
}

const pause = () => {
  // YouTube iframe pause control
}

const seekTo = (time: number) => {
  // YouTube iframe seek control
}

const getCurrentTime = (): number => {
  return 0
}

const getDuration = (): number => {
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