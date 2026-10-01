import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Socket } from 'socket.io-client'
import type { DailyUsage, UsageSummary } from '@/types/api'
import * as usageApi from '@/services/usage.api'

export const useUsageStore = defineStore('usage', () => {
  const totalCalls = ref(0)
  const usageLimit = ref(0)
  const percentage = ref(0)
  const alertThreshold = ref(0.8)
  const history = ref<DailyUsage[]>([])
  const alertActive = ref(false)
  const loading = ref(false)

  const percentageLabel = computed(() => `${Math.round(percentage.value * 100)}%`)

  async function fetchUsage(): Promise<void> {
    loading.value = true
    try {
      applySummary(await usageApi.fetchUsage())
    } finally {
      loading.value = false
    }
  }

  async function simulate(count?: number): Promise<void> {
    applySummary(await usageApi.simulateUsage(count))
  }

  function applySummary(summary: UsageSummary): void {
    totalCalls.value = summary.totalCalls
    usageLimit.value = summary.usageLimit
    percentage.value = summary.percentage
    alertThreshold.value = summary.alertThreshold
    history.value = summary.history
    alertActive.value = summary.percentage >= summary.alertThreshold
  }

  function attachRealtime(socket: Socket): void {
    socket.on('usage:update', (payload: UsageSummary) => applySummary(payload))
    socket.on('usage:alert', () => {
      alertActive.value = true
    })
  }

  function reset(): void {
    totalCalls.value = 0
    usageLimit.value = 0
    percentage.value = 0
    alertThreshold.value = 0.8
    history.value = []
    alertActive.value = false
  }

  return {
    totalCalls,
    usageLimit,
    percentage,
    alertThreshold,
    history,
    alertActive,
    loading,
    percentageLabel,
    fetchUsage,
    simulate,
    attachRealtime,
    reset,
  }
})
