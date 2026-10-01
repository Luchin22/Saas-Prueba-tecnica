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
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <p class="mb-4 text-sm font-medium text-slate-500">Historial de consumo (14 días)</p>
    <div class="h-64">
      <Line v-if="history.length" :data="chartData" :options="chartOptions" />
      <p v-else class="flex h-full items-center justify-center text-sm text-slate-400">
        Aún no hay datos de consumo. Simula una llamada para verlo aquí.
      </p>
    </div>
  </div>
</template>
