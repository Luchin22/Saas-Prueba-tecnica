import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppNavBar from './AppNavBar.vue'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/services/socket')
vi.mock('@/services/http')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
      { path: '/licenses', name: 'licenses', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
}

describe('AppNavBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hides the Licencias link for a non-admin user', async () => {
    const router = createTestRouter()
    await router.push('/dashboard')
    await router.isReady()
    const authStore = useAuthStore()
    authStore.user = { id: 'u1', email: 'employee@acme.test', role: 'USER', companyId: 'c1' }
    authStore.token = 'jwt'

    const wrapper = mount(AppNavBar, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('employee@acme.test')
    expect(wrapper.text()).not.toContain('Licencias')
  })

  it('shows the Licencias link for an admin user and logs out on click', async () => {
    const router = createTestRouter()
    await router.push('/dashboard')
    await router.isReady()
    const authStore = useAuthStore()
    authStore.user = { id: 'u1', email: 'admin@acme.test', role: 'ADMIN', companyId: 'c1' }
    authStore.token = 'jwt'

    const wrapper = mount(AppNavBar, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Licencias')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(authStore.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe('login')
  })
})
