import * as firebaseAuth from 'firebase/auth/web-extension'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import * as firestoreService from '../services/firestore'
import { deriveKey } from '../utils/crypto'
import { useAuthStore } from './auth'

vi.mock('../utils/crypto', () => ({
  deriveKey: vi.fn(),
}))

vi.mock('../services/firestore', () => ({
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  subscribeNotes: vi.fn(() => vi.fn()),
  saveCategory: vi.fn(),
  deleteCategory: vi.fn(),
  subscribeCategories: vi.fn(() => vi.fn()),
  saveKeyVerification: vi.fn(),
  hasKeyVerification: vi.fn(),
  verifyKey: vi.fn(),
}))

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

const mockKey = { type: 'secret' } as unknown as CryptoKey

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockStorageMap.clear()
  vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(vi.fn())
  ;(firebaseAuth.GoogleAuthProvider as any).credential = vi.fn().mockReturnValue({ providerId: 'google.com' })
  vi.mocked(deriveKey).mockResolvedValue(mockKey)
  vi.mocked(firestoreService.hasKeyVerification).mockResolvedValue(false)
  vi.mocked(firestoreService.saveKeyVerification).mockResolvedValue(undefined)
  vi.mocked(firestoreService.verifyKey).mockResolvedValue(true)
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

    it('passphraseStatus is loading', () => {
      const store = useAuthStore()
      expect(store.passphraseStatus).toBe('loading')
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
    it('clears loading and error state on success, leaving user to be set by onAuthStateChanged', async () => {
      const mockUser = { uid: 'uid-123', displayName: 'Test User', email: 'test@example.com' }
      mockGetAuthToken.mockResolvedValueOnce({ token: 'mock-access-token' })
      vi.mocked(firebaseAuth.signInWithCredential).mockResolvedValueOnce({ user: mockUser } as any)

      const store = useAuthStore()
      await store.signInWithGoogle()

      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.user).toBeNull()
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

  describe('passphraseStatus', () => {
    it('is set to "needed" when onAuthStateChanged fires with a user but no cached passphrase', async () => {
      let capturedCallback!: (user: any) => void
      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementationOnce((_auth, cb: any) => {
        capturedCallback = cb
        return vi.fn()
      })

      const store = useAuthStore()
      capturedCallback({ uid: 'uid-123' })

      await vi.waitFor(() => expect(store.passphraseStatus).toBe('needed'))
      expect(store.cryptoKey).toBeNull()
    })

    it('auto-applies cached passphrase and sets status to "ready" on auth state change', async () => {
      mockStorageMap.set('local:passphrase', 'cached-pass')
      vi.mocked(firestoreService.hasKeyVerification).mockResolvedValue(true)
      vi.mocked(firestoreService.verifyKey).mockResolvedValue(true)

      let capturedCallback!: (user: any) => void
      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementationOnce((_auth, cb: any) => {
        capturedCallback = cb
        return vi.fn()
      })

      const store = useAuthStore()
      capturedCallback({ uid: 'uid-123' })

      await vi.waitFor(() => expect(store.passphraseStatus).toBe('ready'))
      expect(store.cryptoKey).toBe(mockKey)
      expect(deriveKey).toHaveBeenCalledWith('cached-pass', 'uid-123')
    })

    it('is reset to "loading" on sign out', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.passphraseStatus = 'ready' as any
      store.user = { uid: 'uid-123' } as any

      await store.signOut()

      expect(store.passphraseStatus).toBe('loading')
    })
  })

  describe('setPassphrase', () => {
    it('derives key, saves verification doc (first time), sets cryptoKey and status ready', async () => {
      vi.mocked(firestoreService.hasKeyVerification).mockResolvedValue(false)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      const result = await store.setPassphrase('my-secret')

      expect(result).toBe(true)
      expect(deriveKey).toHaveBeenCalledWith('my-secret', 'uid-123')
      expect(firestoreService.saveKeyVerification).toHaveBeenCalledWith('uid-123', mockKey)
      expect(store.cryptoKey).toBe(mockKey)
      expect(store.passphraseStatus).toBe('ready')
    })

    it('verifies against existing doc on return visit', async () => {
      vi.mocked(firestoreService.hasKeyVerification).mockResolvedValue(true)
      vi.mocked(firestoreService.verifyKey).mockResolvedValue(true)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      const result = await store.setPassphrase('my-secret')

      expect(result).toBe(true)
      expect(firestoreService.verifyKey).toHaveBeenCalledWith('uid-123', mockKey)
      expect(firestoreService.saveKeyVerification).not.toHaveBeenCalled()
      expect(store.cryptoKey).toBe(mockKey)
    })

    it('returns false and does not set cryptoKey when passphrase is wrong', async () => {
      vi.mocked(firestoreService.hasKeyVerification).mockResolvedValue(true)
      vi.mocked(firestoreService.verifyKey).mockResolvedValue(false)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      const result = await store.setPassphrase('wrong-secret')

      expect(result).toBe(false)
      expect(store.cryptoKey).toBeNull()
      expect(store.passphraseStatus).not.toBe('ready')
    })

    it('returns false when user is not set', async () => {
      const store = useAuthStore()
      const result = await store.setPassphrase('any-passphrase')
      expect(result).toBe(false)
    })
  })

  describe('cryptoKey', () => {
    it('is null initially', () => {
      const store = useAuthStore()
      expect(store.cryptoKey).toBeNull()
    })

    it('is cleared on sign out', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.cryptoKey = { type: 'secret' } as unknown as CryptoKey
      store.user = { uid: 'uid-123' } as any

      await store.signOut()

      expect(store.cryptoKey).toBeNull()
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
