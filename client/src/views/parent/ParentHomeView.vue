<!-- =============================================================
  Parent home: "What did my child do today?"          Owner: Kat
  -------------------------------------------------------------
  Already loads the parent's children + each child's sessions & homework.
  TODO (Kat):
    [x] child switcher when a parent has 2+ children (Ravi Kumar has 2 in the demo data)
    [x] "Today at student care" card in parent-friendly words
        (reuse <HandoverCard> with POST /handover/:id { audience: 'parent' })
    [x] timeline of recent sessions (simpler than the volunteer view - no jargon)
    [x] homework status so parents can remind their child at home
    [x] "Message the volunteer" button -> /messages/:childId
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
import ParentSessionCard from '@/components/ParentSessionCard.vue' // the session card from the whiteboard design
import { firstName, formatDate, daysSince } from '@/utils/format' // small helpers for names, dates and scores
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
const noticeTab = ref('latest') // which tab of the notice board is open: 'social', 'latest' or 'homework'

// ---------- values worked out from the things above ----------
// the child we are showing now (found in the list by its id)
const selectedChild = computed(() => children.value.find((child) => child.id === selectedId.value))

// the newest session (the first one in the list)
const latest = computed(() => sessions.value[0] || null)

// the homework that is still to do, the earliest due date first (for the reminders)
const todoHomework = computed(() => {
  const list = homework.value.filter((item) => item.status === 'assigned')
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
})

// how many homework items are to do, waiting for the volunteer to check, or checked
const homeworkCounts = computed(() => {
  const counts = { todo: 0, waiting: 0, checked: 0, late: 0 }
  for (const item of homework.value) {
    if (item.status === 'assigned') counts.todo = counts.todo + 1
    if (item.status === 'submitted') counts.waiting = counts.waiting + 1
    if (item.status === 'verified') counts.checked = counts.checked + 1
    if (item.status === 'assigned' && daysSince(item.dueDate) > 0) counts.late = counts.late + 1
  }
  return counts
})

// the non-academic things the child did in a session (chess with friends, soccer ...), as a list
function activitiesOf(session) {
  if (session.activities && session.activities.length > 0) {
    return session.activities
  }
  if (session.activity) {
    return [session.activity]
  }
  return []
}

// the 5 newest sessions, for the timeline
const recentSessions = computed(() => sessions.value.slice(0, 5))

// how the child felt, in simple words for a parent
const MOOD_WORDS = {
  happy: '😊 Happy',
  okay: '🙂 Doing okay',
  tired: '😴 A bit tired',
  frustrated: '😕 Found it hard',
}

// the child's first name, used in the sentences
const childName = computed(() => (selectedChild.value ? firstName(selectedChild.value.name) : ''))

// how the child was, as the end of a sentence
const FEELING_WORDS = {
  happy: 'was happy',
  okay: 'was doing okay',
  tired: 'was a bit tired',
  frustrated: 'had a harder day',
}

// the name on the message button: the volunteer of the latest session, like 'Aisha' ('the volunteer' if we do not know)
const messageName = computed(() => {
  if (latest.value && latest.value.volunteerName) return firstName(latest.value.volunteerName)
  return 'the volunteer'
})

// the weekday of the latest session, like "Saturday"
const latestWeekday = computed(() => {
  if (!latest.value) return ''
  return new Date(latest.value.date).toLocaleDateString('en-SG', { weekday: 'long' })
})

// the number of each weekday, the way JavaScript counts them (Sunday is 0)
const DAY_NUMBERS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

// the name of a volunteer, found in the sessions we already have (empty if we have not seen them yet)
function volunteerName(volunteerId) {
  const session = sessions.value.find((item) => item.volunteerId === volunteerId)
  return session ? session.volunteerName : ''
}

// the next session of the child: the soonest day in the child's weekly schedule
const nextSession = computed(() => {
  const schedule = selectedChild.value ? selectedChild.value.schedule : []
  if (!schedule || schedule.length === 0) return null

  const today = new Date()
  let soonest = null
  for (const slot of schedule) {
    let daysAway = DAY_NUMBERS[slot.day] - today.getDay()
    if (daysAway < 0) daysAway = daysAway + 7 // that day already passed this week, so it is next week
    if (soonest === null || daysAway < soonest.daysAway) {
      soonest = { daysAway: daysAway, volunteerId: slot.volunteerId }
    }
  }

  // the date of that day, written like 2026-10-12 so formatDate can show it
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + soonest.daysAway)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return {
    isToday: soonest.daysAway === 0,
    date: `${date.getFullYear()}-${month}-${day}`,
    volunteer: volunteerName(soonest.volunteerId),
  }
})

// how many of the 9 cake layers are baked: one for every checked homework (a full cake is 9, then a new one starts)
const layersBaked = computed(() => {
  const checked = homeworkCounts.value.checked
  if (checked > 0 && checked % 9 === 0) return 9
  return checked % 9
})

// ONE friendly sentence about the latest session, shown at the very top
const topSentence = computed(() => {
  if (!latest.value) return ''
  const session = latest.value
  const feeling = FEELING_WORDS[session.mood] || 'was at student care'
  let text = `${childName.value} ${feeling} on ${formatDate(session.date)}. `
  text = text + `${childName.value} worked on ${session.subject}: ${session.topic} and got ${session.correct} out of ${session.attempted} right.`
  if (activitiesOf(session).length > 0) {
    text = text + ` Also: ${activitiesOf(session).join(', ')}.`
  }
  if (homeworkCounts.value.late > 0) {
    text = text + ` ${homeworkCounts.value.late} homework is late.`
  }
  return text
})

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
    <PageHeader :title="`Hello ${firstName(auth.user.name)}`" subtitle="Stay up to date with your child's learning and social life at student care." />

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
        <!-- goes to the chat about this child -->
        <router-link :to="{ name: 'messages', params: { childId: selectedId } }" class="btn btn-primary ms-auto" data-test="message-volunteer">
          <i class="bi bi-chat-dots me-1"></i>Message {{ messageName }}
        </router-link>
      </div>

      <!-- one sentence: how the latest session went -->
      <div v-if="topSentence" class="top-summary" data-test="top-summary">
        <span class="top-label">Today at a glance</span>
        {{ topSentence }}
        <!-- who ran the last session, and when the next one is -->
        <div v-if="latest && latest.volunteerName" class="top-extra">{{ latest.volunteerName }} ran {{ latestWeekday }}'s session.</div>
        <div v-if="nextSession" class="top-extra top-next">
          Next session: {{ nextSession.isToday ? 'today, ' : '' }}{{ formatDate(nextSession.date) }}
          <span v-if="nextSession.volunteer">with {{ nextSession.volunteer }}</span>
        </div>
      </div>

      <!-- the notice board (the AI summary is inside it, under the academic details) -->
      <div class="row g-4 mb-4">
        <div class="col-12">
          <div class="notice-board" :class="'board-' + noticeTab" data-test="notice-board">
            <h2 class="board-title">Notice board</h2>

            <!-- the three tabs -->
            <div class="notice-tabs">
              <button type="button" class="notice-tab tab-social" :class="{ active: noticeTab === 'social' }" @click="noticeTab = 'social'">Social</button>
              <button type="button" class="notice-tab tab-latest" :class="{ active: noticeTab === 'latest' }" @click="noticeTab = 'latest'">Latest session</button>
              <button type="button" class="notice-tab tab-homework" :class="{ active: noticeTab === 'homework' }" @click="noticeTab = 'homework'">Homework</button>
            </div>

            <!-- tab: social = one post-it per session. Click it to open the social card of that session. -->
            <div v-if="noticeTab === 'social'">
              <p v-if="recentSessions.length === 0" class="note mb-0">Nothing posted yet.</p>
              <details v-for="session in recentSessions" :key="session.id" class="note">
                <!-- the part you always see: the date, the mood and the activities -->
                <summary>
                  {{ formatDate(session.date) }} &middot; {{ MOOD_WORDS[session.mood] || 'Mood not noted' }}
                  <span v-if="activitiesOf(session).length > 0" class="text-muted-cb">&middot; {{ activitiesOf(session).join(', ') }}</span>
                </summary>
                <!-- the part that opens: the social card -->
                <div class="mt-2">
                  <ParentSessionCard :session="session" :child="selectedChild" :social-only="true" />
                </div>
              </details>
            </div>

            <!-- tab: latest session = the session card -->
            <div v-else-if="noticeTab === 'latest'">
              <p v-if="!latest" class="note mb-0">No sessions yet.</p>
              <ParentSessionCard v-else :session="latest" :child="selectedChild" :homework="homework">
                <!-- the AI summary, under the academic details -->
                <template #academic-extra>
                  <HandoverCard
                    v-if="handover || handoverLoading"
                    :handover="handover"
                    :loading="handoverLoading"
                    audience="parent"
                    title="AI summary"
                  />
                  <div v-else class="small text-muted-cb">No summary yet.</div>
                </template>
              </ParentSessionCard>
            </div>

            <!-- tab: homework = the homework of the child -->
            <div v-else>
              <p v-if="homework.length === 0" class="note mb-0">No homework right now.</p>

              <!-- homework status: four small boxes with numbers -->
              <div v-else class="homework-status" data-test="homework-status">
                <div class="status-box"><strong class="fs-4">{{ homeworkCounts.todo }}</strong><span class="small text-muted-cb">To do</span></div>
                <div class="status-box"><strong class="fs-4">{{ homeworkCounts.waiting }}</strong><span class="small text-muted-cb">Waiting for check</span></div>
                <div class="status-box"><strong class="fs-4">{{ homeworkCounts.checked }}</strong><span class="small text-muted-cb">Checked</span></div>
                <div class="status-box" :class="{ late: homeworkCounts.late > 0 }"><strong class="fs-4">{{ homeworkCounts.late }}</strong><span class="small text-muted-cb">Late</span></div>
              </div>

              <!-- the kueh lapis cake: nine layers, one more for every checked homework -->
              <div v-if="homework.length > 0" class="cake-box" data-test="cake">
                <span class="note-label">{{ firstName(selectedChild.name) }}'s kueh lapis</span>
                <div class="cake">
                  <i v-for="layer in 9" :key="layer" :class="{ baked: layer <= layersBaked }"></i>
                </div>
                <div class="small">{{ layersBaked }} of 9 layers baked. Each checked homework adds one.</div>
              </div>

              <!-- reminders: what to ask the child about at home -->
              <div v-if="todoHomework.length > 0" class="note" data-test="homework-reminders">
                <strong>Remind {{ firstName(selectedChild.name) }} at home:</strong>
                <ul class="mb-0 ps-4">
                  <li v-for="item in todoHomework" :key="item.id">
                    {{ item.title }} - due {{ formatDate(item.dueDate) }}
                    <span v-if="daysSince(item.dueDate) > 0" class="text-danger fw-semibold">(late)</span>
                  </li>
                </ul>
              </div>
              <div class="d-flex flex-column gap-2">
                <div v-for="item in homework" :key="item.id" class="note">
                  <HomeworkQuestCard :homework="item" mode="parent" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- below: the progress chart and the recent sessions -->
      <div class="row g-4">
        <div class="col-lg-7">
          <SkillProgressChart :sessions="sessions" />
        </div>
        <div class="col-lg-5">
          <div v-if="recentSessions.length > 0" class="cb-card topic-academic p-3 p-md-4" data-test="session-timeline">
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
      </div>
    </template>
  </div>
</template>
