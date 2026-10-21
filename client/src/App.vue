<script setup>
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'

const route = useRoute()
</script>

<template>
  <NavBar />
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <Transition name="page-peel" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>
  <footer class="app-footer text-center py-3">
    Kids Lapis &middot; IS216 WAD2 Group Project
  </footer>
</template>
