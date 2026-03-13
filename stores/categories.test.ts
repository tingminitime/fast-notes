import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCategoriesStore } from './categories'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useCategoriesStore', () => {
  describe('addCategory', () => {
    it('adds a category with unique name and increments list length', () => {
      const store = useCategoriesStore()
      const result = store.addCategory('Work')
      expect(result).toBe(true)
      expect(store.categories).toHaveLength(1)
      expect(store.categories[0].name).toBe('Work')
    })

    it('trims whitespace when saving', () => {
      const store = useCategoriesStore()
      store.addCategory('  Work  ')
      expect(store.categories[0].name).toBe('Work')
    })

    it('returns false for duplicate name and does not add', () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      const result = store.addCategory('Work')
      expect(result).toBe(false)
      expect(store.categories).toHaveLength(1)
      expect(store.error).toBeTruthy()
    })

    it('returns false for empty name', () => {
      const store = useCategoriesStore()
      const result = store.addCategory('   ')
      expect(result).toBe(false)
      expect(store.categories).toHaveLength(0)
    })

    it('clears error on successful add', () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      store.addCategory('Work') // sets error
      store.addCategory('Personal') // should clear error
      expect(store.error).toBe('')
    })
  })

  describe('deleteCategory', () => {
    it('removes the category from the list', () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      const id = store.categories[0].id
      store.deleteCategory(id)
      expect(store.categories).toHaveLength(0)
    })

    it('only removes the targeted category', () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      store.addCategory('Personal')
      const idToDelete = store.categories.find(c => c.name === 'Work')!.id
      store.deleteCategory(idToDelete)
      expect(store.categories).toHaveLength(1)
      expect(store.categories[0].name).toBe('Personal')
    })
  })

  describe('categoryById getter', () => {
    it('returns the category for a given id', () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      const id = store.categories[0].id
      expect(store.categoryById(id)?.name).toBe('Work')
    })

    it('returns undefined for unknown id', () => {
      const store = useCategoriesStore()
      expect(store.categoryById('no-such-id')).toBeUndefined()
    })
  })
})
