import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/types/api'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/features/dashboard/DashboardView.vue'),
    },
    {
      path: '/licenses',
      name: 'licenses',
      component: () => import('@/features/licenses/LicensesView.vue'),
      meta: { roles: ['ADMIN'] },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    return true
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  const requiredRoles = to.meta.roles as Role[] | undefined
  if (requiredRoles && (!authStore.role || !requiredRoles.includes(authStore.role))) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
