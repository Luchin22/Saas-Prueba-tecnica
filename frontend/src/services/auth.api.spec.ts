import { describe, it, expect, vi } from 'vitest'
import { login } from './auth.api'
import { apiFetch } from './http'

vi.mock('./http', () => ({ apiFetch: vi.fn<() => Promise<unknown>>() }))

describe('auth.api', () => {
  it('login posts credentials to /auth/login', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ accessToken: 'jwt', user: {} })

    await login('admin@acme.test', 'Password123!')

    expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'admin@acme.test', password: 'Password123!' },
    })
  })
})
