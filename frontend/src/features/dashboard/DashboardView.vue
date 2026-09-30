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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <button
        type="button"
        :disabled="simulating"
        class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        @click="handleSimulate"
      >
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
