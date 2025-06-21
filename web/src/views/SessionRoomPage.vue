<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Oturum yükleniyor...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="h-12 w-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Oturum Bulunamadı</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
        <div class="mt-6">
          <router-link
            to="/sessions"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Oturumlara Dön
          </router-link>
        </div>
      </div>
    </div>

    <!-- Session Room Content -->
    <div v-else-if="currentSession" class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <button
                @click="handleLeaveSession"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Oturumdan Ayrıl
              </button>
              <div class="ml-4">
                <h1 class="text-lg font-semibold text-gray-900">{{ currentSession.title }}</h1>
                <p v-if="currentSession.description" class="text-sm text-gray-500">{{ currentSession.description }}</p>
              </div>
            </div>
            
            <!-- Connection Status -->
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <div 
                  :class="[
                    'h-2 w-2 rounded-full mr-2',
                    websocketConnected ? 'bg-green-400' : 'bg-red-400'
                  ]"
                ></div>
                <span class="text-sm text-gray-500">
                  {{ websocketConnected ? 'Bağlandı' : 'Bağlantı yok' }}
                </span>
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-sm text-gray-500">{{ participants.length }} kişi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex h-screen">
        <!-- Left Side - Video and Session Info -->
        <div class="flex-1 flex flex-col">
          <!-- Video Area -->
          <div class="flex-1 bg-black">
            <div v-if="currentSession.videoId" class="h-full flex items-center justify-center">
              <div class="text-center text-white">
                <svg class="h-16 w-16 mx-auto mb-4 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="black"/>
                </svg>
                <p class="text-lg font-medium">{{ currentSession.videoTitle }}</p>
                <p class="text-sm opacity-75">Video player will be here</p>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center">
              <div class="text-center text-white">
                <svg class="h-16 w-16 mx-auto mb-4 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p class="text-lg font-medium">Video Henüz Seçilmedi</p>
                <p class="text-sm opacity-75">Host tarafından video seçilmesi bekleniyor</p>
              </div>
            </div>
          </div>

          <!-- Session Info Panel -->
          <SessionInfo 
            :session="currentSession"
            :is-host="isHost"
            @set-video="handleSetVideo"
          />
        </div>

        <!-- Right Side - Chat and Participants -->
        <div class="w-96 bg-white border-l flex flex-col">
          <!-- Participants -->
          <ParticipantsList :participants="participants" :host-id="currentSession.hostId" />
          
          <!-- Chat will be here -->
          <div class="flex-1 border-t">
            <div class="h-full flex items-center justify-center">
              <div class="text-center text-gray-500">
                <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">Chat özelliği yakında</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import { useAuthStore } from '@/stores/auth'
import ParticipantsList from '@/components/ParticipantsList.vue'
import SessionInfo from '@/components/SessionInfo.vue'
import { useWebSocket } from '@/composables/useWebSocket'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const sessionsStore = useSessionsStore()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)

// WebSocket composable
const { 
  connected: websocketConnected, 
  participants, 
  connect, 
  disconnect 
} = useWebSocket(props.id)

// Computed properties
const currentSession = computed(() => sessionsStore.currentSession)
const isHost = computed(() => 
  currentSession.value && authStore.user?.id === currentSession.value.hostId
)

// Methods
const loadSession = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Join session via API
    await sessionsStore.joinSession(props.id)
    
    // Connect to WebSocket
    await connect()
    
  } catch (err: any) {
    console.error('Failed to load session:', err)
    error.value = err.response?.data?.message || 'Oturum yüklenemedi'
  } finally {
    loading.value = false
  }
}

const handleLeaveSession = async () => {
  try {
    // Disconnect from WebSocket
    disconnect()
    
    // Leave session
    sessionsStore.leaveSession()
    
    // Navigate back to sessions
    router.push('/sessions')
  } catch (err) {
    console.error('Failed to leave session:', err)
    // Still navigate away even if there's an error
    router.push('/sessions')
  }
}

const handleSetVideo = async (videoData: { videoId: string }) => {
  try {
    if (!currentSession.value) return
    
    await sessionsStore.setSessionVideo(currentSession.value.id, {
      videoProvider: 'youtube',
      videoId: videoData.videoId
    })
  } catch (error) {
    console.error('Failed to set video:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await loadSession()
})

onUnmounted(() => {
  disconnect()
})
</script> 