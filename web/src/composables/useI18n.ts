import { useI18n as useVueI18n } from 'vue-i18n'
import { setLocale, getCurrentLocale, getLocaleNames, type SupportedLocale, SUPPORTED_LOCALES } from '@/i18n'

export function useI18n() {
  const { t, locale } = useVueI18n()

  const switchLocale = (newLocale: SupportedLocale) => {
    setLocale(newLocale)
  }

  const toggleLocale = () => {
    const current = getCurrentLocale()
    const newLocale = current === 'tr' ? 'en' : 'tr'
    setLocale(newLocale)
  }

  return {
    t,
    locale,
    switchLocale,
    toggleLocale,
    getCurrentLocale,
    getLocaleNames,
    supportedLocales: SUPPORTED_LOCALES
  }
} 