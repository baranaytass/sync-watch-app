<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div class="p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ session.title }}</h3>
          <p v-if="session.description" class="text-sm text-gray-600 mb-3">{{ session.description }}</p>
          
          <!-- Video Info -->
          <div v-if="session.videoTitle" class="flex items-center gap-2 mb-3">
            <div class="flex items-center justify-center w-8 h-8 bg-red-100 rounded">
              <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ session.videoTitle }}</p>
              <p class="text-xs text-gray-500">{{ formatDuration(session.videoDuration) }}</p>
            </div>
          </div>
          
          <!-- Session Info -->
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{{ participantCount }} katılımcı</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ formatDate(session.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Join Button -->
        <button
          @click="$emit('join-session', session.id)"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Katılınıyor...' : 'Katıl' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Session } from '@/stores/sessions'

interface Props {
  session: Session
  participantCount?: number
  loading?: boolean
}

defineProps<Props>()
defineEmits<{
  'join-session': [sessionId: string]
}>()

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const sessionDate = new Date(date)
  const diffInHours = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Az önce oluşturuldu'
  } else if (diffInHours < 24) {
    return `${diffInHours} saat önce`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} gün önce`
  }
}
</script> 