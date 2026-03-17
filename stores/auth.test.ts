import * as firebaseAuth from 'firebase/auth/web-extension'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  describe('signOut', () => {
    it('sets user to null after sign out', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.user = { uid: 'uid-123' } as any

      await store.signOut()

      expect(store.user).toBeNull()
    })
  })
})
