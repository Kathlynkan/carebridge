<!-- =============================================================
  Skills-based matchmaking                            Owner: Yu Xuan
  Route: /coordinator/matchmaking/:childId?
  -------------------------------------------------------------
  Flow: pick a child -> see suggested volunteers ranked by score
        -> "Assign" -> child.volunteerIds updated
  TODO (Yu Xuan):
    [ ] GET /matchmaking/:childId -> ranked suggestions with matched skills
    [ ] show WHY: "Matches: Fractions, Primary Math · Free on Mon"
    [ ] assign / unassign -> PUT /matchmaking/:childId/assign
    [ ] unassigned children listed first (Sofia in the demo data)
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'

const children = ref([])
const selectedId = ref('')
const error = ref('')

onMounted(async () => {
  try {
    const res = await api.get('/children')
    children.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  }
})
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Matchmaking" subtitle="Match each child with volunteers who have the right skills." />
    <TodoPanel
      owner="Yu Xuan"
      :items="['Ranked suggestions', 'Explain the match', 'Assign / unassign', 'Unassigned children first']"
    />
    <StateMessage v-if="error" type="error" :message="error" />

    <div class="cb-card p-3 mb-4">
      <label class="form-label" for="child">Child</label>
      <select id="child" v-model="selectedId" class="form-select">
        <option value="" disabled>Choose a child</option>
        <option v-for="c in children" :key="c.id" :value="c.id">
          {{ c.name }} ({{ c.level }}) - needs: {{ c.needs.join(', ') }}
        </option>
      </select>
    </div>

    <p class="text-muted-cb">TODO (Yu Xuan): suggested volunteers appear here.</p>
  </div>
</template>
