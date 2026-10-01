import { apiFetch } from './http'
import type { License, UserSummary } from '@/types/api'

export function fetchUsers(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>('/users')
}

export function createEmployee(email: string, password: string): Promise<UserSummary> {
  return apiFetch<UserSummary>('/users', { method: 'POST', body: { email, password } })
}

export function fetchLicenses(): Promise<License[]> {
  return apiFetch<License[]>('/licenses')
}

export function assignLicense(userId: string): Promise<License> {
  return apiFetch<License>('/licenses/assign', { method: 'POST', body: { userId } })
}
