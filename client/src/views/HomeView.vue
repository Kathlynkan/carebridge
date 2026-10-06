<!-- =============================================================
  Landing page (public).                              Owner: Kai Sen
  TODO (Kai Sen):
    [ ] hero illustration / photo
    [ ] "How it works" section matches the final features
    [ ] check layout from iPhone 6 (375px) to Bootstrap XL
============================================================= -->
<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const steps = [
  { icon: 'bi-person-vcard', title: 'Before a session', text: "See the child's recent topics, struggles and what worked." },
  { icon: 'bi-pencil-square', title: 'After a session', text: 'Record the topic, score, struggles and next step in under a minute.' },
  { icon: 'bi-arrow-left-right', title: 'Handover', text: 'An AI summary tells the next volunteer exactly where to continue.' },
  { icon: 'bi-graph-up-arrow', title: 'Track progress', text: 'See which skills are improving and which keep coming back.' },
]

const roles = [
  { icon: 'bi-person-heart', name: 'Volunteers', text: 'Pick up where the last volunteer left off.' },
  { icon: 'bi-speedometer2', name: 'Coordinators', text: 'Spot children who need follow-up or have missing records.' },
  { icon: 'bi-house-heart', name: 'Parents', text: 'Know what your child worked on today, even when you work late.' },
  { icon: 'bi-stars', name: 'Children', text: 'Earn stars and badges for finishing homework quests.' },
]
</script>

<template>
  <section class="hero py-5">
    <div class="container py-md-4">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <span class="badge badge-accent mb-3">For student care centres</span>
          <h1 class="display-5 fw-heavy mb-3">
            When the volunteer changes, the child's progress shouldn't reset.
          </h1>
          <p class="lead text-muted-cb mb-4">
            CareBridge keeps every child's learning history in one place and turns past session
            notes into a short handover for the next volunteer.
          </p>
          <div class="d-flex flex-wrap gap-2">
            <RouterLink v-if="auth.isLoggedIn" :to="auth.homePath" class="btn btn-primary btn-lg">
              Go to my dashboard
            </RouterLink>
            <template v-else>
              <RouterLink to="/login" class="btn btn-primary btn-lg">Log in</RouterLink>
              <RouterLink to="/signup" class="btn btn-outline-primary btn-lg">
                Volunteer / parent sign up
              </RouterLink>
            </template>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="cb-card p-4 handover-demo">
            <div class="small text-muted-cb mb-2">Example</div>
            <h2 class="h5 mb-3">Today's Handover</h2>
            <dl class="row small mb-0">
              <dt class="col-5">Continue</dt><dd class="col-7">Fractions</dd>
              <dt class="col-5">Struggle</dt><dd class="col-7">Finding common denominators</dd>
              <dt class="col-5">What worked</dt><dd class="col-7">Visual diagrams</dd>
              <dt class="col-5">Last session</dt><dd class="col-7">3/5 correct</dd>
              <dt class="col-5">Next step</dt><dd class="col-7">Practise basic fraction addition</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="container py-5">
    <h2 class="h3 text-center mb-4">How it works</h2>
    <div class="row g-3">
      <div v-for="(step, i) in steps" :key="step.title" class="col-sm-6 col-lg-3">
        <div class="cb-card p-3 h-100">
          <div class="step-num mb-2">{{ i + 1 }}</div>
          <h3 class="h6"><i class="bi me-1" :class="step.icon"></i>{{ step.title }}</h3>
          <p class="small text-muted-cb mb-0">{{ step.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="container pb-5">
    <h2 class="h3 text-center mb-4">One app, four views</h2>
    <div class="row g-3">
      <div v-for="r in roles" :key="r.name" class="col-sm-6 col-lg-3">
        <div class="cb-card p-3 h-100 text-center">
          <i class="bi fs-2 text-primary" :class="r.icon"></i>
          <h3 class="h6 mt-2">{{ r.name }}</h3>
          <p class="small text-muted-cb mb-0">{{ r.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(180deg, var(--cb-primary-soft), var(--cb-bg));
}
.handover-demo {
  border-left: 6px solid var(--cb-accent);
}
.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--cb-accent);
  color: #3d2a00;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
