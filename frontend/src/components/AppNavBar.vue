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
  <header class="bg-brand-950">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" class="h-4.5 w-4.5 text-brand-300">
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
          <span class="text-base font-semibold tracking-tight text-white">SaaS Subscriptions</span>
        </div>
        <div class="flex items-center gap-1">
          <RouterLink
            to="/dashboard"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-brand-100/70 transition hover:bg-white/5 hover:text-white"
            active-class="!bg-white/10 !text-white"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            v-if="authStore.role === 'ADMIN'"
            to="/licenses"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-brand-100/70 transition hover:bg-white/5 hover:text-white"
            active-class="!bg-white/10 !text-white"
          >
            Licencias
          </RouterLink>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="hidden text-sm text-brand-100/70 sm:inline">{{ authStore.user?.email }}</span>
        <button
          type="button"
          class="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  </header>
</template>
