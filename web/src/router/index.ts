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
  
  // Sadece authentication gerektiren route'larda session doğrula
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    await authStore.fetchUser()
  }

  // Authentication gerektiren route'a yetkisiz giriş kontrolü
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Eğer zaten authenticated ve login sayfasına gidiyorsa ana sayfaya yönlendir
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router 