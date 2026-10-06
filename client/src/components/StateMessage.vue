<!-- Loading / error / empty states in one component, so every page handles them the same way
  <StateMessage v-if="loading" type="loading" />
  <StateMessage v-else-if="error" type="error" :message="error" />
  <StateMessage v-else-if="items.length === 0" type="empty" message="No sessions yet" />
-->
<script setup>
defineProps({
  type: { type: String, default: 'empty' }, // 'loading' | 'error' | 'empty'
  message: String,
})
</script>

<template>
  <div v-if="type === 'loading'" class="text-center py-5 text-muted-cb">
    <div class="spinner-border text-primary mb-2" role="status"></div>
    <div>{{ message || 'Loading...' }}</div>
  </div>
  <div v-else-if="type === 'error'" class="alert alert-danger" role="alert">
    <i class="bi bi-exclamation-triangle me-2"></i>{{ message }}
  </div>
  <div v-else class="text-center py-5 text-muted-cb cb-card">
    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
    {{ message || 'Nothing here yet.' }}
    <div class="mt-2"><slot></slot></div>
  </div>
</template>
