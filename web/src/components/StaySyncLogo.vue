<template>
  <div class="flex items-center" :class="containerClasses">
    <!-- STAY SYNC Icon -->
    <div class="relative">
      <img 
        :class="iconClasses"
        :src="logoSrc" 
        alt="STAY SYNC Logo"
        class="object-contain"
      />
    </div>
    
    <!-- Brand Text -->
    <div v-if="showText" class="flex flex-col">
      <span :class="titleClasses" class="brand-font font-bold tracking-wide text-foreground leading-none">
        STAY SYNC
      </span>
      <span v-if="showTagline" :class="taglineClasses" class="text-muted-foreground font-medium tracking-wide">
        Watch Sync, Stay Connected
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

interface Props {
  showText?: boolean
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'auto' | 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  showTagline: false,
  size: 'md',
  variant: 'auto'
})

const themeStore = useThemeStore()

const logoSrc = computed(() => {
  if (props.variant === 'light') {
    // Light variant: use dark logo (for light backgrounds)
    return new URL('@/assets/stay-sync-icon-light.png', import.meta.url).href
  } else if (props.variant === 'dark') {
    // Dark variant: use light logo (for dark backgrounds)
    return new URL('@/assets/stay-sync-icon-transparent.png', import.meta.url).href
  } else {
    // Auto mode: check theme store for current theme
    if (themeStore.currentTheme === 'dark') {
      // Dark theme: use light logo (green/white)
      return new URL('@/assets/stay-sync-icon-transparent.png', import.meta.url).href
    } else {
      // Light theme: use dark logo (black/green)
      return new URL('@/assets/stay-sync-icon-light.png', import.meta.url).href
    }
  }
})

const containerClasses = computed(() => {
  return props.showText ? 'gap-3' : ''
})

const iconClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8' // 32px for small contexts
    case 'lg':
      return 'h-16 w-16' // 64px for hero sections
    case 'xl':
      return 'h-32 w-32' // 128px for extra large hero sections
    default:
      return 'h-12 w-12' // 48px base size
  }
})

const titleClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-lg'
    case 'lg':
      return 'text-3xl'
    case 'xl':
      return 'text-5xl'
    default:
      return 'text-xl'
  }
})

const taglineClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-sm'
    case 'xl':
      return 'text-lg'
    default:
      return 'text-xs'
  }
})
</script>