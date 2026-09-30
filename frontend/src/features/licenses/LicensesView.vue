<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLicensesStore } from '@/stores/licenses.store'
import { ApiError } from '@/services/http'
import LicensesTable from './LicensesTable.vue'

const licensesStore = useLicensesStore()

const newEmployeeEmail = ref('')
const newEmployeePassword = ref('')
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const submittingEmployee = ref(false)

onMounted(() => {
  void licensesStore.fetchUsers()
})

async function handleCreateEmployee(): Promise<void> {
  feedback.value = null
  submittingEmployee.value = true
  try {
    await licensesStore.createEmployee(newEmployeeEmail.value, newEmployeePassword.value)
    newEmployeeEmail.value = ''
    newEmployeePassword.value = ''
    feedback.value = { type: 'success', message: 'Empleado creado correctamente.' }
  } catch (error) {
    feedback.value = {
      type: 'error',
      message: error instanceof ApiError ? error.message : 'No se pudo crear el empleado',
    }
  } finally {
    submittingEmployee.value = false
  }
}

async function handleAssign(userId: string): Promise<void> {
  feedback.value = null
  try {
    await licensesStore.assignLicense(userId)
    feedback.value = { type: 'success', message: 'Licencia asignada correctamente.' }
  } catch (error) {
    feedback.value = {
      type: 'error',
      message: error instanceof ApiError ? error.message : 'No se pudo asignar la licencia',
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-slate-900">Gestión de licencias</h1>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="mb-4 text-sm font-medium text-slate-500">Agregar empleado</p>
      <form class="flex flex-wrap items-end gap-4" @submit.prevent="handleCreateEmployee">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            v-model="newEmployeeEmail"
            type="email"
            required
            class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-600">Contraseña</label>
          <input
            v-model="newEmployeePassword"
            type="password"
            required
            minlength="8"
            class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="submittingEmployee"
          class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {{ submittingEmployee ? 'Creando…' : 'Crear empleado' }}
        </button>
      </form>
    </div>

    <p
      v-if="feedback"
      class="text-sm"
      :class="feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'"
    >
      {{ feedback.message }}
    </p>

    <p v-if="licensesStore.loading" class="text-sm text-slate-500">Cargando usuarios…</p>
    <LicensesTable v-else :users="licensesStore.users" @assign="handleAssign" />
  </div>
</template>
