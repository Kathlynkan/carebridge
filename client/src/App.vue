<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="app-main"> <!--main content area-->
    <RouterView />
  </main>
  <footer class="app-footer text-center small py-4">
    <!--displays footer at the bottom of every page-->
    CareBridge &middot; IS216 WAD2 Group Project
  </footer>
</template>
