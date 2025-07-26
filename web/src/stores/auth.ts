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
      
      console.log(`🔥 Auth: Guest login API response:`, response.data)
      
      if (response.data.success && response.data.data) {
        const guestUser = response.data.data
        const token = response.data.token
        
        console.log(`🔥 Auth: Guest user data:`, guestUser)
        console.log(`🔥 Auth: Guest token:`, token ? 'YES (length=' + token.length + ')' : 'NO')
        
        // Store user data
        user.value = guestUser
        localStorage.setItem('user', JSON.stringify(guestUser))
        console.log(`🔥 Auth: Stored user data in localStorage`)
        
        // Store token for WebSocket use (backend sends it in response)
        if (token) {
          localStorage.setItem('auth_token', token)
          console.log(`🔥 Auth: Stored token in localStorage: ${token.substring(0, 20)}...`)
        } else {
          console.log(`🔥 Auth: No token received from backend!`)
        }
        
        loading.value = false
        
        // Store success state - let the component handle navigation
        console.log('✅ Guest authentication successful, token stored')
      } else {
        throw new Error('Guest login failed')
      }
      
    } catch (err: any) {
      loading.value = false
      error.value = 'Guest login failed'
      console.error('Guest login error:', err)
    }
  }

  const logout = async () => {
    try {
      console.log(`🔥 Auth: Starting logout process`)
      loading.value = true
      error.value = null
      
      // Check what we have before logout
      const userBefore = localStorage.getItem('user')
      const tokenBefore = localStorage.getItem('auth_token')
      console.log(`🔥 Auth: Before logout - user: ${userBefore ? 'YES' : 'NO'}, token: ${tokenBefore ? 'YES' : 'NO'}`)
      
      await axios.post(`${API_BASE_URL}/api/auth/logout`)
      console.log(`🔥 Auth: Logout API call successful`)
      
      user.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token') // Also remove token
      console.log(`🔥 Auth: Cleared user data and token from localStorage`)
    } catch (err) {
      console.error('🔥 Auth: Logout error:', err)
      error.value = 'Logout failed'
    } finally {
      loading.value = false
      console.log(`🔥 Auth: Logout process completed`)
    }
  }

  const fetchUser = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: createAuthHeaders(),
      })
      
      if (response.data.success && response.data.data) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
      }
    } catch (err: any) {
      user.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
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