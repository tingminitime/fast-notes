import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ mode }) => {
    const isDev = mode === 'development'
    const appName = isDev ? 'Fast Notes (Dev)' : 'Fast Notes'
    return {
      name: appName,
      description: 'A simple note-taking extension.',
      version: '0.1.0',
      permissions: ['sidePanel', 'storage', 'identity'],
      oauth2: {
        client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
        scopes: ['openid', 'email', 'profile'],
      },
    }
  },
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      vueDevTools({
        appendTo: '/entrypoints/sidepanel/main.ts',
      }),
      tailwindcss(),
    ],
  }),
})
