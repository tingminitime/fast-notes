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

// 儲存或更新指定使用者的單筆筆記至 Firestore
export function saveNote(uid: string, note: Note): Promise<void> {
  return setDoc(
    doc(db, 'users', uid, 'notes', note.id),
    note,
    { merge: true },
  )
}

// 從 Firestore 刪除指定使用者的單筆筆記
export function deleteNote(uid: string, noteId: string): Promise<void> {
  return deleteDoc(doc(db, 'users', uid, 'notes', noteId))
}

// 儲存或更新指定使用者的單筆分類至 Firestore
export function saveCategory(uid: string, category: Category): Promise<void> {
  return setDoc(
    doc(db, 'users', uid, 'categories', category.id),
    category,
    { merge: true },
  )
}

// 從 Firestore 刪除指定使用者的單筆分類
export function deleteCategory(uid: string, categoryId: string): Promise<void> {
  return deleteDoc(
    doc(db, 'users', uid, 'categories', categoryId),
  )
}

// 訂閱指定使用者的筆記集合，資料變動時觸發回呼；回傳取消訂閱函式
export function subscribeNotes(
  uid: string,
  callback: (notes: Note[]) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'notes'),
    (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as Note))
    },
  )
}

// 訂閱指定使用者的分類集合，資料變動時觸發回呼；回傳取消訂閱函式
export function subscribeCategories(
  uid: string,
  callback: (categories: Category[]) => void,
): () => void {
  return onSnapshot(collection(db, 'users', uid, 'categories'), (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as Category))
  })
}
