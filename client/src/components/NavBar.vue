<!-- =============================================================
  NavBar — shows different links for each role.      Owner: Kai Sen
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
  ],
  teacher: [
    { to: '/teacher',             label: 'Dashboard',   icon: 'bi-speedometer2' },
    { to: '/teacher/children',    label: 'Children',    icon: 'bi-person-badge' },
    { to: '/teacher/volunteers',  label: 'Volunteers',  icon: 'bi-person-heart' },
    { to: '/teacher/matchmaking', label: 'Matchmaking', icon: 'bi-shuffle' },
    { to: '/messages',                label: 'Messages',    icon: 'bi-chat-dots' },
  ],
  parent: [
    { to: '/parent',   label: 'My Child',  icon: 'bi-house-heart' },
    { to: '/messages', label: 'Messages',  icon: 'bi-chat-dots' },
  ],
  child: [
    { to: '/child',             label: 'My Quests',   icon: 'bi-stars' },
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
  <nav class="lapis-nav sticky-top">
    <div class="container lapis-nav-inner">
      <RouterLink class="lapis-brand" :to="auth.homePath">
        <img src="/favicon.svg" alt="" width="26" height="26" />
        Kids Lapis
      </RouterLink>

      <div class="lapis-links">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          class="lapis-nav-link"
          :to="link.to"
        >
          <i class="bi me-1" :class="link.icon"></i>{{ link.label }}
        </RouterLink>
      </div>

      <div v-if="auth.isLoggedIn" class="lapis-right">
        <RouterLink to="/profile" class="lapis-user-pill" data-test="nav-profile">
          <i class="bi bi-person-circle me-1"></i>{{ auth.user.name }}
          <span class="lapis-role-badge ms-1">{{ auth.role }}</span>
        </RouterLink>
        <button class="btn btn-outline-secondary btn-sm" data-test="logout" @click="logout">
          Log out
        </button>
      </div>

      <div v-else class="lapis-right">
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/login">Log in</RouterLink>
        <RouterLink class="btn btn-primary btn-sm" to="/signup">Sign up</RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.lapis-nav {
  background-color: var(--role-accent, var(--lapis-pink));
  border-bottom: 3px solid var(--role-accent-dark, var(--lapis-pink-dark));
}

.lapis-nav-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}

.lapis-brand {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--lapis-plum);
  text-decoration: none;
  background: var(--lapis-cream);
  border: 1px solid var(--lapis-cream-dark);
  border-radius: 4px;
  padding: 0.2rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.lapis-links {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  flex: 1;
}

.lapis-nav-link {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.72rem;
  color: var(--lapis-plum);
  background: var(--lapis-cream);
  border: 1px solid var(--lapis-cream-dark);
  border-radius: 4px;
  padding: 0.2rem 0.55rem;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.1s ease;
}

.lapis-nav-link:hover {
  background: var(--role-accent-soft, var(--lapis-cream));
  border-color: var(--role-accent-dark, var(--lapis-cream-dark));
  color: var(--lapis-plum);
}

.lapis-nav-link.router-link-active {
  background: var(--role-accent-soft, var(--lapis-cream));
  border-color: var(--role-accent-dark, var(--lapis-cream-dark));
  color: var(--lapis-plum);
}

.lapis-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  margin-left: auto;
}

.lapis-user-pill {
  display: inline-flex;
  align-items: center;
  background: var(--lapis-cream);
  border: 1px solid var(--lapis-cream-dark);
  border-radius: 4px;
  padding: 0.2rem 0.7rem;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--lapis-plum);
  text-decoration: none;
  white-space: nowrap;
}

.lapis-role-badge {
  background: var(--role-accent, var(--lapis-pink));
  border: 1px solid var(--role-accent-dark, var(--lapis-pink-dark));
  border-radius: 3px;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 5px;
  color: var(--lapis-plum);
}

@media (max-width: 575px) {
  .lapis-links {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
}
</style>
