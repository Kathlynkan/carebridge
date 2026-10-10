<!-- =============================================================
  THE BOUNTY BOARD  (the leaderboard)                      Owner: Jachin
  =============================================================
  Which pirates have the most berries?
  This page shows the 10 children with the biggest bounty, and where the child looking at the page stands.

  Everything for this page is in THIS ONE FILE, written with plain HTML tags (div, h1, p...).

  How the page is built:
    - one row for each of the top 10 children, the biggest bounty first
    - if the child is not in the top 10, their own place is shown at the bottom

  PRIVACY: the server only sends FIRST NAMES (GET /homework/leaderboard),
  so nobody can be recognised outside the centre.

  TODO (Jachin):
    [ ] think about fairness: a weekly reset? show "most improved" and not only the biggest scores?
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api' // api talks to our server
import { berries, rankFor } from '@/utils/gamification'
import '@/assets/childpage.css' // the pirate look

const router = useRouter()

// ---------- the data of this page ----------
const board = ref([]) // the list of children, best first
const me = ref(null) // my own row (my place, my berries)
const loading = ref(true) // true while we wait for the server
const error = ref('') // an error message, if something went wrong

// ---------- when the page opens ----------
onMounted(async () => {
  try {
    // Ask the server for the board. It answers with { top: [...], me: {...} }.
    const response = await api.get('/homework/leaderboard')
    board.value = response.data.top
    me.value = response.data.me
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-background childpage">
    <div class="container py-4">
      <!-- the back button at the top left. A large screen shows the button with words (d-none d-lg-block hides it on smaller screens). -->
      <div class="text-start d-none d-lg-block">
        <button class="action-button back-to-quests" @click="router.push('/child')"><i class="bi bi-arrow-left"></i> BACK TO QUESTS</button>
      </div>
      <!-- A small or medium screen shows only an arrow, flush against the top left corner (d-lg-none hides it on large screens). -->
      <button class="action-button back-to-quests-arrow d-lg-none position-absolute top-0 start-0" aria-label="Back to quests" title="Back to quests" @click="router.push('/child')">
        <i class="bi bi-arrow-left"></i>
      </button>

      <!-- The page title (display-4 is a Bootstrap class: a big font size that shrinks by itself on a small screen) -->
      <h1 class="sections title display-4 text-center mb-3">THE BOUNTY BOARD</h1>
      <p class="inner-box text-center fw-bold mx-auto px-3 py-2 mb-4" style="max-width: 560px">
        Which pirates have the biggest bounty? Only first names are shown.
      </p>

      <!-- While we wait, or if something failed, or if nobody is on the board yet, show a message. -->
      <p v-if="loading" class="text-center fw-bold py-5">Checking the bounty board...</p>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else-if="board.length === 0" class="inner-box text-center fw-bold p-4">
        No pirates on the board yet. Finish a quest to be the first!
      </div>

      <!-- The board itself. v-for makes one row for every child. -->
      <div v-else class="bounty-board" data-test="bounty-board">
        <div v-for="row in board" :key="row.rank" class="bountyboard-row" :class="{ 'current-child': row.isMe }" data-test="bounty-row">
          <div class="place-number">{{ row.rank }}</div>
          <!-- the child's picture if there is one, otherwise the emoji -->
          <img v-if="row.photo" :src="row.photo" alt="" class="board-photo" @error="row.photo = ''" />
          <span v-else class="fs-2">{{ row.avatar }}</span>
          <div class="flex-grow-1">
            <div class="subheadings">{{ row.name }}</div>
            <div class="small fw-bold"><i class="bi" :class="rankFor(row.points).rank.icon"></i> {{ rankFor(row.points).rank.name }}</div>
          </div>
          <span class="red-stamp berry-reward">{{ berries(row.points) }}</span>
        </div>

        <!-- If I am not in the top 10, still show my own place at the bottom. -->
        <div v-if="me && me.rank > board.length" class="bountyboard-row current-child" data-test="my-place">
          <div class="place-number">{{ me.rank }}</div>
          <img v-if="me.photo" :src="me.photo" alt="" class="board-photo" @error="me.photo = ''" />
          <span v-else class="fs-2">{{ me.avatar }}</span>
          <div class="flex-grow-1 subheadings">{{ me.name }}</div>
          <span class="red-stamp berry-reward">{{ berries(me.points) }}</span>
        </div>
      </div>

      <p v-if="!loading && !error && board.length > 0" class="text-center fw-bold mt-4 mb-0">
        Finish quests to earn berries and climb the board!
      </p>
    </div>
  </div>
</template>
