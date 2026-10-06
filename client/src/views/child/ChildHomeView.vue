<!-- =============================================================
  Child home: "My Quests" (gamified homework)         Owner: Jachin
  -------------------------------------------------------------
  Keep it SIMPLE and BIG for young children: few words, big buttons, emojis.
  TODO (Jachin):
    [ ] "I'm done!" -> PUT /homework/:id/submit, update the card
    [ ] level + progress bar from levelFor(points) (utils/gamification.js)
    [ ] badge shelf from earnedBadges() - locked badges shown greyed out
    [ ] celebration animation when a quest is submitted
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import StateMessage from '@/components/StateMessage.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import HomeworkQuestCard from '@/components/HomeworkQuestCard.vue'
import { BADGES, levelFor } from '@/utils/gamification'

const auth = useAuthStore()

const me = ref(null)
const homework = ref([])
const loading = ref(true)
const error = ref('')

const level = computed(() => levelFor(me.value?.points || 0))
const todo = computed(() => homework.value.filter((h) => h.status === 'assigned'))
const done = computed(() => homework.value.filter((h) => h.status !== 'assigned'))

// eslint-disable-next-line no-unused-vars
async function submitQuest(homeworkId) {
  // TODO (Jachin)
}

onMounted(async () => {
  try {
    const [c, h] = await Promise.all([
      api.get(`/children/${auth.user.childId}`),
      api.get('/homework', { params: { childId: auth.user.childId } }),
    ])
    me.value = c.data
    homework.value = h.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <TodoPanel
      owner="Jachin"
      :items="['I am done! button', 'Level progress bar', 'Badge shelf', 'Celebration animation']"
    />

    <StateMessage v-if="loading" type="loading" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <template v-else>
      <div class="hero-card p-4 mb-4 text-center">
        <div class="display-3">{{ me.avatar }}</div>
        <h1 class="h2 mb-1">Hi {{ auth.user.name }}!</h1>
        <div class="fs-4 fw-heavy">⭐ {{ me.points }} stars &middot; Level {{ level.level }}</div>
      </div>

      <h2 class="h4 mb-3">🗺️ Quests to do</h2>
      <StateMessage v-if="todo.length === 0" message="All quests done! 🎉" />
      <div class="row g-3 mb-4">
        <div v-for="h in todo" :key="h.id" class="col-sm-6 col-lg-4">
          <HomeworkQuestCard :homework="h" mode="child" @submit="submitQuest" />
        </div>
      </div>

      <h2 class="h4 mb-3">✅ Finished</h2>
      <div class="row g-3 mb-4">
        <div v-for="h in done" :key="h.id" class="col-sm-6 col-lg-4">
          <HomeworkQuestCard :homework="h" mode="child" />
        </div>
      </div>

      <h2 class="h4 mb-3">🏅 Badges</h2>
      <div class="d-flex flex-wrap gap-3">
        <div v-for="b in BADGES" :key="b.id" class="cb-card p-3 text-center badge-tile" :title="b.rule">
          <div class="fs-2">{{ b.icon }}</div>
          <div class="small fw-bold">{{ b.name }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, var(--cb-accent-soft), var(--cb-primary-soft));
  border-radius: var(--cb-radius);
}
.badge-tile {
  width: 120px;
  opacity: 0.45; /* TODO (Jachin): full opacity when earned */
}
</style>
