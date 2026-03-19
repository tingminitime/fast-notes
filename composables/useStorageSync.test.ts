import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useStorageSync } from './useStorageSync'

// Mock wxt/utils/storage
const mockStore = new Map<string, any>()
const mockWatchers = new Map<string, Array<(newVal: any, oldVal: any) => void>>()

vi.mock('wxt/utils/storage', () => ({
  storage: {
    defineItem: (key: string, opts?: { fallback?: any }) => ({
      key,
      fallback: opts?.fallback,
      getValue: vi.fn(async () => mockStore.get(key) ?? opts?.fallback),
      setValue: vi.fn(async (val: any) => {
        mockStore.set(key, val)
      }),
      watch: vi.fn((cb: (newVal: any, _oldVal: any) => void) => {
        if (!mockWatchers.has(key))
          mockWatchers.set(key, [])
        mockWatchers.get(key)!.push(cb)
        return () => {
          const arr = mockWatchers.get(key)
          if (arr) {
            const idx = arr.indexOf(cb)
            if (idx !== -1)
              arr.splice(idx, 1)
          }
        }
      }),
    }),
  },
}))

// Helper to simulate external storage change
function triggerExternalChange(key: string, newVal: any, _oldVal: any = null) {
  const watchers = mockWatchers.get(key)
  if (watchers)
    watchers.forEach(cb => cb(newVal, _oldVal))
}

beforeEach(() => {
  mockStore.clear()
  mockWatchers.clear()
})

describe('useStorageSync', () => {
  it('hydrate() loads stored value into the ref', async () => {
    mockStore.set('local:notes', [{ id: '1', text: 'hello' }])
    const data = ref<any[]>([])
    const { hydrate } = useStorageSync('local:notes', data, [])

    await hydrate()

    expect(data.value).toEqual([{ id: '1', text: 'hello' }])
  })

  it('hydrate() uses fallback when storage is empty', async () => {
    const data = ref<string[]>([])
    const { hydrate } = useStorageSync('local:items', data, ['default'])

    await hydrate()

    expect(data.value).toEqual(['default'])
  })

  it('ref mutation triggers setValue on storage', async () => {
    const data = ref<string[]>([])
    const { storageItem } = useStorageSync('local:items', data, [])

    data.value.push('new item')
    await nextTick()

    expect(storageItem.setValue).toHaveBeenCalledWith(['new item'])
  })

  it('external storage change updates the ref', async () => {
    const data = ref<string[]>(['old'])
    useStorageSync('local:items', data, [])

    triggerExternalChange('local:items', ['updated'])

    expect(data.value).toEqual(['updated'])
  })

  it('hydrate() falls back to fallback when stored value is wrong type (non-array)', async () => {
    mockStore.set('local:notes', { corrupted: true })
    const data = ref<any[]>([])
    const { hydrate } = useStorageSync('local:notes', data, [])

    await hydrate()

    expect(data.value).toEqual([])
  })

  it('external watch falls back to fallback when incoming value is wrong type (non-array)', () => {
    const data = ref<any[]>([])
    useStorageSync('local:items', data, [])

    triggerExternalChange('local:items', { corrupted: true })

    expect(data.value).toEqual([])
  })

  it('does not trigger infinite loop when ref and storage have same value', async () => {
    const data = ref<string[]>([])
    const { storageItem } = useStorageSync('local:items', data, [])

    // Simulate external change with same value as current ref
    triggerExternalChange('local:items', [])

    await nextTick()

    // setValue should not be called because the value is the same
    expect(storageItem.setValue).not.toHaveBeenCalled()
  })
})
