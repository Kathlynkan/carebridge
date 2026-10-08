<!-- =============================================================
  HomeworkQuestCard - one homework "quest", with its berry reward.     Owner: Jachin
  =============================================================
  A plain card used on two pages:
    'volunteer' - shows a "Check & pay" button once the child has handed the quest in
    'parent'    - only for reading
  (The child's own page does not use this card. It writes its quest cards directly in ChildHomeView.vue.)

  Values the parent page gives us (props):
    homework - the quest (title, subject, dueDate, details, points, status)
    mode     - 'volunteer' or 'parent'
    busy     - true while a button was just pressed, so we can switch the button off

  Message we send back to the parent page (emit):
    verify(id) - the volunteer pressed "Check & pay"

  A quest has a "status" that changes over time:
    'assigned'  -> the child still has to do it
    'submitted' -> the child handed it in, now it waits for the volunteer
    'verified'  -> the volunteer checked it, the berries were paid
============================================================= -->
<script setup>
import { computed } from 'vue'
import { formatDate } from '@/utils/format'
import { HOMEWORK_STATUS } from '@/utils/constants'
import { berries } from '@/utils/gamification'

const props = defineProps({
  homework: { type: Object, required: true },
  mode: { type: String, default: 'parent' },
  busy: { type: Boolean, default: false },
})

// The list of messages this card can send to its parent page.
const emit = defineEmits(['verify'])

// The label and colour of the status, taken from utils/constants.js.
const status = computed(() => HOMEWORK_STATUS[props.homework.status])

// True when the child handed the quest in and it still waits for the volunteer.
const isWaiting = computed(() => props.homework.status === 'submitted')
</script>

<template>
  <div class="cb-card p-3 h-100 d-flex flex-column" data-test="homework-card">
    <div class="d-flex justify-content-between align-items-start gap-2">
      <h3 class="h6 mb-1">{{ homework.title }}</h3>
      <span class="badge badge-accent">+{{ berries(homework.points) }}</span>
    </div>
    <div class="small text-muted-cb mb-2">
      {{ homework.subject }} &middot; due {{ formatDate(homework.dueDate) }}
    </div>
    <p class="small mb-3">{{ homework.details }}</p>

    <div class="mt-auto d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <span class="badge" :class="status.badge">{{ status.label }}</span>

      <!-- Only a volunteer sees this button, and only when the child has handed the quest in. -->
      <button
        v-if="mode === 'volunteer' && isWaiting"
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="busy"
        data-test="quest-verify"
        @click="emit('verify', homework.id)"
      >
        Check &amp; pay {{ berries(homework.points) }}
      </button>
    </div>
  </div>
</template>
