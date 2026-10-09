<!-- =============================================================
  SessionCard - one past session in the history list.   Owner: Ning Xuan
  Props:  session (Object), canEdit (Boolean)
  Emits:  edit(sessionId), delete(sessionId)
  TODO (Ning Xuan):
    [ ] confirm before delete (Bootstrap modal)
    [ ] collapse long notes ("Show more")
============================================================= -->
<script setup>
import { ref } from 'vue'
import { formatDate, accuracy } from '@/utils/format'
import { MOODS } from '@/utils/constants'

const props = defineProps({
  session: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})
const emit = defineEmits(['edit', 'delete'])

const mood = MOODS.find((m) => m.value === props.session.mood)

const showFullNotes = ref(false)

function handleDelete() {
  const confirmed = window.confirm(
    'Are you sure you want to delete this session?'
  )

  // stop if user clicks cancel
  if (!confirmed) {
    return
  }

  emit('delete', props.session.id)
}
</script>

<template>
  <div class="cb-card p-3" data-test="session-card">
    <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
      <div>
        <strong>{{ session.subject }} - {{ session.topic }}</strong>
        <div class="small text-muted-cb">
          {{ formatDate(session.date) }} &middot; by {{ session.volunteerName }}
          <span v-if="mood"> &middot; {{ mood.emoji }} {{ mood.label }}</span>
        </div>
      </div>
      <span class="badge badge-soft align-self-start fs-6">
        {{ session.correct }}/{{ session.attempted }} &middot; {{ accuracy(session) }}%
      </span>
    </div>

    <div class="small">
      <div v-if="session.struggles.length">
        <i class="bi bi-exclamation-circle me-1"></i>Struggled with:
        <span v-for="s in session.struggles" :key="s" class="badge badge-danger-soft me-1">{{ s }}</span>
      </div>
      <div><i class="bi bi-lightbulb me-1"></i>What worked: {{ session.whatWorked || '-' }}</div>
      <div><i class="bi bi-flag me-1"></i>Next step: {{ session.nextStep || '-' }}</div>
      
      <div v-if="session.notes" class="mt-1 fst-italic">
        <template v-if="showFullNotes">
          "{{ session.notes }}"
        </template>

        <template v-else>
          "{{ session.notes.slice(0, 100) }}"
          <span v-if="session.notes.length > 100">...</span>
        </template>

        <button
          v-if="session.notes.length > 100"
          class="btn btn-link btn-sm p-0 ms-1"
          @click="showFullNotes = !showFullNotes">
          {{ showFullNotes ? 'Show less' : 'Show more' }}
        </button>
      </div>
    </div>

    <div v-if="canEdit" class="mt-2 d-flex gap-2">
      <button class="btn btn-sm btn-outline-primary" @click="emit('edit', session.id)">
        <i class="bi bi-pencil"></i> Edit
      </button>
      <button class="btn btn-sm btn-outline-danger" @click="handleDelete">
        <i class="bi bi-trash"></i> Delete
      </button>
    </div>
  </div>
</template>