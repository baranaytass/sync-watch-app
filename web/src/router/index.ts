import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login', 
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/sessions',
    name: 'Sessions',
    component: () => import('@/views/SessionsPage.vue'),
  },
  {
    path: '/session/:id',
    name: 'SessionRoom',
    component: () => import('@/views/SessionRoomPage.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Auth kontrolü daha sonra eklenecek
  next()
})

export default router 