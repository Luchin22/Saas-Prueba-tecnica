<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import AppNavBar from '@/components/AppNavBar.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <template v-if="authStore.isAuthenticated">
      <AppNavBar />
      <main class="mx-auto max-w-6xl px-6 py-8">
        <RouterView />
      </main>
    </template>
    <RouterView v-else />
  </div>
</template>
