<!-- =============================================================
  Manage children (CRUD)                              Owner: Kai Sen
  -------------------------------------------------------------
  Already: table of all children.
  TODO (Kai Sen):
    [ ] "Add child" form in a Bootstrap modal -> POST /children
    [ ] edit (PUT) + delete (DELETE, with confirm)
    [ ] create the child's login + a "child code" for the parent to link
    [ ] search + responsive table (.table-responsive) / cards on mobile
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'

const children = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await api.get('/children')
    children.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Children" subtitle="Everyone enrolled at the centre.">
      <button class="btn btn-primary" disabled><i class="bi bi-plus-lg me-1"></i>Add child</button>
    </PageHeader>
    <TodoPanel
      owner="Kai Sen"
      :items="['Add child (modal + POST)', 'Edit / delete', 'Child login + parent link code', 'Search, mobile layout']"
    />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <div v-else class="cb-card table-responsive">
      <table class="table align-middle mb-0">
        <thead>
          <tr>
            <th>Child</th>
            <th>Level</th>
            <th>Needs</th>
            <th>Volunteers</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in children" :key="c.id">
            <td>{{ c.avatar }} {{ c.name }}</td>
            <td>{{ c.level }}</td>
            <td>
              <span v-for="n in c.needs" :key="n" class="badge badge-soft me-1">{{ n }}</span>
            </td>
            <td>
              <span v-if="c.volunteerIds.length">{{ c.volunteerIds.length }}</span>
              <span v-else class="badge badge-danger-soft">Unassigned</span>
            </td>
            <td class="text-end">
              <RouterLink :to="{ name: 'child-profile', params: { id: c.id } }" class="btn btn-sm btn-outline-primary">
                View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
