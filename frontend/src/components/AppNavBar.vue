<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout(): void {
  authStore.logout()
  void router.push({ name: 'login' })
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <div class="flex items-center gap-6">
        <span class="text-lg font-semibold text-slate-900">SaaS Subscriptions</span>
        <RouterLink
          to="/dashboard"
          class="text-sm font-medium text-slate-600 hover:text-brand-600"
          active-class="text-brand-600"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          v-if="authStore.role === 'ADMIN'"
          to="/licenses"
          class="text-sm font-medium text-slate-600 hover:text-brand-600"
          active-class="text-brand-600"
        >
          Licencias
        </RouterLink>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-500">{{ authStore.user?.email }}</span>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  </header>
</template>
