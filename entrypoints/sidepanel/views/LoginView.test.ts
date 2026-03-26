import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from './LoginView.vue'

vi.mock('wxt/browser', () => ({
  browser: { identity: { getAuthToken: vi.fn() } },
}))

vi.mock('firebase/auth/web-extension', () => {
  // eslint-disable-next-line prefer-arrow-callback
  const MockGoogleAuthProvider = vi.fn(function () {})
  ;(MockGoogleAuthProvider as any).credential = vi.fn()
  return {
    GoogleAuthProvider: MockGoogleAuthProvider,
    onAuthStateChanged: vi.fn().mockReturnValue(vi.fn()),
    signInWithCredential: vi.fn(),
    signOut: vi.fn(),
  }
})

vi.mock('../../../firebase.config', () => ({ auth: {} }))

describe('loginView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/', name: 'notes', component: { template: '<div />' } },
        { path: '/login', name: 'login', component: { template: '<div />' } },
      ],
    })
    await router.push('/login')
  })

  it('renders the sign in button', () => {
    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Sign in with Google')
  })

  it('redirects to home when isAuthenticated becomes true', async () => {
    const { useAuthStore } = await import('@/stores/auth')

    mount(LoginView, { global: { plugins: [router] } })

    const store = useAuthStore()
    store.user = { uid: 'uid-123' } as any

    await flushPromises()

    expect(router.currentRoute.value.name).toBe('notes')
  })
})
