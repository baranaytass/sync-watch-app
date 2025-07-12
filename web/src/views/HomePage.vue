<template>
  <!-- Not authenticated users - standalone layout -->
  <div v-if="!authStore.isAuthenticated" class="min-h-screen bg-background">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <div class="flex justify-center mb-8">
            <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-20 w-auto">
          </div>
          <h1 class="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {{ $t('app.title') }}
          </h1>
          <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {{ $t('app.description') }}
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/login"
              class="nesbat-button text-base px-8 py-3"
            >
              {{ $t('navigation.login') }}
            </router-link>
            <a
              href="#features"
              class="nesbat-button-secondary text-base px-8 py-3"
            >
              Özellikler
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="py-24 bg-muted/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            Neden Nesbat?
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            Arkadaşlarınızla birlikte video izleme deneyimini tamamen yeniden tasarladık.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="nesbat-card p-8 text-center">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">Senkronize İzleme</h3>
            <p class="text-muted-foreground">
              Herkes aynı anda izliyor. Duraklat, oynat, sar - herkes aynı noktada.
            </p>
          </div>
          
          <div class="nesbat-card p-8 text-center">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">Çoklu Kullanıcı</h3>
            <p class="text-muted-foreground">
              Arkadaşlarınızla birlikte katılın. Gerçek zamanlı katılımcı takibi.
            </p>
          </div>
          
          <div class="nesbat-card p-8 text-center">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">Güvenli & Hızlı</h3>
            <p class="text-muted-foreground">
              Modern teknolojilerle güvenli ve hızlı izleme deneyimi.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-16">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-foreground mb-4">
          Hemen Başlayın
        </h2>
        <p class="text-lg text-muted-foreground mb-8">
          Arkadaşlarınızla video izleme keyfi sadece bir tık uzakta.
        </p>
        <router-link
          to="/login"
          class="nesbat-button text-lg px-8 py-4"
        >
          Ücretsiz Başlayın
        </router-link>
      </div>
    </div>
  </div>
  
  <!-- Authenticated users - with auth layout -->
  <AuthLayout v-else>
    <div class="px-4 py-6 sm:px-0">
      <!-- Welcome Header -->
      <div class="nesbat-card p-8 mb-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <img 
              :src="authStore.user?.avatar" 
              :alt="authStore.user?.name"
              class="w-16 h-16 rounded-full border-4 border-primary/20"
            />
            <div>
              <h1 class="text-2xl font-bold text-foreground">
                {{ $t('auth.welcome') }}, {{ authStore.user?.name }}!
              </h1>
              <p class="text-muted-foreground">{{ authStore.user?.email }}</p>
            </div>
          </div>
          <router-link
            to="/sessions"
            class="nesbat-button px-6 py-3"
          >
            {{ $t('navigation.sessions') }}
          </router-link>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer" @click="$router.push('/sessions')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7v2m0 0v2m0-2h2m-2 0h-2m-7 12a3 3 0 01-3-3V5a3 3 0 013-3h2a3 3 0 013 3v11a3 3 0 01-3 3h-2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">Oturum Listesi</h3>
              <p class="text-sm text-muted-foreground">Aktif oturumları görüntüle</p>
            </div>
          </div>
        </div>

        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer" @click="createSession">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">Yeni Oturum</h3>
              <p class="text-sm text-muted-foreground">Hemen oturum oluştur</p>
            </div>
          </div>
        </div>

        <div class="nesbat-card p-6 hover:scale-105 transition-transform cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-foreground">Nasıl Kullanılır?</h3>
              <p class="text-sm text-muted-foreground">Rehber ve ipuçları</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="nesbat-card p-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">Son Aktiviteler</h2>
        <div class="text-center py-8">
          <svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-muted-foreground">Henüz aktivite yok</p>
          <p class="text-sm text-muted-foreground">İlk oturumunuzu oluşturun!</p>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'

const authStore = useAuthStore()
const router = useRouter()

// Fetch user data when component mounts
onMounted(() => {
  if (!authStore.user) {
    authStore.fetchUser()
  }
})

const createSession = () => {
  router.push('/sessions?create=true')
}
</script> 