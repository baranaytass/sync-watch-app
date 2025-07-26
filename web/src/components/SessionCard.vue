<template>
  <div class="nesbat-card hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
    <div class="p-6">
      <div class="flex flex-col space-y-4">
        <!-- Session Header -->
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-foreground mb-2 line-clamp-2">{{ session.title }}</h3>
          <p v-if="session.description" class="text-sm text-muted-foreground mb-3 line-clamp-2">{{ session.description }}</p>
          
          <!-- Video Info -->
          <div v-if="session.videoTitle" class="flex items-center gap-2 mb-3">
            <div class="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ session.videoTitle }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDuration(session.videoDuration) }}</p>
            </div>
          </div>
          
          <!-- Session Info -->
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{{ participantCount }} {{ $t('common.people') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ formatDate(session.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Join Button -->
        <div class="pt-2 border-t border-border">
          <button
            @click="$emit('join-session', session.id)"
            :disabled="loading"
            class="w-full nesbat-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? $t('session.joining') : $t('session.join') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
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

const { t } = useI18n()

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
    return t('date.justCreated')
  } else if (diffInHours < 24) {
    return t('date.hoursAgo', { hours: diffInHours })
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return t('date.daysAgo', { days: diffInDays })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 
