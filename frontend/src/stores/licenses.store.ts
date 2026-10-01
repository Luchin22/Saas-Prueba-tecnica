import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Socket } from 'socket.io-client'
import type { UserSummary } from '@/types/api'
import * as licensesApi from '@/services/licenses.api'

export const useLicensesStore = defineStore('licenses', () => {
  const users = ref<UserSummary[]>([])
  const loading = ref(false)

  async function fetchUsers(): Promise<void> {
    loading.value = true
    try {
      users.value = await licensesApi.fetchUsers()
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(email: string, password: string): Promise<void> {
    const user = await licensesApi.createEmployee(email, password)
    users.value = [...users.value, user]
  }

  async function assignLicense(userId: string): Promise<void> {
    await licensesApi.assignLicense(userId)
    const target = users.value.find((candidate) => candidate.id === userId)
    if (target) {
      target.hasActiveLicense = true
    }
  }

  function attachRealtime(socket: Socket): void {
    socket.on('licenses:updated', (payload: { userId: string; status: string }) => {
      const target = users.value.find((candidate) => candidate.id === payload.userId)
      if (target) {
        target.hasActiveLicense = payload.status === 'ACTIVE'
      }
    })
  }

  return { users, loading, fetchUsers, createEmployee, assignLicense, attachRealtime }
})
