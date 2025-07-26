<template>
  <!-- Not authenticated users - standalone layout -->
  <div v-if="!authStore.isAuthenticated" class="min-h-screen bg-background">
    <!-- Hero Section - Apple Style -->
    <div class="relative overflow-hidden py-32">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Logo -->
        <div class="flex justify-center mb-8">
          <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-16 w-auto">
        </div>
        
        <!-- Main Title -->
        <h1 class="text-5xl md:text-7xl font-light text-foreground mb-8 tracking-tight">
          {{ $t('home.hero.title') }}
        </h1>
        
        <!-- Subtitle -->
        <p class="text-xl md:text-2xl text-muted-foreground mb-6 font-light max-w-4xl mx-auto leading-relaxed">
          {{ $t('home.hero.subtitle') }}
        </p>
        
        <!-- Description -->
        <p class="text-lg text-muted-foreground/80 mb-12 max-w-3xl mx-auto">
          {{ $t('home.hero.description') }}
        </p>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/login"
            class="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Hemen Başla
          </router-link>
          <a
            href="#demo"
            class="border border-border bg-background text-foreground px-8 py-4 rounded-xl font-medium text-lg hover:bg-muted transition-all duration-200"
          >
            Demo İzle
          </a>
        </div>
      </div>
    </div>

    <!-- App Screenshots Demo -->
    <div id="demo" class="py-24 bg-muted/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
            {{ $t('home.demo.title') }}
          </h2>
        </div>
        
        <!-- Demo Steps with Screenshots -->
        <div class="space-y-32">
          <!-- Step 1: Login -->
          <div class="grid lg:grid-cols-2 gap-16 items-center">
            <div class="order-2 lg:order-1">
              <div class="space-y-6">
                <div class="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Adım 1
                </div>
                <h3 class="text-3xl font-light text-foreground">{{ $t('home.demo.steps.create.title') }}</h3>
                <p class="text-lg text-muted-foreground leading-relaxed">
                  {{ $t('home.demo.steps.create.description') }}
                </p>
              </div>
            </div>
            <div class="order-1 lg:order-2">
              <div class="relative">
                <img 
                  src="/screenshots/01-login-page.png" 
                  alt="Login Page Screenshot"
                  class="w-full rounded-2xl shadow-2xl border border-border"
                >
              </div>
            </div>
          </div>
          
          <!-- Step 2: Sessions -->
          <div class="grid lg:grid-cols-2 gap-16 items-center">
            <div class="relative">
              <img 
                src="/screenshots/02-sessions-page.png" 
                alt="Sessions Page Screenshot"
                class="w-full rounded-2xl shadow-2xl border border-border"
              >
            </div>
            <div class="space-y-6">
              <div class="inline-block px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
                Adım 2
              </div>
              <h3 class="text-3xl font-light text-foreground">{{ $t('home.demo.steps.sync.title') }}</h3>
              <p class="text-lg text-muted-foreground leading-relaxed">
                {{ $t('home.demo.steps.sync.description') }}
              </p>
            </div>
          </div>
          
          <!-- Step 3: Watch Together -->
          <div class="grid lg:grid-cols-2 gap-16 items-center">
            <div class="order-2 lg:order-1">
              <div class="space-y-6">
                <div class="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                  Adım 3
                </div>
                <h3 class="text-3xl font-light text-foreground">{{ $t('home.demo.steps.enjoy.title') }}</h3>
                <p class="text-lg text-muted-foreground leading-relaxed">
                  {{ $t('home.demo.steps.enjoy.description') }}
                </p>
              </div>
            </div>
            <div class="order-1 lg:order-2">
              <div class="relative bg-muted/50 rounded-2xl border border-border p-8 text-center">
                <p class="text-muted-foreground">Session Room Screenshot</p>
                <p class="text-sm text-muted-foreground/60 mt-2">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <h2 class="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
            Özellikler
          </h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-12">
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-medium text-foreground">{{ $t('home.features.realtime.title') }}</h3>
            <p class="text-muted-foreground leading-relaxed">
              {{ $t('home.features.realtime.description') }}
            </p>
          </div>
          
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <div class="w-8 h-8 bg-green-500 rounded-lg"></div>
            </div>
            <h3 class="text-xl font-medium text-foreground">{{ $t('home.features.multiuser.title') }}</h3>
            <p class="text-muted-foreground leading-relaxed">
              {{ $t('home.features.multiuser.description') }}
            </p>
          </div>
          
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <div class="w-8 h-8 bg-blue-500 rounded-lg"></div>
            </div>
            <h3 class="text-xl font-medium text-foreground">{{ $t('home.features.secure.title') }}</h3>
            <p class="text-muted-foreground leading-relaxed">
              {{ $t('home.features.secure.description') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tech & Open Source -->
    <div class="py-24 bg-muted/20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-light text-foreground mb-6 tracking-tight">
          Open Source
        </h2>
        <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
          Modern web teknolojileri ile geliştirilmiş, tamamen açık kaynak bir proje.
        </p>
        
        <div class="flex justify-center">
          <a
            href="https://github.com/baranaytas/sync-watch-app-3"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-3 border border-border bg-background text-foreground px-6 py-3 rounded-xl font-medium hover:bg-muted transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub'da İncele
          </a>
        </div>
        
        <!-- Tech Stack Tags -->
        <div class="flex flex-wrap justify-center gap-3 mt-8">
          <span class="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm">Vue.js</span>
          <span class="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm">Fastify</span>
          <span class="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-sm">WebSocket</span>
          <span class="px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm">TypeScript</span>
        </div>
      </div>
    </div>

    <!-- Final CTA -->
    <div class="py-32">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
          Hemen Başlayın
        </h2>
        <p class="text-lg text-muted-foreground mb-12 leading-relaxed">
          Ücretsiz, hızlı ve kolay. Sadece birkaç tıkla arkadaşlarınızla synchronized video deneyimi.
        </p>
        
        <router-link
          to="/login"
          class="inline-flex bg-primary text-primary-foreground px-12 py-6 rounded-xl font-medium text-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Ücretsiz Başla
        </router-link>
      </div>
    </div>

    <!-- Simple Footer -->
    <footer class="border-t border-border py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="flex justify-center items-center gap-3 mb-4">
          <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-6 w-auto">
          <span class="text-foreground font-medium">{{ $t('app.brandTitle') }}</span>
        </div>
        
        <p class="text-sm text-muted-foreground">
          Made with ❤️ by <a href="#" class="text-primary hover:underline">Baran Aytaş</a>
        </p>
        <p class="text-xs text-muted-foreground mt-2">{{ new Date().getFullYear() }} - Open Source Project</p>
      </div>
    </footer>
  </div>
  
  <!-- Authenticated users - with auth layout -->
  <AuthLayout v-else>
    <div class="px-4 py-6 sm:px-0">
      <!-- Welcome Header -->
      <div class="nesbat-card p-8 mb-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <img 
              :src="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.name || 'User')}&background=6366f1&color=ffffff&rounded=true`"
              :alt="authStore.user?.name"
              class="w-16 h-16 rounded-full border-4 border-primary/20"
              @error="$event.target.src = 'https://ui-avatars.com/api/?name=Guest&background=6366f1&color=ffffff&rounded=true'"
            />
            <div>
              <h1 class="text-2xl font-bold text-foreground">
                {{ $t('auth.welcome') }}, {{ authStore.user?.name }}!
              </h1>
              <p class="text-muted-foreground">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <router-link
            to="/sessions"
            class="nesbat-button px-6 py-3"
          >
            {{ $t('navigation.sessions') }}
          </router-link>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer" @click="$router.push('/sessions')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7v2m0 0v2m0-2h2m-2 0h-2m-7 12a3 3 0 01-3-3V5a3 3 0 013-3h2a3 3 0 013 3v11a3 3 0 01-3 3h-2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.sessionsList.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.sessionsList.description') }}</p>
            </div>
          </div>
        </div>

        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer" @click="createSession">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.newSession.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.newSession.description') }}</p>
            </div>
          </div>
        </div>

        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.guide.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.guide.description') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="nesbat-card p-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.dashboard.recentActivity.title') }}</h2>
        <div class="text-center py-8">
          <svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-muted-foreground">{{ $t('home.dashboard.recentActivity.noActivity') }}</p>
          <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.recentActivity.createFirst') }}</p>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'

const authStore = useAuthStore()
const router = useRouter()

// Fetch user data when component mounts
onMounted(() => {
  if (!authStore.user) {
    authStore.fetchUser()
  }
})

const createSession = () => {
  router.push('/sessions?create=true')
}
</script>