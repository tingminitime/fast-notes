import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('wxt/browser', () => ({ browser: { identity: { getAuthToken: vi.fn() } } }))
import { createRouter, createWebHashHistory } from 'vue-router'
import router from '../entrypoints/sidepanel/router'

describe('sidepanel router', () => {
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

  describe('history mode', () => {
    it('resolves routes without throwing in a non-browser env', () => {
      const resolved = router.resolve('/')
      expect(resolved.fullPath).toBe('/')
    })
  })
})
