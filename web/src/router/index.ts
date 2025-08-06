import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login', 
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/session/:id',
    name: 'SessionRoom',
    component: () => import('@/views/SessionRoomPage.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Ensure auth store is initialized from localStorage before checking authentication
  authStore.initializeAuth()
  
  // Give a tick for reactive updates
  await new Promise(resolve => setTimeout(resolve, 0))
  
  // Debug router guard execution
  console.log('🛡️ Router Guard:', {
    toPath: to.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    hasUserInStorage: !!localStorage.getItem('user'),
    hasTokenInStorage: !!localStorage.getItem('auth_token')
  })
  
  // Sadece authentication gerektiren route'larda session doğrula
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    console.log('🛡️ Router Guard: Fetching user data for authenticated route')
    try {
      await authStore.fetchUser()
      console.log('🛡️ Router Guard: User fetch completed successfully')
    } catch (error) {
      console.log('🛡️ Router Guard: User fetch failed:', error)
    }
  }

  // Authentication gerektiren route'a yetkisiz giriş kontrolü
  // Check both auth store and localStorage as fallback for authentication
  const hasLocalStorageAuth = !!localStorage.getItem('user') && !!localStorage.getItem('auth_token')
  const isActuallyAuthenticated = authStore.isAuthenticated || hasLocalStorageAuth
  
  if (to.meta.requiresAuth && !isActuallyAuthenticated) {
    console.log('🛡️ Router Guard: Redirecting to /login - user not authenticated', {
      storeAuth: authStore.isAuthenticated,
      localStorageAuth: hasLocalStorageAuth,
      actualAuth: isActuallyAuthenticated
    })
    next('/login')
    return
  } else if (to.meta.requiresAuth && isActuallyAuthenticated) {
    console.log('🛡️ Router Guard: User is authenticated', {
      storeAuth: authStore.isAuthenticated,
      localStorageAuth: hasLocalStorageAuth,
      actualAuth: isActuallyAuthenticated
    })
  }
  
  // Eğer zaten authenticated ve login sayfasına gidiyorsa ana sayfaya yönlendir
  if (to.name === 'Login' && authStore.isAuthenticated) {
    console.log('🛡️ Router Guard: Redirecting authenticated user from /login to /')
    next('/')
    return
  }
  
  console.log('🛡️ Router Guard: Allowing navigation to', to.path)
  next()
})

export default router 