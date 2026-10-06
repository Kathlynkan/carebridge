<!-- =============================================================
  Give homework to a child                            Owner: Ning Xuan
  Route: /children/:id/homework/new
  The homework then appears on the child's quest page (Jachin)
  and on the parent page (Kat).
  TODO (Ning Xuan):
    [ ] POST /homework with { childId, title, subject, details, dueDate, points }
    [ ] validation: title required, due date not in the past
    [ ] "suggest from next step": pre-fill title from the latest session's nextStep
============================================================= -->
<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import TodoPanel from '@/components/TodoPanel.vue'
import { SUBJECTS } from '@/utils/constants'

const route = useRoute()
const router = useRouter()

const form = ref({
  childId: route.params.id,
  title: '',
  subject: 'Math',
  details: '',
  dueDate: '',
  points: 10,
})
const error = ref('')

async function handleSubmit() {
  // TODO (Ning Xuan)
  error.value = 'Not built yet (TODO Ning Xuan).'
}
</script>

<template>
  <div class="container py-4">
    <PageHeader title="Give homework" subtitle="Small tasks from the question book work best." />
    <TodoPanel owner="Ning Xuan" :items="['POST /homework', 'Validation', 'Pre-fill from last next step']" />

    <div class="row justify-content-center">
      <div class="col-lg-7">
        <form class="cb-card p-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-warning small">{{ error }}</div>
          <div class="mb-3">
            <label class="form-label" for="title">Title</label>
            <input id="title" v-model.trim="form.title" class="form-control" placeholder="e.g. Fraction addition worksheet" />
          </div>
          <div class="row g-3 mb-3">
            <div class="col-sm-4">
              <label class="form-label" for="subject">Subject</label>
              <select id="subject" v-model="form.subject" class="form-select">
                <option v-for="s in SUBJECTS" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-sm-4">
              <label class="form-label" for="due">Due date</label>
              <input id="due" v-model="form.dueDate" type="date" class="form-control" />
            </div>
            <div class="col-sm-4">
              <label class="form-label" for="points">Reward points</label>
              <select id="points" v-model.number="form.points" class="form-select">
                <option :value="10">10 ⭐ (small)</option>
                <option :value="15">15 ⭐</option>
                <option :value="20">20 ⭐ (big)</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label" for="details">Instructions for the child</label>
            <textarea id="details" v-model="form.details" rows="3" class="form-control" placeholder="Question book p.42, Q1-10"></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="router.back()">Cancel</button>
            <button type="submit" class="btn btn-primary">Assign homework</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
