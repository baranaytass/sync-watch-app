<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="max-w-md w-full">
      <!-- Logo and Branding -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-16 w-auto">
        </div>
        <h1 class="text-3xl font-semibold text-foreground mb-2">{{ $t('auth.welcomeToNesbat') }}</h1>
        <p class="text-muted-foreground">
          {{ $t('auth.loginToAccount') }}
        </p>
      </div>

      <!-- Login Card -->
      <div class="nesbat-card p-8 space-y-6">
        <div class="space-y-4">
          <button
            @click="handleGoogleLogin"
            :disabled="authStore.loading"
            class="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            data-testid="google-login-button"
          >
            <svg v-if="authStore.loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ authStore.loading ? $t('auth.loggingIn') : $t('auth.loginWithGoogle') }}
          </button>

          <!-- Guest Login Section -->
          <div v-if="isGuestLoginEnabled" class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-card text-muted-foreground">{{ $t('common.or') }}</span>
            </div>
          </div>
          
          <button
            v-if="isGuestLoginEnabled"
            @click="handleGuestLogin"
            :disabled="authStore.loading"
            class="w-full flex justify-center items-center py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed nesbat-button-secondary"
            data-testid="guest-login-button"
          >
            <svg v-if="authStore.loading" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ authStore.loading ? $t('auth.loggingIn') : $t('auth.loginAsGuest') }}
          </button>
          
          <div v-if="authStore.error" class="text-destructive text-sm text-center p-3 bg-destructive/10 rounded-md">
            {{ authStore.error }}
          </div>
        </div>
      </div>

      <!-- Features Preview -->
      <div class="mt-8 text-center space-y-4">
        <div class="flex items-center justify-center space-x-6 text-sm text-muted-foreground flex-wrap gap-4">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{{ $t('home.loginFeatures.syncWatch') }}</span>
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{{ $t('home.loginFeatures.multiUser') }}</span>
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{{ $t('home.loginFeatures.secure') }}</span>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div class="mt-6 pt-6 border-t border-border">
          <div class="flex items-center justify-center space-x-6 text-sm">
            <router-link 
              to="/" 
              class="text-muted-foreground hover:text-primary transition-colors"
            >
              {{ $t('navigation.home') }}
            </router-link>
            <a 
              href="https://github.com/baranaytas/sync-watch-app-3"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Check if guest login is enabled via env
const isGuestLoginEnabled = computed(() => {
  return import.meta.env.VITE_ENABLE_GUEST_LOGIN === 'true'
})

const handleGoogleLogin = () => {
  authStore.clearError()
  authStore.loginWithGoogle()
}

const handleGuestLogin = () => {
  authStore.clearError()
  authStore.loginAsGuest()
}

// Check if user is already authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }
  
  // Try to fetch user from stored session
  await authStore.fetchUser()
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script> 