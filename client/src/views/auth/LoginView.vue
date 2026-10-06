<!-- =============================================================
  Login page - WORKING, use it as the reference for forms.   Owner: Kai Sen
  Pattern: v-model inputs -> async submit -> loading + error states -> router.push
  TODO (Kai Sen):
    [ ] show/hide password toggle
    [ ] remove the "demo accounts" box before final submission (keep them in README)
============================================================= -->
<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/api'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { role: 'Volunteer', email: 'volunteer@carebridge.sg' },
  { role: 'Coordinator', email: 'coordinator@carebridge.sg' },
  { role: 'Parent', email: 'parent@carebridge.sg' },
  { role: 'Child', email: 'child@carebridge.sg' },
]

function fillDemo(account) {
  email.value = account.email
  password.value = 'password123'
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    // go back to the page they wanted, or to their role's home page
    router.push(route.query.redirect || auth.homePath)
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
          <h1 class="h3 mb-1">Welcome back</h1>
          <p class="text-muted-cb mb-4">Log in to continue to CareBridge.</p>

          <div v-if="route.query.expired" class="alert alert-warning small">
            Your session expired. Please log in again.
          </div>
          <div v-if="error" class="alert alert-danger small" data-test="login-error">{{ error }}</div>

          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                v-model.trim="email"
                type="email"
                class="form-control"
                required
                autocomplete="username"
              />
            </div>
            <div class="mb-4">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-control"
                required
                autocomplete="current-password"
              />
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Log in
            </button>
          </form>

          <p class="small text-center mt-3 mb-0">
            New volunteer or parent? <RouterLink to="/signup">Create an account</RouterLink>
          </p>
        </div>

        <div class="cb-card p-3 mt-3 small">
          <strong>Demo accounts</strong> (password: <code>password123</code>)
          <div class="d-flex flex-wrap gap-2 mt-2">
            <button
              v-for="a in demoAccounts"
              :key="a.email"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="fillDemo(a)"
            >
              {{ a.role }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
