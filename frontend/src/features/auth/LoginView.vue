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

function fillDemoAdmin(): void {
  email.value = 'admin@acme.test'
  password.value = 'Password123!'
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Branding panel -->
    <div
      class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 text-white lg:flex"
    >
      <div
        class="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        class="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-500/20 blur-3xl"
      />

      <div class="relative flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
            <path
              d="M12 2 3 6v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V6l-9-4Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="m8.5 12 2.2 2.3L15.5 9.5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <span class="text-lg font-semibold tracking-tight">SaaS Subscriptions</span>
      </div>

      <div class="relative max-w-sm">
        <h1 class="text-3xl leading-tight font-bold text-balance">
          Licencias, consumo de API y alertas de tu empresa, en un solo lugar.
        </h1>
        <ul class="mt-8 space-y-4 text-sm text-brand-100">
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"
              >✓</span
            >
            Gestiona roles y licencias de tus empleados
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"
              >✓</span
            >
            Consumo de API y alertas en tiempo real
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15"
              >✓</span
            >
            Nunca más superes tu límite contratado sin saberlo
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-brand-200">Sistema de gestión de suscripciones B2B</p>
    </div>

    <!-- Form panel -->
    <div class="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-white">
              <path
                d="M12 2 3 6v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V6l-9-4Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path
                d="m8.5 12 2.2 2.3L15.5 9.5"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <span class="text-lg font-semibold tracking-tight text-slate-900">SaaS Subscriptions</span>
        </div>

        <h2 class="text-2xl font-semibold text-slate-900">Iniciar sesión</h2>
        <p class="mt-1 mb-8 text-sm text-slate-500">Ingresa con tu cuenta para continuar</p>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700" for="email">Email</label>
            <div class="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                class="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              >
                <path
                  d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="m4 6.5 8 6.2 8-6.2"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="username"
                placeholder="tu@empresa.com"
                class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700" for="password"
              >Contraseña</label
            >
            <div class="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                class="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              >
                <rect
                  x="5"
                  y="10.5"
                  width="14"
                  height="9"
                  rx="1.8"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M8 10.5V8a4 4 0 1 1 8 0v2.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>
          </div>

          <p v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="submitting"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              v-if="submitting"
              class="h-4 w-4 animate-spin text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
              />
            </svg>
            {{ submitting ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

        <div class="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Cuenta de demo</p>
          <p class="mt-1 text-sm text-slate-600">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">admin@acme.test</code> ·
            contraseña
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">Password123!</code>
          </p>
          <button
            type="button"
            class="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
            @click="fillDemoAdmin"
          >
            Usar credenciales de demo →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
