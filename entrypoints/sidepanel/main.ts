import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useNotesStore } from '@/stores/notes'
import App from './App.vue'
import router from './router'
import './main.css'

async function init() {
  const pinia = createPinia()
  const app = createApp(App)

  app.use(pinia)
  app.use(router)

  const notesStore = useNotesStore()
  const categoriesStore = useCategoriesStore()
  await Promise.all([notesStore.hydrate(), categoriesStore.hydrate()])

  app.mount('#app')
}

init()
