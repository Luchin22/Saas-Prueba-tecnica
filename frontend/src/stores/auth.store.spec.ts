import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'
import * as authApi from '@/services/auth.api'
import { setAuthToken } from '@/services/http'
import { connectSocket, disconnectSocket } from '@/services/socket'
import type { LoginResponse } from '@/types/api'

vi.mock('@/services/auth.api')
vi.mock('@/services/http')
vi.mock('@/services/socket')

const loginResponse: LoginResponse = {
  accessToken: 'jwt-token',
  user: { id: 'user-1', email: 'admin@acme.test', role: 'ADMIN', companyId: 'company-1' },
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.resetAllMocks()
    vi.mocked(connectSocket).mockReturnValue({ on: vi.fn<(event: string, handler: (...args: unknown[]) => void) => void>() } as never)
  })

  it('login stores the session, propagates the token, and connects the realtime socket', async () => {
    vi.mocked(authApi.login).mockResolvedValue(loginResponse)
    const store = useAuthStore()

    await store.login('admin@acme.test', 'Password123!')

    expect(store.isAuthenticated).toBe(true)
    expect(store.role).toBe('ADMIN')
    expect(setAuthToken).toHaveBeenCalledWith('jwt-token')
    expect(connectSocket).toHaveBeenCalledWith('jwt-token')
    expect(localStorage.getItem('saas.auth.token')).toBe('jwt-token')
  })

  it('logout clears state, storage and disconnects the socket', async () => {
    vi.mocked(authApi.login).mockResolvedValue(loginResponse)
    const store = useAuthStore()
    await store.login('admin@acme.test', 'Password123!')

    store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(setAuthToken).toHaveBeenCalledWith(null)
    expect(disconnectSocket).toHaveBeenCalled()
    expect(localStorage.getItem('saas.auth.token')).toBeNull()
  })

  it('restoreSession rehydrates state from localStorage', () => {
    localStorage.setItem('saas.auth.token', 'stored-token')
    localStorage.setItem('saas.auth.user', JSON.stringify(loginResponse.user))
    const store = useAuthStore()

    store.restoreSession()

    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.email).toBe('admin@acme.test')
    expect(connectSocket).toHaveBeenCalledWith('stored-token')
  })

  it('restoreSession leaves the store logged out when nothing is stored', () => {
    const store = useAuthStore()

    store.restoreSession()

    expect(store.isAuthenticated).toBe(false)
  })

  it('restoreSession recovers gracefully from corrupted storage', () => {
    localStorage.setItem('saas.auth.token', 'stored-token')
    localStorage.setItem('saas.auth.user', '{not-json')
    const store = useAuthStore()

    store.restoreSession()

    expect(store.isAuthenticated).toBe(false)
  })
})
