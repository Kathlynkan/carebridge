<!-- =============================================================
  Manage volunteers                                   Owner: Yu Xuan
  -------------------------------------------------------------
  Already: list of volunteers with skills + availability.
  TODO (Yu Xuan):
    [ ] edit a volunteer's skills / available days (checkboxes, Week 5) -> PUT /users/:id
    [ ] show how many children each volunteer has (workload)
    [ ] filter by skill
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'

const volunteers = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await api.get('/users', { params: { role: 'volunteer' } })
    volunteers.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Volunteers" subtitle="Skills and availability power the matchmaking." />
    <TodoPanel owner="Yu Xuan" :items="['Edit skills / days', 'Workload count', 'Filter by skill']" />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <div v-else class="row g-3">
      <div v-for="v in volunteers" :key="v.id" class="col-md-6 col-lg-4">
        <div class="cb-card p-3 h-100">
          <h2 class="h6 mb-1"><i class="bi bi-person-circle me-1"></i>{{ v.name }}</h2>
          <div class="small text-muted-cb mb-2">{{ v.email }}</div>
          <div class="mb-2">
            <span v-for="s in v.skills" :key="s" class="badge badge-soft me-1 mb-1">{{ s }}</span>
          </div>
          <div class="small"><i class="bi bi-calendar-week me-1"></i>{{ (v.availability || []).join(', ') || 'Not set' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
