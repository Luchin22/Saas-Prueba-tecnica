import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useLicensesTable } from './useLicensesTable'
import type { UserSummary } from '@/types/api'

function makeUser(overrides: Partial<UserSummary>): UserSummary {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    email: 'user@acme.test',
    role: 'USER',
    companyId: 'company-1',
    createdAt: new Date().toISOString(),
    hasActiveLicense: false,
    ...overrides,
  }
}

describe('useLicensesTable', () => {
  it('filters users by email (case-insensitive)', () => {
    const users = ref<UserSummary[]>([
      makeUser({ id: '1', email: 'admin@acme.test' }),
      makeUser({ id: '2', email: 'employee1@acme.test' }),
    ])
    const { searchQuery, paginated } = useLicensesTable(users)

    searchQuery.value = 'ADMIN'

    expect(paginated.value).toHaveLength(1)
    expect(paginated.value[0]!.email).toBe('admin@acme.test')
  })

  it('sorts ascending by default and toggles to descending on repeated clicks', () => {
    const users = ref<UserSummary[]>([
      makeUser({ id: '1', email: 'b@acme.test' }),
      makeUser({ id: '2', email: 'a@acme.test' }),
    ])
    const { paginated, setSort, sortAscending } = useLicensesTable(users)

    // 'email' is already the default sort column, so the first click on it
    // reverses direction rather than re-applying the (already active) ascending sort.
    expect(paginated.value.map((u) => u.email)).toEqual(['a@acme.test', 'b@acme.test'])

    setSort('email')
    expect(sortAscending.value).toBe(false)
    expect(paginated.value.map((u) => u.email)).toEqual(['b@acme.test', 'a@acme.test'])

    setSort('email')
    expect(sortAscending.value).toBe(true)
    expect(paginated.value.map((u) => u.email)).toEqual(['a@acme.test', 'b@acme.test'])
  })

  it('resets to ascending order when switching to a different column', () => {
    const users = ref<UserSummary[]>([makeUser({ id: '1' })])
    const { setSort, sortKey, sortAscending } = useLicensesTable(users)

    setSort('email')
    expect(sortAscending.value).toBe(false)

    setSort('role')
    expect(sortKey.value).toBe('role')
    expect(sortAscending.value).toBe(true)
  })

  it('paginates results and clamps navigation within bounds', () => {
    const users = ref<UserSummary[]>(
      Array.from({ length: 12 }, (_, i) => makeUser({ id: String(i), email: `user${i}@acme.test` })),
    )
    const { paginated, totalPages, goToPage, currentPage } = useLicensesTable(users)

    expect(totalPages.value).toBe(3)
    expect(paginated.value).toHaveLength(5)

    goToPage(2)
    expect(currentPage.value).toBe(2)

    goToPage(99)
    expect(currentPage.value).toBe(3)

    goToPage(-5)
    expect(currentPage.value).toBe(1)
  })

  it('resets to the first page whenever the search query changes', async () => {
    const users = ref<UserSummary[]>(
      Array.from({ length: 12 }, (_, i) => makeUser({ id: String(i), email: `user${i}@acme.test` })),
    )
    const { goToPage, currentPage, searchQuery } = useLicensesTable(users)

    goToPage(2)
    expect(currentPage.value).toBe(2)

    searchQuery.value = 'user1'
    await nextTick()

    expect(currentPage.value).toBe(1)
  })
})
