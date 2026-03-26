import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { useAuthStore } from '@/stores/auth'
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

  // Instantiate all stores to register auth-state watchers before authReady resolves
  const authStore = useAuthStore()
  const notesStore = useNotesStore()
  const categoriesStore = useCategoriesStore()

  // Wait for Firebase to report initial auth state
  await authStore.authReady

  // Only hydrate from local storage when not signed in (guest mode)
  if (!authStore.isAuthenticated) {
    await Promise.all([
      notesStore.hydrate(),
      categoriesStore.hydrate(),
    ])
  }

  app.mount('#app')
}

init()
