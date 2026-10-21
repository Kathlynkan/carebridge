<!-- =============================================================
  ChatThread - chat bubbles + send box.               Owner: Kat
============================================================= -->
<script setup>
import { ref } from 'vue'
import { formatDate } from '@/utils/format'

defineProps({
  messages:      { type: Array, default: () => [] },
  currentUserId: { type: String, required: true },
  sending:       { type: Boolean, default: false },
})
const emit = defineEmits(['send'])

const draft = ref('')

function submit() {
  const text = draft.value.trim()
  if (!text) return
  emit('send', text)
  draft.value = ''
}

function time(iso) {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <div class="cb-card d-flex flex-column chat" style="padding-top: 0.5rem !important;">
    <div class="flex-grow-1 overflow-auto p-3" data-test="chat-messages">
      <p v-if="messages.length === 0" class="empty-chat text-center mt-4">
        No messages yet. Say hello!
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="d-flex mb-2"
        :class="m.fromId === currentUserId ? 'justify-content-end' : 'justify-content-start'"
      >
        <div class="bubble" :class="m.fromId === currentUserId ? 'mine' : 'theirs'">
          <div class="bubble-name">{{ m.fromName }}</div>
          <div class="bubble-text">{{ m.text }}</div>
          <div class="bubble-time">{{ formatDate(m.sentAt) }}, {{ time(m.sentAt) }}</div>
        </div>
      </div>
    </div>

    <form class="chat-input-row border-top p-2 d-flex gap-2" @submit.prevent="submit">
      <input
        v-model="draft"
        class="form-control"
        placeholder="Type a message..."
        data-test="chat-input"
        @keyup.enter="submit"
      />
      <button class="btn btn-primary" type="submit" :disabled="sending || !draft.trim()">
        <i class="bi bi-send"></i>
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  height: 65vh;
  min-height: 360px;
}

.empty-chat {
  color: var(--cb-muted);
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.bubble {
  max-width: 78%;
  padding: 0.5rem 0.85rem;
  border-radius: 14px;
  border: 3px solid var(--lapis-shadow);
  box-shadow: 3px 3px 0 var(--lapis-shadow);
  font-weight: 500;
}

.mine {
  background: var(--topic-messages);
  color: var(--lapis-plum);
  border-bottom-right-radius: 4px;
}

.theirs {
  background: var(--topic-messages-soft);
  color: var(--lapis-plum);
  border-bottom-left-radius: 4px;
}

.bubble-name {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin-bottom: 2px;
}

.bubble-text { font-size: 0.95rem; }

.bubble-time {
  font-size: 0.68rem;
  text-align: right;
  opacity: 0.7;
  margin-top: 3px;
}

.chat-input-row {
  border-top-color: var(--lapis-shadow) !important;
  border-top-width: 3px !important;
}
</style>
