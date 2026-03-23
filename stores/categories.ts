import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useStorageSync } from '@/composables/useStorageSync'
import { useAuthStore } from './auth'
import { useNotesStore } from './notes'

export interface Category {
  id: string
  name: string
}

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const { hydrate, pause, resume } = useStorageSync('local:categories', categories, [])
  const error = ref('')

  const authStore = useAuthStore()
  watch(() => authStore.isAuthenticated, async (isAuth) => {
    if (isAuth) {
      pause()
      categories.value = []
    }
    else {
      resume()
      await hydrate()
    }
  })

  function categoryById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  function addCategory(name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      return false
    }
    const duplicate = categories.value.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      error.value = `Category "${trimmed}" already exists.`
      return false
    }
    error.value = ''
    categories.value.push({
      id: crypto.randomUUID(),
      name: trimmed,
    })
    return true
  }

  function deleteCategory(id: string): void {
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      categories.value.splice(idx, 1)
      useNotesStore().clearCategoryFromNotes(id)
    }
  }

  return {
    categories,
    error,
    categoryById,
    addCategory,
    deleteCategory,
    hydrate,
  }
})
