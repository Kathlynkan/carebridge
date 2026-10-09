<!-- =============================================================
  Record / edit a session                              Owner: Ning Xuan
  Routes:  /children/:id/sessions/new     (create)
           /sessions/:sessionId/edit      (edit - same form)
  -------------------------------------------------------------
  The form fields are already bound with v-model. TODO (Ning Xuan):
    [ ] submit: POST /sessions (create) or PUT /sessions/:id (edit)
        then router.push to the child profile
    [ ] edit mode: load the session with GET /sessions/:sessionId and fill the form
    [ ] validation: topic required, correct <= attempted (computed + .is-invalid)
    [ ] "struggles" as tags: type + Enter to add, x to remove (Week 5 list exercise)
    [ ] quick-pick chips from the child's previous struggles
============================================================= -->
<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { SUBJECTS, MOODS } from '@/utils/constants'
import api, { errorMessage } from '@/services/api'

const route = useRoute() // read information
const router = useRouter() // navigate to another page

const isEdit = computed(() => {
  if (route.params.sessionId) {
    return true
  } else {
    return false
  }
})

const childId = route.params.id // get childID from URL

const today = new Date()
const dateString = today.toISOString() // convert to string
const date = dateString.slice(0, 10) // format to yyyy-mm-dd

const form = ref({
  date: date,
  subject: 'Math',
  topic: '',
  attempted: 0,
  correct: 0,
  struggles: [],
  whatWorked: '',
  nextStep: '',
  mood: 'okay',
  notes: '',
})
const newStruggle = ref('')
const saving = ref(false) // track whether the form is currently saving (?)
const error = ref('')

async function handleSubmit() {
  try {
    saving.value = true
    error.value = ''

    // if edit form, update exisitng session
    if (isEdit.value) {
      await api.put(
        `/sessions/${route.params.sessionId}`, 
        form.value
      )
    } else {
      // else, create new session
      await api.post('/sessions', {
        childId: childId,
        date: form.value.date,
        subject: form.value.subject,
        topic: form.value.topic,
        attempted: form.value.attempted,
        correct: form.value.correct,
        struggles: form.value.struggles,
        whatWorked: form.value.whatWorked,
        nextStep: form.value.nextStep,
        mood: form.value.mood,
        notes: form.value.notes,
      })
    }

    // push /children/childId=c_1
    // redirect to child profile page after successful submission
    router.push({
      name: 'child-profile',
      params: {
        id: childId
      }
    })
  } catch (err) {
    // convert error message into readable text
    error.value = errorMessage(err)
  } finally {
    saving.value = false // after submission
  }
}

function cancel() {
  router.back() // return user to wherever they came from
}
</script>

<template>
  <div class="container py-4">
    <PageHeader
      :title="isEdit ? 'Edit session' : 'Record a session'"
      subtitle="Takes about a minute. The next volunteer will thank you!"
    />

    <div class="row justify-content-center">
      <div class="col-lg-8">
        <form class="cb-card p-4" data-test="session-form" @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-warning small">{{ error }}</div>

          <div class="row g-3">
            <div class="col-sm-4">
              <label class="form-label" for="date">Date</label>
              <input id="date" v-model="form.date" type="date" class="form-control" required />
            </div>
            <div class="col-sm-4">
              <label class="form-label" for="subject">Subject</label>
              <select id="subject" v-model="form.subject" class="form-select">
                <option v-for="s in SUBJECTS" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-sm-4">
              <label class="form-label" for="topic">Topic covered</label>
              <input id="topic" v-model.trim="form.topic" class="form-control" placeholder="e.g. Fractions" />
            </div>

            <div class="col-6 col-sm-3">
              <label class="form-label" for="attempted">Attempted</label>
              <input id="attempted" v-model.number="form.attempted" type="number" min="0" class="form-control" />
            </div>
            <div class="col-6 col-sm-3">
              <label class="form-label" for="correct">Correct</label>
              <input id="correct" v-model.number="form.correct" type="number" min="0" class="form-control" />
            </div>
            <div class="col-sm-6">
              <span class="form-label d-block">How was the child feeling?</span>
              <div class="btn-group flex-wrap" role="group">
                <template v-for="m in MOODS" :key="m.value">
                  <input :id="'mood-' + m.value" v-model="form.mood" type="radio" class="btn-check" :value="m.value" />
                  <label class="btn btn-outline-secondary btn-sm" :for="'mood-' + m.value">
                    {{ m.emoji }} {{ m.label }}
                  </label>
                </template>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label" for="struggle">Skills the child struggled with</label>
              <input
                id="struggle"
                v-model.trim="newStruggle"
                class="form-control"
                placeholder="Type a skill and press Enter"
              />
              <div class="mt-2">
                <span v-for="s in form.struggles" :key="s" class="badge badge-danger-soft me-1">{{ s }}</span>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="worked">Teaching method that worked</label>
              <input id="worked" v-model.trim="form.whatWorked" class="form-control" placeholder="e.g. Visual diagrams" />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="next">Suggested next step</label>
              <input id="next" v-model.trim="form.nextStep" class="form-control" placeholder="e.g. Practise fraction addition" />
            </div>
            <div class="col-12">
              <label class="form-label" for="notes">Other notes (optional)</label>
              <textarea id="notes" v-model="form.notes" rows="3" class="form-control"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary" @click="cancel">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ isEdit ? 'Save changes' : 'Save session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
