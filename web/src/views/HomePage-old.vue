<template>
  <!-- Not authenticated users - standalone layout -->
  <div v-if="!authStore.isAuthenticated" class="min-h-screen bg-background">
    <!-- Hero Section with Animated Background -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <!-- Logo with Animation -->
          <div class="flex justify-center mb-8">
            <div class="relative">
              <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-24 w-auto animate-bounce">
              <div class="absolute -top-2 -right-2 text-2xl animate-spin">🎬</div>
            </div>
          </div>
          
          <!-- Main Title -->
          <h1 class="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            {{ $t('home.hero.title') }}
          </h1>
          
          <!-- Catchphrase -->
          <div class="mb-4">
            <span class="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              {{ $t('home.character.catchphrase') }}
            </span>
          </div>
          
          <!-- Funny Intro -->
          <p class="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            {{ $t('home.hero.subtitle') }}
          </p>
          
          <p class="text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto italic">
            {{ $t('home.hero.funnyIntro') }}
          </p>
          
          <!-- Stats Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-5xl mx-auto">
            <div class="bg-primary/5 rounded-lg p-6 border border-primary/10 hover:scale-105 transition-transform">
              <div class="text-base font-medium text-primary">{{ $t('home.hero.stats.realtime') }}</div>
            </div>
            <div class="bg-green-500/5 rounded-lg p-6 border border-green-500/10 hover:scale-105 transition-transform">
              <div class="text-base font-medium text-green-600">{{ $t('home.hero.stats.multiuser') }}</div>
            </div>
            <div class="bg-blue-500/5 rounded-lg p-6 border border-blue-500/10 hover:scale-105 transition-transform">
              <div class="text-base font-medium text-blue-600">{{ $t('home.hero.stats.opensource') }}</div>
            </div>
            <div class="bg-purple-500/5 rounded-lg p-6 border border-purple-500/10 hover:scale-105 transition-transform">
              <div class="text-base font-medium text-purple-600">{{ $t('home.hero.stats.fun') }}</div>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/login"
              class="nesbat-button text-lg px-8 py-4 hover:scale-105 transition-transform"
            >
              🚀 {{ $t('navigation.login') }}
            </router-link>
            <a
              href="#about"
              class="nesbat-button-secondary text-lg px-8 py-4 hover:scale-105 transition-transform"
            >
              📚 {{ $t('home.buttons.features') }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- About/Story Section -->
    <div id="about" class="py-24 bg-muted/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {{ $t('home.about.title') }}
          </h2>
          <p class="text-xl text-primary font-medium mb-4">
            {{ $t('home.about.subtitle') }}
          </p>
          
          <!-- Story Content -->
          <div class="max-w-4xl mx-auto">
            <div class="nesbat-card p-8 mb-8 text-left">
              <div class="flex items-start gap-4 mb-6">
                <div class="text-4xl">🎭</div>
                <div>
                  <p class="text-lg text-muted-foreground leading-relaxed">
                    {{ $t('home.about.description') }}
                  </p>
                </div>
              </div>
              
              <!-- Funny Story -->
              <div class="bg-primary/5 rounded-lg p-6 border-l-4 border-primary">
                <div class="flex items-start gap-3">
                  <div class="text-2xl">💡</div>
                  <p class="text-muted-foreground italic">
                    {{ $t('home.about.funnyStory') }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Problem & Solution Cards -->
            <div class="grid md:grid-cols-2 gap-8">
              <div class="nesbat-card p-8 hover:scale-105 transition-transform">
                <div class="text-center">
                  <div class="text-4xl mb-4">{{ $t('home.about.problem.title') }}</div>
                  <p class="text-muted-foreground">
                    {{ $t('home.about.problem.description') }}
                  </p>
                </div>
              </div>
              
              <div class="nesbat-card p-8 hover:scale-105 transition-transform">
                <div class="text-center">
                  <div class="text-4xl mb-4">{{ $t('home.about.solution.title') }}</div>
                  <p class="text-muted-foreground">
                    {{ $t('home.about.solution.description') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="py-24 bg-background">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            {{ $t('home.features.sectionTitle') }}
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            {{ $t('home.features.sectionSubtitle') }}
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.syncWatch.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.syncWatch.description') }}
            </p>
          </div>
          
          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.multiUser.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.multiUser.description') }}
            </p>
          </div>
          
          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.secure.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.secure.description') }}
            </p>
          </div>

          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.realTime.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.realTime.description') }}
            </p>
          </div>

          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.noSignup.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.noSignup.description') }}
            </p>
          </div>

          <div class="nesbat-card p-8 text-center hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">{{ $t('home.features.crossPlatform.title') }}</h3>
            <p class="text-muted-foreground">
              {{ $t('home.features.crossPlatform.description') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- How It Works Section -->
    <div class="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-foreground mb-4">
            {{ $t('home.howItWorks.title') }}
          </h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span class="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-4">{{ $t('home.howItWorks.step1.title') }}</h3>
            <p class="text-muted-foreground">{{ $t('home.howItWorks.step1.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span class="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-4">{{ $t('home.howItWorks.step2.title') }}</h3>
            <p class="text-muted-foreground">{{ $t('home.howItWorks.step2.description') }}</p>
          </div>
          
          <div class="text-center">
            <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span class="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-4">{{ $t('home.howItWorks.step3.title') }}</h3>
            <p class="text-muted-foreground">{{ $t('home.howItWorks.step3.description') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Providers Section -->
    <div class="py-24 bg-gradient-to-r from-red-500/10 via-background to-blue-500/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {{ $t('home.providers.title') }}
          </h2>
          <p class="text-xl text-primary font-medium mb-8">
            {{ $t('home.providers.subtitle') }}
          </p>
          
          <div class="max-w-5xl mx-auto">
            <div class="grid md:grid-cols-2 gap-8">
              <!-- Current Providers -->
              <div class="nesbat-card p-8">
                <h3 class="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <span class="text-3xl">🚀</span>
                  {{ $t('home.providers.current.title') }}
                </h3>
                
                <div class="space-y-4">
                  <div class="flex items-center gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div class="text-3xl">▶️</div>
                    <div>
                      <div class="font-medium text-foreground">{{ $t('home.providers.current.youtube') }}</div>
                      <div class="text-sm text-muted-foreground">Real-time sync, seek, play/pause controls</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Planned Providers -->
              <div class="nesbat-card p-8">
                <h3 class="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <span class="text-3xl">🔜</span>
                  {{ $t('home.providers.planned.title') }}
                </h3>
                
                <div class="space-y-3">
                  <div v-for="platform in $t('home.providers.planned.platforms')" :key="platform" 
                       class="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border">
                    <span class="text-blue-500">📋</span>
                    <span class="text-sm text-muted-foreground">{{ platform }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Blog Section (Simplified) -->
    <div class="py-16 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl font-bold text-foreground mb-4">
          {{ $t('home.blog.title') }}
        </h2>
        <p class="text-lg text-muted-foreground mb-6">
          {{ $t('home.blog.description') }}
        </p>
        <div class="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <p class="text-primary font-medium">{{ $t('home.blog.announcement') }}</p>
        </div>
      </div>
    </div>

    <!-- GitHub Section -->
    <div class="py-24 bg-gradient-to-br from-gray-900/5 via-background to-gray-800/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {{ $t('home.github.title') }}
          </h2>
          <p class="text-xl text-primary font-medium mb-8">
            {{ $t('home.github.subtitle') }}
          </p>
          
          <div class="max-w-5xl mx-auto">
            <!-- Main Description -->
            <div class="nesbat-card p-8 mb-8">
              <div class="flex items-start gap-4 mb-6">
                <div class="text-4xl">🐙</div>
                <div class="text-left">
                  <p class="text-lg text-muted-foreground leading-relaxed mb-4">
                    {{ $t('home.github.description') }}
                  </p>
                  <div class="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                    <p class="text-sm text-yellow-700 dark:text-yellow-400 italic">
                      {{ $t('home.github.funnyWarning') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Clone Instructions -->
            <div class="grid md:grid-cols-2 gap-8 mb-8">
              <div class="nesbat-card p-8">
                <h3 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  {{ $t('home.github.clone.title') }}
                </h3>
                <p class="text-muted-foreground mb-4">{{ $t('home.github.clone.subtitle') }}</p>
                
                <div class="space-y-3">
                  <div v-for="(step, index) in $t('home.github.clone.steps')" :key="index" 
                       class="bg-gray-900/5 dark:bg-gray-100/5 rounded-md p-3 font-mono text-sm">
                    <div class="text-primary font-medium mb-1">{{ index + 1 }}.</div>
                    <code class="text-muted-foreground">{{ step }}</code>
                  </div>
                </div>
                
                <div class="mt-4 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <p class="text-sm text-green-600 dark:text-green-400">
                    {{ $t('home.github.clone.encouragement') }}
                  </p>
                </div>
              </div>
              
              <!-- Contribution Types -->
              <div class="nesbat-card p-8">
                <h3 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  {{ $t('home.github.contribute.title') }}
                </h3>
                <p class="text-muted-foreground mb-4">{{ $t('home.github.contribute.description') }}</p>
                
                <div class="space-y-3">
                  <div v-for="type in $t('home.github.contribute.types')" :key="type" 
                       class="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span class="text-sm text-muted-foreground">{{ type }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="text-center">
              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="https://github.com/baranaytas/sync-watch-app-3"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="nesbat-button text-lg px-8 py-4 flex items-center gap-3 hover:scale-105 transition-transform"
                >
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  🚀 {{ $t('home.github.button') }}
                </a>
                
                <div class="flex items-center gap-2 text-muted-foreground">
                  <span>{{ $t('home.github.stars') }}</span>
                  <div class="flex gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-yellow-500">⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Final CTA Section -->
    <div class="py-24 bg-gradient-to-r from-primary/10 via-background to-primary/5">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div class="text-6xl mb-6">🎬🍿</div>
        <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
          {{ $t('home.cta.title') }}
        </h2>
        <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {{ $t('home.cta.subtitle') }}
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <router-link
            to="/login"
            class="nesbat-button text-xl px-10 py-5 hover:scale-105 transition-transform shadow-lg"
          >
            {{ $t('home.cta.button') }}
          </router-link>
          <a
            href="#about"
            class="nesbat-button-secondary text-xl px-10 py-5 hover:scale-105 transition-transform"
          >
            📖 Hikayeyi Oku
          </a>
        </div>
        
        <!-- Fun Quote -->
        <div class="bg-primary/5 rounded-lg p-6 border border-primary/10 max-w-2xl mx-auto">
          <p class="text-lg italic text-muted-foreground">
            "{{ $t('home.character.mission') }}"
          </p>
          <div class="text-sm text-primary font-medium mt-2">- {{ $t('home.character.name') }} 🎭</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-muted/20 py-12 border-t border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <!-- Logo and Name -->
          <div class="flex justify-center items-center gap-3 mb-6">
            <img src="@/assets/nesbat-logo.svg" alt="Nesbat Logo" class="h-8 w-auto">
            <span class="text-xl font-semibold text-foreground">{{ $t('app.brandTitle') }}</span>
          </div>
          
          <!-- Links -->
          <div class="flex justify-center items-center gap-6 mb-6 flex-wrap">
            <a href="https://github.com/baranaytas/sync-watch-app-3" target="_blank" rel="noopener noreferrer" 
               class="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <router-link to="/sessions" class="text-muted-foreground hover:text-primary transition-colors">
              {{ $t('navigation.sessions') }}
            </router-link>
            <router-link to="/login" class="text-muted-foreground hover:text-primary transition-colors">
              {{ $t('navigation.login') }}
            </router-link>
          </div>
          
          <!-- Copyright -->
          <div class="text-sm text-muted-foreground">
            <p class="mb-2">{{ $t('app.description') }}</p>
            <p>Made with ❤️ by <a href="#" class="text-primary hover:underline" title="Personal website coming soon!">Baran Aytaş</a> & 🤖 <span class="text-purple-600">Claude AI</span></p>
            <p class="mt-1 text-xs italic">👨‍💻 Portfolio & personal website link will be added soon!</p>
            <p class="mt-2 text-xs">{{ new Date().getFullYear() }} - Open Source Project</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
  
  <!-- Authenticated users - with auth layout -->
  <AuthLayout v-else>
    <div class="px-4 py-6 sm:px-0">
      <!-- Welcome Header -->
      <div class="nesbat-card p-8 mb-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <img 
              :src="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.name || 'User')}&background=6366f1&color=ffffff&rounded=true`"
              :alt="authStore.user?.name"
              class="w-16 h-16 rounded-full border-4 border-primary/20"
              @error="$event.target.src = 'https://ui-avatars.com/api/?name=Guest&background=6366f1&color=ffffff&rounded=true'"
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
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.sessionsList.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.sessionsList.description') }}</p>
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
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.newSession.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.newSession.description') }}</p>
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
              <h3 class="font-semibold text-foreground">{{ $t('home.dashboard.guide.title') }}</h3>
              <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.guide.description') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="nesbat-card p-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.dashboard.recentActivity.title') }}</h2>
        <div class="text-center py-8">
          <svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-muted-foreground">{{ $t('home.dashboard.recentActivity.noActivity') }}</p>
          <p class="text-sm text-muted-foreground">{{ $t('home.dashboard.recentActivity.createFirst') }}</p>
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