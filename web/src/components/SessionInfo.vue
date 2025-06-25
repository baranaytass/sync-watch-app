<template>
  <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
    <!-- Session Details -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">Oturum Bilgileri</h3>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatDate(session.createdAt) }}
        </div>
      </div>
      
      <!-- Current Video Info -->
      <div v-if="session.videoId && session.videoTitle" class="mb-3">
        <div class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded">
            <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ session.videoTitle }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDuration(session.videoDuration) }} • 
              Son eylem: {{ formatLastAction(session.lastAction) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Video URL Input (Only for host) -->
    <div v-if="isHost" class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          YouTube Video URL
        </label>
        <span class="text-xs text-gray-500 dark:text-gray-400">Sadece host ayarlayabilir</span>  
      </div>
      
      <div class="flex gap-2">
        <input
          v-model="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          class="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          :class="{ 'border-red-300 dark:border-red-500': urlError }"
        />
        <button
          @click="handleSetVideo"
          :disabled="loading || !videoUrl.trim()"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Ayarlanıyor...' : 'Ayarla' }}
        </button>
      </div>
      
      <p v-if="urlError" class="text-sm text-red-600 dark:text-red-400">{{ urlError }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        YouTube video URL'sini yapıştırın. Video tüm katılımcılar için senkronize edilecek.
      </p>
    </div>

    <!-- Not Host Message -->
    <div v-else-if="!session.videoId" class="text-center py-4">
      <svg class="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <p class="text-sm text-gray-500 dark:text-gray-400">Host tarafından video seçilmesi bekleniyor</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Session } from '@/stores/sessions'

interface Props {
  session: Session
  isHost: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'set-video': [data: { videoId: string }]
}>()

// Reactive state
const videoUrl = ref('')
const loading = ref(false)
const urlError = ref<string | null>(null)

// Methods
const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const handleSetVideo = async () => {
  try {
    loading.value = true
    urlError.value = null
    
    const videoId = extractVideoId(videoUrl.value)
    if (!videoId) {
      urlError.value = 'Geçerli bir YouTube URL\'si girin'
      return
    }
    
    emit('set-video', { videoId })
    videoUrl.value = ''
    
  } catch (error) {
    console.error('Failed to set video:', error)
    urlError.value = 'Video ayarlanırken bir hata oluştu'
  } finally {
    loading.value = false
  }
}

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) {
    return 'Tarih yok'
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Geçersiz tarih'
  }
  
  return dateObj.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatLastAction = (action: string): string => {
  switch (action) {
    case 'play':
      return 'Oynat'
    case 'pause':
      return 'Duraklat'
    case 'seek':
      return 'Atlama'
    default:
      return action
  }
}
</script> 