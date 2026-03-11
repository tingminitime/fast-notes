import { createRouter, createWebHashHistory } from 'vue-router'
import AboutView from './views/AboutView.vue'
import HomeView from './views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: AboutView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
