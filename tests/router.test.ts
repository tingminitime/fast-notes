import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

vi.mock('wxt/browser', () => ({ browser: { identity: { getAuthToken: vi.fn() } } }))
vi.mock('firebase/auth/web-extension', () => ({
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn().mockReturnValue(vi.fn()),
  signInWithCredential: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('../firebase.config', () => ({ auth: {} }))
vi.mock('wxt/utils/storage', () => ({
  storage: {
    defineItem: (_key: string, opts?: { fallback?: any }) => ({
      getValue: vi.fn(async () => opts?.fallback),
      setValue: vi.fn(),
      watch: vi.fn(() => () => {}),
    }),
  },
}))

// eslint-disable-next-line import/first
import router from '../entrypoints/sidepanel/router'
// eslint-disable-next-line import/first
import { useAuthStore } from '../stores/auth'

describe('sidepanel router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('route configuration', () => {
    it('has 6 routes', () => {
      expect(router.getRoutes()).toHaveLength(6)
    })

    it('has a notes route at /', () => {
      const notes = router.getRoutes().find(r => r.path === '/')
      expect(notes).toBeDefined()
      expect(notes?.name).toBe('notes')
    })

    it('has a notes-new route at /new', () => {
      const route = router.getRoutes().find(r => r.path === '/new')
      expect(route).toBeDefined()
      expect(route?.name).toBe('notes-new')
    })

    it('has a notes-edit route at /edit/:id', () => {
      const route = router.getRoutes().find(r => r.path === '/edit/:id')
      expect(route).toBeDefined()
      expect(route?.name).toBe('notes-edit')
    })

    it('has a categories route at /categories', () => {
      const route = router.getRoutes().find(r => r.path === '/categories')
      expect(route).toBeDefined()
      expect(route?.name).toBe('categories')
    })
  })

  describe('navigation', () => {
    let testRouter: ReturnType<typeof createRouter>

    beforeEach(async () => {
      testRouter = createRouter({
        history: createWebHashHistory(),
        routes: router.getRoutes(),
      })
      await testRouter.push('/')
    })

    it('starts at the notes route', () => {
      expect(testRouter.currentRoute.value.name).toBe('notes')
    })
  })

  describe('guest mode', () => {
    it('allows unauthenticated users to access notes route', async () => {
      const auth = useAuthStore()
      expect(auth.isAuthenticated).toBe(false)

      await router.push({ name: 'notes' })
      expect(router.currentRoute.value.name).toBe('notes')
    })

    it('redirects authenticated users to passphrase when passphrase not ready', async () => {
      const auth = useAuthStore()
      auth.user = { uid: 'uid-123' } as any
      // passphraseStatus starts as 'loading'; navigating to any non-passphrase route redirects

      await router.push({ name: 'categories' })
      expect(router.currentRoute.value.name).toBe('passphrase')
    })

    it('redirects authenticated users from login to notes when passphrase is ready', async () => {
      const auth = useAuthStore()
      auth.user = { uid: 'uid-123' } as any
      auth.passphraseStatus = 'ready' as any

      await router.push({ name: 'login' })
      expect(router.currentRoute.value.name).toBe('notes')
    })
  })

  describe('history mode', () => {
    it('resolves routes without throwing in a non-browser env', () => {
      const resolved = router.resolve('/')
      expect(resolved.fullPath).toBe('/')
    })
  })
})
