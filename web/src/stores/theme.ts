import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<Theme>('dark')

  // Initialize theme from localStorage or system preference
  const initializeTheme = (): void => {
    const stored = localStorage.getItem('sync-watch-theme') as Theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (stored && ['light', 'dark'].includes(stored)) {
      currentTheme.value = stored
    } else {
      currentTheme.value = systemPrefersDark ? 'dark' : 'light'
    }
    
    applyTheme()
  }

  // Apply theme to document
  const applyTheme = (): void => {
    if (currentTheme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  // Toggle theme
  const toggleTheme = (): void => {
    currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
  }

  // Set specific theme
  const setTheme = (theme: Theme): void => {
    currentTheme.value = theme
  }

  // Watch theme changes and persist to localStorage
  watch(currentTheme, (newTheme) => {
    localStorage.setItem('sync-watch-theme', newTheme)
    applyTheme()
  }, { immediate: true })

  // Getters
  const isDark = (): boolean => currentTheme.value === 'dark'
  const isLight = (): boolean => currentTheme.value === 'light'

  return {
    currentTheme,
    initializeTheme,
    toggleTheme,
    setTheme,
    isDark,
    isLight
  }
}) 