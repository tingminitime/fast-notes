<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useCategoriesStore } from '../stores/categories'

const props = defineProps<{
  initialText?: string
  initialCategoryId?: string | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  save: [text: string, categoryId: string | null]
  cancel: []
}>()

const categoriesStore = useCategoriesStore()

const text = ref(props.initialText ?? '')
const selectedCategoryId = ref<string | null>(props.initialCategoryId ?? null)
const error = ref('')

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
  emit('save', trimmed, selectedCategoryId.value)
  if (!props.isEditing) {
    text.value = ''
    selectedCategoryId.value = null
  }
}

function cancel() {
  text.value = props.initialText ?? ''
  selectedCategoryId.value = props.initialCategoryId ?? null
  error.value = ''
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <textarea
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

    <select
      v-model="selectedCategoryId"
      class="
        rounded-sm border border-gray-300 px-2 py-1 text-sm
        focus:ring-2 focus:ring-blue-400 focus:outline-none
      "
    >
      <option :value="null">
        Uncategorized
      </option>
      <option
        v-for="cat in categoriesStore.categories"
        :key="cat.id"
        :value="cat.id"
      >
        {{ cat.name }}
      </option>
    </select>

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
