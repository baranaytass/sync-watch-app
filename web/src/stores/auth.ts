import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import router from '@/router'

export interface User {
  id: string
  googleId: string
  email: string
  name: string
  avatar: string
  createdAt: Date
  updatedAt: Date
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Configure axios defaults
axios.defaults.withCredentials = true

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Initialize user from localStorage on store creation
  const initializeAuth = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('user')
      }
    }
  }

  // Actions
  const loginWithGoogle = () => {
    loading.value = true
    error.value = null
    // Redirect to backend Google OAuth
    window.location.href = `${API_BASE_URL}/api/auth/google`
  }

  const loginAsGuest = async (customName?: string) => {
    try {
      loading.value = true
      error.value = null

      const guestName = customName || 'Misafir Kullanıcı'

      const response = await axios.post(`${API_BASE_URL}/api/auth/guest`, {
        name: guestName
      }, {
        withCredentials: true
      })

      if (response.data.success && response.data.data) {
        const guestUser: User = response.data.data
        user.value = guestUser
        localStorage.setItem('user', JSON.stringify(guestUser))

        // Debug: Check if cookies are set after guest login
        console.log('🍪 Auth Store: Guest login successful, checking cookies...')
        console.log('🍪 Auth Store: Document cookies:', document.cookie)
        console.log('🍪 Auth Store: Response headers:', response.headers)

        // Redirect to home page after login
        await router.push('/')
      } else {
        throw new Error('Guest login failed')
      }
    } catch (err) {
      error.value = 'Guest login failed'
      console.error('Guest login error:', err)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      await axios.post(`${API_BASE_URL}/api/auth/logout`)
    } catch (err) {
      error.value = 'Logout failed'
      console.error('Logout error:', err)
    } finally {
      user.value = null
      localStorage.removeItem('user')
      loading.value = false
      await router.push('/login')
    }
  }

  const fetchUser = async () => {
    // Always verify session with backend to ensure cookie is valid
    
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`)
      if (response.data.success && response.data.data) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
      }
    } catch (err: any) {
      user.value = null
      localStorage.removeItem('user')
      if (err.response?.status !== 401) {
        console.error('Fetch user error:', err)
      }
    } finally {
      loading.value = false
    }
  }

  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    loginWithGoogle,
    loginAsGuest,
    logout,
    fetchUser,
    setUser,
    clearError,
    initializeAuth
  }
}) 