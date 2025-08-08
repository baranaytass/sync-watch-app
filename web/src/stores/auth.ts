import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, logApiCall } from '@/utils/api'
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('onrender.com') ? 'https://sync-watch-backend.onrender.com' : 'http://localhost:3000')

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Helper function to create request headers with auth token
  const createAuthHeaders = (): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    }
    
    // Add Authorization header if token exists in localStorage
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

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
      
      logApiCall('/api/auth/guest', 'POST', false)
      const result = await api.post<User>('/api/auth/guest', { name: guestName })

      if (result.success && result.data) {
        const guestUser: User = result.data
        user.value = guestUser
        localStorage.setItem('user', JSON.stringify(guestUser))

        // Debug: Guest login successful
        console.log('🍪 Auth Store: Guest login successful')
        console.log('🍪 Auth Store: Document cookies:', document.cookie)
        
        // Check if the response includes a token or create one
        // Note: With unified API, token handling is managed automatically
        if (!localStorage.getItem('auth_token')) {
          // Create a JWT-like token from user data for consistent auth
          console.log('🔧 Auth Store: Creating compatible auth token')
          
          // Create a simple JWT-like structure (header.payload.signature)
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
          const payload = btoa(JSON.stringify({ 
            userId: guestUser.id, 
            email: guestUser.email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
          }))
          const signature = btoa(`fallback_signature_${guestUser.id}`)
          
          const fallbackToken = `${header}.${payload}.${signature}`
          localStorage.setItem('auth_token', fallbackToken)
          console.log('🔑 Auth Store: JWT-like token created for session auth')
        }

        // Redirect to home page after login
        await router.push('/')
      } else {
        throw new Error('Guest login failed')
      }
      
    } catch (err: any) {
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
      
      const authToken = localStorage.getItem('auth_token')
      logApiCall('/api/auth/logout', 'POST', !!authToken)
      await api.post('/api/auth/logout')
    } catch (err) {
      error.value = 'Logout failed'
      console.error('Logout error:', err)
    } finally {
      user.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      loading.value = false
      await router.push('/login')
    }
  }

  const fetchUser = async () => {
    try {
      loading.value = true
      error.value = null
      
      const authToken = localStorage.getItem('auth_token')
      console.log('🔍 Auth Store: fetchUser - token available:', !!authToken)
      
      logApiCall('/api/auth/me', 'GET', !!authToken)
      const result = await api.get<User>('/api/auth/me')
      
      if (result.success && result.data) {
        user.value = result.data
        localStorage.setItem('user', JSON.stringify(result.data))
        console.log('✅ Auth Store: fetchUser successful')
      } else {
        throw new Error(result.error?.message || 'Failed to fetch user')
      }
    } catch (err: any) {
      console.log('❌ Auth Store: fetchUser failed:', err.message)
      
      // Only clear user data if we don't have a localStorage token
      const authToken = localStorage.getItem('auth_token')
      if (!authToken) {
        user.value = null
        localStorage.removeItem('user')
        console.log('🗑️ Auth Store: Cleared user data - no fallback token')
      } else {
        console.log('💾 Auth Store: Keeping user data - localStorage token exists')
      }
      
      if (!err.message?.includes('HTTP 401')) {
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

  const getToken = (): string | null => {
    return localStorage.getItem('auth_token')
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
    initializeAuth,
    getToken
  }
}) 