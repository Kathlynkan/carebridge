<!-- =============================================================
  Sign up page (volunteers and parents).              Owner: Kai Sen
  Basic version works. TODO (Kai Sen):
    [ ] client-side validation (password >= 8 chars, passwords match) with Bootstrap
        .is-invalid / .invalid-feedback classes
    [ ] volunteers: pick skills + available days (SKILL_OPTIONS, DAYS in utils/constants.js)
    [ ] parents: enter the "child code" given by the centre to link their child
============================================================= -->
<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/api'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ name: '', email: '', password: '', role: 'volunteer' })
const loading = ref(false)
const error = ref('')

async function handleSignup() {
  error.value = ''
  loading.value = true
  try {
    await auth.signup(form.value)
    router.push(auth.homePath)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-sm-10 col-md-7 col-lg-5">
        <div class="cb-card p-4 p-md-5">
          <h1 class="h3 mb-1">Create an account</h1>
          <p class="text-muted-cb mb-4">Coordinators create child accounts for the centre.</p>

          <div v-if="error" class="alert alert-danger small">{{ error }}</div>

          <form @submit.prevent="handleSignup">
            <div class="mb-3">
              <span class="form-label d-block">I am a...</span>
              <div class="btn-group w-100" role="group">
                <input id="role-vol" v-model="form.role" type="radio" class="btn-check" value="volunteer" />
                <label class="btn btn-outline-primary" for="role-vol">Volunteer</label>
                <input id="role-par" v-model="form.role" type="radio" class="btn-check" value="parent" />
                <label class="btn btn-outline-primary" for="role-par">Parent</label>
              </div>
            </div>
            <div class="mb-3">
              <label for="name" class="form-label">Full name</label>
              <input id="name" v-model.trim="form.name" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input id="email" v-model.trim="form.email" type="email" class="form-control" required />
            </div>
            <div class="mb-4">
              <label for="password" class="form-label">Password</label>
              <input id="password" v-model="form.password" type="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Sign up
            </button>
          </form>

          <p class="small text-center mt-3 mb-0">
            Already have an account? <RouterLink to="/login">Log in</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
