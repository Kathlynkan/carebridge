<!-- =============================================================
  Messages: volunteer <-> parent, one conversation per child.   Owner: Kat
  Route: /messages/:childId?   (used by volunteers, parents, coordinators)
  -------------------------------------------------------------
  Already: list of children on the left, messages loaded for the selected child.
  TODO (Kat):
    [ ] onSend(text): POST /messages, then add it to the list
    [ ] mark as read (PUT /messages/read) when a conversation is opened
    [ ] unread badge per child in the left list (GET /messages/unread)
    [ ] simple polling every 10s with setInterval (clear it in onUnmounted!)
    [ ] mobile: show either the list OR the chat, with a back button
============================================================= -->
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import ChatThread from '@/components/ChatThread.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const children = ref([])
const messages = ref([])
const loading = ref(true)
const error = ref('')

async function loadMessages(childId) {
  if (!childId) return
  try {
    const res = await api.get('/messages', { params: { childId } })
    messages.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  }
}

// eslint-disable-next-line no-unused-vars
async function onSend(text) {
  // TODO (Kat)
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
})
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Messages" subtitle="Keep parents and volunteers on the same page." />
    <TodoPanel
      owner="Kat"
      :items="['Send messages', 'Mark as read + unread badges', 'Polling for new messages', 'Mobile layout']"
    />

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
        <ChatThread :messages="messages" :current-user-id="auth.user.id" @send="onSend" />
      </div>
    </div>
  </div>
</template>
