<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUsageStore } from '@/stores/usage.store'
import UsageKpiCard from './UsageKpiCard.vue'
import UsageChart from './UsageChart.vue'

const usageStore = useUsageStore()
const simulating = ref(false)

onMounted(() => {
  void usageStore.fetchUsage()
})

async function handleSimulate(): Promise<void> {
  simulating.value = true
  try {
    await usageStore.simulate()
  } finally {
    simulating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p class="mt-0.5 text-sm text-slate-500">Consumo de API en tiempo real de tu empresa</p>
      </div>
      <button
        type="button"
        :disabled="simulating"
        class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="handleSimulate"
      >
        <svg
          v-if="!simulating"
          viewBox="0 0 24 24"
          fill="none"
          class="h-4 w-4"
        >
          <path
            d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
        </svg>
        {{ simulating ? 'Simulando…' : 'Simular consumo de API' }}
      </button>
    </div>

    <p v-if="usageStore.loading" class="text-sm text-slate-500">Cargando consumo…</p>

    <div v-else class="grid gap-6 md:grid-cols-3">
      <UsageKpiCard
        class="md:col-span-1"
        :total-calls="usageStore.totalCalls"
        :usage-limit="usageStore.usageLimit"
        :percentage-label="usageStore.percentageLabel"
        :alert-active="usageStore.alertActive"
      />
      <div class="md:col-span-2">
        <UsageChart :history="usageStore.history" />
      </div>
    </div>
  </div>
</template>
