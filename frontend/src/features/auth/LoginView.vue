<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ApiError } from '@/services/http'

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const submitting = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleSubmit(): Promise<void> {
  errorMessage.value = null
  submitting.value = true
  try {
    await authStore.login(email.value, password.value)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'No se pudo iniciar sesión'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <form
      class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <h1 class="mb-1 text-xl font-semibold text-slate-900">Iniciar sesión</h1>
      <p class="mb-6 text-sm text-slate-500">Gestión de suscripciones B2B</p>

      <label class="mb-1 block text-sm font-medium text-slate-700" for="email">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />

      <label class="mb-1 block text-sm font-medium text-slate-700" for="password">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        class="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />

      <p v-if="errorMessage" class="mb-4 text-sm text-red-600">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {{ submitting ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>
