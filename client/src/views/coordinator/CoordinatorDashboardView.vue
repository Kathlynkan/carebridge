<!-- =============================================================
  Coordinator dashboard                               Owner: Yu Xuan
  -------------------------------------------------------------
  Already: KPI cards from GET /dashboard/summary + centre-wide topic chart.
  TODO (Yu Xuan):
    [ ] "Needs attention" table from GET /dashboard/alerts
        (no session in 7 days, recurring struggle, overdue homework, unassigned child)
    [ ] filter alerts by type + click a row -> child profile
    [ ] "Flag for follow-up" toggle per child
    [ ] recent activity feed (latest sessions across the centre)
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import TopicSummaryChart from '@/components/charts/TopicSummaryChart.vue'

const summary = ref(null)
const sessions = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [sum, s] = await Promise.all([api.get('/dashboard/summary'), api.get('/sessions')])
    summary.value = sum.data
    sessions.value = s.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Centre dashboard" subtitle="See who needs follow-up at a glance." />
    <TodoPanel
      owner="Yu Xuan"
      :items="[
        'Needs-attention alerts table (GET /dashboard/alerts)',
        'Filter alerts + click through to child',
        'Flag child for follow-up',
        'Recent activity feed',
      ]"
    />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <StatCard label="Children" :value="summary.totalChildren" icon="bi-people" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard label="Volunteers" :value="summary.totalVolunteers" icon="bi-person-heart" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard label="Sessions this week" :value="summary.sessionsThisWeek" icon="bi-journal-check" />
        </div>
        <div class="col-6 col-lg-3">
          <StatCard label="Homework pending" :value="summary.homeworkPending" icon="bi-hourglass-split" />
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="cb-card p-3">
            <h2 class="h6"><i class="bi bi-exclamation-triangle me-2"></i>Needs attention</h2>
            <p class="small text-muted-cb mb-0">TODO (Yu Xuan): alerts table goes here.</p>
          </div>
        </div>
        <div class="col-lg-5">
          <TopicSummaryChart :sessions="sessions" title="Centre-wide accuracy by topic" />
        </div>
      </div>
    </template>
  </div>
</template>
