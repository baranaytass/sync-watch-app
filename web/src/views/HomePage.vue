<template>
  <!-- Not authenticated users - standalone layout -->
  <div v-if="!authStore.isAuthenticated" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Video Sync Chat
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Videoları arkadaşlarınla senkronize izle ve sohbet et
        </p>
      </div>
      
      <div class="mt-8 space-y-6">
        <router-link
          to="/login"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Giriş Yap
        </router-link>
      </div>
    </div>
  </div>
  
  <!-- Authenticated users - with auth layout -->
  <AuthLayout v-else>
    <div class="px-4 py-6 sm:px-0">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="text-center">
          <div class="flex justify-center mb-4">
            <img 
              :src="authStore.user?.avatar" 
              :alt="authStore.user?.name"
              class="w-16 h-16 rounded-full"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-900">
            Hoş geldin, {{ authStore.user?.name }}!
          </h3>
          <p class="text-sm text-gray-600 mb-6">{{ authStore.user?.email }}</p>
          
          <router-link
            to="/sessions"
            class="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Oturumları Görüntüle
          </router-link>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/AuthLayout.vue'

const authStore = useAuthStore()

// Fetch user data when component mounts
onMounted(() => {
  if (!authStore.user) {
    authStore.fetchUser()
  }
})
</script> 