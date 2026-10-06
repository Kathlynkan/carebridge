import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Bootstrap (Week 5 slides) + Bootstrap Icons  ->  <i class="bi bi-heart"></i>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// If the server says our token is no longer valid (401), log out and go to /login
setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  auth.clearSession()
  router.push({ name: 'login', query: { expired: '1' } })
})

app.mount('#app')
