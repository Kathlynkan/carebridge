<!-- =============================================================
  HomeworkQuestCard - homework shown as a "quest".     Owner: Jachin
  Props:  homework (Object), mode: 'child' | 'volunteer' | 'parent'
  Emits:  submit(id)  (child marks done),  verify(id)  (volunteer checks it)
  TODO (Jachin):
    [ ] child mode: big friendly "I'm done!" button -> emit('submit')
    [ ] volunteer mode: "Verify & give points" button -> emit('verify')
    [ ] celebrate animation when points are earned (CSS keyframes)
    [ ] overdue styling
============================================================= -->
<script setup>
import { computed } from 'vue'
import { formatDate } from '@/utils/format'
import { HOMEWORK_STATUS } from '@/utils/constants'

const props = defineProps({
  homework: { type: Object, required: true },
  mode: { type: String, default: 'child' },
})
// eslint-disable-next-line no-unused-vars
const emit = defineEmits(['submit', 'verify'])

const status = computed(() => HOMEWORK_STATUS[props.homework.status])
</script>

<template>
  <div class="cb-card p-3 h-100 d-flex flex-column" data-test="homework-card">
    <div class="d-flex justify-content-between align-items-start gap-2">
      <h3 class="h6 mb-1">{{ homework.title }}</h3>
      <span class="badge badge-accent">+{{ homework.points }} ⭐</span>
    </div>
    <div class="small text-muted-cb mb-2">
      {{ homework.subject }} &middot; due {{ formatDate(homework.dueDate) }}
    </div>
    <p class="small mb-3">{{ homework.details }}</p>
    <div class="mt-auto">
      <span class="badge" :class="status.badge">{{ status.label }}</span>
    </div>
  </div>
</template>
