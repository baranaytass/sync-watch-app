import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login', 
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/sessions',
    name: 'Sessions',
    component: () => import('@/views/SessionsPage.vue'),
    meta: { requiresAuth: true }
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
  
  // Eğer kullanıcı bilgisi yoksa ve authentication gerektiren bir sayfaya gidiyorsa
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Önce kullanıcı bilgisini almaya çalış (session'dan)
    await authStore.fetchUser()
    
    // Hala authenticated değilse login sayfasına yönlendir
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
  }
  
  // Eğer zaten authenticated ve login sayfasına gidiyorsa ana sayfaya yönlendir
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router 