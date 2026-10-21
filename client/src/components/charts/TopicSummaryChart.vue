<!-- TopicSummaryChart - average accuracy per topic (bar chart)  Owner: Jachin
     Used on: Child profile (Yuqi), Coordinator dashboard (Yu Xuan)
     Props: sessions (Array), title (String) -->
<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  title: { type: String, default: 'Accuracy by topic' },
})

function barColor(acc) {
  if (acc < 50) return '#E58AA8'   // Lapis Pink — needs help
  if (acc < 75) return '#F4A37A'   // Lapis Orange — steady
  return '#6FBF84'                  // Lapis Lime — strong
}

const byTopic = computed(() => {
  const groups = {}
  for (const s of props.sessions) {
    groups[s.topic] ??= { topic: s.topic, attempted: 0, correct: 0 }
    groups[s.topic].attempted += s.attempted
    groups[s.topic].correct += s.correct
  }
  return Object.values(groups).map((g) => ({
    ...g,
    accuracy: g.attempted ? Math.round((g.correct / g.attempted) * 100) : 0,
  }))
})

const chartData = computed(() => ({
  labels: byTopic.value.map((t) => t.topic),
  datasets: [
    {
      label: 'Accuracy %',
      data: byTopic.value.map((t) => t.accuracy),
      backgroundColor: byTopic.value.map((t) => barColor(t.accuracy)),
      borderRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } },
  },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${ctx.raw}%` } },
  },
}
</script>

<template>
  <div class="cb-card p-3" data-test="topic-summary-chart">
    <h2 class="h6 mb-3"><i class="bi bi-bar-chart me-2"></i>{{ title }}</h2>
    <p v-if="sessions.length === 0" class="small text-muted-cb mb-0">No data yet.</p>
    <template v-else>
      <div
        style="position: relative"
        :style="{ height: Math.max(120, byTopic.length * 44) + 'px' }"
      >
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <div class="d-flex flex-wrap gap-3 mt-2 small text-muted-cb">
        <span><span style="color:#6FBF84;font-size:1.1em">●</span> Strong (≥75%)</span>
        <span><span style="color:#F4A37A;font-size:1.1em">●</span> Steady (50–74%)</span>
        <span><span style="color:#E58AA8;font-size:1.1em">●</span> Needs help (&lt;50%)</span>
      </div>
    </template>
  </div>
</template>
