<!-- =============================================================
  THE BOUNTY BOARD  (the leaderboard)                      Owner: Jachin
  =============================================================
  Which pirates have the most berries?
  This page shows the 10 children with the biggest bounty, and where the child looking at the page stands.

  Everything for this page is in THIS ONE FILE, written with plain HTML tags (div, h1, p...).

  How the page is built:
    - the top 3 are shown as small WANTED posters on a wooden board
    - places 4 to 10 are shown as notes pinned underneath
    - if the child is not in the top 10, their own place is shown at the bottom

  PRIVACY: the server only sends FIRST NAMES (GET /homework/leaderboard),
  so nobody can be recognised outside the centre.

  TODO (Jachin):
    [ ] think about fairness: a weekly reset? show "most improved" and not only the biggest scores?
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { errorMessage } from '@/services/api' // api talks to our server
import { berries, rankFor } from '@/utils/gamification'
import '@/assets/pirate.css' // the pirate look

// ---------- the data of this page ----------
const board = ref([]) // the list of children, best first
const me = ref(null) // my own row (my place, my berries)
const loading = ref(true) // true while we wait for the server
const error = ref('') // an error message, if something went wrong
const missingPhotos = ref([]) // the pictures that could not be found (we show the emoji for those children)

// Should this child's poster show a picture? Only if they have one and the file exists.
function showPhoto(row) {
  return row.photo && !missingPhotos.value.includes(row.photo)
}

// The first 3 children (the "podium"). We copy them into a new list with a loop.
const podium = computed(() => {
  const list = []
  for (let i = 0; i < board.value.length && i < 3; i++) {
    list.push(board.value[i])
  }
  return list
})

// Everybody after the first 3 (places 4 to 10).
const rest = computed(() => {
  const list = []
  for (let i = 3; i < board.value.length; i++) {
    list.push(board.value[i])
  }
  return list
})

// Is my own row already in the top 10 list?
const iAmOnTheBoard = computed(() => {
  for (const row of board.value) {
    if (row.isMe) {
      return true
    }
  }
  return false
})

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
  <div class="pirate-page pirate">
    <div class="container py-4">
      <h1 class="sections title text-center mb-3">THE BOUNTY BOARD</h1>
      <p class="panel text-center fw-bold mx-auto px-3 py-2 mb-4" style="max-width: 560px">
        Which pirates have the biggest bounty? Only first names are shown.
      </p>

      <!-- While we wait, or if something failed, or if nobody is on the board yet, show a message. -->
      <p v-if="loading" class="text-center fw-bold py-5">Checking the bounty board...</p>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else-if="board.length === 0" class="panel text-center fw-bold p-4">
        No pirates on the board yet. Finish a quest to be the first!
      </div>

      <!-- The board itself -->
      <div v-else class="board" data-test="bounty-board">
        <!-- the top 3, as small wanted posters (v-for makes one poster per child) -->
        <div class="podium">
          <div v-for="row in podium" :key="row.rank" class="poster compact" data-test="bounty-row">
            <div class="poster-paper">
              <div class="poster-place">NO. {{ row.rank }}</div>
              <div class="wanted">WANTED</div>
              <div class="photo">
                <img v-if="showPhoto(row)" class="photo-img" :src="row.photo" alt="" @error="missingPhotos.push(row.photo)" />
                <span v-else class="photo-face">{{ row.avatar }}</span>
              </div>
              <div class="poster-name">{{ row.name }}</div>
              <div class="alive">ALIVE &amp; LEARNING</div>
              <div class="bounty">
                <span class="bounty-berry">฿</span>
                <span class="bounty-amount">{{ row.points }}</span>
                <span class="bounty-dash">-</span>
              </div>
              <div class="poster-foot">CAREBRIDGE CREW</div>
              <!-- only the child looking at the page gets this stamp -->
              <div v-if="row.isMe" class="poster-you">YOU!</div>
            </div>
          </div>
        </div>

        <!-- places 4 to 10, as notes -->
        <div v-for="row in rest" :key="row.rank" class="slip" :class="{ me: row.isMe }" data-test="bounty-row">
          <div class="slip-place">{{ row.rank }}</div>
          <span class="slip-face">{{ row.avatar }}</span>
          <div class="flex-grow-1">
            <div class="subheadings">{{ row.name }}<span v-if="row.isMe"> (that's you!)</span></div>
            <div class="small fw-bold"><i class="bi" :class="rankFor(row.points).rank.icon"></i> {{ rankFor(row.points).rank.name }}</div>
          </div>
          <span class="stamp reward">{{ berries(row.points) }}</span>
        </div>

        <!-- If I am not in the top 10, still show my own place at the bottom. -->
        <div v-if="me && !iAmOnTheBoard" class="slip me mt-3" data-test="my-place">
          <div class="slip-place">{{ me.rank }}</div>
          <span class="slip-face">{{ me.avatar }}</span>
          <div class="flex-grow-1 subheadings">{{ me.name }} (that's you!)</div>
          <span class="stamp reward">{{ berries(me.points) }}</span>
        </div>
      </div>

      <p v-if="!loading && !error && board.length > 0" class="text-center fw-bold mt-4 mb-0">
        Finish quests to earn berries and climb the board!
      </p>
    </div>
  </div>
</template>
