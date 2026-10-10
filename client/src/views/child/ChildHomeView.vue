<!-- =============================================================
  CHILD HOME  -  "My Pirate Adventure"                       Owner: Kat
  =============================================================
  A child earns BERRIES (pirate money) by finishing quests (homework) and climbs the ranks up to King of the Pirates.
  The page shows: 1. a WANTED poster and rank  2. the road of ranks  3. the quests  4. the badges  5. a Bounty Board button.
  The rules (ranks, badges) are in src/utils/gamification.js. The looks are in src/assets/childpage.css.
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue' // ref = a box that holds a value, onMounted = runs when the page opens
import { useRouter, useRoute } from 'vue-router' // useRouter lets us go to another page, useRoute lets us read the address of this page
import api, { errorMessage } from '@/services/api' // api = talks to our server, errorMessage = turns an error into a sentence
import { useAuthStore } from '@/stores/auth' // remembers who is logged in
import { formatDate } from '@/utils/format' // turns a date into text like "Thu, 8 Oct"
import { BADGES, RANKS, KING_AT, berries, rankFor, earnedBadges, badgeStory, groupQuestsByMilestone } from '@/utils/gamification' // the game rules
import '@/assets/childpage.css' // the css look

const router = useRouter() /* used when child press a button to go to the next page -> decides which page to show */
const route = useRoute() // the address of this page. We use it for the demo box: when the address ends with ?demo
const activeUser = useAuthStore() // the logged-in user
const childId = activeUser.user.childId // the id of the logged-in child

// ---------- the data from the server ----------
const user = ref(null) // the child: avatar, photo, points
const quests = ref([]) // the child's quests

// ---------- worked out from the data (filled in by sortQuests) ----------
const road = ref(null) // where the child is on the road: rank, next rank, berries to go
const earnedBadgeIds = ref([]) // the ids of the badges the child earned
const questsByMilestone = ref([]) // 8 lists of quests, one list for each milestone

// ---------- what the page is showing right now ----------
const loading = ref(true) // true while we wait for the server
const error = ref('') // an error sentence, if something went wrong
const message = ref('') // the text of the pop-up (empty = no pop-up)
const openMilestone = ref(0) // the number of the milestone that is open (null = none)
const lockedMessage = ref('') // the text shown when the child taps a locked milestone
const openBadgeId = ref(null) // the id of the badge that is open (null = none)

// ---------- the quiz: the questions of one quest ----------
const quizQuest = ref(null) // the quest the child is answering right now (null = no quiz is open)
const answers = ref([]) // what the child typed, one text for every question
const results = ref([]) // true or false for every question, after the child pressed CHECK (empty = not checked yet)
const allCorrect = ref(false) // true when every answer is right, then the child may press DONE!

// ---------- the demo box (only shows when the address ends with ?demo) ----------
const demoBerries = ref('') // the berries picked in the demo box

// ---------- work out the rank, the badges and the quests of each milestone ----------
function sortQuests() {
  // Line 1: use the child's berries to work out which rank they are on and how far they are from the next rank.
  road.value = rankFor(user.value.points) 
  // The points number is stored in the database, the server sends it to the page when the page asks for the child, and the page keeps it in user.value.points.
  // Line 2: look at the child and their quests to make a list of the badges the child has already won.
  earnedBadgeIds.value = earnedBadges(user.value, quests.value)
  // Line 3: put every quest into the list of the milestone it belongs to (8 lists, one for each rank).
  questsByMilestone.value = groupQuestsByMilestone(user.value.points, quests.value)
}

// ---------- when the page opens ----------
onMounted(async () => {
  try {
    const childResponse = await api.get('/children/' + childId) // ask the server for the child
    user.value = childResponse.data // save the child 
    const questResponse = await api.get('/homework?childId=' + childId) // ask the server for the child's quests, based on the child's id
    quests.value = questResponse.data // save the quests in the box

    sortQuests() // work out the rank, the badges and the quests of each milestone
    openMilestone.value = road.value.index // check child's berries then compares to what each rank needs and chooses the rank that is equivalent or less than the berries the child has  
    loading.value = false // all done, so hide "Hoisting the sails..." and show the page
  } catch (err) {
    error.value = errorMessage(err) // something went wrong, so save the error sentence
    loading.value = false // hide "Hoisting the sails..." and show the error
  }
})

// ---------- is this badge earned? (true or false) ----------
// isEarned looks through the list of badges the child has won and answers true if the badge you asked about is in it, or false if it isn’t.
function isEarned(badgeId) {
  for (const id of earnedBadgeIds.value) {
    if (id === badgeId) {
      return true
    }
  }
  return false
}

// ---------- when the child taps a quest to answer its questions ----------
function openQuiz(quest) {
  quizQuest.value = quest // this opens the quiz
  results.value = [] // nothing is checked yet
  answers.value = [] // nothing is typed yet
  allCorrect.value = quest.questions.length === 0 // a quest with no questions can be handed in straight away
}

// ---------- when the child presses CHECK MY ANSWERS ----------
async function checkAnswers() {
  try {
    // Send the answers to the server. It answers with true or false for every question (it never sends the right answers).
    const response = await api.post('/homework/' + quizQuest.value.id + '/answers', { answers: answers.value })
    results.value = response.data.results
    allCorrect.value = response.data.allCorrect
  } catch (err) {
    message.value = errorMessage(err)
  }
}

// ---------- the demo box: pretend the child has other berries (nothing is saved) ----------
function tryBerries() {
  user.value.points = Number(demoBerries.value) // change the berries only on this page
  sortQuests() // work out the rank, badges and milestones again
  openMilestone.value = road.value.index // open the milestone of the new rank
  lockedMessage.value = ''
}

// ---------- when the child hands the quest in ----------
async function submitQuest(questId) {
  quizQuest.value = null // close the quiz
  try {
    // Tell the server. It answers with the updated quest.
    const response = await api.put('/homework/' + questId + '/submit')

    // looks through the list of quests, finds the one that was just handed in, and replaces the old copy with the updated one from the server.
    for (let i = 0; i < quests.value.length; i++) {
      if (quests.value[i].id === questId) {
        quests.value[i] = response.data
      }
    }

    sortQuests() // runs the code to 'refresh' the quests and thier descriptions
    message.value = 'Quest handed in! ' + berries(response.data.points) + ' will land in your chest when your Captain checks it.'
  } catch (err) {
    message.value = errorMessage(err)
  }
}

// ---------- when the child taps a milestone on the road ----------
function chooseMilestone(number) {
  lockedMessage.value = ''
  if (number > road.value.index) { // check child's milestone number against the milestone number of the road 
    // The child has not reached this milestone yet, so close the quests and say why.
    openMilestone.value = null
    lockedMessage.value = RANKS[number].name + ' is not unlocked yet. Complete your current quests to unlock it.'
  } else if (number === openMilestone.value) {
    openMilestone.value = null // tapping the open milestone again closes it
  } else {
    openMilestone.value = number
  }
}

// ---------- when the child taps a badge ----------
function chooseBadge(badgeId) {
  if (badgeId === openBadgeId.value) { // check child's badge id against the badgeid of all 
    openBadgeId.value = null // tapping the open badge again closes it
  } else {
    openBadgeId.value = badgeId
  }
}
</script>

<template>
  <div class="childpage">
    <div class="container py-4">
      <!-- Only one of these shows: "Loading..." while loading is true, then the red error box if error has a sentence, otherwise the real page. -->
      <p v-if="loading" class="text-center fw-bold py-5">Hoisting the sails...</p>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else>
        <h1 class="title display-4 text-center mb-4">MY PIRATE ADVENTURE</h1>

        <!-- 1. the poster and the rank -->
        <!--g-4 = a gap between the column--> 
        <div class="row g-4 align-items-center mb-4">
          <!-- The wanted poster column: by default it takes the full width, on a md bp (col-md-5), on a lg bp (col-lg-4). -->
          <div class="col-md-5 col-lg-4">
            <div class="wanted-poster mx-auto mx-md-0">
              <div class="wanted-heading">WANTED</div>
              <div class="photo-frame">
                <!-- the child's picture if there is one, otherwise the emoji -->
                <!--if there is pic in user.photo, use the photo frm the src -->
                <img v-if="user.photo" :src="user.photo" alt="" />
                <!-- otherwise use the avatar (emoji) -->
                <span v-else>{{ user.avatar }}</span>
              </div>
              <div class="childname">{{ activeUser.user.name }}</div>
              <div class="small fw-bold">LEARNING &amp; IMPROVING</div>
              <div class="poster-bounty">฿{{ user.points }}</div>
            </div>
          </div>

          <!-- The rank column takes the slices that are left: 7 on md and 8 on a lg, so the two columns always add up to 12. -->
          <div class="col-md-7 col-lg-8">
            <!-- inner-box is the css, padding 3 -->
             <div class="inner-box p-3"> 
              <!-- d-flex for the rank to sit beside the icon, gap-3 for the gap between the icon and the rank words -->
              <div class="d-flex align-items-center gap-3">
              <!-- take the css big-icon, for the circle badge, bi is the bootstrap icon, rest of the code adds the name of the pic for the child's rank -->
                <div class="big-icon" :class="road.rank.icon"></div>
                <div>
                  <div class="small subheadings">My rank</div>
                  <div class="current-rank-name">{{ road.rank.name }}</div>
                </div>
              </div>
              <!-- show the bottom of the rank "the crew is..."  -->
              <p class="mt-2 mb-0 fw-bold">{{ road.rank.motto }}</p>
              <!-- border-top is the line at the top -->
              <!-- KING_AT is the number 600 (the berries the top rank needs), and berries(600) turns it into the text ฿600. -->
              <p class="border-top border-dark pt-2 mt-2 mb-0 fw-bold">The goal: collect {{ berries(KING_AT) }} to become the King of the Pirates!</p>
            </div>
          </div>
        </div>

        <!-- ===== 2. the road: one milestone for every rank ===== -->
        <h2 class="sections fs-3 text-center mb-3">THE ROAD TO BECOMING KING OF THE PIRATES</h2>
        <div class="rank-road mb-3">
          <!-- bootstrap's grid -->
          <!-- justify-content-center = put the milestones in the middle of the row (this replaces the empty spacer columns) -->
          <div class="row justify-content-center">
            <!-- v-for makes one milestone for every rank, and position is its number in the list (0 to 7). "notachieved" = grey (not reached yet), "chosen" = the open one (red border). -->
            <!-- rank.id is found in gamification.js,  -->
            <div v-for="(rank, position) in RANKS" :key="rank.id" class="col-lg-1 col-3">
              <!-- compare if the position is bigger then the child's rank number -> yes -> child has not reached. compare if number is same as opened milestone number -> yes -> adds class 'chosen' -> red border -->
              <div class="milestones" :class="{ notachieved: position > road.index, chosen: position === openMilestone }">
                <!-- class="icon" -> for the yellow circles, :class="rank.icon" -> for icons in the circle -->
                <button class="icon" :class="rank.icon" @click="chooseMilestone(position)"></button>
                <!-- displays the class name  -->
                <div>{{ rank.name }}</div>
                <!-- display the berries needed to unlock each milestone -->
                <div>{{ berries(rank.at) }}</div>
                <!-- Shows only on the milestone whose number matches the child's rank, then display the "you" -->
                <div v-if="position === road.index" class="you-are-here">YOU</div>
              </div>
            </div>
          </div>
        </div>
        <div class="inner-box text-center fw-bold mb-4 px-3 py-2">
          <span v-if="road.isKing">You found the One Piece! You are the King of the Pirates!</span>
          <span v-else>Next milestone: {{ road.next.name }} &mdash; {{ berries(road.toNext) }} to go!</span>
        </div>

        <!-- shown when the child taps a milestone that is not unlocked yet -->
        <div v-if="lockedMessage" class="inner-box text-center fw-bold p-3 mb-4" data-test="locked-message">
          <i class="bi bi-lock-fill"></i> {{ lockedMessage }}
        </div>

        <!-- ===== 3. the quests of the open milestone (hidden when no milestone is open) ===== -->
        <div v-if="openMilestone !== null">
          <h2 class="sections text-uppercase fs-2 mb-3">{{ RANKS[openMilestone].name }}: the quests</h2>
          <div v-if="questsByMilestone[openMilestone].length === 0" class="inner-box text-center fw-bold p-4 mb-4">No quests were saved for this milestone.</div>
          <div class="row g-4 mb-4">
            <!-- v-for makes one card for every quest -->
            <div v-for="quest in questsByMilestone[openMilestone]" :key="quest.id" class="col-sm-6 col-lg-4">
              <div class="quest-card" :class="{ 'quest-waiting': quest.status === 'submitted', 'quest-paid': quest.status === 'verified' }" data-test="homework-card">
                <div class="d-flex justify-content-between gap-2 mb-1">
                  <h3 class="fs-5 fw-bold m-0"><button class="quest-title" data-test="quest-title" @click="openQuiz(quest)">{{ quest.title }}</button></h3>
                  <span class="red-stamp berry-reward">{{ berries(quest.points) }}</span>
                </div>
                <div class="small text-uppercase mb-2">{{ quest.subject }} &middot; due {{ formatDate(quest.dueDate) }}</div>
                <!-- a paid quest hides the exercise (it is in the quiz, under PRACTICE AGAIN) -->
                <p v-if="quest.status !== 'verified'" class="small mb-3">{{ quest.details }}</p>

                <!-- the bottom of the card depends on the status: 'assigned' = to do, 'submitted' = waiting, 'verified' = paid -->
                <div class="mt-auto">
                  <!-- opens the quiz. The child answers the questions there and presses DONE! when every answer is right. -->
                  <button v-if="quest.status === 'assigned'" class="action-button" data-test="quest-open" @click="openQuiz(quest)">ANSWER THE QUESTIONS</button>

                  <div v-else-if="quest.status === 'submitted'" data-test="quest-waiting">
                    <span class="red-stamp"><i class="bi bi-hourglass-split"></i> WAITING</span>
                    <div class="small fw-bold mt-2">Your Captain is checking it. {{ berries(quest.points) }} on the way!</div>
                  </div>

                  <div v-else data-test="quest-paid">
                    <span class="red-stamp paid"><i class="bi bi-check-lg"></i> PAID</span>
                    <div class="small fw-bold mt-2">{{ berries(quest.points) }} are in your chest.</div>
                    <button class="action-button practiceagain mt-2" @click="openQuiz(quest)">PRACTICE AGAIN</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 4. the badges: tap one to see how it was earned ===== -->
        <h2 class="sections fs-2 mb-3">PIRATE BADGES</h2>
        <div class="row g-3 mb-5">
          <div class="col-lg-1 d-none d-lg-block"></div>
          <div v-for="badge in BADGES" :key="badge.id" class="col-lg-2 col-md-4 col-6 badge-column">
            <div class="badge-card" :class="{ locked: !isEarned(badge.id), chosen: badge.id === openBadgeId }" data-test="badge" @click="chooseBadge(badge.id)">
              <!-- an earned badge shows its icon and name, a locked badge shows a lock and "???" -->
              <div v-if="isEarned(badge.id)">
                <div class="big-icon" :class="badge.icon"></div>
                <div class="small subheadings">{{ badge.name }}</div>
                <div class="small fw-bold">Earned!</div>
              </div>
              <div v-else>
                <div class="big-icon bi-lock-fill"></div>
                <div class="small subheadings">???</div>
                <div class="small fw-bold">{{ badge.rule }}</div>
              </div>
            </div>

            <!-- the box under the badge that was tapped. A locked badge does not tell the child how far they are. -->
            <div v-if="badge.id === openBadgeId" class="inner-box badge-description p-2 small" data-test="badge-detail">
              <div v-if="isEarned(badge.id)">
                <div class="fw-bold">{{ badge.name }}: earned!</div>
                <div>{{ badgeStory(badge.id, user, quests) }}</div>
              </div>
              <div v-else>
                <div class="fw-bold">Not earned yet</div>
                <div>Keep going, you will find out how you did it when you earn it!</div>
              </div>
            </div>
          </div>
          <div class="col-lg-1 d-none d-lg-block"></div>
        </div>

        <!-- the demo box: only shows when the address ends with ?demo, so you can try every rank (nothing is saved) -->
        <div v-if="route.query.demo" class="inner-box p-3 mb-4" data-test="demo-box">
          <div class="fw-bold mb-2">DEMO: pretend the child has other berries (nothing is saved, reload the page to go back)</div>
          <select v-model="demoBerries" class="form-select" @change="tryBerries">
            <option value="" disabled>Pick a rank...</option>
            <option v-for="rank in RANKS" :key="rank.id" :value="rank.at">{{ rank.name }} ({{ berries(rank.at) }})</option>
          </select>
        </div>

        <!-- ===== 5. button to the leaderboard ===== -->
        <div class="text-center">
          <button class="action-button red" style="max-width: 360px" @click="router.push('/child/leaderboard')">THE BOUNTY BOARD</button>
        </div>
      </div>

      <!-- the quiz: the questions of the quest the child tapped (shows only when quizQuest is not empty) -->
      <div v-if="quizQuest" class="popup-overlay">
        <div class="inner-box popup-box p-4" data-test="quiz">
          <h2 class="fs-3 fw-bold mb-1">{{ quizQuest.title }}</h2>
          <p class="small mb-2">{{ quizQuest.details }}</p>
          <p v-if="quizQuest.status === 'verified'" class="small fw-bold">Practice only: no new berries.</p>

          <p v-if="quizQuest.questions.length === 0" class="fw-bold">This quest has no questions. Press DONE! when you have finished it.</p>

          <!-- v-for makes one box for every question. v-model keeps what the child types in the list called answers. -->
          <div v-for="(question, number) in quizQuest.questions" :key="number" class="mb-3">
            <label class="fw-bold d-block mb-1">{{ number + 1 }}. {{ question.text }}</label>
            <input v-model="answers[number]" type="text" class="form-control" />
            <!-- after CHECK: a tick or a cross for every question -->
            <div v-if="results.length > 0" class="small fw-bold mt-1">
              <span v-if="results[number]" class="correct"><i class="bi bi-check-lg"></i> Correct!</span>
              <span v-else class="wrong"><i class="bi bi-x-lg"></i> Try again</span>
            </div>
          </div>

                    <p v-if="allCorrect && quizQuest.status === 'assigned'" class="fw-bold correct">All correct! Now press DONE!</p>

          <div class="d-grid gap-2">
            <button v-if="quizQuest.questions.length > 0" class="action-button" data-test="quiz-check" @click="checkAnswers">CHECK MY ANSWERS</button>
            <!-- DONE! only shows when every answer is right (or the quest has no questions), and only for a quest that is still to do -->
            <button v-if="allCorrect && quizQuest.status === 'assigned'" class="action-button red" data-test="quest-done" @click="submitQuest(quizQuest.id)">DONE!</button>
            <button class="action-button" @click="quizQuest = null">CLOSE</button>
          </div>
        </div>
      </div>

      <!-- the pop-up after DONE! (shows only when message is not empty, OK empties it) -->
      <div v-if="message" class="popup-overlay">
        <div class="inner-box popup-box text-center p-4" data-test="toast">
          <h2 class="sections fs-2 mb-3">YOHOHO!</h2>
          <p class="fw-bold mb-3">{{ message }}</p>
          <button class="action-button" @click="message = ''">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>
