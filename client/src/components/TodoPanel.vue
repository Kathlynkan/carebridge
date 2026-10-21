<!-- DEV-ONLY: shows who owns a page and what is left to build.
     Remove every <TodoPanel> before final submission. -->
<script setup>
import { ref } from 'vue'

defineProps({
  owner: { type: String, required: true },
  items: { type: Array, default: () => [] },
})

const open = ref(true)
</script>

<template>
  <div class="todo-panel mb-4" data-test="todo-panel">
    <button class="btn btn-sm w-100 text-start d-flex justify-content-between" @click="open = !open">
      <span><i class="bi bi-tools me-2"></i><strong>Owner: {{ owner }}</strong> &middot; to build</span>
      <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
    </button>
    <ul v-if="open" class="small mb-0 mt-2 ps-3">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<style scoped>
.todo-panel {
  border: 3px dashed var(--lapis-orange);
  background: var(--lapis-yellow);
  border-radius: var(--cb-radius);
  padding: 0.6rem 0.9rem;
  box-shadow: 3px 3px 0 var(--lapis-shadow);
  color: var(--lapis-plum);
}
</style>
