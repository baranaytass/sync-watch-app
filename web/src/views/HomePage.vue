<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
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
        
        <router-link
          to="/sessions"
          class="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Oturumları Görüntüle
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Ana sayfa bileşeni
</script> 