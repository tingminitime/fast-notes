import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useStorageSync } from '@/composables/useStorageSync'
import {
  deleteCategory as firestoreDeleteCategory,
  saveCategory,
  subscribeCategories,
} from '../services/firestore'
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
  let _unsubscribeCategories: (() => void) | null = null

  watch(() => authStore.isAuthenticated, async (isAuth) => {
    if (isAuth) {
      pause()
      categories.value = []
    }
    else {
      _unsubscribeCategories?.()
      _unsubscribeCategories = null
      resume()
      await hydrate()
    }
  })

  watch(() => authStore.cryptoKey, (key) => {
    if (key && authStore.uid && !_unsubscribeCategories) {
      _unsubscribeCategories = subscribeCategories(authStore.uid, key, (firestoreCategories) => {
        categories.value = firestoreCategories
      })
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
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: trimmed,
    }
    if (authStore.isAuthenticated && authStore.uid && authStore.cryptoKey) {
      saveCategory(authStore.uid, newCategory, authStore.cryptoKey)
    }
    else {
      categories.value.push(newCategory)
    }
    return true
  }

  function deleteCategory(id: string): void {
    if (authStore.isAuthenticated && authStore.uid) {
      firestoreDeleteCategory(authStore.uid, id)
    }
    else {
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx !== -1) {
        categories.value.splice(idx, 1)
        useNotesStore().clearCategoryFromNotes(id)
      }
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
