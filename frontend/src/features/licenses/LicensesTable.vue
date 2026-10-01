<script setup lang="ts">
import type { UserSummary } from '@/types/api'
import { useLicensesTable, type LicensesSortKey } from './useLicensesTable'
import { toRef } from 'vue'

const props = defineProps<{ users: UserSummary[] }>()
const emit = defineEmits<{ assign: [userId: string] }>()

const usersRef = toRef(props, 'users')
const { searchQuery, sortKey, sortAscending, currentPage, totalPages, paginated, setSort, goToPage } =
  useLicensesTable(usersRef)

const columns: { key: LicensesSortKey; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Rol' },
  { key: 'hasActiveLicense', label: 'Licencia' },
]

function sortIndicator(key: LicensesSortKey): string {
  if (sortKey.value !== key) return ''
  return sortAscending.value ? '▲' : '▼'
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 p-4">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Buscar por email…"
        class="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </div>

    <table class="w-full text-left text-sm">
      <thead class="border-b border-slate-200 bg-slate-50 text-slate-500">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="cursor-pointer select-none px-4 py-3 font-medium"
            @click="setSort(column.key)"
          >
            {{ column.label }} <span class="text-brand-600">{{ sortIndicator(column.key) }}</span>
          </th>
          <th class="px-4 py-3 font-medium">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginated.length === 0">
          <td colspan="4" class="px-4 py-6 text-center text-slate-400">Sin resultados</td>
        </tr>
        <tr v-for="user in paginated" :key="user.id" class="border-b border-slate-100 last:border-0">
          <td class="px-4 py-3 text-slate-800">{{ user.email }}</td>
          <td class="px-4 py-3 text-slate-600">{{ user.role }}</td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="user.hasActiveLicense ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ user.hasActiveLicense ? 'Activa' : 'Sin licencia' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              :disabled="user.hasActiveLicense"
              class="rounded-md border border-brand-600 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              @click="emit('assign', user.id)"
            >
              Asignar licencia
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex items-center justify-between p-4 text-sm text-slate-500">
      <span>Página {{ currentPage }} de {{ totalPages }}</span>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          Anterior
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>
