import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLicensesStore } from './licenses.store'
import * as licensesApi from '@/services/licenses.api'
import type { UserSummary } from '@/types/api'

vi.mock('@/services/licenses.api')

function makeUser(overrides: Partial<UserSummary>): UserSummary {
  return {
    id: 'user-1',
    email: 'employee@acme.test',
    role: 'USER',
    companyId: 'company-1',
    createdAt: new Date().toISOString(),
    hasActiveLicense: false,
    ...overrides,
  }
}

describe('licenses store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('fetchUsers populates the users list and toggles loading', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([makeUser({})])
    const store = useLicensesStore()

    const promise = store.fetchUsers()
    expect(store.loading).toBe(true)
    await promise

    expect(store.loading).toBe(false)
    expect(store.users).toHaveLength(1)
  })

  it('createEmployee appends the newly created user', async () => {
    const created = makeUser({ id: 'user-2', email: 'new@acme.test' })
    vi.mocked(licensesApi.createEmployee).mockResolvedValue(created)
    const store = useLicensesStore()

    await store.createEmployee('new@acme.test', 'password123')

    expect(store.users).toContainEqual(created)
  })

  it('assignLicense marks the matching user as having an active license', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([makeUser({ id: 'user-1' })])
    vi.mocked(licensesApi.assignLicense).mockResolvedValue({
      id: 'license-1',
      userId: 'user-1',
      companyId: 'company-1',
      status: 'ACTIVE',
      assignedAt: new Date().toISOString(),
    })
    const store = useLicensesStore()
    await store.fetchUsers()

    await store.assignLicense('user-1')

    expect(store.users[0]!.hasActiveLicense).toBe(true)
  })

  it('propagates errors from assignLicense to the caller', async () => {
    vi.mocked(licensesApi.assignLicense).mockRejectedValue(new Error('limit reached'))
    const store = useLicensesStore()

    await expect(store.assignLicense('user-1')).rejects.toThrow('limit reached')
  })

  it('attachRealtime reconciles license status pushed over the socket', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([makeUser({ id: 'user-1' })])
    const store = useLicensesStore()
    await store.fetchUsers()

    const handlers = new Map<string, (payload: { userId: string; status: string }) => void>()
    const socket = {
      on: vi.fn<
        (event: string, handler: (payload: { userId: string; status: string }) => void) => void
      >((event, handler) => handlers.set(event, handler)),
    }

    store.attachRealtime(socket as never)
    handlers.get('licenses:updated')?.({ userId: 'user-1', status: 'ACTIVE' })

    expect(store.users[0]!.hasActiveLicense).toBe(true)
  })
})
