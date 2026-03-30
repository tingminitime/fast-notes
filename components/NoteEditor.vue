<script lang="ts" setup>
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
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
import { onUnmounted, ref, watch } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import { toPlainText } from '../utils/noteContent'

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
const editorHtml = ref(props.initialText ?? '')
const selectedCategoryId = ref<string | null>(props.initialCategoryId ?? null)
const error = ref('')

const editor = useEditor({
  content: editorHtml.value,
  extensions: [StarterKit],
  onUpdate({ editor: e }) {
    editorHtml.value = e.getHTML()
  },
  editorProps: {
    handleKeyDown(_view, event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        submit()
        return true
      }
      return false
    },
  },
})

onUnmounted(() => {
  editor.value?.destroy()
})

watch(() => props.initialTitle, (val) => {
  title.value = val ?? ''
})

watch(() => props.initialText, (val) => {
  editorHtml.value = val ?? ''
  editor.value?.commands.setContent(val ?? '')
  error.value = ''
})

watch(() => props.initialCategoryId, (val) => {
  selectedCategoryId.value = val ?? null
})

function submit() {
  const plain = toPlainText(editorHtml.value).trim()
  if (!plain) {
    error.value = 'Note cannot be empty.'
    return
  }
  error.value = ''
  emit('save', editorHtml.value, selectedCategoryId.value, title.value.trim())
  if (!props.isEditing) {
    title.value = ''
    editorHtml.value = ''
    selectedCategoryId.value = null
    editor.value?.commands.setContent('')
  }
}

function cancel() {
  title.value = props.initialTitle ?? ''
  editorHtml.value = props.initialText ?? ''
  editor.value?.commands.setContent(props.initialText ?? '')
  selectedCategoryId.value = props.initialCategoryId ?? null
  error.value = ''
  emit('cancel')
}

defineExpose({ editorHtml })
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
        for="note-editor"
        class="text-xs font-medium text-gray-600"
      >
        Note
      </Label>
      <div
        id="note-editor"
        class="
          note-editor-wrapper min-h-24 w-full rounded-sm border border-gray-300
          p-2 text-sm
          focus-within:ring-2 focus-within:ring-blue-400
          focus-within:outline-none
        "
      >
        <EditorContent :editor="editor" />
      </div>
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
          rounded-sm bg-brand-500 px-3 py-1 text-sm text-white
          hover:bg-brand-600
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

<style scoped>
.note-editor-wrapper :deep(.ProseMirror) {
  outline: none;
  min-height: 5rem;
}
.note-editor-wrapper :deep(.ProseMirror p) {
  margin-bottom: 0.25rem;
}
.note-editor-wrapper :deep(.ProseMirror ul),
.note-editor-wrapper :deep(.ProseMirror ol) {
  padding-left: 1.25rem;
  list-style: revert;
}
.note-editor-wrapper :deep(.ProseMirror strong) {
  font-weight: 600;
}
.note-editor-wrapper :deep(.ProseMirror em) {
  font-style: italic;
}
.note-editor-wrapper :deep(.ProseMirror code) {
  font-family: monospace;
  background: #f3f4f6;
  border-radius: 2px;
  padding: 0 2px;
}
</style>
