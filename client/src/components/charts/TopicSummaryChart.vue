<!-- =============================================================
  TopicSummaryChart - average accuracy per topic (bar chart)  Owner: Jachin
  Used on: Child profile (Yuqi), Coordinator dashboard (Yu Xuan, centre-wide)
  Props:  sessions (Array), title (String)
  TODO (Jachin):
    [ ] Chart.js horizontal bar chart (indexAxis: 'y')
    [ ] colour bars by status: < 50% needs help, 50-75% steady, > 75% strong
    [ ] (stretch) a "recurring struggles" chart: how often each skill appears
============================================================= -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  title: { type: String, default: 'Accuracy by topic' },
})

// Placeholder aggregation so the data is visible already
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
</script>

<template>
  <div class="cb-card p-3" data-test="topic-summary-chart">
    <h2 class="h6 mb-3"><i class="bi bi-bar-chart me-2"></i>{{ title }}</h2>
    <!-- TODO (Jachin): replace with the real chart -->
    <table class="table table-sm small mb-0">
      <thead>
        <tr>
          <th>Topic</th>
          <th class="text-end">Correct</th>
          <th class="text-end">Accuracy</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in byTopic" :key="t.topic">
          <td>{{ t.topic }}</td>
          <td class="text-end">{{ t.correct }}/{{ t.attempted }}</td>
          <td class="text-end">{{ t.accuracy }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
