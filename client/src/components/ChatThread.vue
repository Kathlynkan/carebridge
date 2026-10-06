<!-- =============================================================
  ChatThread - chat bubbles + send box.               Owner: Kat
  Props:  messages (Array), currentUserId (String), sending (Boolean)
  Emits:  send(text)
  TODO (Kat):
    [ ] emit('send', text) when the form is submitted, then clear the box
    [ ] Enter to send (Week 5: @keyup.enter), disable when empty
    [ ] auto-scroll to the newest message (watch + nextTick)
    [ ] group messages by day ("Today", "Yesterday")
============================================================= -->
<script setup>
import { ref } from 'vue'
import { formatDate } from '@/utils/format'

defineProps({
  messages: { type: Array, default: () => [] },
  currentUserId: { type: String, required: true },
  sending: { type: Boolean, default: false },
})
// eslint-disable-next-line no-unused-vars
const emit = defineEmits(['send'])

const draft = ref('')

function submit() {
  // TODO (Kat): emit the message to the parent page
}

function time(iso) {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <div class="cb-card d-flex flex-column chat">
    <div class="flex-grow-1 overflow-auto p-3" data-test="chat-messages">
      <p v-if="messages.length === 0" class="text-muted-cb text-center mt-4">
        No messages yet. Say hello!
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="d-flex mb-2"
        :class="m.fromId === currentUserId ? 'justify-content-end' : 'justify-content-start'"
      >
        <div class="bubble" :class="m.fromId === currentUserId ? 'mine' : 'theirs'">
          <div class="small fw-bold">{{ m.fromName }}</div>
          <div>{{ m.text }}</div>
          <div class="tiny text-end">{{ formatDate(m.sentAt) }}, {{ time(m.sentAt) }}</div>
        </div>
      </div>
    </div>

    <form class="border-top p-2 d-flex gap-2" @submit.prevent="submit">
      <input
        v-model="draft"
        class="form-control"
        placeholder="Type a message..."
        data-test="chat-input"
      />
      <button class="btn btn-primary" type="submit" :disabled="sending">
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
.bubble {
  max-width: 78%;
  padding: 0.5rem 0.75rem;
  border-radius: 14px;
}
.mine {
  background: var(--cb-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.theirs {
  background: var(--cb-primary-soft);
  border-bottom-left-radius: 4px;
}
.tiny {
  font-size: 0.7rem;
  opacity: 0.75;
}
</style>
