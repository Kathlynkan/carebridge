<!-- =============================================================
  Child profile = the PRE-SESSION BRIEFING page.      Owner: Yuqi
  (Session history list + homework section: Ning Xuan's components)
  (Charts: Jachin's components)
  -------------------------------------------------------------
  Already loads: child, sessions, homework, handover (fallback summary).
  TODO (Yuqi):
    [ ] "At a glance" cards: recent topics, recurring struggles, best methods
    [ ] HandoverCard refresh -> POST /handover/:id again (after Gemini is wired up)
    [ ] tabs (Overview / History / Homework) on mobile so the page isn't too long
  TODO (Ning Xuan):
    [done] wire SessionCard @edit / @delete (DELETE /sessions/:id, then reload)
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import HandoverCard from '@/components/HandoverCard.vue'
import SessionCard from '@/components/SessionCard.vue'
import HomeworkQuestCard from '@/components/HomeworkQuestCard.vue'
import SkillProgressChart from '@/components/charts/SkillProgressChart.vue'
import TopicSummaryChart from '@/components/charts/TopicSummaryChart.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const childId = route.params.id

const child = ref(null)
const sessions = ref([])
const homework = ref([])
const handover = ref(null)
const handoverLoading = ref(false)
const loading = ref(true)
const success = ref('')
const error = ref('')

const pendingHomework = computed(() => homework.value.filter((h) => h.status !== 'verified'))

async function loadHandover() {
  handoverLoading.value = true
  try {
    const res = await api.post(`/handover/${childId}`, { audience: 'volunteer' })
    handover.value = res.data
  } catch (err) {
    console.error(errorMessage(err))
  } finally {
    handoverLoading.value = false
  }
}

async function loadData() {
  try {
    const [c, s, h] = await Promise.all([
      api.get(`/children/${childId}`),
      api.get('/sessions', { params: { childId } }),
      api.get('/homework', { params: { childId } }),
    ])
    child.value = c.data
    sessions.value = s.data
    homework.value = h.data
    loadHandover()
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

function editSession(sessionId) {
  router.push({ name: 'session-edit', params: { sessionId } })
}

// The child handed a quest in; the volunteer checks it and the child is paid the stars (PUT /homework/:id/verify)
const checkingQuestId = ref(null)
async function verifyQuest(homeworkId) {
  checkingQuestId.value = homeworkId
  try {
    await api.put(`/homework/${homeworkId}/verify`)
    const h = await api.get('/homework', { params: { childId } })
    homework.value = h.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    checkingQuestId.value = null
  }
}

async function deleteSession(sessionId) {
  try {
    await api.delete(`/sessions/${sessionId}`)

    success.value = 'Session deleted successfully'

    await loadData() // reload data after successful deletion
  } catch (err) {
    error.value = errorMessage(err)
  }
}

onMounted(() => {
  success.value = route.query.success || ''

  // remove success message from URL after reading it
  if (route.query.success) {
    router.replace({
      name: 'child-profile',
      params: {id: childId}
    })
  }

  loadData()
})
</script>

<template>
  <div class="container py-4">
    <StateMessage v-if="loading" type="loading" />

    <template v-else>
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      <StateMessage v-else-if="error" type="error" :message="error" />

      <PageHeader :title="child.name" :subtitle="`${child.level} · ${child.school}`">
        <RouterLink
          v-if="auth.role === 'volunteer'"
          :to="{ name: 'session-new', params: { id: child.id } }"
          class="btn btn-primary"
          data-test="record-session"
        >
          <i class="bi bi-plus-lg me-1"></i>Record session
        </RouterLink>
        <RouterLink
          v-if="auth.role === 'volunteer'"
          :to="{ name: 'homework-new', params: { id: child.id } }"
          class="btn btn-outline-primary"
        >
          <i class="bi bi-journal-plus me-1"></i>Give homework
        </RouterLink>
        <RouterLink :to="{ name: 'messages', params: { childId: child.id } }" class="btn btn-outline-secondary">
          <i class="bi bi-chat-dots me-1"></i>Message parent
        </RouterLink>
      </PageHeader>

      <div class="row g-4">
        <div class="col-lg-7">
          <HandoverCard :handover="handover" :loading="handoverLoading" class="mb-4" @refresh="loadHandover" />

          <h2 class="h5 mb-3">Session history</h2>
          <StateMessage v-if="sessions.length === 0" message="No sessions recorded yet." />
          <div class="d-flex flex-column gap-3">
            <SessionCard
              v-for="s in sessions"
              :key="s.id"
              :session="s"
              :can-edit="s.volunteerId === auth.user.id || auth.role === 'coordinator'"
              @edit="editSession"
              @delete="deleteSession"
            />
          </div>
        </div>

        <div class="col-lg-5 d-flex flex-column gap-4">
          <SkillProgressChart :sessions="sessions" />
          <TopicSummaryChart :sessions="sessions" />

          <div>
            <h2 class="h5 mb-3">Homework ({{ pendingHomework.length }} pending)</h2>
            <div class="d-flex flex-column gap-2">
              <HomeworkQuestCard
                v-for="h in homework"
                :key="h.id"
                :homework="h"
                mode="volunteer"
                :busy="checkingQuestId !== null"
                @verify="verifyQuest"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>