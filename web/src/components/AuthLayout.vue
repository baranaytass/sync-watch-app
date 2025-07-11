<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-900">{{ $t('app.title') }}</h1>
            </router-link>
            
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                :class="{ 'border-indigo-500 text-gray-900': $route.name === 'Home' }"
              >
                {{ $t('navigation.home') }}
              </router-link>
              <router-link
                to="/sessions"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                :class="{ 'border-indigo-500 text-gray-900': $route.name === 'Sessions' }"
              >
                {{ $t('navigation.sessions') }}
              </router-link>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Language Switcher -->
            <button
              @click="toggleLanguage"
              class="text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md text-sm font-medium transition-colors"
              :title="$t('language.switch')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span class="ml-1">{{ currentLocale === 'tr' ? 'EN' : 'TR' }}</span>
            </button>

            <div v-if="authStore.user" class="flex items-center space-x-3">
              <img
                :src="authStore.user.avatar"
                :alt="authStore.user.name"
                class="h-8 w-8 rounded-full"
              />
              <div class="hidden sm:block">
                <div class="text-sm font-medium text-gray-700">{{ authStore.user.name }}</div>
                <div class="text-xs text-gray-500">{{ authStore.user.email }}</div>
              </div>
              <button
                @click="handleLogout"
                :disabled="authStore.loading"
                class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {{ authStore.loading ? $t('auth.loggingOut') : $t('auth.logout') }}
              </button>
            </div>
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
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const authStore = useAuthStore()
const router = useRouter()
const { toggleLocale, getCurrentLocale } = useI18n()

const currentLocale = computed(() => getCurrentLocale())

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleLanguage = () => {
  toggleLocale()
}
</script> 