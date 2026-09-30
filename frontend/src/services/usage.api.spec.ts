import { describe, it, expect, vi } from 'vitest'
import { fetchUsage, simulateUsage } from './usage.api'
import { apiFetch } from './http'

vi.mock('./http', () => ({ apiFetch: vi.fn<() => Promise<unknown>>() }))

describe('usage.api', () => {
  it('fetchUsage performs a GET to /usage', async () => {
    vi.mocked(apiFetch).mockResolvedValue({})

    await fetchUsage()

    expect(apiFetch).toHaveBeenCalledWith('/usage')
  })

  it('simulateUsage sends the given count', async () => {
    vi.mocked(apiFetch).mockResolvedValue({})

    await simulateUsage(25)

    expect(apiFetch).toHaveBeenCalledWith('/usage/simulate', { method: 'POST', body: { count: 25 } })
  })

  it('simulateUsage sends an empty body when no count is given', async () => {
    vi.mocked(apiFetch).mockResolvedValue({})

    await simulateUsage()

    expect(apiFetch).toHaveBeenCalledWith('/usage/simulate', { method: 'POST', body: {} })
  })
})
