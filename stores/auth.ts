import type { User } from 'firebase/auth/web-extension'
import { signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithCredential } from 'firebase/auth/web-extension'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { browser } from 'wxt/browser'
import { storage } from 'wxt/utils/storage'
import { auth } from '../firebase.config'
import { hasKeyVerification, saveKeyVerification, verifyKey } from '../services/firestore'
import { deriveKey } from '../utils/crypto'

const passphraseStorage = storage.defineItem<string | null>('local:passphrase', { fallback: null })

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const cryptoKey = shallowRef<CryptoKey | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const passphraseStatus = ref<'loading' | 'needed' | 'ready'>('loading')

  const isAuthenticated = computed(() => user.value !== null)
  const uid = computed(() => user.value?.uid ?? null)

  let _resolveAuthReady!: () => void
  const authReady = new Promise<void>(resolve => (_resolveAuthReady = resolve))

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      user.value = firebaseUser
      const cached = await passphraseStorage.getValue()
      if (cached) {
        await _applyPassphrase(cached, firebaseUser.uid)
      }
      else {
        passphraseStatus.value = 'needed'
      }
    }
    else {
      cryptoKey.value = null
      user.value = null
      passphraseStatus.value = 'loading'
    }
    _resolveAuthReady()
  })

  async function _applyPassphrase(passphrase: string, targetUid: string): Promise<boolean> {
    const derived = await deriveKey(passphrase, targetUid)
    const exists = await hasKeyVerification(targetUid)
    if (!exists) {
      await saveKeyVerification(targetUid, derived)
    }
    else {
      const valid = await verifyKey(targetUid, derived)
      if (!valid)
        return false
    }
    cryptoKey.value = derived
    passphraseStatus.value = 'ready'
    return true
  }

  async function setPassphrase(passphrase: string): Promise<boolean> {
    if (!user.value)
      return false
    const ok = await _applyPassphrase(passphrase, user.value.uid)
    if (ok) {
      await passphraseStorage.setValue(passphrase)
    }
    return ok
  }

  async function signInWithGoogle() {
    isLoading.value = true
    error.value = null
    try {
      const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID as string
      const redirectUrl = browser.identity.getRedirectURL()
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('response_type', 'token')
      authUrl.searchParams.set('redirect_uri', redirectUrl)
      authUrl.searchParams.set('scope', 'openid email profile')
      authUrl.searchParams.set('prompt', 'select_account')

      const responseUrl = await browser.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true })

      if (!responseUrl)
        throw new Error('Failed to get auth token')

      const hash = new URL(responseUrl).hash.slice(1)
      const token = new URLSearchParams(hash).get('access_token')

      if (!token)
        throw new Error('No access_token in response')

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

  async function resetPassphraseState(): Promise<void> {
    await passphraseStorage.setValue(null)
    cryptoKey.value = null
    passphraseStatus.value = 'needed'
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
      await passphraseStorage.setValue(null)
      cryptoKey.value = null
      user.value = null
      passphraseStatus.value = 'loading'
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
    passphraseStatus,
    authReady,
    signInWithGoogle,
    signOut,
    setPassphrase,
    resetPassphraseState,
  }
})
