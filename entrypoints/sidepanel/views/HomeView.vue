<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import CategoryManager from '@/components/CategoryManager.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import NoteList from '@/components/NoteList.vue'
import { useNotesStore } from '@/stores/notes'

const store = useNotesStore()

type Mode = 'list' | 'new' | 'edit' | 'categories'
const mode = ref<Mode>('list')
const editingId = ref<string | null>(null)
const activeCategory = ref<string | null>(null)

function editingNote() {
  if (!editingId.value)
    return undefined
  return store.notes.find(n => n.id === editingId.value)
}

function startEdit(id: string) {
  editingId.value = id
  mode.value = 'edit'
}

function saveNote(text: string, categoryId: string | null, title: string) {
  if (mode.value === 'edit' && editingId.value) {
    store.updateNote(editingId.value, text, categoryId, title)
  }
  else {
    store.addNote(text, categoryId, title)
  }
  mode.value = 'list'
  editingId.value = null
}

function cancelEditor() {
  mode.value = 'list'
  editingId.value = null
}

function deleteNote(id: string) {
  store.deleteNote(id)
}

const filteredNotes = computed(() => {
  const sorted = store.sortedNotes
  if (activeCategory.value === null)
    return sorted
  return sorted.filter(n => n.categoryId === activeCategory.value)
})

// Arrow
const containerRef = useTemplateRef<HTMLDivElement>('container')
const addBtnRef = useTemplateRef<HTMLButtonElement>('add-new-note-btn')
const noteListRef = useTemplateRef<InstanceType<typeof NoteList>>('note-list')

interface ArrowCoords { x1: number, y1: number, x2: number, y2: number }
const arrow = ref<ArrowCoords | null>(null)

const showArrow = computed(() => mode.value === 'list' && filteredNotes.value.length === 0)

function computeArrow() {
  const container = containerRef.value
  const btn = addBtnRef.value
  const emptyEl = noteListRef.value?.emptyStateEl
  if (!container || !btn || !emptyEl) {
    arrow.value = null
    return
  }
  const cRect = container.getBoundingClientRect()
  const bRect = btn.getBoundingClientRect()
  const eRect = emptyEl.getBoundingClientRect()
  arrow.value = {
    x1: eRect.left - cRect.left + eRect.width / 2,
    y1: eRect.top - cRect.top,
    x2: bRect.left - cRect.left + bRect.width / 2,
    y2: bRect.top - cRect.top + bRect.height + 10,
  }
}

watch(showArrow, async (val) => {
  if (val) {
    await nextTick()
    computeArrow()
  }
  else {
    arrow.value = null
  }
}, { immediate: true })

function onResize() {
  if (showArrow.value)
    computeArrow()
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div
    ref="container"
    class="relative flex h-full flex-col gap-3 p-3"
  >
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-brand-900">
        Fast Notes
      </h1>
      <div class="flex gap-2">
        <button
          v-if="mode === 'list'"
          ref="add-new-note-btn"
          class="
            rounded-sm bg-brand-500 px-2 py-1 text-sm text-white
            hover:bg-brand-600
          "
          @click="mode = 'new'"
        >
          <span
            class="icon-[mdi--plus] block size-6"
            aria-label="Add new note"
          ></span>
        </button>
        <button
          v-if="mode === 'list'"
          class="
            rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600
            hover:bg-gray-100
          "
          title="Manage categories"
          @click="mode = 'categories'"
        >
          Categories
        </button>
        <button
          v-if="mode === 'categories'"
          class="
            rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600
            hover:bg-gray-100
          "
          @click="mode = 'list'"
        >
          ← Back
        </button>
      </div>
    </div>

    <CategoryManager v-if="mode === 'categories'" />

    <template v-if="mode === 'list'">
      <CategoryFilter v-model="activeCategory" />

      <NoteList
        ref="note-list"
        :notes="filteredNotes"
        @edit="startEdit"
        @delete="deleteNote"
      />
    </template>

    <NoteEditor
      v-if="mode === 'new' || mode === 'edit'"
      :initial-title="editingNote()?.title"
      :initial-text="editingNote()?.text"
      :initial-category-id="editingNote()?.categoryId"
      :is-editing="mode === 'edit'"
      @save="saveNote"
      @cancel="cancelEditor"
    />

    <!-- SVG arrow: empty-state → add-new-note-btn -->
    <svg
      v-if="arrow"
      class="pointer-events-none absolute inset-0 size-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path
            d="M0,0 L0,8 L8,4 Z"
            fill="#9ca3af"
          />
        </marker>
      </defs>
      <path
        :d="`M${arrow.x1},${arrow.y1} Q${arrow.x2},${arrow.y1} ${arrow.x2},${arrow.y2}`"
        fill="none"
        stroke="#9ca3af"
        stroke-width="1.5"
        stroke-dasharray="5,4"
        marker-end="url(#arrowhead)"
      />
    </svg>
  </div>
</template>
