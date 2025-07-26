<template>
  <AuthLayout>
    <div class="px-4 py-6 sm:px-0">
      <!-- Header -->
      <div class="nesbat-card p-6 mb-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground">{{ $t('navigation.sessions') }}</h1>
            <p class="text-muted-foreground mt-1">{{ $t('app.description') }}</p>
          </div>
          <button
            @click="showCreateModal = true"
            class="nesbat-button px-4 py-2 text-sm"
            data-testid="create-session-button"
          >
            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ $t('session.createNew') }}
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="nesbat-card p-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4 flex-1">
            <!-- Search -->
            <div class="relative flex-1 max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="$t('session.search')"
                class="nesbat-input pl-10 pr-3 py-2 text-sm"
              />
            </div>
            
            <!-- Filter by video -->
            <div class="flex items-center">
              <input
                id="has-video"
                v-model="filterByVideo"
                type="checkbox"
                class="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <label for="has-video" class="ml-2 block text-sm text-foreground">
                {{ $t('session.onlyWithVideo') }}
              </label>
            </div>
          </div>
          
          <!-- Stats -->
          <div class="text-sm text-muted-foreground">
            <span>{{ filteredSessions.length }} {{ $t('session.found') }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="sessionsStore.loading" class="nesbat-card p-12">
        <div class="text-center">
          <svg class="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-muted-foreground">{{ $t('session.loadingSessions') }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="sessionsStore.error" class="nesbat-card p-6 mb-6 bg-destructive/5 border-destructive/20">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-destructive">{{ $t('common.error') }}</h3>
            <p class="text-sm text-destructive/80 mt-1">{{ sessionsStore.error }}</p>
          </div>
          <div class="flex-shrink-0">
            <button
              @click="loadSessions"
              class="nesbat-button-secondary px-3 py-1 text-sm"
            >
              {{ $t('common.retry') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSessions.length === 0" class="nesbat-card p-12">
        <div class="text-center">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7v2m0 0v2m0-2h2m-2 0h-2m-7 12a3 3 0 01-3-3V5a3 3 0 013-3h2a3 3 0 013 3v11a3 3 0 01-3 3h-2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">{{ $t('session.noSessions') }}</h3>
          <p class="text-muted-foreground mb-6">
            {{ searchQuery || filterByVideo ? $t('session.noSearchResults') : $t('session.noActiveYet') }}
          </p>
          <button
            @click="showCreateModal = true"
            class="nesbat-button px-6 py-3"
            data-testid="create-first-session-button"
          >
            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ $t('session.createFirstSession') }}
          </button>
        </div>
      </div>

      <!-- Sessions Grid -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SessionCard
          v-for="session in filteredSessions"
          :key="session.id"
          :session="session"
          :participant-count="getParticipantCount(session.id)"
          :loading="joiningSessionId === session.id"
          @join-session="handleJoinSession"
        />
      </div>

      <!-- Create Session Modal -->
      <CreateSessionModal
        :open="showCreateModal"
        :loading="sessionsStore.loading"
        @close="showCreateModal = false"
        @create-session="handleCreateSession"
      />
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import SessionCard from '@/components/SessionCard.vue'
import CreateSessionModal from '@/components/CreateSessionModal.vue'
import { useSessionsStore } from '@/stores/sessions'
import { useAuthStore } from '@/stores/auth'
import type { CreateSessionRequest } from '@/stores/sessions'

const router = useRouter()
const sessionsStore = useSessionsStore()
const authStore = useAuthStore()

// Reactive state
const searchQuery = ref('')
const filterByVideo = ref(false)
const showCreateModal = ref(false)
const joiningSessionId = ref<string | null>(null)

// Computed properties
const filteredSessions = computed(() => {
  let filtered = [...sessionsStore.sessions]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(session => 
      session.title.toLowerCase().includes(query) ||
      session.description?.toLowerCase().includes(query) ||
      session.videoTitle?.toLowerCase().includes(query)
    )
  }
  
  // Video filter
  if (filterByVideo.value) {
    filtered = filtered.filter(session => session.videoTitle && session.videoId)
  }
  
  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return filtered
})

// Methods
const loadSessions = async () => {
  await sessionsStore.fetchSessions()
}

const handleCreateSession = async (sessionData: CreateSessionRequest) => {
  try {
    // Create session via API
    const newSession = await sessionsStore.createSession(sessionData)
    showCreateModal.value = false
    router.push(`/session/${newSession.id}`)
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

const handleJoinSession = async (sessionId: string) => {
  try {
    joiningSessionId.value = sessionId
    await sessionsStore.joinSession(sessionId)
    router.push(`/session/${sessionId}`)
  } catch (error) {
    console.error('Failed to join session:', error)
  } finally {
    joiningSessionId.value = null
  }
}

// Get participant count from sessions list 
const getParticipantCount = (sessionId: string): number => {
  // Note: This is a placeholder until we implement real-time participant tracking
  // For now, all sessions show 0 participants unless actively being tracked
  return 0
}

// Lifecycle
onMounted(() => {
  loadSessions()
})

// Reload sessions when returning to this page
onActivated(() => {
  loadSessions()
})
</script> 