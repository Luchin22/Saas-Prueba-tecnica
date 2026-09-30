import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import * as authApi from '@/services/auth.api'
import { connectSocket } from '@/services/socket'

vi.mock('@/services/auth.api')
vi.mock('@/services/http')
vi.mock('@/services/socket')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
    ],
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    vi.mocked(connectSocket).mockReturnValue({ on: vi.fn<(event: string, handler: (...args: unknown[]) => void) => void>() } as never)
  })

  it('logs in and redirects to the dashboard on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'jwt-token',
      user: { id: 'user-1', email: 'admin@acme.test', role: 'ADMIN', companyId: 'company-1' },
    })
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('#email').setValue('admin@acme.test')
    await wrapper.find('#password').setValue('Password123!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authApi.login).toHaveBeenCalledWith('admin@acme.test', 'Password123!')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('shows an error message and stays on the page when login fails', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('#email').setValue('admin@acme.test')
    await wrapper.find('#password').setValue('wrong-password')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo iniciar sesión')
    expect(router.currentRoute.value.name).toBe('login')
  })
})
