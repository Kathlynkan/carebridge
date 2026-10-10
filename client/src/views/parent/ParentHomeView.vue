<!-- =============================================================
  Parent home: "What did my child do today?"          Owner: Kat
  -------------------------------------------------------------
  Already loads the parent's children + each child's sessions & homework.
  TODO (Kat):
    [ ] child switcher when a parent has 2+ children (Ravi Kumar has 2 in the demo data)
    [ ] "Today at student care" card in parent-friendly words
        (reuse <HandoverCard> with POST /handover/:id { audience: 'parent' })
    [ ] timeline of recent sessions (simpler than the volunteer view - no jargon)
    [ ] homework status so parents can remind their child at home
    [ ] "Message the volunteer" button -> /messages/:childId
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import SkillProgressChart from '@/components/charts/SkillProgressChart.vue'
import HomeworkQuestCard from '@/components/HomeworkQuestCard.vue'
import { firstName, formatDate, accuracy } from '@/utils/format'

const auth = useAuthStore()

const children = ref([])
const selectedId = ref(null)
const sessions = ref([])
const homework = ref([])
const loading = ref(true)
const error = ref('')

const selectedChild = computed(() => children.value.find((c) => c.id === selectedId.value))
const latest = computed(() => sessions.value[0] || null)

async function loadChild(childId) {
  selectedId.value = childId
  const [s, h] = await Promise.all([
    api.get('/sessions', { params: { childId } }),
    api.get('/homework', { params: { childId } }),
  ])
  sessions.value = s.data
  homework.value = h.data
}

onMounted(async () => {
  try {
    const res = await api.get('/children')
    children.value = res.data
    if (children.value.length) await loadChild(children.value[0].id)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <PageHeader
      :title="`Hello ${firstName(auth.user.name)}`"
      subtitle="Here's what's been happening at student care."
    />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />
    <StateMessage v-else-if="!selectedChild" message="No child is linked to your account yet." />

    <template v-else>
      <div class="cb-card p-3 p-md-4 mb-4 d-flex align-items-center gap-3">
        <span class="avatar">{{ selectedChild.avatar }}</span>
        <div>
          <h2 class="h5 mb-0">{{ selectedChild.name }}</h2>
          <div class="small text-muted-cb">
            {{ selectedChild.level }} &middot; {{ selectedChild.points }} ⭐ earned
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div v-if="latest" class="cb-card p-3 p-md-4 mb-4">
            <h2 class="h5">Latest session &middot; {{ formatDate(latest.date) }}</h2>
            <p class="mb-1">
              Worked on <strong>{{ latest.subject }}: {{ latest.topic }}</strong> and got
              <strong>{{ latest.correct }} out of {{ latest.attempted }}</strong> right
              ({{ accuracy(latest) }}%).
            </p>
            <p class="mb-0 text-muted-cb">Next time: {{ latest.nextStep }}</p>
          </div>
          <SkillProgressChart :sessions="sessions" />
        </div>
        <div class="col-lg-5">
          <h2 class="h5 mb-3">Homework</h2>
          <div class="d-flex flex-column gap-2">
            <HomeworkQuestCard v-for="h in homework" :key="h.id" :homework="h" mode="parent" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
