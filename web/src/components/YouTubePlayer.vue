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

// State
const loading = ref(true)
const error = ref<string | null>(null)
let loadTimeout: number | null = null
let player: any = null
let playerReady = false
let programmaticAction = false  // Loop önleme flag'i

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
  }, 500)
}

// Player state değiştiğinde
const onPlayerStateChange = (event: any) => {
  const currentTime = player?.getCurrentTime?.() || 0
  emit('time-update', currentTime)
  
  console.log(`🎬 YouTube Player: State changed - event.data: ${event.data}`)
  
  // Programmatic action ise emit etme (loop önleme)
  if (programmaticAction) {
    console.log('🔄 YouTube Player: Programmatic action detected, skipping emit')
    programmaticAction = false  // Flag'i reset et
    return
  }
  
  // User action'larını yakala ve WebSocket'e gönder (tüm kullanıcılar için)
  console.log(`🎬 YouTube Player: Processing state change for USER`)
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
      console.log(`🎬 YouTube Player: Unknown state: ${event.data}`)
  }
}

// Player hata verdiğinde
const onPlayerError = (event: any) => {
  const errorCode = event.data || 'UNKNOWN_ERROR'
  let errorMessage = 'Video yüklenirken bir hata oluştu'
  
  switch (errorCode) {
    case 2:
      errorMessage = 'Geçersiz video ID'
      break
    case 5:
      errorMessage = 'HTML5 player hatası'
      break
    case 100:
      errorMessage = 'Video bulunamadı'
      break
    case 101:
    case 150:
      errorMessage = 'Video gömme izni yok'
      break
    default:
      errorMessage = `Video hatası (Kod: ${errorCode})`
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
    
    // Bu bir programmatic action olduğunu işaretle (loop önleme)
    programmaticAction = true
    
    // Player state'ini kontrol et
    const playerState = player.getPlayerState()
    console.log(`📊 YouTube Player: Current state: ${playerState}`)
    
    switch (action) {
      case 'play':
        // Önce video'yu doğru zamana seek et, sonra başlat
        console.log(`🎯 YouTube Player: Seeking to ${time}s before play`)
        player.seekTo(time, true)
        
        // Player state'ine göre farklı stratejiler
        if (playerState === window.YT.PlayerState.UNSTARTED || playerState === -1) {
          console.log(`🎬 YouTube Player: Video UNSTARTED, cuing first then playing`)
          // Video henüz hiç başlatılmamış, önce cue et
          player.cueVideoById(props.videoId, time)
          setTimeout(() => {
            programmaticAction = true  // Timeout içinde de flag'i set et
            player.playVideo()
            console.log(`▶️ YouTube Player: Video started at ${time}s (after cue)`)
          }, 200)
        } else {
          // Video daha önce başlatılmış, normal play
          setTimeout(() => {
            programmaticAction = true  // Timeout içinde de flag'i set et
            player.playVideo()
            console.log(`▶️ YouTube Player: Video started at ${time}s`)
          }, 100)
        }
        break
        
      case 'pause':
        // Önce video'yu doğru zamana seek et, sonra durdur
        console.log(`🎯 YouTube Player: Seeking to ${time}s before pause`)
        player.seekTo(time, true)
        
        if (playerState === window.YT.PlayerState.UNSTARTED || playerState === -1) {
          console.log(`⏸️ YouTube Player: Video UNSTARTED, cuing to pause position`)
          // Video henüz hiç başlatılmamış, sadece cue et (pause pozisyonunda)
          player.cueVideoById(props.videoId, time)
          console.log(`⏸️ YouTube Player: Video cued at ${time}s (paused state)`)
        } else {
          // Video daha önce başlatılmış, normal pause
          setTimeout(() => {
            programmaticAction = true  // Timeout içinde de flag'i set et
            player.pauseVideo()
            console.log(`⏸️ YouTube Player: Video paused at ${time}s`)
          }, 100)
        }
        break
        
      case 'seek':
        console.log(`🎯 YouTube Player: Seeking to ${time}s`)
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
    programmaticAction = true  // Loop önleme
    player.playVideo()
  }
}

const pause = () => {
  if (player && playerReady) {
    programmaticAction = true  // Loop önleme
    player.pauseVideo()
  }
}

const seekTo = (time: number) => {
  if (player && playerReady) {
    programmaticAction = true  // Loop önleme
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