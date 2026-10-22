<!-- =============================================================
  Messages: parent <-> teacher, one conversation per child.   Owner: Kat
  Route: /messages/:childId?   (used by parents and teachers)
============================================================= -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import ChatThread from '@/components/ChatThread.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const subtitle = computed(() => {
  if (auth.role === 'parent') return "Chat with your child's teachers."
  if (auth.role === 'teacher') return 'Chat with parents about their child.'
  return 'Chat about your child\'s progress.'
})

const children = ref([])
const messages = ref([])
const loading = ref(true)
const sending = ref(false)
const error = ref('')
const pollTimer = ref(null)

async function loadMessages(childId) {
  if (!childId) return
  try {
    const res = await api.get('/messages', { params: { childId } })
    messages.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  }
}

async function onSend(text) {
  if (!text?.trim() || !route.params.childId) return
  sending.value = true
  try {
    const res = await api.post('/messages', { childId: route.params.childId, text })
    messages.value.push(res.data)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    sending.value = false
  }
}

function selectChild(childId) {
  router.push({ name: 'messages', params: { childId } })
}

// When the URL changes (/messages/c_1 -> /messages/c_2), reload (Week 6: watchers)
watch(
  () => route.params.childId,
  (childId) => loadMessages(childId),
)

onMounted(async () => {
  try {
    const res = await api.get('/children')
    children.value = res.data
    if (!route.params.childId && children.value.length) {
      selectChild(children.value[0].id)
    } else {
      await loadMessages(route.params.childId)
    }
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
  // Poll every 10 s so new messages appear without a manual refresh
  pollTimer.value = setInterval(() => {
    if (route.params.childId) loadMessages(route.params.childId)
  }, 10_000)
})

onUnmounted(() => clearInterval(pollTimer.value))
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Messages" :subtitle="subtitle" />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <div v-else class="row g-3">
      <div class="col-md-4">
        <div class="list-group">
          <button
            v-for="c in children"
            :key="c.id"
            type="button"
            class="list-group-item list-group-item-action d-flex align-items-center gap-2"
            :class="{ active: c.id === route.params.childId }"
            @click="selectChild(c.id)"
          >
            <span>{{ c.avatar }}</span> {{ c.name }}
          </button>
        </div>
      </div>
      <div class="col-md-8">
        <ChatThread :messages="messages" :current-user-id="auth.user.id" :sending="sending" @send="onSend" />
      </div>
    </div>
  </div>
</template>
