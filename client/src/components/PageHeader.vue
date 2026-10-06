<!-- Page title + optional buttons on the right (Week 6: props + slots)
  <PageHeader title="My Children" subtitle="...">
    <button class="btn btn-primary">Action</button>
  </PageHeader>
-->
<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: String,
})
</script>

<template>
  <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
    <div>
      <h1 class="h3 mb-1">{{ title }}</h1>
      <p v-if="subtitle" class="text-muted-cb mb-0">{{ subtitle }}</p>
    </div>
    <div class="d-flex flex-wrap gap-2">
      <slot></slot>
    </div>
  </div>
</template>
