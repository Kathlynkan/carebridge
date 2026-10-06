<!-- =============================================================
  SkillProgressChart - accuracy over time, one line per topic.   Owner: Jachin
  Used on: Child profile (Yuqi), Parent page (Kat)
  Props:  sessions (Array)  - straight from GET /sessions?childId=...
  -------------------------------------------------------------
  The other pages already use this component with this prop,
  so keep the prop name the same and only change the inside.

  TODO (Jachin):
    [ ] Render a Chart.js line chart with vue-chartjs:
          import { Line } from 'vue-chartjs'
          import { Chart as ChartJS, LineElement, PointElement, CategoryScale,
                   LinearScale, Tooltip, Legend } from 'chart.js'
          ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)
    [ ] x = date, y = accuracy %, one dataset per topic (computed property)
    [ ] responsive: true, maintainAspectRatio: false, readable on mobile
    [ ] a text summary under the chart ("Fractions: improving 20% -> 80%") for accessibility
============================================================= -->
<script setup>
import { computed } from 'vue'
import { accuracy, formatDate } from '@/utils/format'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

// Placeholder: oldest -> newest, so Jachin can see the data shape
const points = computed(() =>
  [...props.sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, topic: s.topic, accuracy: accuracy(s) })),
)
</script>

<template>
  <div class="cb-card p-3" data-test="skill-progress-chart">
    <h2 class="h6 mb-3"><i class="bi bi-graph-up-arrow me-2"></i>Progress over time</h2>
    <!-- TODO (Jachin): replace this placeholder bar list with the real chart -->
    <div v-for="p in points" :key="p.date + p.topic" class="d-flex align-items-center gap-2 small mb-1">
      <span class="label">{{ formatDate(p.date) }}</span>
      <span class="label text-truncate">{{ p.topic }}</span>
      <div class="progress flex-grow-1" role="progressbar" style="height: 10px">
        <div class="progress-bar" :style="{ width: p.accuracy + '%' }"></div>
      </div>
      <span>{{ p.accuracy }}%</span>
    </div>
    <p v-if="points.length === 0" class="small text-muted-cb mb-0">No data yet.</p>
  </div>
</template>

<style scoped>
.label {
  width: 90px;
  flex-shrink: 0;
}
</style>
