import type { User } from 'firebase/auth/web-extension'
import { signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithCredential } from 'firebase/auth/web-extension'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { browser } from 'wxt/browser'
import { auth } from '../firebase.config'
import { deriveKey } from '../utils/crypto'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const cryptoKey = shallowRef<CryptoKey | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const uid = computed(() => user.value?.uid ?? null)

  let _resolveAuthReady!: () => void
  const authReady = new Promise<void>(resolve => (_resolveAuthReady = resolve))

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      cryptoKey.value = await deriveKey(firebaseUser.uid)
      user.value = firebaseUser
    }
    else {
      cryptoKey.value = null
      user.value = null
    }
    _resolveAuthReady()
  })

  async function signInWithGoogle() {
    isLoading.value = true
    error.value = null
    try {
      const { token } = await browser.identity.getAuthToken({ interactive: true })
      if (!token)
        throw new Error('Failed to get auth token')
      const credential = GoogleAuthProvider.credential(null, token)
      await signInWithCredential(auth, credential)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed'
    }
    finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
      cryptoKey.value = null
      user.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
    }
  }

  return {
    user,
    cryptoKey,
    isLoading,
    error,
    isAuthenticated,
    uid,
    authReady,
    signInWithGoogle,
    signOut,
  }
})
