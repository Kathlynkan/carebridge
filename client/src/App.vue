<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <!-- Kueh Lapis signature stripe: Spiced Brown | Golden Yellow | Pandan Green -->
  <div class="lapis-stripe" aria-hidden="true"></div>
  <main class="app-main">
    <RouterView />
  </main>
  <footer class="app-footer text-center small py-4">
    Kids Lapis &middot; IS216 WAD2 Group Project
  </footer>
</template>
