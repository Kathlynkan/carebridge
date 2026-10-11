<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="app-main"> <!--main content area-->
    <RouterView />
  </main>
  <!-- displays footer at the bottom of every page -->
  <footer class="app-footer text-center small py-4">
    CareBridge &middot; IS216 WAD2 Group Project
  </footer>
</template>
