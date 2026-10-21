<!-- =============================================================
  HandoverCard - "Today's Handover" box.             Owner: Yuqi
============================================================= -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  handover: { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  title:    { type: String, default: "Today's Handover" },
  audience: { type: String, default: 'volunteer' },
})

const VOLUNTEER_ROWS = [
  { key: 'continueTopic', label: 'Continue',       icon: 'bi-arrow-right-circle' },
  { key: 'struggle',      label: 'Last Struggle',  icon: 'bi-exclamation-circle' },
  { key: 'whatWorked',    label: 'What worked',    icon: 'bi-lightbulb' },
  { key: 'lastResult',    label: 'Last session',   icon: 'bi-check2-square' },
  { key: 'nextStep',      label: 'Next step',      icon: 'bi-flag' },
]

const PARENT_ROWS = [
  { key: 'continueTopic', label: 'Working on',     icon: 'bi-book' },
  { key: 'struggle',      label: 'Finding tricky', icon: 'bi-emoji-neutral' },
  { key: 'whatWorked',    label: 'What helped',    icon: 'bi-lightbulb' },
  { key: 'lastResult',    label: 'Latest score',   icon: 'bi-star' },
  { key: 'nextStep',      label: 'Coming up next', icon: 'bi-flag' },
]

const rows = computed(() => props.audience === 'parent' ? PARENT_ROWS : VOLUNTEER_ROWS)

const recurringLabel = computed(() =>
  props.audience === 'parent' ? 'Keep practising' : 'Recurring Struggles'
)
</script>

<template>
  <div class="cb-card handover-card p-3 p-md-4" data-test="handover-card" style="padding-top: 1.25rem !important;">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h2 class="handover-title mb-0">
        <i class="bi bi-arrow-left-right me-2"></i>{{ title }}
      </h2>
      <div class="d-flex align-items-center gap-2 mw-100">
        <span
          v-if="handover"
          class="badge handover-badge"
          :style="handover.source === 'ai'
            ? 'background:var(--lapis-purple);color:var(--lapis-cream)'
            : 'background:var(--lapis-lime);color:var(--lapis-plum)'"
        >
          {{ handover.source === 'ai' ? 'AI summary' : 'From last session' }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-msg">
      <span class="spinner-border spinner-border-sm me-2"></span>
      {{ audience === 'parent' ? 'Getting the update...' : 'Preparing handover...' }}
    </div>

    <dl v-else-if="handover" class="row mb-0">
      <template v-for="row in rows" :key="row.key">
        <dt class="col-12 col-sm-4 small handover-key">
          <i class="bi me-1" :class="row.icon"></i>{{ row.label }}
        </dt>
        <dd class="col-12 col-sm-8 fw-semibold handover-value" style="color:var(--lapis-plum)">
          {{ handover[row.key] }}
        </dd>
      </template>

      <template v-if="handover.recurring && handover.recurring.length > 0">
        <dt class="col-12 col-sm-4 small handover-key">
          <i class="bi bi-arrow-repeat me-1"></i>{{ recurringLabel }}
        </dt>
        <dd class="col-12 col-sm-8 handover-value">
          <span
            v-for="item in handover.recurring"
            :key="item"
            class="badge handover-badge me-1 mb-1"
            style="background:var(--lapis-yellow);color:var(--lapis-plum)"
            data-test="recurring-badge"
          >{{ item }}</span>
        </dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
/* on a narrow screen the tags wrap inside the card instead of sticking out of it */
.handover-badge {
  white-space: normal;
  max-width: 100%;
  text-align: left;
  overflow-wrap: anywhere;
}
.handover-value {
  overflow-wrap: anywhere;
  margin-bottom: 0.6rem;
}
.handover-card {
  border-left: 6px solid var(--topic-academic);
}

.handover-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--lapis-plum);
}

.handover-key {
  color: var(--cb-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.72rem;
}

.loading-msg {
  color: var(--cb-muted);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
