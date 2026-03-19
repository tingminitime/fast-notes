import type { User } from 'firebase/auth/web-extension'
import { signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithCredential } from 'firebase/auth/web-extension'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { browser } from 'wxt/browser'
import { auth } from '../firebase.config'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const uid = computed(() => user.value?.uid ?? null)

  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
  })

  async function signInWithGoogle() {
    isLoading.value = true
    error.value = null
    try {
      const { token } = await browser.identity.getAuthToken({ interactive: true })
      if (!token)
        throw new Error('Failed to get auth token')
      const credential = GoogleAuthProvider.credential(null, token)
      const result = await signInWithCredential(auth, credential)
      user.value = result.user
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
      user.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    uid,
    signInWithGoogle,
    signOut,
  }
})
