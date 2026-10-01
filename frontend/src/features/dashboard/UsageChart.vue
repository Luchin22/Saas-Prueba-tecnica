<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import type { DailyUsage } from '@/types/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{ history: DailyUsage[] }>()

const chartData = computed(() => ({
  labels: props.history.map((entry) => entry.date.slice(5)),
  datasets: [
    {
      label: 'Llamadas por día',
      data: props.history.map((entry) => entry.count),
      borderColor: '#00b8e0',
      backgroundColor: 'rgba(0, 184, 224, 0.12)',
      pointBackgroundColor: '#00b8e0',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="mb-4 flex items-center gap-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path
            d="M3 17l5-5 4 4 8-8M15 8h5v5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-slate-500">Historial de consumo (14 días)</p>
    </div>
    <div class="h-64">
      <Line v-if="history.length" :data="chartData" :options="chartOptions" />
      <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">
        Aún no hay datos de consumo. Simula una llamada para verlo aquí.
      </p>
    </div>
  </div>
</template>
