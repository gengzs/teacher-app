import { createApp } from 'vue'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const apiOrigin =
  typeof window !== 'undefined' && window.__TEACHER_API_ORIGIN__
    ? String(window.__TEACHER_API_ORIGIN__).replace(/\/$/, '')
    : ''
if (apiOrigin) {
  axios.defaults.baseURL = apiOrigin
}

const app = createApp(App)
app.use(router)
app.mount('#app')
