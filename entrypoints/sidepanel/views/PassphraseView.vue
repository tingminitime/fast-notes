<script lang="ts" setup>
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { deleteAllUserData, hasKeyVerification } from '@/services/firestore'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const isSetup = ref(false)
const passphrase = ref('')
const confirm = ref('')
const error = ref('')
const isLoading = ref(false)

const showPassphrase = ref(false)
const showConfirm = ref(false)

// Post-setup: copy passphrase dialog
const showCopyDialog = ref(false)
const showPassphraseInDialog = ref(false)
const copied = ref(false)

// Reset flow
const showResetConfirm = ref(false)
const resetDone = ref(false)

onMounted(async () => {
  if (auth.uid) {
    try {
      isSetup.value = !(await hasKeyVerification(auth.uid))
    }
    catch {
      isSetup.value = true
    }
  }
})

async function submit() {
  error.value = ''
  if (isSetup.value && passphrase.value !== confirm.value) {
    error.value = 'Passphrases do not match'
    return
  }
  if (!passphrase.value) {
    error.value = 'Please enter a passphrase'
    return
  }
  isLoading.value = true
  try {
    const ok = await auth.setPassphrase(passphrase.value)
    if (!ok) {
      error.value = 'Incorrect passphrase, please try again'
      return
    }
    if (isSetup.value) {
      showCopyDialog.value = true
    }
    else {
      router.push({ name: 'notes' })
    }
  }
  finally {
    isLoading.value = false
  }
}

async function copyPassphrase() {
  await navigator.clipboard.writeText(passphrase.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function closeCopyDialog() {
  showCopyDialog.value = false
  router.push({ name: 'notes' })
}

async function handleReset() {
  if (!auth.uid)
    return
  try {
    await deleteAllUserData(auth.uid)
    await auth.resetPassphraseState()
    passphrase.value = ''
    confirm.value = ''
    error.value = ''
    isSetup.value = true
    resetDone.value = true
  }
  finally {
    showResetConfirm.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-6 p-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-brand-900">
        Fast Notes
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ isSetup ? 'Set up your passphrase' : 'Enter your passphrase to unlock' }}
      </p>
    </div>

    <div
      v-if="resetDone"
      class="
        w-full max-w-xs rounded-md border border-amber-200 bg-amber-50 p-3
        text-xs text-amber-700
      "
    >
      All your data has been deleted. Please create a new passphrase to continue.
    </div>
    <div
      v-else-if="isSetup"
      class="
        w-full max-w-xs rounded-md border border-blue-200 bg-blue-50 p-3 text-xs
        text-blue-700
      "
    >
      Your notes are end-to-end encrypted. Your passphrase stays on your device and is never sent to any server.
    </div>

    <form
      class="flex w-full max-w-xs flex-col gap-3"
      @submit.prevent="submit"
    >
      <div class="relative">
        <input
          v-model="passphrase"
          :type="showPassphrase ? 'text' : 'password'"
          :placeholder="isSetup ? 'Set passphrase' : 'Enter passphrase'"
          autocomplete="off"
          class="
            w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 text-sm
            focus:border-brand-500 focus:outline-none
          "
        >
        <button
          type="button"
          class="
            absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
            hover:text-gray-600
          "
          @click="showPassphrase = !showPassphrase"
        >
          <span
            :class="showPassphrase ? 'icon-[mdi--eye-off]' : 'icon-[mdi--eye]'"
            class="block size-4"
            aria-hidden="true"
          ></span>
        </button>
      </div>

      <div
        v-if="isSetup"
        class="relative"
      >
        <input
          v-model="confirm"
          :type="showConfirm ? 'text' : 'password'"
          placeholder="Confirm passphrase"
          autocomplete="off"
          class="
            w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 text-sm
            focus:border-brand-500 focus:outline-none
          "
        >
        <button
          type="button"
          class="
            absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
            hover:text-gray-600
          "
          @click="showConfirm = !showConfirm"
        >
          <span
            :class="showConfirm ? 'icon-[mdi--eye-off]' : 'icon-[mdi--eye]'"
            class="block size-4"
            aria-hidden="true"
          ></span>
        </button>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="
          rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white
          hover:bg-brand-700
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        <span
          v-if="isLoading"
          class="
            mr-1 icon-[mdi--loading] inline-block size-4 animate-spin
            align-middle
          "
          aria-hidden="true"
        ></span>
        {{ isSetup ? 'Create passphrase' : 'Unlock' }}
      </button>
    </form>

    <p
      v-if="error"
      role="alert"
      class="
        max-w-xs rounded-md border border-red-200 bg-red-50 px-4 py-3
        text-center text-sm text-red-600
      "
    >
      {{ error }}
    </p>

    <p class="max-w-xs text-center text-xs text-gray-400">
      If you forget your passphrase, your encrypted data cannot be recovered.
    </p>

    <button
      v-if="!isSetup"
      class="text-xs text-red-400 underline-offset-2 hover:underline"
      @click="showResetConfirm = true"
    >
      Forgot passphrase? Reset and delete all data
    </button>
  </div>

  <!-- Copy passphrase dialog (shown after first-time setup) -->
  <DialogRoot :open="showCopyDialog">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/40" />
      <DialogContent
        class="
          fixed top-1/2 left-1/2 z-50 w-72 -translate-1/2 rounded-lg bg-white
          p-5 shadow-lg
        "
      >
        <DialogTitle class="mb-1 text-sm font-semibold text-gray-800">
          Save your passphrase
        </DialogTitle>
        <DialogDescription class="mb-4 text-xs text-gray-500">
          Copy and store it somewhere safe. This is the only time we'll show it to you.
        </DialogDescription>

        <div class="relative mb-3">
          <input
            :type="showPassphraseInDialog ? 'text' : 'password'"
            :value="passphrase"
            readonly
            class="
              w-full rounded-md border border-gray-200 bg-gray-50 py-2 pr-10
              pl-3 text-sm text-gray-700
            "
          >
          <button
            type="button"
            class="
              absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
              hover:text-gray-600
            "
            @click="showPassphraseInDialog = !showPassphraseInDialog"
          >
            <span
              :class="
                showPassphraseInDialog ? 'icon-[mdi--eye-off]' : `
                  icon-[mdi--eye]
                `
              "
              class="block size-4"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <button
          type="button"
          class="
            mb-3 flex w-full items-center justify-center gap-1.5 rounded-md
            border border-gray-300 px-3 py-1.5 text-sm text-gray-700
            hover:bg-gray-50
          "
          @click="copyPassphrase"
        >
          <span
            :class="copied ? 'icon-[mdi--check]' : 'icon-[mdi--content-copy]'"
            class="size-4"
            aria-hidden="true"
          ></span>
          {{ copied ? 'Copied!' : 'Copy to clipboard' }}
        </button>

        <DialogClose as-child>
          <button
            type="button"
            class="
              w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium
              text-white
              hover:bg-brand-700
            "
            @click="closeCopyDialog"
          >
            Continue to notes
          </button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <!-- Reset confirm dialog -->
  <ConfirmDialog
    v-if="showResetConfirm"
    :open="showResetConfirm"
    title="Delete all data?"
    message="This will permanently delete all your notes, categories, and passphrase. This action cannot be undone."
    confirm-text="DELETE"
    @confirm="handleReset"
    @cancel="showResetConfirm = false"
  />
</template>
