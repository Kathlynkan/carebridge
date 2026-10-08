<!-- =============================================================
  CHILD HOME  -  "My Pirate Adventure"                       Owner: Kat 
  =============================================================
  The idea:
    A child earns BERRIES (pirate money, written ฿) by finishing quests (their homework).
    More berries = a higher pirate rank. The top rank is KING OF THE PIRATES.

  What the page shows, from top to bottom:
    1. a WANTED poster with the child's berries, and the child's rank
    2. the road to becoming King of the Pirates (8 ranks in a row)
    3. the quests
    4. the pirate badges
    5. a button to the Bounty Board (the leaderboard)

  What happens when the child presses DONE!
    We tell the server. The quest moves to "waiting". The volunteer checks it later and the berries are paid.

  The rules (ranks, badges) are in src/utils/gamification.js. The looks are in src/assets/pirate.css.
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { errorMessage } from '@/services/api' // api talks to our server
import { useAuthStore } from '@/stores/auth' // tells us who is logged in
import { formatDate } from '@/utils/format' // turns a date into text like "Thu, 8 Oct"
import { BADGES, RANKS, KING_AT, berries, rankFor, earnedBadges } from '@/utils/gamification'
import '@/assets/pirate.css' // the pirate look

const router = useRouter()
const auth = useAuthStore()

// ---------- the data of this page ----------
// A "ref" is a box that holds a value. When the value changes, the page updates by itself.
const child = ref(null) // the child: name, avatar, berries
const quests = ref([]) // the child's quests
const loading = ref(true) // true while we wait for the server
const error = ref('') // an error message, if something went wrong
const message = ref('') // the text of the pop-up after the child presses DONE! (empty = no pop-up)
const photoMissing = ref(false) // becomes true if the picture file cannot be found, so we show the emoji instead

// ---------- values worked out from the data ----------
// A "computed" is a value that is worked out from other values. It updates by itself.

// Where the child is on the road (rank, next rank, berries still needed...).
const road = computed(() => rankFor(child.value.points))

// How much of the road is filled, from 0 to 100 (percent).
// There are 8 ranks, so there are 7 gaps between them. The child is "index" gaps along, plus a part of the next gap.
const roadFill = computed(() => {
  if (road.value.isKing) {
    return 100
  }
  return ((road.value.index + road.value.fractionToNext) / (RANKS.length - 1)) * 100
})

// The badges the child has earned.
const earned = computed(() => earnedBadges(child.value, quests.value))

// Has the child earned this badge? We look through the earned list.
function isEarned(badgeId) {
  for (const badge of earned.value) {
    if (badge.id === badgeId) {
      return true
    }
  }
  return false
}

// ---------- when the page opens ----------
onMounted(async () => {
  try {
    // Ask the server for the child, and then for the child's quests.
    const childResponse = await api.get('/children/' + auth.user.childId)
    child.value = childResponse.data

    const questResponse = await api.get('/homework', { params: { childId: auth.user.childId } })
    quests.value = questResponse.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})

// ---------- when the child presses DONE! ----------
async function submitQuest(questId) {
  try {
    // Tell the server. It answers with the updated quest.
    const response = await api.put('/homework/' + questId + '/submit')

    // Put the updated quest in our list, in place of the old one.
    for (let i = 0; i < quests.value.length; i++) {
      if (quests.value[i].id === questId) {
        quests.value[i] = response.data
      }
    }

    message.value = 'Quest handed in! ' + berries(response.data.points) + ' will land in your chest when your Captain checks it.'
  } catch (err) {
    message.value = errorMessage(err)
  }
}

// ---------- the button to the Bounty Board ----------
function goToBoard() {
  router.push('/child/leaderboard')
}
</script>

<template>
  <div class="pirate-page pirate"> 
    <div class="container py-4">
      <!-- While we wait for the server, or if it failed, we show a simple message instead of the page. -->
      <p v-if="loading" class="text-center fw-bold py-5">Hoisting the sails...</p>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else>
        <h1 class="sections title text-center mb-4">MY PIRATE ADVENTURE</h1>

        <!-- ===== 1. the poster and the rank ===== -->
        <div class="row g-4 align-items-center mb-4">
          <div class="col-md-5 col-lg-4">
            <!-- the WANTED poster -->
            <div class="poster" data-test="wanted-poster">
              <div class="poster-paper">
                <div class="wanted">WANTED</div>
                <div class="photo">
                  <!-- the child's picture if there is one (and the file exists), otherwise the emoji avatar -->
                  <img v-if="child.photo && !photoMissing" class="photo-img" :src="child.photo" alt="" @error="photoMissing = true" />
                  <span v-else class="photo-face">{{ child.avatar }}</span>
                </div>
                <div class="poster-name">{{ auth.user.name }}</div>
                <div class="alive">ALIVE &amp; LEARNING</div>
                <div class="bounty">
                  <span class="bounty-berry">฿</span>
                  <span class="bounty-amount">{{ child.points }}</span>
                  <span class="bounty-dash">-</span>
                </div>
                <div class="poster-foot">CAREBRIDGE CREW</div>
              </div>
            </div>
            <!-- hidden text, so screen readers (and our tests) can read the berries -->
            <span class="visually-hidden" data-test="berries">{{ berries(child.points) }}</span>
          </div>

          <div class="col-md-7 col-lg-8">
            <div class="panel log">
              <div class="d-flex align-items-center gap-3">
                <div class="medal"><i class="bi" :class="road.rank.icon"></i></div>
                <div>
                  <div class="small subheadings">My rank</div>
                  <div class="rank-name" data-test="rank">{{ road.rank.name }}</div>
                </div>
              </div>
              <p class="mt-2 mb-0 fw-bold">{{ road.rank.motto }}</p>
              <p class="goal mb-0 fw-bold">The goal: collect {{ berries(KING_AT) }} to become the King of the Pirates!</p>
            </div>
          </div>
        </div>

        <!-- ===== 2. the road to becoming King of the Pirates ===== -->
        <h2 class="sections sm text-center fs-3 mb-3">THE ROAD TO BECOMING KING OF THE PIRATES</h2>
        <div class="road mb-3" data-test="road">
          <!-- the bar behind the circles. The coloured part grows as the child earns berries. -->
          <div class="road-bar">
            <div class="road-fill" :style="{ width: roadFill + '%' }"></div>
          </div>

          <!-- v-for makes one stop for every rank. A stop is "reached" when the child has got that far. -->
          <div
            v-for="(rank, i) in RANKS"
            :key="rank.id"
            class="stop"
            :class="{ reached: i <= road.index, here: i === road.index }"
          >
            <div class="stop-you">{{ i === road.index ? 'YOU' : '' }}</div>
            <!-- the circle shows the icon of the rank (a crate, a bucket, tools... and a gem for the King) -->
            <div class="stop-circle"><i class="bi" :class="rank.icon"></i></div>
            <div class="stop-name">{{ rank.name }}</div>
            <!-- how many berries the rank needs -->
            <div class="stop-berries">{{ berries(rank.at) }}</div>
          </div>
        </div>
        <div class="panel text-center fw-bold mb-4 px-3 py-2" data-test="road-next">
          <span v-if="road.isKing">You found the One Piece! You are the King of the Pirates!</span>
          <span v-else>Next stop: {{ road.next.name }} &mdash; {{ berries(road.toNext) }} to go!</span>
        </div>

        <!-- ===== 3. the quests ===== -->
        <h2 class="sections sm fs-2 mb-3">QUESTS ON THE BOUNTY BOARD</h2>
        <div v-if="quests.length === 0" class="panel text-center fw-bold p-4 mb-4">No quests right now. The sea is calm!</div>
        <div class="row g-4 mb-4">
          <!-- v-for makes one card for every quest -->
          <div v-for="quest in quests" :key="quest.id" class="col-sm-6 col-lg-4">
            <div class="quest" :class="{ 'is-waiting': quest.status === 'submitted', 'is-done': quest.status === 'verified' }" data-test="homework-card">
              <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                <h3 class="quest-title">{{ quest.title }}</h3>
                <span class="stamp reward">{{ berries(quest.points) }}</span>
              </div>
              <div class="quest-meta small mb-2">{{ quest.subject }} &middot; due {{ formatDate(quest.dueDate) }}</div>
              <p class="small mb-3">{{ quest.details }}</p>

              <!-- The bottom of the card depends on the status of the quest. Only ONE of these three is shown. -->
              <div class="mt-auto">
                <!-- 'assigned' = still to do -->
                <button v-if="quest.status === 'assigned'" class="pirate-btn" data-test="quest-done" @click="submitQuest(quest.id)">DONE!</button>

                <!-- 'submitted' = handed in, waiting for the volunteer -->
                <div v-else-if="quest.status === 'submitted'" data-test="quest-waiting">
                  <span class="stamp"><i class="bi bi-hourglass-split"></i> WAITING</span>
                  <div class="small fw-bold mt-2">Your Captain is checking it. {{ berries(quest.points) }} on the way!</div>
                </div>

                <!-- 'verified' = checked, the berries were paid -->
                <div v-else data-test="quest-paid">
                  <span class="stamp paid"><i class="bi bi-check-lg"></i> PAID</span>
                  <div class="small fw-bold mt-2">{{ berries(quest.points) }} are in your chest.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 4. the badges ===== -->
        <h2 class="sections sm fs-2 mb-3">PIRATE BADGES</h2>
        <div class="d-flex flex-wrap gap-4 mb-5">
          <!-- A badge the child has not earned yet shows a lock and "???". -->
          <div
            v-for="badge in BADGES"
            :key="badge.id"
            class="pirate-badge"
            :class="isEarned(badge.id) ? 'earned' : 'locked'"
            data-test="badge"
          >
            <div class="pirate-badge-medal"><i class="bi" :class="isEarned(badge.id) ? badge.icon : 'bi-lock-fill'"></i></div>
            <div class="subheadings small">{{ isEarned(badge.id) ? badge.name : '???' }}</div>
            <div class="small fw-bold">{{ isEarned(badge.id) ? 'Earned!' : badge.rule }}</div>
          </div>
        </div>

        <!-- ===== 5. button to the leaderboard ===== -->
        <div class="text-center">
          <button class="pirate-btn red" style="max-width: 360px" @click="goToBoard">THE BOUNTY BOARD</button>
        </div>
      </div>

      <!-- The pop-up after DONE!. It only shows when message is not empty. The OK button empties it again. -->
      <div v-if="message" class="popup-background">
        <div class="panel popup text-center p-4" data-test="toast">
          <h2 class="sections sm fs-2 mb-3">YOHOHO!</h2>
          <p class="fw-bold mb-3">{{ message }}</p>
          <button class="pirate-btn" @click="message = ''">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>
