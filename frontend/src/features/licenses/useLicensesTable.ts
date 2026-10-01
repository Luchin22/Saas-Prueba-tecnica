import { ref, computed, watch, type Ref } from 'vue'
import type { UserSummary } from '@/types/api'

export type LicensesSortKey = 'email' | 'role' | 'hasActiveLicense'

const PAGE_SIZE = 5

export function useLicensesTable(users: Ref<UserSummary[]>) {
  const searchQuery = ref('')
  const sortKey = ref<LicensesSortKey>('email')
  const sortAscending = ref(true)
  const currentPage = ref(1)

  const filtered = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      return users.value
    }
    return users.value.filter((user) => user.email.toLowerCase().includes(query))
  })

  const sorted = computed(() => {
    const list = [...filtered.value]
    list.sort((a, b) => {
      const comparison = String(a[sortKey.value]).localeCompare(String(b[sortKey.value]))
      return sortAscending.value ? comparison : -comparison
    })
    return list
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))

  const paginated = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return sorted.value.slice(start, start + PAGE_SIZE)
  })

  watch([searchQuery, sortKey, sortAscending], () => {
    currentPage.value = 1
  })

  function setSort(key: LicensesSortKey): void {
    if (sortKey.value === key) {
      sortAscending.value = !sortAscending.value
    } else {
      sortKey.value = key
      sortAscending.value = true
    }
  }

  function goToPage(page: number): void {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  return {
    searchQuery,
    sortKey,
    sortAscending,
    currentPage,
    totalPages,
    paginated,
    setSort,
    goToPage,
  }
}
