import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useCategoriesStore } from './categories'

const mockStore = new Map<string, any>()

vi.mock('wxt/utils/storage', () => ({
  storage: {
    defineItem: (key: string, opts?: { fallback?: any }) => ({
      key,
      fallback: opts?.fallback,
      getValue: vi.fn(async () => mockStore.get(key) ?? opts?.fallback),
      setValue: vi.fn(async (val: any) => {
        mockStore.set(key, val)
      }),
      watch: vi.fn(() => () => {}),
    }),
  },
}))

let mockAuthState: { isAuthenticated: boolean }

vi.mock('./auth', () => ({
  useAuthStore: () => mockAuthState,
}))

beforeEach(() => {
  mockAuthState = reactive({ isAuthenticated: false })
  setActivePinia(createPinia())
  mockStore.clear()
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

  describe('persistence', () => {
    it('hydrate() loads categories from storage', async () => {
      const storedCategories = [{ id: '1', name: 'Work' }]
      mockStore.set('local:categories', storedCategories)

      const store = useCategoriesStore()
      await store.hydrate()

      expect(store.categories).toEqual(storedCategories)
    })

    it('hydrate() returns empty array when storage is empty', async () => {
      const store = useCategoriesStore()
      await store.hydrate()

      expect(store.categories).toEqual([])
    })
  })

  describe('auth state transitions', () => {
    it('when user signs in, categories are cleared', async () => {
      const store = useCategoriesStore()
      store.addCategory('Work')
      expect(store.categories).toHaveLength(1)

      mockAuthState.isAuthenticated = true
      await nextTick()

      expect(store.categories).toHaveLength(0)
    })

    it('when user signs out, guest categories are restored from storage', async () => {
      const storedCategories = [{ id: '1', name: 'Work' }]
      mockStore.set('local:categories', storedCategories)

      const store = useCategoriesStore()

      // Sign in → categories cleared
      mockAuthState.isAuthenticated = true
      await nextTick()
      expect(store.categories).toHaveLength(0)

      // Sign out → guest categories restored
      mockAuthState.isAuthenticated = false
      await nextTick()
      await nextTick() // wait for async hydrate()

      expect(store.categories).toEqual(storedCategories)
    })
  })
})
