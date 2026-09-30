import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, ApiError, setAuthToken } from './http'

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      ...response,
    }),
  )
}

describe('apiFetch', () => {
  beforeEach(() => {
    setAuthToken(null)
    vi.unstubAllGlobals()
  })

  it('returns the parsed JSON body on success', async () => {
    mockFetchOnce({ json: async () => ({ hello: 'world' }) })

    const result = await apiFetch<{ hello: string }>('/ping')

    expect(result).toEqual({ hello: 'world' })
  })

  it('does not attach an Authorization header when no token is set', async () => {
    const fetchMock = vi
      .fn<(url: string, options: RequestInit) => Promise<unknown>>()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/ping')

    const [, options] = fetchMock.mock.calls[0]!
    expect((options.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('attaches a Bearer Authorization header once a token is set', async () => {
    const fetchMock = vi
      .fn<(url: string, options: RequestInit) => Promise<unknown>>()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    setAuthToken('jwt-token')

    await apiFetch('/ping')

    const [, options] = fetchMock.mock.calls[0]!
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer jwt-token')
  })

  it('returns undefined for a 204 No Content response', async () => {
    mockFetchOnce({ status: 204 })

    const result = await apiFetch('/ping')

    expect(result).toBeUndefined()
  })

  it('throws an ApiError built from the parsed error body', async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({
        statusCode: 409,
        message: 'User already has an active license',
        error: 'Conflict',
        timestamp: '2026-01-01T00:00:00.000Z',
        path: '/api/v1/licenses/assign',
      }),
    })

    await expect(apiFetch('/licenses/assign')).rejects.toMatchObject({
      statusCode: 409,
      message: 'User already has an active license',
    })
    await expect(apiFetch('/licenses/assign')).rejects.toBeInstanceOf(ApiError)
  })

  it('joins array validation messages and falls back when the error body is not JSON', async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json')
      },
    })

    await expect(apiFetch('/broken')).rejects.toMatchObject({ statusCode: 500 })
  })
})
