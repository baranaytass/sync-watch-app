<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <StaySyncLogo :show-text="false" :show-tagline="false" size="lg" />
        <div class="space-y-2">
          <div class="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <h2 class="text-xl font-semibold text-foreground">{{ $t('auth.processing') }}</h2>
          <p class="text-muted-foreground">{{ $t('auth.redirecting') }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-4">
        <StaySyncLogo :show-text="false" :show-tagline="false" size="lg" />
        <div class="space-y-4">
          <div class="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg class="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-foreground">{{ $t('auth.error') }}</h2>
          <p class="text-muted-foreground">{{ error }}</p>
          <router-link to="/login" class="btn btn-primary">
            {{ $t('auth.backToLogin') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import StaySyncLogo from '@/components/StaySyncLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // Get authorization code from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const errorParam = urlParams.get('error')

    if (errorParam) {
      throw new Error(`OAuth error: ${errorParam}`)
    }

    if (!code) {
      throw new Error('No authorization code received')
    }

    console.log('🔵 Processing OAuth callback with code:', code?.substring(0, 10) + '...')

    // Exchange code for tokens via backend
    const API_BASE_URL = import.meta.env.VITE_API_URL || 
      (window.location.hostname.includes('onrender.com') ? 'https://sync-watch-backend.onrender.com' : 'http://localhost:3000')

    const response = await fetch(`${API_BASE_URL}/api/auth/google/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code, state }),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Authentication failed')
    }

    console.log('✅ OAuth authentication successful')

    // Fetch user data to update auth store
    await authStore.fetchUser()

    // Redirect to home page
    router.push('/')
    
  } catch (err) {
    console.error('❌ OAuth callback error:', err)
    error.value = err instanceof Error ? err.message : 'Authentication failed'
  } finally {
    loading.value = false
  }
})
</script>