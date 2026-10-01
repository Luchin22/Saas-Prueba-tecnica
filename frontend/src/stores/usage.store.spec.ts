import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsageStore } from './usage.store'
import * as usageApi from '@/services/usage.api'
import type { UsageSummary } from '@/types/api'

vi.mock('@/services/usage.api')

const summary: UsageSummary = {
  totalCalls: 400,
  usageLimit: 1000,
  percentage: 0.4,
  alertThreshold: 0.8,
  history: [{ date: '2026-01-01', count: 400 }],
}

describe('usage store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('fetchUsage populates state from the API summary', async () => {
    vi.mocked(usageApi.fetchUsage).mockResolvedValue(summary)
    const store = useUsageStore()

    await store.fetchUsage()

    expect(store.totalCalls).toBe(400)
    expect(store.usageLimit).toBe(1000)
    expect(store.percentageLabel).toBe('40%')
    expect(store.alertActive).toBe(false)
  })

  it('marks alertActive true once the percentage reaches the threshold', async () => {
    vi.mocked(usageApi.fetchUsage).mockResolvedValue({ ...summary, percentage: 0.85 })
    const store = useUsageStore()

    await store.fetchUsage()

    expect(store.alertActive).toBe(true)
  })

  it('simulate() forwards the count and applies the returned summary', async () => {
    vi.mocked(usageApi.simulateUsage).mockResolvedValue({ ...summary, totalCalls: 450 })
    const store = useUsageStore()

    await store.simulate(50)

    expect(usageApi.simulateUsage).toHaveBeenCalledWith(50)
    expect(store.totalCalls).toBe(450)
  })

  it('resets loading state even when the request fails', async () => {
    vi.mocked(usageApi.fetchUsage).mockRejectedValue(new Error('network error'))
    const store = useUsageStore()

    await expect(store.fetchUsage()).rejects.toThrow('network error')
    expect(store.loading).toBe(false)
  })

  it('attachRealtime updates state on usage:update and flips alertActive on usage:alert', () => {
    const handlers = new Map<string, (payload?: unknown) => void>()
    const socket = {
      on: vi.fn<(event: string, handler: (payload?: unknown) => void) => void>((event, handler) =>
        handlers.set(event, handler),
      ),
    }
    const store = useUsageStore()

    store.attachRealtime(socket as never)
    handlers.get('usage:update')?.({ ...summary, totalCalls: 999 })
    expect(store.totalCalls).toBe(999)

    handlers.get('usage:alert')?.()
    expect(store.alertActive).toBe(true)
  })

  it('reset() clears the store back to its initial values', async () => {
    vi.mocked(usageApi.fetchUsage).mockResolvedValue(summary)
    const store = useUsageStore()
    await store.fetchUsage()

    store.reset()

    expect(store.totalCalls).toBe(0)
    expect(store.history).toEqual([])
    expect(store.alertActive).toBe(false)
  })
})
