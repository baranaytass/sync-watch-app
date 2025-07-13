<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation Bar -->
    <nav class="nesbat-nav sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and Desktop Navigation -->
          <div class="flex items-center">
            <router-link to="/" class="flex-shrink-0 flex items-center">
              <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-8 w-auto mr-2">
              <span class="text-xl font-semibold text-foreground">{{ $t('app.brandTitle') }}</span>
            </router-link>
            
            <div class="hidden sm:ml-8 sm:flex sm:space-x-6">
              <router-link
                to="/"
                class="border-transparent text-muted-foreground hover:text-foreground hover:border-primary whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                :class="{ 'border-primary text-foreground': $route.name === 'Home' }"
              >
                {{ $t('navigation.home') }}
              </router-link>
              <router-link
                to="/sessions"
                class="border-transparent text-muted-foreground hover:text-foreground hover:border-primary whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                :class="{ 'border-primary text-foreground': $route.name === 'Sessions' }"
              >
                {{ $t('navigation.sessions') }}
              </router-link>
            </div>
          </div>
          
          <!-- Mobile menu button -->
          <div class="sm:hidden flex items-center">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors duration-200"
              :aria-expanded="mobileMenuOpen"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Desktop Controls -->
          <div class="hidden sm:flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors duration-200"
              :title="$t('theme.toggle')"
            >
              <svg v-if="themeStore.isDark" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <!-- Language Switcher -->
            <button
              @click="toggleLanguage"
              class="text-muted-foreground hover:text-foreground px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200"
              :title="$t('language.switch')"
            >
              <svg class="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{{ currentLocale === 'tr' ? 'EN' : 'TR' }}</span>
            </button>

            <div v-if="authStore.user" class="flex items-center space-x-3">
              <img
                :src="authStore.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user.name || 'User')}&background=6366f1&color=ffffff&rounded=true`"
                :alt="authStore.user.name"
                class="h-8 w-8 rounded-full border-2 border-border"
                @error="$event.target.src = 'https://ui-avatars.com/api/?name=Guest&background=6366f1&color=ffffff&rounded=true'"
              />
              <div class="hidden sm:block">
                <div class="text-sm font-medium text-foreground">{{ authStore.user.name }}</div>
                <div class="text-xs text-muted-foreground">{{ authStore.user.email }}</div>
              </div>
              <button
                @click="handleLogout"
                :disabled="authStore.loading"
                class="nesbat-button-secondary disabled:opacity-50 text-sm px-3 py-1.5"
                data-testid="logout-button"
              >
                {{ authStore.loading ? $t('auth.loggingOut') : $t('auth.logout') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mobile Navigation Menu -->
      <div v-show="mobileMenuOpen" class="sm:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 bg-card/95 backdrop-blur-sm border-b border-border">
          <router-link
            to="/"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            :class="$route.name === 'Home' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
          >
            {{ $t('navigation.home') }}
          </router-link>
          <router-link
            to="/sessions"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            :class="$route.name === 'Sessions' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
          >
            {{ $t('navigation.sessions') }}
          </router-link>
          
          <!-- Mobile Controls -->
          <div class="flex items-center justify-between px-3 py-2">
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors duration-200"
              :title="$t('theme.toggle')"
            >
              <svg v-if="themeStore.isDark" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <!-- Language Switcher -->
            <button
              @click="toggleLanguage"
              class="text-muted-foreground hover:text-foreground px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200"
              :title="$t('language.switch')"
            >
              <svg class="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{{ currentLocale === 'tr' ? 'EN' : 'TR' }}</span>
            </button>
          </div>
          
          <!-- Mobile User Info -->
          <div v-if="authStore.user" class="px-3 py-3 border-t border-border">
            <div class="flex items-center mb-3">
              <img
                :src="authStore.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user.name || 'User')}&background=6366f1&color=ffffff&rounded=true`"
                :alt="authStore.user.name"
                class="h-10 w-10 rounded-full border-2 border-border"
                @error="$event.target.src = 'https://ui-avatars.com/api/?name=Guest&background=6366f1&color=ffffff&rounded=true'"
              />
              <div class="ml-3">
                <div class="text-base font-medium text-foreground">{{ authStore.user.name }}</div>
                <div class="text-sm text-muted-foreground">{{ authStore.user.email }}</div>
              </div>
            </div>
            <button
              @click="handleLogout"
              :disabled="authStore.loading"
              class="w-full nesbat-button-secondary disabled:opacity-50 text-sm py-2"
              data-testid="logout-button-mobile"
            >
              {{ authStore.loading ? $t('auth.loggingOut') : $t('auth.logout') }}
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const { toggleLocale, getCurrentLocale } = useI18n()

// Mobile menu state
const mobileMenuOpen = ref(false)

const currentLocale = computed(() => getCurrentLocale())

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleLanguage = () => {
  toggleLocale()
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}
</script> 