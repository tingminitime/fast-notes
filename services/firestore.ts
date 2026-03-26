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
import { decrypt, encrypt } from '../utils/crypto'

interface EncryptedNote {
  id: string
  createdAt: number
  iv: string
  ciphertext: string
}

interface EncryptedCategory {
  id: string
  iv: string
  ciphertext: string
}

// 儲存或更新指定使用者的單筆筆記至 Firestore（加密後）
export async function saveNote(
  uid: string,
  note: Note,
  cryptoKey: CryptoKey,
): Promise<void> {
  const { iv, ciphertext } = await encrypt(
    cryptoKey,
    JSON.stringify({ title: note.title, text: note.text, categoryId: note.categoryId }),
  )
  return setDoc(
    doc(db, 'users', uid, 'notes', note.id),
    { id: note.id, createdAt: note.createdAt, iv, ciphertext } satisfies EncryptedNote,
  )
}

// 從 Firestore 刪除指定使用者的單筆筆記
export function deleteNote(uid: string, noteId: string): Promise<void> {
  return deleteDoc(doc(db, 'users', uid, 'notes', noteId))
}

// 儲存或更新指定使用者的單筆分類至 Firestore（加密後）
export async function saveCategory(uid: string, category: Category, cryptoKey: CryptoKey): Promise<void> {
  const { iv, ciphertext } = await encrypt(cryptoKey, JSON.stringify({ name: category.name }))
  return setDoc(
    doc(db, 'users', uid, 'categories', category.id),
    { id: category.id, iv, ciphertext } satisfies EncryptedCategory,
  )
}

// 從 Firestore 刪除指定使用者的單筆分類
export function deleteCategory(uid: string, categoryId: string): Promise<void> {
  return deleteDoc(
    doc(db, 'users', uid, 'categories', categoryId),
  )
}

// 訂閱指定使用者的筆記集合，解密後觸發回呼；回傳取消訂閱函式
export function subscribeNotes(
  uid: string,
  cryptoKey: CryptoKey,
  callback: (notes: Note[]) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'notes'),
    async (snapshot) => {
      const notes = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data() as EncryptedNote
          try {
            const plaintext = await decrypt(cryptoKey, data.iv, data.ciphertext)
            const payload = JSON.parse(plaintext) as { title: string, text: string, categoryId: string | null }
            return { id: data.id, createdAt: data.createdAt, ...payload } as Note
          }
          catch {
            return { id: data.id, createdAt: data.createdAt, title: '[Decryption failed]', text: '', categoryId: null } as Note
          }
        }),
      )
      callback(notes)
    },
  )
}

// 訂閱指定使用者的分類集合，解密後觸發回呼；回傳取消訂閱函式
export function subscribeCategories(
  uid: string,
  cryptoKey: CryptoKey,
  callback: (categories: Category[]) => void,
): () => void {
  return onSnapshot(collection(db, 'users', uid, 'categories'), async (snapshot) => {
    const categories = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data() as EncryptedCategory
        try {
          const plaintext = await decrypt(cryptoKey, data.iv, data.ciphertext)
          const payload = JSON.parse(plaintext) as { name: string }
          return { id: data.id, name: payload.name } as Category
        }
        catch {
          return null
        }
      }),
    )
    callback(categories.filter((c): c is Category => c !== null))
  })
}
