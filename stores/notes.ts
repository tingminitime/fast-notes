import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useStorageSync } from '@/composables/useStorageSync'
import {
  deleteNote as firestoreDeleteNote,
  saveNote,
  subscribeNotes,
} from '../services/firestore'
import { useAuthStore } from './auth'

export interface Note {
  id: string
  title: string
  text: string
  createdAt: number
  categoryId: string | null
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const { hydrate, pause, resume } = useStorageSync('local:notes', notes, [])

  const authStore = useAuthStore()
  let _unsubscribeNotes: (() => void) | null = null

  watch(() => authStore.isAuthenticated, async (isAuth) => {
    if (isAuth) {
      pause()
      notes.value = []
      if (authStore.uid) {
        _unsubscribeNotes = subscribeNotes(authStore.uid, (firestoreNotes) => {
          notes.value = firestoreNotes
        })
      }
    }
    else {
      _unsubscribeNotes?.()
      _unsubscribeNotes = null
      resume()
      await hydrate()
    }
  })

  const sortedNotes = computed(() => {
    const arr = Array.isArray(notes.value) ? notes.value : []
    return arr.toSorted((a, b) => b.createdAt - a.createdAt)
  })

  const notesCount = computed(() => notes.value.length)

  let _lastTs = 0
  function addNote(text: string, categoryId: string | null = null, title: string = ''): boolean {
    const trimmed = text.trim()
    if (!trimmed)
      return false
    const now = Date.now()
    _lastTs = now > _lastTs ? now : _lastTs + 1
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: title.trim(),
      text: trimmed,
      createdAt: _lastTs,
      categoryId,
    }
    if (authStore.isAuthenticated && authStore.uid) {
      saveNote(authStore.uid, newNote)
    }
    else {
      notes.value.push(newNote)
    }
    return true
  }

  function updateNote(id: string, text: string, categoryId?: string | null, title?: string): boolean {
    const trimmed = text.trim()
    if (!trimmed)
      return false
    const note = notes.value.find(n => n.id === id)
    if (!note)
      return false
    if (authStore.isAuthenticated && authStore.uid) {
      const updated: Note = {
        ...note,
        text: trimmed,
        categoryId: categoryId !== undefined ? categoryId : note.categoryId,
        title: title !== undefined ? title.trim() : note.title,
      }
      saveNote(authStore.uid, updated)
    }
    else {
      note.text = trimmed
      if (categoryId !== undefined)
        note.categoryId = categoryId
      if (title !== undefined)
        note.title = title.trim()
    }
    return true
  }

  function deleteNote(id: string): void {
    if (authStore.isAuthenticated && authStore.uid) {
      firestoreDeleteNote(authStore.uid, id)
    }
    else {
      const idx = notes.value.findIndex(n => n.id === id)
      if (idx !== -1)
        notes.value.splice(idx, 1)
    }
  }

  function notesByCategory(categoryId: string | null): Note[] {
    return notes.value.filter(n => n.categoryId === categoryId)
  }

  function clearCategoryFromNotes(categoryId: string): void {
    for (const note of notes.value) {
      if (note.categoryId === categoryId)
        note.categoryId = null
    }
  }

  return {
    notes,
    sortedNotes,
    notesCount,
    addNote,
    updateNote,
    deleteNote,
    notesByCategory,
    clearCategoryFromNotes,
    hydrate,
  }
})
