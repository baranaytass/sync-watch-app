import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import i18n from './i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Initialize stores after pinia is setup
const themeStore = useThemeStore()
themeStore.initializeTheme()

const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app') 