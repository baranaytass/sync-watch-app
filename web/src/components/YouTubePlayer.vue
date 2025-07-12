<template>
  <div class="w-full h-full bg-black relative">
    <!-- Loading -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-white z-10">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p class="text-sm">{{ $t('video.loading') }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center text-white p-4 z-10">
      <div class="text-center max-w-md">
        <p class="text-red-400 mb-2">❌ {{ $t('video.loadFailed') }}</p>
        <p class="text-sm text-gray-300 mb-4">{{ error }}</p>
        <button 
          @click="retry" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {{ $t('common.retry') }}
        </button>
      </div>
    </div>

    <!-- YouTube Player Container - API kullanımı için div -->
    <div
      :id="`youtube-player-${props.videoId}`"
      class="w-full h-full"
    />
    
    <!-- Fallback iframe - API yüklenemezse -->
    <iframe
      v-if="!playerReady && !loading && !error"
      :key="props.videoId"
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
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'

// YouTube Player API TypeScript tanımları
declare global {
  interface Window {
    YT: {
      Player: any
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface Props {
  videoId: string
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showControls: true
})

const emit = defineEmits<{
  'video-action': [action: 'play' | 'pause' | 'seek', time: number]
  'video-ready': []
  'video-error': [message: string]
  'time-update': [currentTime: number]
  'duration-change': [duration: number]
}>()

// i18n setup
const { t } = useI18n()

// State
const loading = ref(true)
const error = ref<string | null>(null)
let loadTimeout: number | null = null
let player: any = null
let playerReady = false
let isAuthoritativeMode = false  // Allow user actions to be emitted
let programmaticActionCount = 0  // Counter to detect programmatic vs user actions
let programmaticOperationId: string | null = null  // Unique ID for each programmatic operation

// Computed iframe URL - YouTube Player API ile düzeltilmiş
const iframeUrl = computed(() => {
  if (!props.videoId) return ''
  
  // YouTube Player API için enablejsapi: '1' olmalı
  const baseUrl = 'https://www.youtube.com/embed'
  
  const params = new URLSearchParams({
    enablejsapi: '1',  // API erişimi için gerekli
    controls: props.showControls ? '1' : '0',
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    fs: '1'
  })
  
  const finalUrl = `${baseUrl}/${props.videoId}?${params.toString()}`
  
  return finalUrl
})

// YouTube Player API yüklenmesini kontrol et
const loadYouTubeAPI = () => {
  return new Promise<void>((resolve) => {
    // API zaten yüklüyse direkt resolve et
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }
    
    // API yüklenmesini bekle
    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }
    
    // API script'i ekle (eğer yoksa)
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })
}

// YouTube Player initialize et
const initializePlayer = async () => {
  try {
    await loadYouTubeAPI()
    
    // DOM'un render olmasını bekle
    await nextTick()
    
    const playerId = `youtube-player-${props.videoId}`
    const playerElement = document.getElementById(playerId)
    
    if (!playerElement) {
      console.error('Player element bulunamadı:', playerId)
      onPlayerError({ data: 'ELEMENT_NOT_FOUND' })
      return
    }
    
    // Player oluştur
    player = new window.YT.Player(playerId, {
      height: '100%',
      width: '100%',
      videoId: props.videoId,
      playerVars: {
        enablejsapi: 1,
        controls: props.showControls ? 1 : 0,
        autoplay: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    })
  } catch (error) {
    console.error('YouTube Player initialize hatası:', error)
    onPlayerError({ data: 'INITIALIZATION_ERROR' })
  }
}

// Player hazır olduğunda
const onPlayerReady = (event: any) => {
  playerReady = true
  loading.value = false  // Gerçek player hazır olduğunda loading'i kapat
  
  console.log('🎬 YouTube Player: onPlayerReady called - player is ready!')
  console.log('🎬 YouTube Player: Player state constants available:', {
    PLAYING: window.YT?.PlayerState?.PLAYING,
    PAUSED: window.YT?.PlayerState?.PAUSED,
    BUFFERING: window.YT?.PlayerState?.BUFFERING,
    ENDED: window.YT?.PlayerState?.ENDED,
    CUED: window.YT?.PlayerState?.CUED
  })
  
  // Clear load timeout
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  
  emit('video-ready')
  
  // Duration bilgisini al
  setTimeout(() => {
    const duration = player?.getDuration?.() || 180
    emit('duration-change', duration)
    console.log('🎬 YouTube Player: Duration obtained:', duration)
  }, 500)
}

// Player state değiştiğinde
const onPlayerStateChange = (event: any) => {
  const currentTime = player?.getCurrentTime?.() || 0
  emit('time-update', currentTime)
  
  const stateChangeTime = Date.now()
  const stateName = getStateName(event.data)
  console.log(`🎬 YouTube Player: State changed - ${stateName} (${event.data}) (programmatic count: ${programmaticActionCount}, opId: ${programmaticOperationId})`)
  
  // Enhanced cleanup: Clear programmatic flags on FINAL states (PLAYING/PAUSED)
  // These are final user-visible states, so any programmatic operations should be done
  if ((event.data === window.YT.PlayerState.PLAYING || event.data === window.YT.PlayerState.PAUSED) && programmaticOperationId) {
    // Check if this could be the end of a programmatic operation
    const timeSinceOpStart = stateChangeTime - (parseInt(programmaticOperationId.split('_')[0]) || 0)
    
    if (timeSinceOpStart > 500) { // If more than 500ms passed since operation start
      console.log(`🧹 YouTube Player: Auto-clearing stale operation ID ${programmaticOperationId} (${timeSinceOpStart}ms old)`)
      programmaticOperationId = null
      programmaticActionCount = 0
    }
  }
  
  // Server-Authoritative Pattern: Check if this is a programmatic action
  // FIXED: More strict detection - both ID and counter must be clear
  const isProgrammaticAction = programmaticOperationId !== null || programmaticActionCount > 0
  
  if (isProgrammaticAction) {
    console.log(`🔄 YouTube Player: Programmatic action detected (count: ${programmaticActionCount}, opId: ${programmaticOperationId}), skipping emit`)
    
    // More aggressive cleanup: decrement counter AND clear ID if counter reaches 0
    if (programmaticActionCount > 0) {
      programmaticActionCount = Math.max(0, programmaticActionCount - 1)
      console.log(`🔄 YouTube Player: Programmatic count decremented to: ${programmaticActionCount}`)
      
      // Clear operation ID when counter reaches 0
      if (programmaticActionCount === 0) {
        console.log(`🧹 YouTube Player: Clearing operation ID ${programmaticOperationId} (counter reached 0)`)
        programmaticOperationId = null
      }
    }
    
    return
  }
  
  // This is a USER action - emit it to trigger WebSocket message
  console.log(`🎬 YouTube Player: Processing USER action`)
  switch (event.data) {
    case window.YT.PlayerState.PLAYING:
      console.log('🎬 YouTube Player: User clicked PLAY, emitting video-action')
      emit('video-action', 'play', currentTime)
      break
    case window.YT.PlayerState.PAUSED:
      console.log('⏸️ YouTube Player: User clicked PAUSE, emitting video-action')
      emit('video-action', 'pause', currentTime)
      break
    default:
      console.log(`🎬 YouTube Player: Unknown state: ${event.data} (no action taken)`)
  }
}

// Helper function to get state name for logging
const getStateName = (state: number): string => {
  switch (state) {
    case window.YT?.PlayerState?.UNSTARTED: return 'UNSTARTED'
    case window.YT?.PlayerState?.ENDED: return 'ENDED'
    case window.YT?.PlayerState?.PLAYING: return 'PLAYING'
    case window.YT?.PlayerState?.PAUSED: return 'PAUSED'
    case window.YT?.PlayerState?.BUFFERING: return 'BUFFERING'
    case window.YT?.PlayerState?.CUED: return 'CUED'
    default: return `UNKNOWN(${state})`
  }
}

// Player hata verdiğinde
const onPlayerError = (event: any) => {
  const errorCode = event.data || 'UNKNOWN_ERROR'
  let errorMessage = t('video.loadFailed')
  
  switch (errorCode) {
    case 2:
      errorMessage = t('video.errors.invalidVideoId')
      break
    case 5:
      errorMessage = t('video.errors.html5Error')
      break
    case 100:
      errorMessage = t('video.errors.videoNotFound')
      break
    case 101:
    case 150:
      errorMessage = t('video.errors.embedNotAllowed')
      break
    default:
      errorMessage = `${t('video.errors.unknownError')} (${t('common.error')}: ${errorCode})`
  }
  
  loading.value = false
  error.value = errorMessage
  
  if (loadTimeout) {
    clearTimeout(loadTimeout)
    loadTimeout = null
  }
  
  emit('video-error', errorMessage)
}

// Handlers - iframe fallback için
const onIframeLoad = () => {
  // YouTube API kullanıyorsak iframe load'u önemsemiyoruz
  // API yoksa fallback olarak 2 saniye bekle
  if (!window.YT || !window.YT.Player) {
    setTimeout(() => {
      if (loading.value) {  // Hala loading'se
        loading.value = false
        emit('video-ready')
        setTimeout(() => {
          emit('duration-change', 180)
        }, 500)
      }
    }, 2000)
  }
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
    if (loading.value) {  // Hala loading'se timeout yap
      loading.value = false
      error.value = 'Video yükleme zaman aşımı'
      emit('video-error', 'Video yükleme zaman aşımı')
    }
  }, 20000) // 20 saniye timeout (API yüklenmesi için daha uzun)
}

const retry = () => {
  loading.value = true
  error.value = null
  playerReady = false
  
  // Clear any existing timeouts
  if (loadTimeout) clearTimeout(loadTimeout)
  
  // Player'ı yeniden initialize et
  if (player) {
    player.destroy?.()
    player = null
  }
  
  startLoadTimeout()
  initializePlayer()
}

// Watch for video changes - API ile senkron
watch(() => props.videoId, (newVideoId, oldVideoId) => {
  if (newVideoId && newVideoId !== oldVideoId) {
    loading.value = true
    error.value = null
    playerReady = false
    
    // Clear existing timeouts
    if (loadTimeout) clearTimeout(loadTimeout)
    
    // Eski player'ı temizle
    if (player) {
      player.destroy?.()
      player = null
    }
    
    // Yeni player'ı initialize et
    startLoadTimeout()
    initializePlayer()
  }
}, { immediate: true })

// Expose methods - YouTube Player API ile gerçek kontrol
const syncVideo = (action: 'play' | 'pause' | 'seek', time: number) => {
  if (!player || !playerReady) {
    console.warn('🚫 YouTube Player: Sync çağrıldı ama player hazır değil')
    return
  }
  
  try {
    console.log(`🔄 YouTube Player: Sync video - ${action} at ${time}s`)
    
    // Generate unique operation ID and set counter
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    programmaticOperationId = operationId
    programmaticActionCount += 2  // Reduced counter for cleaner operations
    console.log(`🔄 YouTube Player: Programmatic operation started (ID: ${operationId}, count: ${programmaticActionCount})`)
    
    // Auto-reset counter after a shorter delay as backup
    setTimeout(() => {
      if (programmaticOperationId === operationId) {
        console.log(`🔄 YouTube Player: Timeout cleanup for operation (ID: ${operationId}): clearing programmatic flags`)
        programmaticActionCount = 0
        programmaticOperationId = null
      }
    }, 1500)  // Reduced to 1.5 seconds for faster cleanup
    
    // Player state'ini kontrol et
    const playerState = player.getPlayerState()
    const stateName = getStateName(playerState)
    console.log(`📊 YouTube Player: Current state: ${stateName} (${playerState})`)
    
    switch (action) {
      case 'play':
        if (playerState === window.YT.PlayerState.UNSTARTED || playerState === -1) {
          console.log(`🎬 YouTube Player: Video UNSTARTED, loading and playing from ${time}s`)
          // Video henüz hiç başlatılmamış, loadVideoById kullan (seek + play combined)
          player.loadVideoById(props.videoId, time)
          console.log(`▶️ YouTube Player: Loading and playing from ${time}s`)
        } else {
          // Video daha önce başlatılmış - check if seek needed
          const currentTime = player.getCurrentTime() || 0
          const timeDiff = Math.abs(currentTime - time)
          
          if (timeDiff > 2) {
            // Significant time difference, seek first then play
            console.log(`🎯 YouTube Player: Seeking to ${time}s (diff: ${timeDiff.toFixed(2)}s) then playing`)
            player.seekTo(time, true)
            setTimeout(() => {
              player.playVideo()
              console.log(`▶️ YouTube Player: Play after seek to ${time}s`)
            }, 100)
          } else {
            // Minor difference or already at correct position, just play
            console.log(`▶️ YouTube Player: Direct play (already near ${time}s)`)
            player.playVideo()
          }
        }
        break
        
      case 'pause':
        if (playerState === window.YT.PlayerState.UNSTARTED || playerState === -1) {
          console.log(`⏸️ YouTube Player: Video UNSTARTED, cuing to pause position ${time}s`)
          // Video henüz hiç başlatılmamış, cue et
          player.cueVideoById(props.videoId, time)
          console.log(`⏸️ YouTube Player: Cued to ${time}s (paused state)`)
        } else {
          // FIXED: Server-authoritative pattern'da pause action doğru zamanda geliyor
          // Gereksiz seek işlemi buffering'e neden oluyor, sadece pause yapalım
          console.log(`⏸️ YouTube Player: Clean pause (server-authoritative time: ${time}s)`)
          player.pauseVideo()
          console.log(`⏸️ YouTube Player: Video paused cleanly`)
          
          // Optional: Only seek if there's a significant time difference
          const currentTime = player.getCurrentTime() || 0
          const timeDiff = Math.abs(currentTime - time)
          
          if (timeDiff > 2) {
            console.log(`🎯 YouTube Player: Correcting time difference: ${timeDiff.toFixed(2)}s`)
            // Use a gentle seek after pause to avoid buffering
            setTimeout(() => {
              player.seekTo(time, false) // Use allowSeekAhead=false for gentler seek
              console.log(`🎯 YouTube Player: Gentle time correction to ${time}s`)
            }, 100)
          }
        }
        break
        
      case 'seek':
        console.log(`🎯 YouTube Player: Seek to ${time}s`)
        if (playerState === window.YT.PlayerState.UNSTARTED || playerState === -1) {
          console.log(`🎯 YouTube Player: Video UNSTARTED, cuing to seek position`)
          player.cueVideoById(props.videoId, time)
        } else {
          player.seekTo(time, true)
        }
        break
    }
  } catch (error) {
    console.error('Video sync hatası:', error)
  }
}

const play = () => {
  if (player && playerReady) {
    console.log('🎯 YouTube Player: Direct play call (authoritative)')
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_play`
    programmaticOperationId = operationId
    programmaticActionCount += 1
    console.log(`🔄 YouTube Player: Direct play operation started (ID: ${operationId}, count: ${programmaticActionCount})`)
    // Auto-reset counter after a delay as backup
    setTimeout(() => {
      if (programmaticOperationId === operationId) {
        console.log(`🔄 YouTube Player: Timeout cleanup for play operation (ID: ${operationId})`)
        programmaticActionCount = 0
        programmaticOperationId = null
      }
    }, 1000)
    player.playVideo()
  }
}

const pause = () => {
  if (player && playerReady) {
    console.log('🎯 YouTube Player: Direct pause call (authoritative)')
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_pause`
    programmaticOperationId = operationId
    programmaticActionCount += 1
    console.log(`🔄 YouTube Player: Direct pause operation started (ID: ${operationId}, count: ${programmaticActionCount})`)
    // Auto-reset counter after a delay as backup
    setTimeout(() => {
      if (programmaticOperationId === operationId) {
        console.log(`🔄 YouTube Player: Timeout cleanup for pause operation (ID: ${operationId})`)
        programmaticActionCount = 0
        programmaticOperationId = null
      }
    }, 1000)
    player.pauseVideo()
  }
}

const seekTo = (time: number) => {
  if (player && playerReady) {
    console.log('🎯 YouTube Player: Direct seek call (authoritative)')
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_seek`
    programmaticOperationId = operationId
    programmaticActionCount += 1
    console.log(`🔄 YouTube Player: Direct seek operation started (ID: ${operationId}, count: ${programmaticActionCount})`)
    // Auto-reset counter after a delay as backup
    setTimeout(() => {
      if (programmaticOperationId === operationId) {
        console.log(`🔄 YouTube Player: Timeout cleanup for seek operation (ID: ${operationId})`)
        programmaticActionCount = 0
        programmaticOperationId = null
      }
    }, 1000)
    player.seekTo(time, true)
  }
}

const getCurrentTime = (): number => {
  if (player && playerReady) {
    return player.getCurrentTime() || 0
  }
  return 0
}

const getDuration = (): number => {
  if (player && playerReady) {
    return player.getDuration() || 0
  }
  return 180
}

// Cleanup
onUnmounted(() => {
  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }
  if (player) {
    player.destroy?.()
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