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
import axios from 'axios'
// import api, { errorMessage } from '@/services/api'
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

const searchText = ref('')
const selectedLevel = ref('') // '' means "All levels"
const sortBy = ref('longest') // 'longest' or 'name'

// Address of our Express server (change to the deployed URL when we deploy)
const API_URL = 'http://localhost:8000'

// show the child's session history
const lastSessionByChild = computed(() => {
  const map = {}
  for (const s of sessions.value) {
    if (!map[s.childId]) {
      map[s.childId] = s // store session in obj if child session not stored
    }
  }
  return map
})

async function loadData() {
  loading.value = true
  error.value = ''

  // send the login token so the server knows who is asking (Week 5: request headers)
  const config = {
    headers: { Authorization: `Bearer ${auth.token}` },
  }

  try {
    // get the children assigned to this volunteer
    const childResponse = await axios.get(`${API_URL}/children`, config)
    children.value = childResponse.data

    // get the sessions of those children
    const sessionResponse = await axios.get(`${API_URL}/sessions`, config)
    sessions.value = sessionResponse.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message
  } finally {
    loading.value = false
  }
}

const filteredChildren = computed(() => {
  const search = searchText.value.toLowerCase()
  let result = children.value.filter((child) => child.name.toLowerCase().includes(search))
  if (selectedLevel.value !== '') {
      result = result.filter((child) => child.level === selectedLevel.value)
  }
  return result
})

// only show levels that my children actually have, e.g. ['P3', 'P4']
const levelOptions = computed(() => {
  const levels = []
  for (const child of children.value) {
    if (!levels.includes(child.level)) levels.push(child.level)
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
      subtitle="These are the children assigned to you. Open one to see their handover before your session."
    />

    <!--<TodoPanel
      owner="Yuqi"
      :items="[
        'Search + filter children (v-model + computed)',
        'Sort by longest time since last session',
        'Today strip: who you are seeing today',
      ]"
    />-->

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />
    <StateMessage
      v-else-if="children.length === 0"
      message="No children assigned to you yet. Your coordinator will assign them."
    />

    <template v-else>
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
          <div class="col-8 col-md-3">
            <select v-model="selectedLevel" class="form-select" data-test="level-filter">
              <option value="">All levels</option>
              <option v-for="level in levelOptions" :key="level" :value="level">{{ level }}</option>
            </select>
          </div>
          <div class="col-4 col-md-2 d-grid">
            <button type="button" class="btn btn-outline-secondary" @click="clearFilters">
              Clear
            </button>
          </div>
        </div>
      </div>

      <StateMessage v-if="filteredChildren.length === 0" message="No children match your search."/>

      <div v-else class="row g-3">
        <div v-for="child in filteredChildren" :key="child.id" class="col-sm-6 col-lg-4">
          <ChildCard
            :child="child"
            :last-session="lastSessionByChild[child.id]"
            @open="openChild"
          />
        </div>
      </div>
    </template>
  </div>
</template>
