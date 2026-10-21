<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="app-main"> <!--main content area-->
    <RouterView /> <!--Routes the current page, for exmaple if child page then /child etc-->
  </main>
  <!-- displays footer at the bottom of every page -->
  <footer class="app-footer text-center small py-4">
    Kids Lapis &middot; IS216 WAD2 Group Project
  </footer>
</template>
