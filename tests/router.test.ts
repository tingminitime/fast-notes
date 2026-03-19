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
    it('has a home route and a login route', () => {
      expect(router.getRoutes()).toHaveLength(2)
    })

    it('has a home route at /', () => {
      const home = router.getRoutes().find(r => r.path === '/')
      expect(home).toBeDefined()
      expect(home?.name).toBe('home')
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

    it('starts at the home route', () => {
      expect(testRouter.currentRoute.value.name).toBe('home')
    })
  })

  describe('guest mode', () => {
    it('allows unauthenticated users to access home route', async () => {
      const auth = useAuthStore()
      expect(auth.isAuthenticated).toBe(false)

      await router.push({ name: 'home' })
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('redirects authenticated users from login to home', async () => {
      const auth = useAuthStore()
      auth.user = { uid: 'uid-123' } as any

      await router.push({ name: 'login' })
      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('history mode', () => {
    it('resolves routes without throwing in a non-browser env', () => {
      const resolved = router.resolve('/')
      expect(resolved.fullPath).toBe('/')
    })
  })
})
