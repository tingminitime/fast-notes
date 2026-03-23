import * as firebaseAuth from 'firebase/auth/web-extension'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAuthStore } from './auth'

vi.mock('firebase/auth/web-extension', () => {
  // eslint-disable-next-line prefer-arrow-callback
  const MockGoogleAuthProvider = vi.fn(function () {})
  ;(MockGoogleAuthProvider as any).credential = vi.fn().mockReturnValue({ providerId: 'google.com' })
  return {
    GoogleAuthProvider: MockGoogleAuthProvider,
    onAuthStateChanged: vi.fn().mockReturnValue(vi.fn()),
    signInWithCredential: vi.fn(),
    signOut: vi.fn(),
  }
})

vi.mock('../firebase.config', () => ({
  auth: {},
  db: {},
}))

vi.mock('../services/firestore', () => ({
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  subscribeNotes: vi.fn(() => vi.fn()),
  saveCategory: vi.fn(),
  deleteCategory: vi.fn(),
  subscribeCategories: vi.fn(() => vi.fn()),
}))

const mockStorageMap = new Map<string, any>()
vi.mock('wxt/utils/storage', () => ({
  storage: {
    defineItem: (key: string, opts?: { fallback?: any }) => ({
      key,
      fallback: opts?.fallback,
      getValue: vi.fn(async () => mockStorageMap.get(key) ?? opts?.fallback),
      setValue: vi.fn(async (val: any) => { mockStorageMap.set(key, val) }),
      watch: vi.fn(() => () => {}),
    }),
  },
}))

const { mockGetAuthToken } = vi.hoisted(() => ({
  mockGetAuthToken: vi.fn<() => Promise<{ token?: string, grantedScopes?: string[] }>>(),
}))

vi.mock('wxt/browser', () => ({
  browser: {
    identity: {
      getAuthToken: mockGetAuthToken,
    },
  },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(vi.fn())
  ;(firebaseAuth.GoogleAuthProvider as any).credential = vi.fn().mockReturnValue({ providerId: 'google.com' })
})

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('user is null', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('isLoading is false', () => {
      const store = useAuthStore()
      expect(store.isLoading).toBe(false)
    })

    it('error is null', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('getters', () => {
    it('isAuthenticated is false when user is null', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated is true when user is set', () => {
      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any
      expect(store.isAuthenticated).toBe(true)
    })

    it('uid is null when user is null', () => {
      const store = useAuthStore()
      expect(store.uid).toBeNull()
    })

    it('uid returns the user uid when signed in', () => {
      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any
      expect(store.uid).toBe('uid-123')
    })
  })

  describe('signInWithGoogle', () => {
    it('sets user on success', async () => {
      const mockUser = { uid: 'uid-123', displayName: 'Test User', email: 'test@example.com' }
      mockGetAuthToken.mockResolvedValueOnce({ token: 'mock-access-token' })
      vi.mocked(firebaseAuth.signInWithCredential).mockResolvedValueOnce({ user: mockUser } as any)

      const store = useAuthStore()
      await store.signInWithGoogle()

      expect(store.user).toEqual(mockUser)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets error on failure and keeps user null', async () => {
      mockGetAuthToken.mockRejectedValueOnce(new Error('The user did not approve access.'))

      const store = useAuthStore()
      await store.signInWithGoogle()

      expect(store.user).toBeNull()
      expect(store.error).toBeTruthy()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('authReady', () => {
    it('resolves when onAuthStateChanged fires for the first time', async () => {
      let capturedCallback!: (_user: any) => void
      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementationOnce((_auth, cb: any) => {
        capturedCallback = cb
        return vi.fn()
      })

      const store = useAuthStore()
      let resolved = false
      const promise = store.authReady.then(() => {
        resolved = true
      })

      expect(resolved).toBe(false)
      capturedCallback(null)
      await promise
      await nextTick()

      expect(resolved).toBe(true)
    })
  })

  describe('signOut', () => {
    it('sets user to null after sign out', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      await store.signOut()

      expect(store.user).toBeNull()
    })

    it('does not clear notes or categories on sign out', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      const { useNotesStore } = await import('./notes')
      const { useCategoriesStore } = await import('./categories')
      const notesStore = useNotesStore()
      const categoriesStore = useCategoriesStore()

      // Push directly to simulate Firestore snapshot having populated state
      notesStore.notes.push({ id: '1', title: '', text: 'keep me', createdAt: 100, categoryId: null })
      categoriesStore.categories.push({ id: '1', name: 'Work' })

      await store.signOut()

      expect(notesStore.notes).toHaveLength(1)
      expect(notesStore.notes[0].text).toBe('keep me')
      expect(categoriesStore.categories).toHaveLength(1)
      expect(categoriesStore.categories[0].name).toBe('Work')
    })
  })
})
