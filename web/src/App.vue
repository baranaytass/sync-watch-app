<template>
  <div
    id="app"
    class="min-h-screen bg-background"
  >
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Initialize auth when app mounts
onMounted(() => {
  // Initialize auth store - it will load from localStorage
  const authStore = useAuthStore()
  // Router guard will handle authentication verification
})
</script>

<style scoped>
/* Scoped styles buraya eklenebilir */
</style> 