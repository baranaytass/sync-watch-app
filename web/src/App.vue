<template>
  <div id="app" class="min-h-screen bg-background">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Initialize auth when app mounts
onMounted(() => {
  // Auth store is already initialized with localStorage data
  // Router guard will handle authentication verification
})
</script>

<style scoped>
/* Scoped styles buraya eklenebilir */
</style> 