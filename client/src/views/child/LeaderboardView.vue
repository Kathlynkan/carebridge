<!-- =============================================================
  Leaderboard (optional stretch feature)              Owner: Jachin
  TODO (Jachin):
    [ ] GET /homework/leaderboard -> top children by points (FIRST NAMES only)
    [ ] highlight "me"
    [ ] think about fairness: weekly reset? show "most improved" instead of only top scores?
============================================================= -->
<script setup>
import PageHeader from '@/components/PageHeader.vue'
import TodoPanel from '@/components/TodoPanel.vue'
</script>

<template>
  <div class="container py-4">
    <PageHeader title="🏆 Leaderboard" subtitle="Who finished the most quests this week?" />
    <TodoPanel
      owner="Jachin"
      :items="['Load GET /homework/leaderboard', 'Podium for top 3', 'Highlight my row', 'Weekly reset / most improved']"
    />
  </div>
</template>
