import type { Category } from '../stores/categories'
import type { Note } from '../stores/notes'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase.config'

export function saveNote(uid: string, note: Note): Promise<void> {
  return setDoc(doc(db, 'users', uid, 'notes', note.id), note, { merge: true })
}

export function deleteNote(uid: string, noteId: string): Promise<void> {
  return deleteDoc(doc(db, 'users', uid, 'notes', noteId))
}

export function saveCategory(uid: string, category: Category): Promise<void> {
  return setDoc(doc(db, 'users', uid, 'categories', category.id), category, { merge: true })
}

export function deleteCategory(uid: string, categoryId: string): Promise<void> {
  return deleteDoc(doc(db, 'users', uid, 'categories', categoryId))
}

export function subscribeNotes(uid: string, callback: (notes: Note[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'notes'), (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as Note))
  })
}

export function subscribeCategories(uid: string, callback: (categories: Category[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'categories'), (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as Category))
  })
}
