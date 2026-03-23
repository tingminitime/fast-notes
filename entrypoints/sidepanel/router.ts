import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CategoryManagerView from './views/CategoryManagerView.vue'
import LoginView from './views/LoginView.vue'
import NoteEditorView from './views/NoteEditorView.vue'
import NoteListView from './views/NoteListView.vue'

const routes = [
  { path: '/', name: 'notes', component: NoteListView },
  { path: '/new', name: 'notes-new', component: NoteEditorView },
  { path: '/edit/:id', name: 'notes-edit', component: NoteEditorView },
  { path: '/categories', name: 'categories', component: CategoryManagerView },
  { path: '/login', name: 'login', component: LoginView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (auth.isAuthenticated && to.name === 'login') {
    return { name: 'notes' }
  }
})

export default router
