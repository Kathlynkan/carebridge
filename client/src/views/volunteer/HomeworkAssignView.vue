<!-- =============================================================
  Give homework to a child                            Owner: Ning Xuan
  Route: /children/:id/homework/new
  The volunteer picks a DECK of questions and the child gets it as a quest.
  The homework then appears on the child's quest page (Jachin)
  and on the parent page (Kat).
  TODO (Ning Xuan):
    [x] POST /homework with { childId, deckId, dueDate, points, title, details }   (done: the questions come from the deck)
    [x] validation: a deck and a due date are needed, the due date is not in the past
    [ ] "suggest from next step": pick a deck that matches the latest session's nextStep
============================================================= -->
<script setup>
import { ref, onMounted } from 'vue' // ref = a box that holds a value, onMounted = runs when the page opens
import { useRoute, useRouter } from 'vue-router' // useRoute = the address of this page, useRouter = go to another page
import api, { errorMessage } from '@/services/api' // api = talks to our server, errorMessage = turns an error into a sentence
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const today = new Date().toISOString().slice(0, 10) // today as text like "2026-10-12", the due date cannot be before it

const decks = ref([]) // all the decks of questions
const chosenDeck = ref(null) // the deck the volunteer picked (null = none yet)
const form = ref({
  childId: route.params.id, // the child comes from the address of this page
  deckId: '', // the id of the picked deck
  title: '', // optional: if it is empty, the title of the deck is used
  details: '', // optional: if it is empty, the description of the deck is used
  dueDate: '',
  points: 10,
})
const error = ref('')

// ---------- when the page opens: ask the server for the decks ----------
onMounted(async () => {
  try {
    const response = await api.get('/decks')
    decks.value = response.data
  } catch (err) {
    error.value = errorMessage(err)
  }
})

// ---------- when the volunteer picks a deck: find it in the list so we can show its questions ----------
function pickDeck() {
  chosenDeck.value = null
  for (const deck of decks.value) {
    if (deck.id === form.value.deckId) {
      chosenDeck.value = deck
    }
  }
}

// ---------- when the volunteer presses "Assign homework" ----------
async function handleSubmit() {
  error.value = ''
  if (!form.value.deckId) {
    error.value = 'Pick a deck of questions.'
    return
  }
  if (!form.value.dueDate) {
    error.value = 'Pick a due date.'
    return
  }

  try {
    await api.post('/homework', form.value) // the server makes the quest with the questions of the deck
    router.push('/children/' + form.value.childId) // go back to the child's page
  } catch (err) {
    error.value = errorMessage(err)
  }
}
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Give homework" subtitle="Pick a deck of questions. The child answers them as a quest." />

    <div class="row justify-content-center">
      <div class="col-lg-7">
        <form class="cb-card p-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-warning small">{{ error }}</div>

          <!-- the deck of questions -->
          <div class="mb-3">
            <label class="form-label" for="deck">Deck of questions</label>
            <select id="deck" v-model="form.deckId" class="form-select" data-test="deck-select" @change="pickDeck">
              <option value="" disabled>Pick a deck...</option>
              <option v-for="deck in decks" :key="deck.id" :value="deck.id">{{ deck.subject }}: {{ deck.title }} ({{ deck.questions.length }} questions)</option>
            </select>
          </div>

          <!-- the questions of the picked deck, so the volunteer can see them (with the answers) -->
          <div v-if="chosenDeck" class="border rounded p-3 mb-3 small" data-test="deck-preview">
            <div class="fw-bold mb-1">{{ chosenDeck.description }}</div>
            <ol class="mb-0">
              <li v-for="(question, number) in chosenDeck.questions" :key="number">
                {{ question.text }} <span class="text-muted">Answer: {{ question.answer }}</span>
              </li>
            </ol>
          </div>

          <div class="mb-3">
            <label class="form-label" for="title">Title (optional)</label>
            <input id="title" v-model.trim="form.title" class="form-control" :placeholder="chosenDeck ? chosenDeck.title : 'Leave empty to use the title of the deck'" />
          </div>
          <div class="row g-3 mb-3">
            <div class="col-sm-6">
              <label class="form-label" for="due">Due date</label>
              <input id="due" v-model="form.dueDate" type="date" :min="today" class="form-control" />
            </div>
            <div class="col-sm-6">
              <label class="form-label" for="points">Reward points</label>
              <select id="points" v-model.number="form.points" class="form-select">
                <option :value="10">10 ⭐ (small)</option>
                <option :value="15">15 ⭐</option>
                <option :value="20">20 ⭐ (big)</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label" for="details">Instructions for the child (optional)</label>
            <textarea id="details" v-model="form.details" rows="2" class="form-control" placeholder="Leave empty to use the description of the deck"></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="router.back()">Cancel</button>
            <button type="submit" class="btn btn-primary" data-test="assign-submit">Assign homework</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
