import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Fast Notes',
    description: 'A simple note-taking extension.',
    version: '0.1.0',
    permissions: ['sidePanel', 'storage'],
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
