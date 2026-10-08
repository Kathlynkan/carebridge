<!-- =============================================================
  NavBar - shows different links for each role.      Owner: Kai Sen
  TODO (Kai Sen):
    [ ] unread-message badge on "Messages" (needs Kat's GET /messages/unread)
    [ ] highlight style for the active link (RouterLink adds .router-link-active)
============================================================= -->
<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const LINKS = {
  volunteer: [
    { to: '/volunteer', label: 'My Children', icon: 'bi-people' },
    { to: '/messages', label: 'Messages', icon: 'bi-chat-dots' },
  ],
  coordinator: [
    { to: '/coordinator', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/coordinator/children', label: 'Children', icon: 'bi-person-badge' },
    { to: '/coordinator/volunteers', label: 'Volunteers', icon: 'bi-person-heart' },
    { to: '/coordinator/matchmaking', label: 'Matchmaking', icon: 'bi-shuffle' },
  ],
  parent: [
    { to: '/parent', label: 'My Child', icon: 'bi-house-heart' },
    { to: '/messages', label: 'Messages', icon: 'bi-chat-dots' },
  ],
  child: [
    { to: '/child', label: 'My Quests', icon: 'bi-stars' },
    { to: '/child/leaderboard', label: 'Bounty Board', icon: 'bi-trophy' },
  ],
}

const links = computed(() => LINKS[auth.role] || [])

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar navbar-expand-md bg-white border-bottom sticky-top">
    <div class="container">
      <RouterLink class="navbar-brand fw-heavy d-flex align-items-center gap-2" :to="auth.homePath">
        <img src="/favicon.svg" alt="" width="30" height="30" />
        CareBridge
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNav" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li v-for="link in links" :key="link.to" class="nav-item">
            <RouterLink class="nav-link" :to="link.to">
              <i class="bi me-1" :class="link.icon"></i>{{ link.label }}
            </RouterLink>
          </li>
        </ul>

        <div v-if="auth.isLoggedIn" class="d-flex align-items-center gap-3">
          <span class="small text-muted-cb">
            <i class="bi bi-person-circle me-1"></i>{{ auth.user.name }}
            <span class="badge badge-soft ms-1 text-capitalize">{{ auth.role }}</span>
          </span>
          <button class="btn btn-sm btn-outline-secondary" data-test="logout" @click="logout">
            Log out
          </button>
        </div>
        <div v-else class="d-flex gap-2">
          <RouterLink class="btn btn-sm btn-outline-primary" to="/login">Log in</RouterLink>
          <RouterLink class="btn btn-sm btn-primary" to="/signup">Sign up</RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link.router-link-active {
  color: var(--cb-primary);
  font-weight: 700;
}
</style>
