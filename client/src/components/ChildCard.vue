<!-- =============================================================
  ChildCard - one child in a list.                 Owner: Yuqi
  Props:  child (Object), lastSession (Object | null)
  Emits:  open(childId)

  "needs attention" badge when a struggle repeats in the last 5 sessions
============================================================= -->
<script setup>
import { computed } from 'vue'
import { relativeDay, accuracy } from '@/utils/format'

const props = defineProps({
  child: { type: Object, required: true },
  lastSession: { type: Object, default: null },
  needsAttention: { type: Boolean, default: false }, // true if a struggle keeps coming back
})
const emit = defineEmits(['open'])

const lastSeen = computed(() => (props.lastSession ? relativeDay(props.lastSession.date) : 'Never'))
</script>

<template>
  <div
    class="cb-card cb-card-hover p-3 h-100 d-flex flex-column"
    role="button"
    data-test="child-card"
    @click="emit('open', child.id)"
  >
    <div class="d-flex align-items-center gap-3 mb-3">
      <span class="avatar">{{ child.avatar }}</span>
      <div>
        <h2 class="h5 mb-0">{{ child.name }}</h2>
        <div class="small text-muted-cb">{{ child.level }} &middot; {{ child.school }}</div>
      </div>
      <span v-if="needsAttention" class="badge text-bg-warning ms-auto" data-test="needs-attention">
        <i class="bi bi-exclamation-triangle me-1"></i>Needs attention
      </span>
    </div>

    <div v-if="lastSession" class="small mb-3">
      <div>
        <i class="bi bi-bookmark me-1"></i>Last topic:
        <strong>{{ lastSession.subject }} - {{ lastSession.topic }}</strong>
      </div>
      <div>
        <i class="bi bi-check2-circle me-1"></i>Last result: {{ lastSession.correct }}/{{
          lastSession.attempted
        }}
        ({{ accuracy(lastSession) }}%)
      </div>
    </div>
    <div v-else class="small text-muted-cb mb-3">No sessions recorded yet.</div>

    <div class="mt-auto d-flex justify-content-between align-items-center">
      <span class="badge badge-soft">Last session: {{ lastSeen }}</span>
      <i class="bi bi-arrow-right-circle fs-5 text-primary"></i>
    </div>
  </div>
</template>
