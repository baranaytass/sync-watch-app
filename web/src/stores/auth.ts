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

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  const loginWithGoogle = () => {
    loading.value = true
    // Redirect to backend Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`
  }

  const logout = async () => {
    try {
      loading.value = true
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/logout`, {}, {
        withCredentials: true
      })
      user.value = null
    } catch (err) {
      error.value = 'Logout failed'
      console.error('Logout error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
        withCredentials: true
      })
      user.value = response.data.data
    } catch (err) {
      user.value = null
      console.error('Fetch user error:', err)
    } finally {
      loading.value = false
    }
  }

  const setUser = (userData: User) => {
    user.value = userData
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    loginWithGoogle,
    logout,
    fetchUser,
    setUser,
    clearError
  }
}) 