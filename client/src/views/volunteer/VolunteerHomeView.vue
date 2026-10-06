<!-- =============================================================
  Volunteer home: "My Children"                       Owner: Yuqi
  -------------------------------------------------------------
  WORKING reference for "load data from the API and show it":
    onMounted -> axios (api.get) -> ref -> computed -> v-for + component
  TODO (Yuqi):
    [ ] search box (v-model) + filter by level / subject (computed)
    [ ] sort: "longest since last session" first
    [ ] "Today" strip: children whose session is today (needs availability days)
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import ChildCard from '@/components/ChildCard.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import { firstName } from '@/utils/format'

const auth = useAuthStore()
const router = useRouter()

const children = ref([])
const sessions = ref([])
const loading = ref(true)
const error = ref('')

// newest session for each child: { c_1: {...}, c_2: {...} }
const lastSessionByChild = computed(() => {
  const map = {}
  for (const s of sessions.value) {
    if (!map[s.childId]) map[s.childId] = s // sessions come newest-first from the API
  }
  return map
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    // two requests at the same time (Week 5: async/await)
    const [childRes, sessionRes] = await Promise.all([api.get('/children'), api.get('/sessions')])
    children.value = childRes.data
    sessions.value = sessionRes.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

function openChild(childId) {
  router.push({ name: 'child-profile', params: { id: childId } })
}

onMounted(loadData)
</script>

<template>
  <div class="container py-4">
    <PageHeader
      :title="`Hi ${firstName(auth.user.name)} 👋`"
      subtitle="These are the children assigned to you. Open one to see their handover before your session."
    />

    <TodoPanel
      owner="Yuqi"
      :items="[
        'Search + filter children (v-model + computed)',
        'Sort by longest time since last session',
        'Today strip: who you are seeing today',
      ]"
    />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />
    <StateMessage
      v-else-if="children.length === 0"
      message="No children assigned to you yet. Your coordinator will assign them."
    />

    <div v-else class="row g-3">
      <div v-for="child in children" :key="child.id" class="col-sm-6 col-lg-4">
        <ChildCard :child="child" :last-session="lastSessionByChild[child.id]" @open="openChild" />
      </div>
    </div>
  </div>
</template>
