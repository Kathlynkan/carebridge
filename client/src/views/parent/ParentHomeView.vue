<!-- =============================================================
  Parent home: "What did my child do today?"          Owner: Kat
  -------------------------------------------------------------
  Already loads the parent's children + each child's sessions & homework.
  TODO (Kat):
    [x] child switcher when a parent has 2+ children (Ravi Kumar has 2 in the demo data)
    [x] "Today at student care" card in parent-friendly words
        (reuse <HandoverCard> with POST /handover/:id { audience: 'parent' })
    [x] timeline of recent sessions (simpler than the volunteer view - no jargon)
    [ ] homework status so parents can remind their child at home
    [ ] "Message the volunteer" button -> /messages/:childId
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue' 
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth' // the logged-in user
import PageHeader from '@/components/PageHeader.vue' // for the 'Hello {{parent}}'
import StateMessage from '@/components/StateMessage.vue' // to show loading etc 
import SkillProgressChart from '@/components/charts/SkillProgressChart.vue'
import HomeworkQuestCard from '@/components/HomeworkQuestCard.vue'
import HandoverCard from '@/components/HandoverCard.vue' 
import { firstName, formatDate, accuracy } from '@/utils/format' // small helpers for names, dates and scores
import '@/assets/parentpage.css' // the styles of this page (the timeline)

const auth = useAuthStore()

// ---------- the things this page remembers ----------
const children = ref([]) // all the children of this parent
const selectedId = ref(null) // the id of the child we are showing now
const sessions = ref([]) // the sessions of that child, newest first
const homework = ref([]) // the homework of that child
const handover = ref(null) // the "Today at student care" summary of that child
const handoverLoading = ref(false) // true while we wait for the summary
const loading = ref(true) // true while the page is first loading
const error = ref('') // the error sentence, empty if there is no error

// ---------- values worked out from the things above ----------
// the child we are showing now (found in the list by its id)
const selectedChild = computed(() => children.value.find((child) => child.id === selectedId.value))

// the newest session (the first one in the list)
const latest = computed(() => sessions.value[0] || null)

// the 5 newest sessions, for the timeline
const recentSessions = computed(() => sessions.value.slice(0, 5))

// how the child felt, in simple words for a parent
const MOOD_WORDS = {
  happy: '😊 Happy',
  okay: '🙂 Doing okay',
  tired: '😴 A bit tired',
  frustrated: '😕 Found it hard',
}

// ---------- ask the server for the "Today at student care" summary ----------
async function loadHandover(childId) {
  handover.value = null
  handoverLoading.value = true
  let summary = null // stays empty if something goes wrong, the rest of the page still works
  try {
    // audience: 'parent' makes the AI write in simple, friendly words
    const response = await api.post(`/handover/${childId}`, { audience: 'parent' })
    summary = response.data
  } catch {
    summary = null
  }
  if (childId !== selectedId.value) return // the parent already switched to another child, so ignore this answer
  handover.value = summary
  handoverLoading.value = false
}

// ---------- show one child: their summary, sessions and homework ----------
async function loadChild(childId) {
  selectedId.value = childId
  loadHandover(childId) // no "await": the page does not wait for the AI
  const sessionResponse = await api.get('/sessions', { params: { childId } })
  sessions.value = sessionResponse.data
  const homeworkResponse = await api.get('/homework', { params: { childId } })
  homework.value = homeworkResponse.data
}

// ---------- when the parent presses a child's button ----------
async function switchChild(childId) {
  if (childId === selectedId.value) return // already showing this child
  error.value = ''
  try {
    await loadChild(childId)
  } catch (err) {
    error.value = errorMessage(err)
  }
}

// ---------- when the page opens: get the children, then show the first one ----------
onMounted(async () => {
  try {
    const response = await api.get('/children')
    children.value = response.data
    if (children.value.length > 0) {
      await loadChild(children.value[0].id)
    }
  } catch (err) {
    error.value = errorMessage(err)
  }
  loading.value = false
})
</script>

<template>
  <div class="container py-4 parentpage">
    <PageHeader :title="`Hello ${firstName(auth.user.name)}`" subtitle="Here's what's been happening at student care." />

    <!-- one of these three messages shows while loading, on an error, or when there is no child -->
    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />
    <StateMessage v-else-if="!selectedChild" message="No child is linked to your account yet." />

    <template v-else>
      <!-- child buttons: only shown when the parent has 2 or more children -->
      <div v-if="children.length > 1" class="d-flex flex-wrap gap-2 mb-3" data-test="child-switcher">
        <button
          v-for="child in children"
          :key="child.id"
          type="button"
          class="btn"
          :class="child.id === selectedId ? 'btn-primary' : 'btn-outline-primary'"
          @click="switchChild(child.id)"
        >
          {{ child.avatar }} {{ firstName(child.name) }}
        </button>
      </div>

      <!-- the child's name, level and stars -->
      <div class="cb-card p-3 p-md-4 mb-4 d-flex align-items-center gap-3">
        <span class="avatar">{{ selectedChild.avatar }}</span>
        <div>
          <h2 class="h5 mb-0">{{ selectedChild.name }}</h2>
          <div class="small text-muted-cb">{{ selectedChild.level }} &middot; ⭐ {{ selectedChild.points }} stars earned</div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <!-- "Today at student care": a short update in simple words -->
          <HandoverCard
            v-if="handover || handoverLoading"
            :handover="handover"
            :loading="handoverLoading"
            audience="parent"
            title="Today at student care"
            class="mb-4"
            @refresh="loadHandover(selectedId)"
          />

          <!-- the newest session -->
          <div v-if="latest" class="cb-card p-3 p-md-4 mb-4">
            <h2 class="h5">Latest session &middot; {{ formatDate(latest.date) }}</h2>
            <p class="mb-1">
              Worked on <strong>{{ latest.subject }}: {{ latest.topic }}</strong> and got
              <strong>{{ latest.correct }} out of {{ latest.attempted }}</strong> right ({{ accuracy(latest) }}%).
            </p>
            <p class="mb-0 text-muted-cb">Next time: {{ latest.nextStep }}</p>
          </div>

          <SkillProgressChart :sessions="sessions" />

          <!-- timeline: the recent sessions, one short entry each -->
          <div v-if="recentSessions.length > 0" class="cb-card p-3 p-md-4 mt-4" data-test="session-timeline">
            <h2 class="h5 mb-3">Recent sessions</h2>
            <ul class="timeline list-unstyled mb-0">
              <li v-for="session in recentSessions" :key="session.id" class="timeline-item">
                <div class="small text-muted-cb">{{ formatDate(session.date) }}</div>
                <div class="fw-semibold">{{ session.subject }}: {{ session.topic }}</div>
                <div>
                  Got {{ session.correct }} out of {{ session.attempted }} right
                  <span v-if="MOOD_WORDS[session.mood]" class="text-muted-cb">&middot; {{ MOOD_WORDS[session.mood] }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- the homework of the child -->
        <div class="col-lg-5">
          <h2 class="h5 mb-3">Homework</h2>
          <div class="d-flex flex-column gap-2">
            <HomeworkQuestCard v-for="item in homework" :key="item.id" :homework="item" mode="parent" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
