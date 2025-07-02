import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

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

  const loginAsGuest = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Call backend to get JWT token for guest user
      const response = await axios.post(`${API_BASE_URL}/api/auth/guest`, {
        name: 'Misafir Kullanıcı',
        email: 'guest@example.com',
        guestId: 'guest-' + Date.now()
      })
      
      if (response.data.success && response.data.data) {
        const guestUser = response.data.data
        const token = response.data.token
        
        // Store user data
        user.value = guestUser
        localStorage.setItem('user', JSON.stringify(guestUser))
        
        // Store token for WebSocket use
        localStorage.setItem('auth_token', token)
        
        loading.value = false
        
        // Redirect to sessions page after login
        window.location.href = '/sessions'
      } else {
        throw new Error('Guest login failed')
      }
      
    } catch (err: any) {
      loading.value = false
      error.value = 'Guest login failed'
      console.error('Guest login error:', err)
      
      // Fallback to old guest logic if backend is not available
      const guestUser: User = {
        id: 'guest-' + Date.now(),
        googleId: 'guest',
        email: 'guest@example.com',
        name: 'Misafir Kullanıcı',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setTimeout(() => {
        user.value = guestUser
        localStorage.setItem('user', JSON.stringify(guestUser))
        loading.value = false
        window.location.href = '/sessions'
      }, 500)
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      await axios.post(`${API_BASE_URL}/api/auth/logout`)
      user.value = null
      localStorage.removeItem('user')
    } catch (err) {
      error.value = 'Logout failed'
      console.error('Logout error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async () => {
    // Skip API call for guest users
    if (user.value && user.value.googleId === 'guest') {
      console.log('👤 Guest user detected, skipping API call')
      return
    }
    
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