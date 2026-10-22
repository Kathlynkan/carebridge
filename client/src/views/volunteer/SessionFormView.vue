<!-- =============================================================
  Record / edit a session                              Owner: Ning Xuan
  Routes:  /children/:id/sessions/new     (create)
           /sessions/:sessionId/edit      (edit - same form)
  -------------------------------------------------------------
  The form fields are already bound with v-model. TODO (Ning Xuan):
    [done] submit: POST /sessions (create) or PUT /sessions/:id (edit)
        then router.push to the child profile
    [done] edit mode: load the session with GET /sessions/:sessionId and fill the form
    [done] validation: topic required, correct <= attempted (computed + .is-invalid)
    [done] "struggles" as tags: type + Enter to add, x to remove (Week 5 list exercise)
    [ ] quick-pick chips from the child's previous struggles
============================================================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
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

const childId = ref(route.params.id) // get childId from URL

const today = new Date()
const dateString = today.toISOString() // convert to string
const date = dateString.slice(0, 10) // format to yyyy-mm-dd

const form = ref({
  // academic
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

  // social
  activity: '',
  interaction: '',
  behaviour: '',
  socialNotes: '',
  photos: []
})
const newStruggle = ref('')
const saving = ref(false) // track whether the form is currently saving
const error = ref('')

async function loadSession() {
  try {
    const res = await api.get(`/sessions/${route.params.sessionId}`)
    const session = res.data

    form.value.date = session.date
    form.value.subject = session.subject
    form.value.topic = session.topic
    form.value.attempted = session.attempted
    form.value.correct = session.correct
    form.value.struggles = session.struggles
    form.value.whatWorked = session.whatWorked
    form.value.nextStep = session.nextStep
    form.value.mood = session.mood
    form.value.notes = session.notes
    form.value.activity = session.activity
    form.value.interaction = session.interaction
    form.value.behaviour = session.behaviour
    form.value.socialNotes = session.socialNotes
    form.value.photos = session.photos || []

    childId.value = session.childId // retrieve childId
  } catch (err) {
    error.value = errorMessage(err)
  }
}

async function handleSubmit() {
  try {
    saving.value = true
    error.value = ''

    // if edit form, update existing session
    if (isEdit.value) {
      await api.put(
        `/sessions/${route.params.sessionId}`, 
        form.value
      )

      // push /children/childId=c_1
      // redirect to child profile page after successful submission
      router.push({
        name: 'child-profile',
        params: {id: childId.value},
        query: {success: 'Session updated successfully'}
      })
    } else {
      // else, create new session
      await api.post('/sessions', {
        childId: childId.value,
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
        activity: form.value.activity,
        interaction: form.value.interaction,
        behaviour: form.value.behaviour,
        socialNotes: form.value.socialNotes,
        photos: form.value.photos
      })

      router.push({
        name: 'child-profile',
        params: {id: childId.value},
        query: {success: 'Session created successfully'}
      })
    }

  } catch (err) {
    // convert error message into readable text
    error.value = errorMessage(err)

    window.scrollTo({ // scroll to top of the form
      top: 0,
    })
  } finally {
    saving.value = false // after submission
  }
}

function uploadPhotos(event) {
  form.value.photos = Array.from(event.target.files)
}

function getPhotoURL(photo) {
  // if photo is a string (already a URL from database)
  if (typeof photo === 'string') {
    return photo
  }

  // else photo is newly uplaoded 
  return URL.createObjectURL(photo)
  // createObjectURL: convert file from computer 
  // into temporary preview link for <img :src="...">
}

function removePhoto(index) {
  form.value.photos.splice(index,1)
}

function addStruggle() {
  if (!newStruggle.value) {
    return
  } else if (form.value.struggles.includes(newStruggle.value)) {
    // avoid duplicates
    return
  }

  // add new struggle
  form.value.struggles.push(newStruggle.value.trim())

  newStruggle.value = ''
}

function removeStruggle(struggle) {
  const updatedStruggles = []

  for (const s of form.value.struggles) {
    if (s !== struggle) {
      updatedStruggles.push(s)
    }
  }

  form.value.struggles = updatedStruggles
}

function cancel() {
  router.back() // return user to wherever they came from
}

onMounted(() => { // autofill form if edit form
  if (isEdit.value) {
    loadSession()
  }
})

</script>

