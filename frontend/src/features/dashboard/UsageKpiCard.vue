<script setup lang="ts">
defineProps<{
  totalCalls: number
  usageLimit: number
  percentageLabel: string
  alertActive: boolean
}>()
</script>

<template>
  <div
    class="rounded-xl border p-6 shadow-sm"
    :class="alertActive ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'"
  >
    <p class="text-sm font-medium text-slate-500">Consumo de API</p>
    <p class="mt-2 text-3xl font-semibold text-slate-900">
      {{ totalCalls.toLocaleString() }}
      <span class="text-base font-normal text-slate-400">/ {{ usageLimit.toLocaleString() }}</span>
    </p>
    <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        class="h-full rounded-full transition-all"
        :class="alertActive ? 'bg-amber-500' : 'bg-brand-500'"
        :style="{ width: percentageLabel }"
      />
    </div>
    <p class="mt-2 text-sm" :class="alertActive ? 'text-amber-700' : 'text-slate-500'">
      {{ percentageLabel }} del límite contratado
      <span v-if="alertActive" class="font-medium"> · Alerta de consumo alto</span>
    </p>
  </div>
</template>
