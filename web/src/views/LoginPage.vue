<template>
  <div class="min-h-screen flex">
    <!-- Left side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-8">
      <div class="text-center text-primary-foreground">
        <div class="mb-8 flex justify-center">
          <StaySyncLogo :show-text="false" :show-tagline="false" size="lg" variant="dark" />
        </div>
        <h1 class="text-4xl font-bold mb-4">{{ $t('app.brandTitle') }}</h1>
        <p class="text-xl opacity-90 mb-8 max-w-md">{{ $t('home.hero.subtitle') }}</p>
        
        <!-- Visual Features -->
        <div class="space-y-4 text-left max-w-sm">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="opacity-90">{{ $t('home.loginFeatures.syncWatch') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="opacity-90">{{ $t('home.loginFeatures.multiUser') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="opacity-90">{{ $t('home.loginFeatures.secure') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Login Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-background">
      <div class="w-full max-w-md">
        <!-- Mobile logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="mb-4 flex justify-center">
            <StaySyncLogo :show-text="false" :show-tagline="false" size="md" />
          </div>
          <h1 class="heading-3 mb-2">{{ $t('auth.welcomeToNesbat') }}</h1>
        </div>

        <!-- Form Header -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-foreground mb-2">{{ $t('auth.loginToAccount') }}</h2>
          <p class="text-muted-foreground">Choose your preferred sign-in method</p>
        </div>

        <!-- Login Options -->
        <div class="space-y-4">
          <!-- Google Login -->
          <button
            @click="handleGoogleLogin"
            :disabled="authStore.loading"
            class="btn btn-secondary w-full text-left justify-start"
            data-testid="google-login-button"
          >
            <svg v-if="authStore.loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EB4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ authStore.loading ? $t('auth.loggingIn') : $t('auth.loginWithGoogle') }}
          </button>

          <!-- Divider -->
          <div v-if="isGuestLoginEnabled" class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-background text-muted-foreground">{{ $t('common.or') }}</span>
            </div>
          </div>
          
          <!-- Guest Login -->
          <div v-if="isGuestLoginEnabled" class="space-y-3">
            <input
              v-model="guestName"
              type="text"
              :placeholder="$t('auth.guestNamePlaceholder')"
              maxlength="50"
              class="input"
              data-testid="guest-name-input"
            />
            
            <button
              @click="handleGuestLogin"
              :disabled="authStore.loading || !guestName.trim()"
              class="btn btn-primary w-full"
              data-testid="guest-login-button"
            >
              <svg v-if="authStore.loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ authStore.loading ? $t('auth.loggingIn') : $t('auth.loginAsGuest') }}
            </button>
          </div>
          
          <!-- Error Message -->
          <div v-if="authStore.error" class="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p class="text-destructive text-sm">{{ authStore.error }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <div class="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <router-link to="/" class="hover:text-foreground transition-colors">
              {{ $t('navigation.home') }}
            </router-link>
            <span class="opacity-50">•</span>
            <span class="opacity-75">{{ $t('app.tagline') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import StaySyncLogo from '@/components/StaySyncLogo.vue'

const authStore = useAuthStore()
const router = useRouter()
const guestName = ref('')

// Check if guest login is enabled via env
const isGuestLoginEnabled = computed(() => {
  // Always enable guest login in production for now - environment variable not working reliably
  return true || import.meta.env.VITE_ENABLE_GUEST_LOGIN === 'true'
})

const handleGoogleLogin = () => {
  authStore.clearError()
  authStore.loginWithGoogle()
}

const handleGuestLogin = () => {
  authStore.clearError()
  authStore.loginAsGuest(guestName.value.trim())
}

// Check if user is already authenticated
onMounted(async () => {
  // Only redirect if user is already authenticated via localStorage
  // Don't call fetchUser() to avoid unnecessary 401 errors
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }
})
</script> 