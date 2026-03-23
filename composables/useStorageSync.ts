import type { Ref } from 'vue'
import type { StorageItemKey } from 'wxt/utils/storage'
import { toRaw, watch } from 'vue'
import { storage } from 'wxt/utils/storage'

function normalize<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined)
    return fallback
  if (Array.isArray(fallback) && !Array.isArray(val))
    return fallback
  return val as T
}

export function useStorageSync<T>(
  key: StorageItemKey,
  reactiveRef: Ref<T>,
  fallback: T,
) {
  const storageItem = storage.defineItem<T>(key, { fallback })

  let _skipWatch = false
  let _paused = false

  function pause() {
    _paused = true
  }

  function resume() {
    _paused = false
  }

  async function hydrate() {
    const stored = await storageItem.getValue()
    _skipWatch = true
    reactiveRef.value = normalize(stored, fallback)
    _skipWatch = false
  }

  watch(reactiveRef, (newVal) => {
    if (!_skipWatch && !_paused)
      storageItem.setValue(toRaw(newVal)).catch(console.error)
  }, { deep: true, flush: 'sync' })

  storageItem.watch((newVal) => {
    if (_paused)
      return
    const val = normalize(newVal, fallback)
    if (JSON.stringify(val) !== JSON.stringify(reactiveRef.value)) {
      _skipWatch = true
      reactiveRef.value = val
      _skipWatch = false
    }
  })

  return { hydrate, storageItem, pause, resume }
}
