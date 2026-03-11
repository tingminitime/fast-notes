import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import router from '../entrypoints/sidepanel/router'

describe('sidepanel router', () => {
  describe('route configuration', () => {
    it('has exactly two routes', () => {
      expect(router.getRoutes()).toHaveLength(2)
    })

    it('has a home route at /', () => {
      const home = router.getRoutes().find(r => r.path === '/')
      expect(home).toBeDefined()
      expect(home?.name).toBe('home')
    })

    it('has an about route at /about', () => {
      const about = router.getRoutes().find(r => r.path === '/about')
      expect(about).toBeDefined()
      expect(about?.name).toBe('about')
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

    it('navigates to /about by path', async () => {
      await testRouter.push('/about')
      expect(testRouter.currentRoute.value.name).toBe('about')
      expect(testRouter.currentRoute.value.path).toBe('/about')
    })

    it('navigates to about by named route', async () => {
      await testRouter.push({ name: 'about' })
      expect(testRouter.currentRoute.value.path).toBe('/about')
    })

    it('navigates back to home from about', async () => {
      await testRouter.push('/about')
      await testRouter.push({ name: 'home' })
      expect(testRouter.currentRoute.value.path).toBe('/')
    })
  })

  describe('history mode', () => {
    it('resolves routes without throwing in a non-browser env', () => {
      const resolved = router.resolve('/')
      expect(resolved.fullPath).toBe('/')

      const resolvedAbout = router.resolve('/about')
      expect(resolvedAbout.fullPath).toBe('/about')
    })
  })
})
