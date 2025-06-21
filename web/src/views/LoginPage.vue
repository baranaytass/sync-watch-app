<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Hesabınıza giriş yapın
        </h2>
      </div>
      <div class="mt-8 space-y-6">
        <button
          @click="loginWithGoogle"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Google ile Giriş Yap
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const loginWithGoogle = () => {
  // Google OAuth implementasyonu sonra eklenecek
  console.log('Google login clicked')
}
</script> 