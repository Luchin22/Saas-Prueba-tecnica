import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthenticatedUser } from '@/types/api'
import * as authApi from '@/services/auth.api'
import { setAuthToken } from '@/services/http'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { useUsageStore } from './usage.store'
import { useLicensesStore } from './licenses.store'

const TOKEN_STORAGE_KEY = 'saas.auth.token'
const USER_STORAGE_KEY = 'saas.auth.user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthenticatedUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null)
  const role = computed(() => user.value?.role ?? null)

  function restoreSession(): void {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedToken && storedUser) {
        token.value = storedToken
        user.value = JSON.parse(storedUser) as AuthenticatedUser
        setAuthToken(storedToken)
        connectRealtime(storedToken)
      }
    } catch {
      token.value = null
      user.value = null
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await authApi.login(email, password)
    token.value = response.accessToken
    user.value = response.user
    setAuthToken(response.accessToken)
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
    connectRealtime(response.accessToken)
  }

  function logout(): void {
    token.value = null
    user.value = null
    setAuthToken(null)
    disconnectSocket()
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }

  function connectRealtime(authToken: string): void {
    const socket = connectSocket(authToken)
    useUsageStore().attachRealtime(socket)
    useLicensesStore().attachRealtime(socket)
  }

  return { token, user, isAuthenticated, role, restoreSession, login, logout }
})
