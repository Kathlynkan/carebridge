<!-- KPI number card, e.g. on the coordinator dashboard
  <StatCard label="Sessions this week" :value="12" icon="bi-journal-check" />
-->
<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: 'bi-bar-chart' },
  hint: String,
})
</script>

<template>
  <div class="cb-card p-3 h-100 d-flex align-items-center gap-3">
    <div class="stat-icon"><i class="bi" :class="icon"></i></div>
    <div>
      <div class="h4 mb-0 fw-heavy">{{ value }}</div>
      <div class="small text-muted-cb">{{ label }}</div>
      <div v-if="hint" class="small">{{ hint }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: var(--cb-primary-soft);
  color: var(--cb-primary);
  flex-shrink: 0;
}
</style>
