<template>
  <!-- VARIANT A: Not Authenticated - Landing Page -->
  <div v-if="!authStore.isAuthenticated" class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="nav sticky top-0 z-50">
      <div class="container flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            W
          </div>
          <span class="text-xl font-semibold">{{ $t('app.brandTitle') }}</span>
        </div>
        
        <!-- Language + Theme Toggle -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button @click="toggleLanguage" class="btn-ghost px-2 sm:px-3 py-2 text-sm">
            {{ currentLocale === 'tr' ? 'EN' : 'TR' }}
          </button>
          <button @click="toggleTheme" class="btn-ghost p-2">
            <svg v-if="theme.currentTheme === 'light'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <router-link to="/login" class="btn-primary text-sm sm:text-base">
            <span class="hidden sm:inline">{{ $t('auth.loginToAccount') }}</span>
            <span class="sm:hidden">{{ $t('auth.login') }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="section gradient-bg">
      <div class="container text-center">
        <!-- Logo/Icon -->
        <div class="mb-8 flex justify-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <!-- Main Heading -->
        <h1 class="heading-1 mb-6">
          {{ $t('home.hero.title') }}
        </h1>
        
        <!-- Subtitle -->
        <p class="body-large mb-8 max-w-3xl mx-auto">
          {{ $t('home.hero.subtitle') }}
        </p>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <router-link to="/login" class="btn-primary btn-lg">
            {{ $t('home.cta.button') }}
          </router-link>
          <a href="#features" class="btn-secondary btn-lg">
            {{ $t('home.buttons.features') }}
          </a>
        </div>
        
        <!-- Hero Visual -->
        <div class="relative mx-auto max-w-4xl">
          <div class="aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
            <div class="flex h-full items-center justify-center">
              <div class="text-center">
                <div class="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p class="text-muted-foreground">{{ $t('home.demo.title') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section">
      <div class="container">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">{{ $t('home.features.sectionTitle') }}</h2>
          <p class="body-large max-w-2xl mx-auto">{{ $t('home.features.sectionSubtitle') }}</p>
        </div>
        
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature 1: Sync Watch -->
          <div class="card-hover text-center">
            <div class="mb-4 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 class="heading-3 mb-2">{{ $t('home.features.syncWatch.title') }}</h3>
            <p class="body">{{ $t('home.features.syncWatch.description') }}</p>
          </div>
          
          <!-- Feature 2: Multi-User -->
          <div class="card-hover text-center">
            <div class="mb-4 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 class="heading-3 mb-2">{{ $t('home.features.multiUser.title') }}</h3>
            <p class="body">{{ $t('home.features.multiUser.description') }}</p>
          </div>
          
          <!-- Feature 3: Secure -->
          <div class="card-hover text-center">
            <div class="mb-4 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h3 class="heading-3 mb-2">{{ $t('home.features.secure.title') }}</h3>
            <p class="body">{{ $t('home.features.secure.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section bg-muted/30">
      <div class="container">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">{{ $t('home.howItWorks.title') }}</h2>
        </div>
        
        <div class="grid gap-12 lg:grid-cols-3">
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">1</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step1.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step1.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">2</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step2.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step2.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">3</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step3.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step3.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section">
      <div class="container text-center">
        <h2 class="heading-2 mb-4">{{ $t('home.cta.title') }}</h2>
        <p class="body-large mb-8 max-w-2xl mx-auto">{{ $t('home.cta.subtitle') }}</p>
        <router-link to="/login" class="btn-primary btn-lg">
          {{ $t('home.cta.button') }}
        </router-link>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="border-t border-border bg-muted/30">
      <div class="container py-8">
        <div class="text-center">
          <div class="flex items-center justify-center gap-2 mb-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              W
            </div>
            <span class="text-xl font-semibold">{{ $t('app.brandTitle') }}</span>
          </div>
          <p class="text-muted-foreground mb-4">{{ $t('app.description') }}</p>
          <div class="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <router-link to="/login" class="hover:text-foreground transition-colors">
              {{ $t('auth.loginToAccount') }}
            </router-link>
            <span class="opacity-50">•</span>
            <span class="opacity-75">{{ $t('app.tagline') }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <!-- VARIANT B: Authenticated - Enhanced Landing -->
  <div v-else class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="nav">
      <div class="container flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            W
          </div>
          <span class="text-xl font-semibold">{{ $t('app.brandTitle') }}</span>
        </div>
        
        <!-- User Menu -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button @click="toggleLanguage" class="btn-ghost px-2 sm:px-3 py-2 text-sm">
            {{ currentLocale === 'tr' ? 'EN' : 'TR' }}
          </button>
          <button @click="toggleTheme" class="btn-ghost p-2">
            <svg v-if="theme.currentTheme === 'light'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <span class="hidden sm:inline text-sm text-muted-foreground">{{ authStore.user?.name }}</span>
          <button @click="handleLogout" class="btn-ghost text-sm sm:text-base" data-testid="logout-button">
            <span class="hidden sm:inline">{{ $t('auth.logout') }}</span>
            <span class="sm:hidden">{{ $t('auth.logoutShort') }}</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="section gradient-bg">
      <div class="container text-center">
        <div class="mb-8 flex justify-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <h1 class="heading-1 mb-6">
          {{ $t('home.welcomeBack') }}, {{ authStore.user?.name }}!
        </h1>
        
        <p class="body-large mb-12 max-w-2xl mx-auto">
          {{ $t('home.dashboard.subtitle') }}
        </p>
        
        <!-- Quick Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button @click="createQuickSession" class="btn-primary btn-lg" data-testid="create-session-button">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ $t('home.dashboard.createSession') }}
          </button>
          <button @click="showSessionsPanel = !showSessionsPanel; loadSessions()" class="btn-secondary btn-lg">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7v2m0 0v2m0-2h2m-2 0h-2m-7 12a3 3 0 01-3-3V5a3 3 0 013-3h2a3 3 0 013 3v11a3 3 0 01-3 3h-2z" />
            </svg>
            {{ $t('home.dashboard.browseSessions') }}
          </button>
        </div>
        
        <!-- Sessions Panel -->
        <div v-if="showSessionsPanel" class="max-w-4xl mx-auto">
          <div class="glass-card rounded-2xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h3 class="heading-3">{{ $t('home.dashboard.activeSessions') }}</h3>
              <button @click="showSessionsPanel = false" class="btn-ghost p-2">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Join Session Input -->
            <div class="mb-6">
              <div class="flex gap-3 max-w-md mx-auto">
                <input 
                  v-model="joinSessionId" 
                  type="text" 
                  :placeholder="$t('home.dashboard.sessionIdPlaceholder')" 
                  class="input flex-1"
                />
                <button @click="joinSession" :disabled="!joinSessionId.trim()" class="btn-primary">
                  {{ $t('home.dashboard.joinButton') }}
                </button>
              </div>
            </div>
            
            <!-- Sessions List -->
            <div v-if="sessionsStore.loading" class="text-center py-8">
              <div class="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-sm text-muted-foreground">{{ $t('common.loading') }}</p>
            </div>
            
            <div v-else-if="sessionsStore.sessions.length === 0" class="text-center py-8">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
                <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7v2m0 0v2m0-2h2m-2 0h-2m-7 12a3 3 0 01-3-3V5a3 3 0 013-3h2a3 3 0 013 3v11a3 3 0 01-3 3h-2z" />
                </svg>
              </div>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.noActiveSessions') }}</p>
            </div>
            
            <div v-else class="space-y-3">
              <div v-for="session in sessionsStore.sessions" :key="session.id" 
                   class="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div class="flex-1">
                  <h4 class="font-medium">{{ session.title }}</h4>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{{ session.participants.length }} participants</span>
                    <span v-if="session.videoTitle">{{ session.videoTitle }}</span>
                  </div>
                </div>
                <button @click="joinSessionById(session.id)" class="btn-primary btn-sm">
                  {{ $t('home.dashboard.joinButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- How to Use Section -->
    <section class="section bg-muted/30">
      <div class="container">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">{{ $t('home.howItWorks.title') }}</h2>
          <p class="body-large max-w-2xl mx-auto">{{ $t('home.howItWorks.subtitle') }}</p>
        </div>
        
        <div class="grid gap-8 md:grid-cols-3">
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">1</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step1.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step1.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">2</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step2.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step2.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="mb-6 flex justify-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">3</div>
            </div>
            <h3 class="heading-3 mb-3">{{ $t('home.howItWorks.step3.title') }}</h3>
            <p class="body">{{ $t('home.howItWorks.step3.description') }}</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="border-t border-border bg-muted/30">
      <div class="container py-8">
        <div class="text-center">
          <div class="flex items-center justify-center gap-2 mb-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              W
            </div>
            <span class="text-xl font-semibold">{{ $t('app.brandTitle') }}</span>
          </div>
          <p class="text-muted-foreground mb-4">{{ $t('app.description') }}</p>
          <div class="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span class="opacity-75">{{ $t('auth.welcome') }}, {{ authStore.user?.name }}</span>
            <span class="opacity-50">•</span>
            <span class="opacity-75">{{ $t('app.tagline') }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSessionsStore } from '@/stores/sessions'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from '@/composables/useI18n'
import { useRouter } from 'vue-router'
import axios from 'axios'

const authStore = useAuthStore()
const sessionsStore = useSessionsStore()
const theme = useThemeStore()
const { getCurrentLocale, toggleLocale } = useI18n()
const router = useRouter()

const joinSessionId = ref('')
const showSessionsPanel = ref(false)
const currentLocale = getCurrentLocale()

const toggleLanguage = () => {
  toggleLocale()
}

const toggleTheme = () => {
  theme.toggleTheme()
}

const createQuickSession = async () => {
  try {
    const response = await axios.post('/api/sessions', {
      title: 'Quick Session',
      description: 'Created from dashboard'
    })
    
    if (response.data.success) {
      router.push(`/session/${response.data.data.id}`)
    }
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

const joinSession = () => {
  if (joinSessionId.value.trim()) {
    router.push(`/session/${joinSessionId.value.trim()}`)
  }
}

const joinSessionById = (sessionId: string) => {
  router.push(`/session/${sessionId}`)
}

const loadSessions = async () => {
  if (showSessionsPanel.value) {
    await sessionsStore.fetchSessions()
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (authStore.isAuthenticated && !authStore.user) {
    authStore.fetchUser()
  }
})
</script>