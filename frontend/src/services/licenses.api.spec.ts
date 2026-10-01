import { describe, it, expect, vi } from 'vitest'
import { fetchUsers, createEmployee, fetchLicenses, assignLicense } from './licenses.api'
import { apiFetch } from './http'

vi.mock('./http', () => ({ apiFetch: vi.fn<() => Promise<unknown>>() }))

describe('licenses.api', () => {
  it('fetchUsers performs a GET to /users', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])
    await fetchUsers()
    expect(apiFetch).toHaveBeenCalledWith('/users')
  })

  it('createEmployee posts the new employee payload', async () => {
    vi.mocked(apiFetch).mockResolvedValue({})
    await createEmployee('new@acme.test', 'Password123!')
    expect(apiFetch).toHaveBeenCalledWith('/users', {
      method: 'POST',
      body: { email: 'new@acme.test', password: 'Password123!' },
    })
  })

  it('fetchLicenses performs a GET to /licenses', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])
    await fetchLicenses()
    expect(apiFetch).toHaveBeenCalledWith('/licenses')
  })

  it('assignLicense posts the target user id', async () => {
    vi.mocked(apiFetch).mockResolvedValue({})
    await assignLicense('user-1')
    expect(apiFetch).toHaveBeenCalledWith('/licenses/assign', {
      method: 'POST',
      body: { userId: 'user-1' },
    })
  })
})
