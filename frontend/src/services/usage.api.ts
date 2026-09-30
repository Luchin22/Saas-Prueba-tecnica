import { apiFetch } from './http'
import type { UsageSummary } from '@/types/api'

export function fetchUsage(): Promise<UsageSummary> {
  return apiFetch<UsageSummary>('/usage')
}

export function simulateUsage(count?: number): Promise<UsageSummary> {
  return apiFetch<UsageSummary>('/usage/simulate', {
    method: 'POST',
    body: count !== undefined ? { count } : {},
  })
}
