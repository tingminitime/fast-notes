<script lang="ts" setup>
import {
  Label,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { ref, watch } from 'vue'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{
  initialTitle?: string
  initialText?: string
  initialCategoryId?: string | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  save: [text: string, categoryId: string | null, title: string]
  cancel: []
}>()

const categoriesStore = useCategoriesStore()

const title = ref(props.initialTitle ?? '')
const text = ref(props.initialText ?? '')
const selectedCategoryId = ref<string | null>(props.initialCategoryId ?? null)
const error = ref('')

watch(() => props.initialTitle, (val) => {
  title.value = val ?? ''
})

watch(() => props.initialText, (val) => {
  text.value = val ?? ''
  error.value = ''
})

watch(() => props.initialCategoryId, (val) => {
  selectedCategoryId.value = val ?? null
})

function submit() {
  const trimmed = text.value.trim()
  if (!trimmed) {
    error.value = 'Note cannot be empty.'
    return
  }
  error.value = ''
  emit('save', trimmed, selectedCategoryId.value, title.value.trim())
  if (!props.isEditing) {
    title.value = ''
    text.value = ''
    selectedCategoryId.value = null
  }
}

function cancel() {
  title.value = props.initialTitle ?? ''
  text.value = props.initialText ?? ''
  selectedCategoryId.value = props.initialCategoryId ?? null
  error.value = ''
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-1">
      <Label
        for="note-title"
        class="text-xs font-medium text-gray-600"
      >
        Title
      </Label>
      <input
        id="note-title"
        v-model="title"
        class="
          w-full rounded-sm border border-gray-300 px-2 py-1 text-sm
          focus:ring-2 focus:ring-blue-400 focus:outline-none
        "
        placeholder="Title (optional)"
      >
    </div>
    <div class="flex flex-col gap-1">
      <Label
        for="note-textarea"
        class="text-xs font-medium text-gray-600"
      >
        Note
      </Label>
      <textarea
        id="note-textarea"
        v-model="text"
        class="
          w-full resize-none rounded-sm border border-gray-300 p-2 text-sm
          focus:ring-2 focus:ring-blue-400 focus:outline-none
        "
        rows="4"
        placeholder="Write a note…"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
      ></textarea>
    </div>

    <div class="flex flex-col gap-1">
      <Label
        for="category-select"
        class="text-xs font-medium text-gray-600"
      >
        Category
      </Label>
      <SelectRoot
        v-model="selectedCategoryId"
      >
        <SelectTrigger
          id="category-select"
          class="
            flex w-full items-center justify-between rounded-sm border
            border-gray-300 px-2 py-1 text-sm
            focus:ring-2 focus:ring-blue-400 focus:outline-none
          "
        >
          <SelectValue placeholder="Uncategorized" />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            class="
              z-50 min-w-32 rounded-sm border border-gray-200 bg-white py-1
              shadow-md
            "
          >
            <SelectViewport>
              <SelectItem
                :value="null"
                class="
                  flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm
                  text-gray-700
                  hover:bg-gray-100
                "
              >
                <SelectItemIndicator class="text-blue-500">
                  ✓
                </SelectItemIndicator>
                <SelectItemText>Uncategorized</SelectItemText>
              </SelectItem>
              <SelectSeparator
                v-if="categoriesStore.categories.length"
                class="my-1 border-t border-gray-100"
              />
              <SelectItem
                v-for="cat in categoriesStore.categories"
                :key="cat.id"
                :value="cat.id"
                class="
                  flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm
                  text-gray-700
                  hover:bg-gray-100
                "
              >
                <SelectItemIndicator class="text-blue-500">
                  ✓
                </SelectItemIndicator>
                <SelectItemText>{{ cat.name }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>

    <p
      v-if="error"
      class="text-xs text-red-500"
    >
      {{ error }}
    </p>
    <div class="flex gap-2">
      <button
        class="
          rounded-sm bg-blue-500 px-3 py-1 text-sm text-white
          hover:bg-blue-600
        "
        @click="submit"
      >
        {{ isEditing ? 'Save' : 'Add Note' }}
      </button>
      <button
        class="
          rounded-sm border border-gray-300 px-3 py-1 text-sm
          hover:bg-gray-100
        "
        @click="cancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
