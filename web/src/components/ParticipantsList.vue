<template>
  <div class="bg-white dark:bg-gray-800 transition-colors duration-300">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Katılımcılar ({{ participants.length }})
        </h3>
        <div class="flex items-center">
          <div class="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ onlineCount }} çevrimiçi</span>
        </div>
      </div>
    </div>

    <!-- Participants List -->
    <div class="max-h-64 overflow-y-auto" data-testid="participants-container">
      <div v-if="participants.length === 0" class="p-4 text-center" data-testid="no-participants">
        <svg class="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p class="text-sm text-gray-500 dark:text-gray-400">Henüz katılımcı yok</p>
      </div>
      
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-700" data-testid="participants-list">
        <div
          v-for="participant in sortedParticipants"
          :key="participant.userId"
          :data-testid="`participant-${participant.userId}`"
          class="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 participant-item"
        >
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <img
              :src="participant.avatar || defaultAvatar"
              :alt="participant.name"
              :data-testid="`avatar-${participant.userId}`"
              class="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-600 user-avatar"
            />
            <!-- Online indicator -->
            <div
              v-if="participant.isOnline"
              class="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"
            ></div>
          </div>
          
          <!-- User Info -->
          <div class="ml-3 flex-1 min-w-0">
            <div class="flex items-center">
              <p 
                class="text-sm font-medium text-gray-900 dark:text-white truncate participant-name"
                :data-testid="`name-${participant.userId}`"
              >
                {{ participant.name }}
              </p>
              <!-- Host Badge -->
              <span
                v-if="participant.userId === hostId"
                class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
              >
                Host
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatJoinTime(participant.joinedAt) }}
            </p>
          </div>
          
          <!-- Status -->
          <div class="flex-shrink-0">
            <div
              :class="[
                'h-2 w-2 rounded-full',
                participant.isOnline ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
              ]"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Participant {
  userId: string
  name: string
  avatar: string
  isOnline: boolean
  joinedAt: Date | string
}

interface Props {
  participants: Participant[]
  hostId: string
}

const props = defineProps<Props>()

// Default avatar for users without profile picture
const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=e5e7eb&color=6b7280'

// Computed properties
const onlineCount = computed(() => 
  props.participants.filter(p => p.isOnline).length
)

const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => {
    // Host first
    if (a.userId === props.hostId) return -1
    if (b.userId === props.hostId) return 1
    
    // Online users first
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    
    // Then by join time (earliest first)
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })
})

// Helper functions
const formatJoinTime = (joinedAt: Date | string): string => {
  const now = new Date()
  const joined = typeof joinedAt === 'string' ? new Date(joinedAt) : joinedAt
  
  if (isNaN(joined.getTime())) {
    return 'Bilinmeyen zaman'
  }
  
  const diffInMinutes = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return 'Az önce katıldı'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce katıldı`
  } else {
    const diffInHours = Math.floor(diffInMinutes / 60)
    return `${diffInHours} saat önce katıldı`
  }
}
</script> 