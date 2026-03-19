# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (Chrome)
pnpm dev:firefox      # Start dev server (Firefox)
pnpm build            # Build extension for Chrome
pnpm build:firefox    # Build extension for Firefox
pnpm zip              # Package as installable Chrome zip
pnpm zip:firefox      # Package as installable Firefox zip
pnpm compile          # TypeScript type check (vue-tsc --noEmit)
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint violations
pnpm test             # Run all Vitest tests
pnpm test -- --run <pattern>  # Run a single test file/suite
```

* Prioritize running `pnpm lint:fix` to resolve any ESLint issues.

## Architecture

**Fast Notes** is a WXT browser extension with a Vue 3 side panel UI. The extension opens in the browser's side panel when the toolbar icon is clicked.

### Extension entry points (`entrypoints/`)
- `sidepanel/` — Main Vue 3 app (router, views, styles)
- `background.ts` — Service worker; opens the side panel on icon click
- `content.ts` — Content script injected on google.com (minimal)

### State management (`stores/`)
Three Pinia stores, all using the Composition API style.

**`useNotesStore`** (`stores/notes.ts`)
```typescript
interface Note {
  id: string           // crypto.randomUUID()
  title: string        // trimmed on save
  text: string         // trimmed on save
  createdAt: number    // Unix timestamp, used for newest-first sort
  categoryId: string | null
}
```

**`useCategoriesStore`** (`stores/categories.ts`) — manages `Category[]` with duplicate-name validation. Deleting a category calls `clearCategoryFromNotes` on the notes store to null out references.

**`useAuthStore`** (`stores/auth.ts`) — Firebase Authentication via Google sign-in. Uses `browser.identity.getAuthToken` (Chrome extension API) to obtain an OAuth token, then exchanges it for a Firebase credential. Exposes `isAuthenticated`, `uid`, `signInWithGoogle()`, and `signOut()`.

### Local persistence (`composables/`)
**`useStorageSync`** (`composables/useStorageSync.ts`) — two-way sync between a Pinia `ref` and `browser.storage.local` via WXT's `storage.defineItem` API. Used by notes and categories stores. Exposes a `hydrate()` function that must be called at app startup (before mount in `main.ts`) to restore persisted state. Storage keys: `local:notes`, `local:categories`.

### Routing
Vue Router 4 with **hash history** mode (required for browser extension side panels — HTML5 history doesn't work in extension pages).

### Styling
Tailwind CSS v4 with the Iconify plugin for icons. Imported via `entrypoints/sidepanel/main.css`.

UI components are built with **Reka UI** (`reka-ui`) — a headless, unstyled component library for Vue 3. Reka UI provides accessible primitives (dialogs, dropdowns, etc.) that are styled with Tailwind classes.

### Key config files
- `wxt.config.ts` — WXT manifest, modules (Vue, DevTools, Tailwind), Vite plugins
- `vitest.config.ts` — jsdom environment, WXT Vitest plugin, Vue plugin
- `eslint.config.mjs` — `@antfu/eslint-config` + `better-tailwindcss` plugin

## Development Workflow: Test-First (TDD)

**IMPORTANT**: Before writing any implementation code, you MUST:
1. Write a failing test that describes the expected behavior
2. Run the test and confirm it fails (red)
3. Write the minimal implementation to make the test pass (green)
4. Refactor if needed, keeping all tests green
5. Repeat for the next behavior

### Test File Convention
- Test files: `**/*.test.ts`
- Always co-locate tests with source files

### Example Flow
User: "Add a `formatCurrency` function"
You should:
1. Create `utils/formatCurrency.test.ts` first
2. Write test cases covering edge cases
3. Run `pnpm test --reporter=verbose` (RED)
4. Then create `utils/formatCurrency.ts`
5. Run tests until all pass (GREEN)
