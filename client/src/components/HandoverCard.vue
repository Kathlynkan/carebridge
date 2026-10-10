<!-- =============================================================
  HandoverCard - "Today's Handover" box.             Owner: Yuqi
  Props:  handover  { continueTopic, struggle, whatWorked, lastResult, nextStep, source }
          loading   Boolean
  Emits:  refresh   (ask the server to regenerate the AI summary)
  Re-used by Kat on the parent page (audience = 'parent').
  TODO (Yuqi):
    [ ] nicer loading skeleton while the AI is thinking
    [ ] show "recurring" struggles as warning badges
============================================================= -->
<script setup>
defineProps({
  handover: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  title: { type: String, default: "Today's Handover" },
})
const emit = defineEmits(['refresh'])

const ROWS = [
  { key: 'continueTopic', label: 'Continue', icon: 'bi-arrow-right-circle' },
  { key: 'struggle', label: 'Last Struggle', icon: 'bi-exclamation-circle' },
  { key: 'whatWorked', label: 'What worked', icon: 'bi-lightbulb' },
  { key: 'lastResult', label: 'Last session', icon: 'bi-check2-square' },
  { key: 'nextStep', label: 'Next step', icon: 'bi-flag' },
]
</script>

<template>
  <div class="cb-card handover p-3 p-md-4" data-test="handover-card">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="h5 mb-0"><i class="bi bi-arrow-left-right me-2"></i>{{ title }}</h2>
      <div class="d-flex align-items-center gap-2">
        <span v-if="handover" class="badge" :class="handover.source === 'ai' ? 'badge-accent' : 'badge-soft'">
          {{ handover.source === 'ai' ? 'AI summary' : 'From last session' }}
        </span>
        <button class="btn btn-sm btn-outline-primary" :disabled="loading" @click="emit('refresh')">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-muted-cb small">
      <span class="spinner-border spinner-border-sm me-2"></span>Preparing handover...
    </div>
    <dl v-else-if="handover" class="row mb-0">
      <template v-for="row in ROWS" :key="row.key">
        <dt class="col-5 col-sm-4 small text-muted-cb">
          <i class="bi me-1" :class="row.icon"></i>{{ row.label }}
        </dt>
        <dd class="col-7 col-sm-8 fw-semibold">{{ handover[row.key] }}</dd>
      </template>

      <template v-if="handover.recurring && handover.recurring.length > 0">
        <dt class="col-5 col-sm-4 small text-muted-cb">
          <i class="bi bi-arrow-repeat me-1"></i>Recurring Struggles
        </dt>
        <dd class="col-7 col-sm-8">
          <span
            v-for="item in handover.recurring"
            :key="item"
            class="badge text-bg-warning me-1"
            data-test="recurring-badge"
          >
            {{ item }}
          </span>
        </dd>
      </template>
    </dl>
    
  </div>
</template>

<style scoped>
.handover {
  border-left: 6px solid var(--cb-accent);
}
</style>
