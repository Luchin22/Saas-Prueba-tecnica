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
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg"
          :class="alertActive ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand-600'"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path
              d="M4 19V10m6.5 9V5M17 19v-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="text-sm font-medium text-slate-500">Consumo de API</p>
      </div>
      <span
        v-if="alertActive"
        class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
      >
        Alerta
      </span>
    </div>

    <p class="mt-4 text-3xl font-semibold text-slate-900">
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
