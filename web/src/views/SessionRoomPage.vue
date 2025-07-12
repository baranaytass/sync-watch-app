<template>
  <!-- Full Height SPA Layout -->
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{ $t('session.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-center">
        <svg class="h-12 w-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">{{ $t('session.notFound') }}</h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ error }}</p>
        <div class="mt-6">
          <router-link
            to="/sessions"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {{ $t('navigation.backToSessions') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Session Room Content -->
    <template v-else-if="currentSession">
      <!-- Header Bar -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div class="px-6 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <button
                @click="handleLeaveSession"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                data-testid="leave-session-button"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Ayrıl
              </button>
              <div class="ml-4">
                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ currentSession.title }}</h1>
                <p v-if="currentSession.description" class="text-sm text-gray-600 dark:text-gray-400">{{ currentSession.description }}</p>
              </div>
            </div>
            
            <!-- Status Info & Theme Toggle -->
            <div class="flex items-center space-x-4">
              <!-- Theme Toggle -->
              <button
                @click="themeStore.toggleTheme()"
                class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                :title="themeStore.isDark() ? 'Açık temaya geç' : 'Koyu temaya geç'"
              >
                <!-- Light Mode Icon -->
                <svg v-if="themeStore.isDark()" class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <!-- Dark Mode Icon -->
                <svg v-else class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              
              <!-- Connection Status -->
              <div class="flex items-center">
                <div 
                  :class="[
                    'h-2 w-2 rounded-full mr-2',
                    websocketConnected ? 'bg-green-400' : 'bg-red-400'
                  ]"
                ></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ websocketConnected ? 'Bağlandı' : 'Bağlantı yok' }}
                </span>
              </div>
              
              <!-- Participants Count -->
              <div class="flex items-center">
                <svg class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ participants.length }} {{ $t('common.people') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Video Section -->
        <div class="flex-1 flex flex-col">
          <!-- Video Player -->
          <div class="flex-1 bg-black relative">
            <VideoPlayer
              v-if="currentSession?.videoId && videoUrl"
              ref="videoPlayerRef"
              :video-url="videoUrl"
              :show-controls="true"
              @video-action="handleVideoAction"
              @video-ready="handleVideoReady"
              @video-error="handleVideoError"
              @duration-change="handleDurationChange"
              @time-update="handleTimeUpdate"
            />
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center text-white">
                <svg class="h-16 w-16 mx-auto mb-4 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
                <p class="text-lg font-medium">{{ $t('video.noVideo') }}</p>
                <p class="text-sm opacity-75">{{ $t('session.info.videoNotSelectedDesc') }}</p>
              </div>
            </div>
          </div>

          <!-- Video Controls & Info -->
          <SessionInfo 
            v-if="currentSession"
            :session="currentSession"
            @set-video="handleSetVideo"
          />
        </div>

        <!-- Sidebar -->
        <div class="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
          <!-- Participants -->
          <ParticipantsList 
            :participants="participants" 
            :host-id="currentSession?.hostId || ''" 
          />
          
          <!-- Chat Area -->
          <div class="flex-1 border-t border-gray-200 dark:border-gray-700">
            <div class="h-full flex items-center justify-center">
              <div class="text-center text-gray-500 dark:text-gray-400">
                <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">{{ $t('chat.comingSoon') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useSessionsStore } from '@/stores/sessions'
import { useAuthStore } from '@/stores/auth'
import { useVideoSyncStore } from '@/stores/videoSync'
import { useThemeStore } from '@/stores/theme'
import ParticipantsList from '@/components/ParticipantsList.vue'
import SessionInfo from '@/components/SessionInfo.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { useWebSocket } from '@/composables/useWebSocket'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const { t } = useI18n()
const sessionsStore = useSessionsStore()
const authStore = useAuthStore()
const videoSyncStore = useVideoSyncStore()
const themeStore = useThemeStore()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)

// VideoPlayer reference
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null)

// WebSocket composable
const { 
  connected: websocketConnected, 
  participants: wsParticipants, 
  connect, 
  sendVideoAction,
  leaveSession: leaveSessionWS
} = useWebSocket(props.id)

// Computed properties
const currentSession = computed(() => sessionsStore.currentSession)
const isHost = computed(() => sessionsStore.isHost)
const participants = computed(() => sessionsStore.participants || [])

// Generate video URL from session data
const videoUrl = computed(() => {
  const session = currentSession.value
  if (!session?.videoId || !session?.videoProvider) return ''
  
  switch (session.videoProvider) {
    case 'youtube':
      return `https://www.youtube.com/watch?v=${session.videoId}`
    default:
      return ''
  }
})

// Methods
const loadSession = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log(`📋 SessionRoom: Loading session ${props.id}`)
    
    // Join session via API (authentication required)
    
    // Fetch session & establish websocket connection
    await sessionsStore.joinSession(props.id)
    await connect()
    
    console.log(`✅ SessionRoom: Session ${props.id} loaded successfully`)
    
  } catch (err: any) {
    console.error('❌ SessionRoom: Failed to load session:', err)
    error.value = err.response?.data?.message || t('session.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

const handleLeaveSession = async () => {
  try {
    console.log(`🚪 SessionRoom: Leaving session ${props.id}`)
    
    // Close WebSocket connection
    await leaveSessionWS()
    
    // Clean up store state
    sessionsStore.leaveSession()
    
    // Navigate back to sessions
    await router.push('/sessions')
    
    console.log(`✅ SessionRoom: Left session ${props.id}`)
  } catch (err) {
    console.error('❌ SessionRoom: Error leaving session:', err)
  }
}

const handleSetVideo = async (videoData: { videoId: string }) => {
  try {
    if (!currentSession.value) return
    
    // Host user sets video via API
    await sessionsStore.setSessionVideo(currentSession.value.id, {
      videoId: videoData.videoId
    })
  } catch (error) {
    console.error('Failed to set video:', error)
  }
}

const handleVideoAction = (action: 'play' | 'pause' | 'seek', time: number) => {
  console.log(`🎬 SessionRoom: Received video action from VideoPlayer - ${action} at ${time}s`)
  
  console.log(`🎬 SessionRoom: USER is sending video action via WebSocket - ${action} at ${time}s`)
  
  // Tüm kullanıcıların video action'ları WebSocket üzerinden diğer kullanıcılara gönderilir
  sendVideoAction(action, time)
  
  // Video sync store'u güncelle
  videoSyncStore.setAction(action)
  videoSyncStore.setCurrentTime(time)
}

const handleVideoReady = () => {
  console.log('Video player is ready')
}

const handleVideoError = (error: string) => {
  console.error('Video player error:', error)
}

const handleDurationChange = (duration: number) => {
  console.log('Video duration:', duration)
  // İleride duration'ı store'da saklayabiliriz
}

const handleTimeUpdate = (currentTime: number) => {
  // İleride real-time time tracking için kullanabiliriz
  // Sadece log level olarak tutuyoruz şimdilik
}

// Watch for authoritative video sync events and forward them to VideoPlayer
watch(
  () => videoSyncStore.lastActionTimestamp,
  (newTimestamp) => {
    if (newTimestamp && videoPlayerRef.value) {
      const action = videoSyncStore.currentAction
      const time = videoSyncStore.currentTime
      
      console.log(`🔄 SessionRoom: Forwarding authoritative sync to VideoPlayer - ${action} at ${time}s`)
      
      // Call syncVideo method on VideoPlayer (authoritative state from server)
      if ('syncVideo' in videoPlayerRef.value) {
        videoPlayerRef.value.syncVideo(action, time)
      }
    }
  },
  { immediate: false }
)

// Lifecycle
onMounted(async () => {
  await loadSession()
})

onUnmounted(() => {
  leaveSessionWS()
})
</script> 