<!-- =============================================================
  ParentSessionCard - the session card from the whiteboard design.   Owner: Kat
  Left: a picture (with < > arrows when there is more than one photo).
  Right: a dropdown (Academic or Social) and the details of that kind of session.
    Academic = subject, score, what helped, next step and the homework.
    Social   = a notice board: how the child is doing, what they ate, what they did, a note.
  Props:  session (Object), child (Object), homework (Array)
  Its styles are in assets/parentpage.css
============================================================= -->
<script setup>
import { ref, computed } from 'vue' // ref = a box that holds a value, computed = a value worked out from other values
import { formatDate, accuracy, firstName } from '@/utils/format' // small helpers for dates, scores and names
import { HOMEWORK_STATUS } from '@/utils/constants' // the words for "To do", "Waiting" and so on

const props = defineProps({
  session: { type: Object, required: true },
  child: { type: Object, required: true },
  homework: { type: Array, default: () => [] },
  socialOnly: { type: Boolean, default: false }, // true = only the social view, without the dropdown
})

// the dropdown: show the academic details or the social details of the session
const kind = ref(props.socialOnly ? 'social' : 'academic')

// the photos of the session (none yet, the session form will add them later)
const photos = computed(() => props.session.photos || [])
const photoNumber = ref(0) // which photo we are showing

// the < and > arrows go round the photos
function nextPhoto(step) {
  photoNumber.value = (photoNumber.value + step + photos.value.length) % photos.value.length
}

// the child's first name, used in the friendly sentences
const name = computed(() => firstName(props.child.name))

// one friendly sentence about how the child was today, from the mood the volunteer picked
const feelingSentence = computed(() => {
  const sentences = {
    happy: `${name.value} was happy today 😊`,
    okay: `${name.value} was doing okay today 🙂`,
    tired: `${name.value} was a bit tired today 😴`,
    frustrated: `${name.value} had a harder day today 😕 Some encouragement at home will help`,
  }
  return sentences[props.session.mood] || `${name.value} was at student care today`
})

// the non-academic things the child did (chess with friends, soccer ...), as a list
const activityList = computed(() => {
  if (props.session.activities && props.session.activities.length > 0) {
    return props.session.activities
  }
  if (props.session.activity) {
    return [props.session.activity]
  }
  return []
})

// the first 3 homework items are enough for the academic view
const someHomework = computed(() => props.homework.slice(0, 3))
</script>

<template>
  <div class="parent-session-card" data-test="parent-session-card">
    <!-- left: the picture -->
    <div class="session-pic">
      <button v-if="photos.length > 1" type="button" class="pic-arrow" aria-label="Previous photo" @click="nextPhoto(-1)">&lt;</button>
      <img v-if="photos.length > 0" :src="photos[photoNumber]" alt="Photo from the session" />
      <!-- the empty picture box: the photos from the session form go here -->
      <div v-else class="pic-empty">
        <span class="fs-1">{{ child.avatar }}</span>
        <small>No photos yet</small>
      </div>
      <button v-if="photos.length > 1" type="button" class="pic-arrow" aria-label="Next photo" @click="nextPhoto(1)">&gt;</button>
    </div>

    <!-- right: the dropdown and the details -->
    <div class="session-info">
      <label v-if="!socialOnly" class="session-kind">
        Session
        <select v-model="kind" class="form-select form-select-sm" data-test="session-kind">
          <option value="academic">Academic</option>
          <option value="social">Social</option>
        </select>
      </label>

      <!-- academic view -->
      <div v-if="kind === 'academic'">
        <h3 class="h5 mb-0">{{ session.subject }}: {{ session.topic }}</h3>
        <div class="small text-muted-cb mb-2">{{ formatDate(session.date) }}</div>

        <!-- the details: the AI summary if the page gives one, otherwise the plain details -->
        <div class="session-details">
          <slot name="academic-extra">
            <div>Got {{ session.correct }} out of {{ session.attempted }} right ({{ accuracy(session) }}%)</div>
            <div v-if="session.struggles && session.struggles.length">A bit tricky: {{ session.struggles.join(', ') }}</div>
            <div v-if="session.whatWorked">What helped: {{ session.whatWorked }}</div>
            <div v-if="session.nextStep">Coming up next: {{ session.nextStep }}</div>
          </slot>
        </div>

        <!-- homework box -->
        <div class="session-homework">
          <strong>Homework</strong>
          <ul v-if="someHomework.length > 0" class="mb-0 ps-4">
            <li v-for="item in someHomework" :key="item.id">
              {{ item.title }}
              <span class="text-muted-cb">({{ HOMEWORK_STATUS[item.status] ? HOMEWORK_STATUS[item.status].label : item.status }})</span>
            </li>
          </ul>
          <div v-else class="small text-muted-cb">No homework right now.</div>
        </div>
      </div>

      <!-- social view: a notice board, nothing academic -->
      <div v-else data-test="social-board">
        <h3 class="h5 mb-0">Today at student care</h3>
        <div class="small text-muted-cb mb-2">{{ formatDate(session.date) }}</div>

        <!-- the pinned notes: each one only shows if the volunteer filled it in -->
        <div>
          <div class="note">
            <span class="note-label">How {{ name }} is doing</span>
            {{ feelingSentence }}
          </div>
          <div v-if="session.meal" class="note">
            <span class="note-label">Today's meal</span>
            {{ session.meal }}
          </div>
          <div v-if="activityList.length > 0" class="note">
            <span class="note-label">What {{ name }} did</span>
            <ul class="mb-0">
              <li v-for="activity in activityList" :key="activity">{{ activity }}</li>
            </ul>
          </div>
          <div v-if="session.notes" class="note">
            <span class="note-label">A note from the volunteer</span>
            "{{ session.notes }}"
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
