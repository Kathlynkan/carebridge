<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="app-main">
    <RouterView /> <!--Routes the current page, for exmaple if child page then /child etc-->
  </main>
  <footer class="app-footer text-center small py-4">
    CareBridge &middot; IS216 WAD2 Group Project
  </footer>
</template>
