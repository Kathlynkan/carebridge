<!-- HomeworkQuestCard - homework shown as a "quest".     Owner: Jachin
     Props:  homework (Object), mode: 'child' | 'volunteer' | 'parent'
     Emits:  submit(id)  (child marks done),  verify(id)  (volunteer checks it) -->
<script setup>
import { computed } from 'vue'
import { formatDate, daysSince } from '@/utils/format'
import { HOMEWORK_STATUS } from '@/utils/constants'

const props = defineProps({
  homework: { type: Object, required: true },
  mode: { type: String, default: 'child' },
})
const emit = defineEmits(['submit', 'verify'])

const status = computed(() => HOMEWORK_STATUS[props.homework.status])
const isOverdue = computed(
  () => props.homework.status === 'assigned' && daysSince(props.homework.dueDate) > 0,
)
</script>

<template>
  <div
    class="cb-card p-3 h-100 d-flex flex-column"
    data-test="homework-card"
    :class="{ 'border-danger': isOverdue }"
  >
    <div class="d-flex justify-content-between align-items-start gap-2">
      <h3 class="h6 mb-1">{{ homework.title }}</h3>
      <span class="badge badge-accent">+{{ homework.points }} ⭐</span>
    </div>
    <div class="small text-muted-cb mb-2">
      {{ homework.subject }} &middot; due {{ formatDate(homework.dueDate) }}
      <span v-if="isOverdue" class="badge badge-danger-soft ms-1">Overdue</span>
    </div>
    <p class="small mb-3">{{ homework.details }}</p>
    <div class="mt-auto d-flex flex-column gap-2">
      <span class="badge" :class="status.badge">{{ status.label }}</span>

      <!-- Child: submitted but not yet verified — explain what happens next -->
      <p
        v-if="mode === 'child' && homework.status === 'submitted'"
        class="small text-muted-cb mb-0 mt-1"
        data-test="waiting-message"
      >
        ⏳ Your volunteer will check this — then you'll get your ⭐ stars!
      </p>

      <button
        v-if="mode === 'child' && homework.status === 'assigned'"
        class="btn btn-primary btn-lg w-100 mt-1"
        data-test="submit-quest-btn"
        @click="emit('submit', homework.id)"
      >
        🎉 I'm done!
      </button>
      <button
        v-if="mode === 'volunteer' && homework.status === 'submitted'"
        class="btn btn-outline-primary w-100 mt-1"
        data-test="verify-quest-btn"
        @click="emit('verify', homework.id)"
      >
        ✅ Verify &amp; give points
      </button>
    </div>
  </div>
</template>
