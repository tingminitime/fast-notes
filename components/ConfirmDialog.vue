<script lang="ts" setup>
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

withDefaults(defineProps<{
  open?: boolean
  title?: string
  message: string
}>(), {
  open: true,
  title: '',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <AlertDialogRoot :open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-black/40" />
      <AlertDialogContent
        class="
          fixed top-1/2 left-1/2 z-50 w-72 -translate-1/2 rounded-lg bg-white
          p-5 shadow-lg
        "
      >
        <AlertDialogTitle
          v-if="title"
          class="mb-1 text-sm font-semibold text-gray-800"
        >
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="mb-4 text-sm text-gray-700">
          {{ message }}
        </AlertDialogDescription>
        <div class="flex justify-end gap-2">
          <AlertDialogCancel
            data-testid="cancel-btn"
            class="
              rounded-sm border border-gray-300 px-3 py-1 text-sm
              hover:bg-gray-100
            "
            @click="emit('cancel')"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-btn"
            class="
              rounded-sm bg-red-500 px-3 py-1 text-sm text-white
              hover:bg-red-600
            "
            @click="emit('confirm')"
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
