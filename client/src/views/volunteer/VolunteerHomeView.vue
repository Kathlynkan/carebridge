<!-- =============================================================
  Volunteer home: "My Children"                       Owner: Yuqi
  -------------------------------------------------------------
  WORKING reference for "load data from the API and show it":
    onMounted -> axios (api.get) -> ref -> computed -> v-for + component
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth' // get auth sotre from Pinia
import PageHeader from '@/components/PageHeader.vue'
import ChildCard from '@/components/ChildCard.vue'
import StateMessage from '@/components/StateMessage.vue'
import { firstName } from '@/utils/format'

const auth = useAuthStore() // open auth store
const router = useRouter()

const children = ref([])
const sessions = ref([])
const loading = ref(true)
const error = ref('')

const activeTab = ref('today') // 'today' or 'all'
const searchText = ref('')
const selectedLevel = ref('') // by default "All levels"

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    // get the children assigned to me (volunteer)
    const childResponse = await api.get('/children')// "http://localhost:8000/children"
    children.value = childResponse.data

    // get the sessions of all my children (newest first)
    const sessionResponse = await api.get('/sessions')
    sessions.value = sessionResponse.data
  } catch (err) {
    error.value = errorMessage(err) 
  } finally {
    loading.value = false
  }
}

// find each child's latest session to shown under my children tab
const lastSessionByChild = computed(() => {
  const map = {}
  for (const s of sessions.value) {
    if (!map[s.childId]) {
      map[s.childId] = s // store session in obj if child session not stored
    }
  }
  return map
})

// ---------- Today tab ----------
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const today = DAY_NAMES[new Date().getDay()] // e.g. 'Fri'

// my volunteering days, e.g. ['Mon', 'Wed']
const myDays = computed(() => {
  if (auth.user.availability) {
    return auth.user.availability
  }
  return []
})

// is today one of my days?
const workingToday = computed(() => {
  return myDays.value.includes(today)
})

// children I'm seeing today
const todaysChildren = computed(() => {
  if (workingToday.value) {
    return children.value
  }
  return []
})

// which children have the same struggle 2+ times in their last 5 sessions?
// e.g. { c_1: true, c_3: true, c_4: false }   (same rule as findRecurring on the server)
const needsAttentionByChild = computed(() => {
  const result = {}
  for (const child of children.value) {
    // get latest 5 sessions of today's child 
    const childSessions = sessions.value.filter((s) => s.childId === child.id).slice(0, 5)

    const counts = {}
    let repeated = false
    for (const s of childSessions) {
      for (const struggle of s.struggles) { //each struggle in sessions.struggles
        if (counts[struggle]) {
          counts[struggle] = counts[struggle] + 1 
          repeated = true // seen before -> this struggle keeps coming back
        } else {
          counts[struggle] = 1
        }
      }
    }
    result[child.id] = repeated
  }
  return result
})

// ---------- All my children tab ----------
// search + level filter 
const filteredChildren = computed(() => {
  const search = searchText.value.toLowerCase()
  let result = children.value.filter((child) => child.name.toLowerCase().includes(search))
  if (selectedLevel.value !== '') {
    result = result.filter((child) => child.level === selectedLevel.value)
  }
  return result
})

// only show levels of all my(volunteer's) children 
const levelOptions = computed(() => {
  const levels = []
  for (const child of children.value) {
    if (!levels.includes(child.level)) {
      levels.push(child.level) // include child's level if its not in the array
    }
  }
  return levels.sort()
})

function clearFilters() {
  searchText.value = ''
  selectedLevel.value = ''
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
      subtitle="Open a child to see their handover before your session."
    />
    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <template v-else>
      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <!-- today's children -->
        <li class="nav-item">
          <button
            type="button"
            class="nav-link"
            :class="{ active: activeTab === 'today' }"
            data-test="tab-today"
            @click="activeTab = 'today'"
          >
            <i class="bi bi-calendar-check me-1"></i>Today ({{ today }})
            <span class="badge text-bg-primary ms-1">{{ todaysChildren.length }}</span>
          </button>
        </li>
        <!-- all children -->
        <li class="nav-item">
          <button
            type="button"
            class="nav-link"
            :class="{ active: activeTab === 'all' }"
            data-test="tab-all"
            @click="activeTab = 'all'"
          >
            <i class="bi bi-people me-1"></i>All my children
            <span class="badge text-bg-secondary ms-1">{{ children.length }}</span>
          </button>
        </li>
      </ul>

      <!-- ===== TODAY TAB ===== -->
      <div v-if="activeTab === 'today'">
        <!-- no children at all -->
        <div v-if="children.length === 0" class="cb-card p-4 text-center">
          <i class="bi bi-person-plus fs-2 text-muted-cb"></i>
          <p class="mb-5 mt-2">No children assigned to you yet. Your coordinator will assign them.</p>
        </div>

        <!-- not my day -->
        <div v-else-if="!workingToday" class="cb-card p-4 text-center" data-test="not-today">
          <i class="bi bi-calendar-x fs-2 text-muted-cb"></i>
          <p class="mb-1 mt-2"><strong>You're not volunteering today.</strong></p>
          <p class="small text-muted-cb">
            Your days: {{ myDays.length > 0 ? myDays.join(', ') : 'not set' }}
          </p>
          <button type="button" class="btn btn-outline-primary btn-sm" @click="activeTab = 'all'">
            View all my children
          </button>
        </div>

        <!-- today's children -->
        <div v-else class="row g-3">
          <div v-for="child in todaysChildren" :key="child.id" class="col-sm-6 col-lg-4">
            <ChildCard 
            :child="child" 
            :last-session="lastSessionByChild[child.id]" 
            :needs-attention="needsAttentionByChild[child.id]" 
            @open="openChild" />
          </div>
        </div>
      </div>

      <!-- ===== ALL MY CHILDREN TAB ===== -->
      <div v-else>
        <StateMessage
          v-if="children.length === 0"
          message="No children assigned to you yet. Your coordinator will assign them."
        />

        <template v-else>
          <!-- search + filter -->
          <div class="cb-card p-3 mb-3">
            <div class="row g-2 align-items-end">
              <div class="col-12 col-md-7">
                <label for="search" class="form-label small mb-1">Search</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input
                    id="search"
                    v-model.trim="searchText"
                    type="text"
                    class="form-control"
                    placeholder="Type a child's name"
                    data-test="child-search"
                  />
                </div>
              </div>
              <!-- filter by level -->
              <div class="col-8 col-md-3">
                <select v-model="selectedLevel" class="form-select" data-test="level-filter">
                  <option value="">All levels</option>
                  <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
                </select>
              </div>
              <div class="col-4 col-md-2 d-grid">
                <button type="button" class="btn btn-outline-secondary" @click="clearFilters">Clear</button>
              </div>
            </div>
          </div>

          <StateMessage v-if="filteredChildren.length === 0" message="No children match your search." />

          <div v-else class="row g-3">
            <div v-for="child in filteredChildren" :key="child.id" class="col-sm-6 col-lg-4">
              <ChildCard 
              :child="child" 
              :last-session="lastSessionByChild[child.id]" 
              :needs-attention="needsAttentionByChild[child.id]" 
              @open="openChild" />
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
