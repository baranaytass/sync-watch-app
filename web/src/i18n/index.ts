import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import tr from '@/locales/tr.json'

// Type-safe locale support
export type SupportedLocale = 'en' | 'tr'

// Available locales
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'tr']

// Get default locale from browser or fallback to Turkish since app is primarily Turkish
function getDefaultLocale(): SupportedLocale {
  const browserLang = navigator.language.toLowerCase()
  
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  
  // Default to Turkish for Turkish users and any other language
  return 'tr'
}

// Get locale from localStorage or use default
function getStoredLocale(): SupportedLocale {
  const stored = localStorage.getItem('locale') as SupportedLocale
  return SUPPORTED_LOCALES.includes(stored) ? stored : getDefaultLocale()
}

// Create i18n instance
export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getStoredLocale(),
  fallbackLocale: 'tr', // Fallback to Turkish as it's the primary language
  messages: {
    en,
    tr
  },
  globalInjection: true, // Enable global $t usage in templates
})

// Locale management functions
export function setLocale(locale: SupportedLocale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`)
    return
  }
  
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  
  // Update document direction and language
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'tr' ? 'ltr' : 'ltr' // Both are LTR
}

export function getCurrentLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}

export function getLocaleNames() {
  return {
    en: 'English',
    tr: 'Türkçe'
  }
}

// Initialize locale on app start
setLocale(getStoredLocale())

export default i18n 