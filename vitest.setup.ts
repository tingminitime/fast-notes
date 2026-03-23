import { Buffer } from 'node:buffer'

// Fix for jsdom@28: TextEncoder returns incorrect Uint8Array instances
// https://github.com/vitest-dev/vitest/issues/4043
globalThis.Uint8Array = Object.getPrototypeOf(Buffer)
