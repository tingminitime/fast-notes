# Phase 6 — 雲端同步（Firestore）

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)
- [Phase 5 — 本地持久化與訪客模式](./phase-5-local-persistence.md)

**輔助流程圖**
- [未登入與已登入狀態切換流程圖](./auth-state-sync-notes-flow.mmd)

本階段將已登入使用者的筆記串接 Cloud Firestore，實現自動雲端同步與跨裝置即時更新。訪客筆記（`browser.storage.local`）與登入筆記（Firestore）維持獨立的儲存空間，不做 merge。離線時本地變更將被佇列，待連線恢復後自動補送。

> **注意**：Phase 7（端到端加密）完成後，寫入 Firestore 的資料將改為密文。本階段先以明文同步驗證流程正確性。

---

## 涵蓋使用者故事

- **US-11** — 筆記自動同步至雲端

---

## EARS 需求規格

### US-11 筆記自動同步至雲端

```
1. WHILE the user is signed in,
   THE EXTENSION SHALL automatically synchronise note changes to Cloud Firestore
   within 3 seconds of each save operation.

2. WHILE the user is signed in on multiple devices,
   THE EXTENSION SHALL reflect note changes made on one device on all other active sessions in real time.

3. IF the network connection is unavailable during a save,
   THEN THE EXTENSION SHALL queue the change locally and synchronise it automatically
   once connectivity is restored.

4. WHEN the user signs in,
   THE EXTENSION SHALL load notes exclusively from Cloud Firestore
   (guest notes in browser.storage.local are not merged or shown).

5. WHEN the user signs out,
   THE EXTENSION SHALL stop the Firestore listener and restore guest notes
   from browser.storage.local.
```

---

## 實作範圍

### 兩個獨立儲存空間

```
訪客模式：  notes.value  ←→  browser.storage.local (useStorageSync, active)
已登入：    notes.value  ←→  Cloud Firestore (useFirestoreSync, active)
                              browser.storage.local (useStorageSync, paused)
```

登入 → `useStorageSync.pause()` → 啟動 Firestore `onSnapshot` → notes.value 由 Firestore 驅動
登出 → 停止 `onSnapshot` → `useStorageSync.resume()` + `hydrate()` → notes.value 由 local storage 恢復

### Firestore 資料結構

```
users/{uid}/notes/{noteId}
  - id: string
  - title: string
  - text: string          // Phase 7 後改為 ciphertext
  - createdAt: number
  - categoryId: string | null

users/{uid}/categories/{categoryId}
  - id: string
  - name: string
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `firebase.config.ts` | 加入 Firestore 實例初始化 |
| `services/firestore.ts` | Firestore CRUD 操作封裝（saveNote / deleteNote / saveCategory / deleteCategory / subscribeNotes / subscribeCategories） |
| `services/firestore.test.ts` | 單元測試（mock Firestore SDK）(TDD) |
| `stores/notes.ts` | 整合 Firestore service；登入後啟動 `subscribeNotes`；登出後停止訂閱並 hydrate |
| `stores/notes.test.ts` | 補充 Firestore 同步相關測試案例 |
| `stores/categories.ts` | 整合 Firestore service；登入後啟動 `subscribeCategories`；登出後停止訂閱並 hydrate |
| `stores/categories.test.ts` | 補充 Firestore 同步相關測試案例 |

---

## Tasks

### Firebase / Firestore 設定

- [x] 在 Firebase Console 啟用 Cloud Firestore（Production mode）
- [x] 設定 Firestore Security Rules（僅允許已認證使用者讀寫自己的資料）：
  ```
  match /users/{uid}/notes/{noteId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  match /users/{uid}/categories/{categoryId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```
- [x] 更新 `firebase.config.ts`，加入 `getFirestore()` 初始化

### Firestore Service（`services/firestore.ts`）

- [x] 建立 `services/firestore.test.ts`，撰寫失敗測試（TDD red，mock `firebase/firestore`）
  - [x] 測試 `saveNote` — 呼叫 `setDoc` 並帶正確路徑與資料
  - [x] 測試 `deleteNote` — 呼叫 `deleteDoc` 並帶正確路徑
  - [x] 測試 `saveCategory` / `deleteCategory` — 同上
  - [x] 測試 `subscribeNotes` — 呼叫 `onSnapshot`，回呼觸發時更新資料
  - [x] 測試 `subscribeCategories` — 同上
- [x] 實作 `services/firestore.ts`，使所有測試通過（TDD green）
  - [x] `saveNote(uid, note)` — `setDoc` with merge
  - [x] `deleteNote(uid, noteId)` — `deleteDoc`
  - [x] `saveCategory(uid, category)` — `setDoc` with merge
  - [x] `deleteCategory(uid, categoryId)` — `deleteDoc`
  - [x] `subscribeNotes(uid, callback)` — `onSnapshot`，回傳 unsubscribe fn
  - [x] `subscribeCategories(uid, callback)` — `onSnapshot`，回傳 unsubscribe fn

### 筆記 Store 整合（`stores/notes.ts`）

- [x] 補充 `stores/notes.test.ts` 同步相關測試
  - [x] 測試登入後自動觸發 `subscribeNotes`，notes 由 snapshot 填入
  - [x] 測試登出後呼叫 unsubscribe，並從 browser.storage.local 恢復訪客筆記
  - [x] 測試 `addNote` / `updateNote` / `deleteNote` 呼叫對應 Firestore service（已登入時）
- [x] 更新 `stores/notes.ts`
  - [x] 登入時（`isAuthenticated` true）：啟動 `subscribeNotes`，以 snapshot 更新 `notes`
  - [x] 登出時（`isAuthenticated` false）：停止訂閱；`useStorageSync.resume()` + `hydrate()`（已由 Phase 5 的 watcher 處理後半段，此處補充 Firestore unsubscribe）
  - [x] `addNote` / `updateNote` / `deleteNote`：已登入時呼叫對應 Firestore service

### 分類 Store 整合（`stores/categories.ts`）

- [x] 補充 `stores/categories.test.ts` 同步相關測試（與 notes 同結構）
- [x] 更新 `stores/categories.ts`（與 notes 同模式）

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證。

- [ ] **基本同步**：登入後新增一條筆記，確認在 Firebase Console → Firestore 中出現對應文件
- [ ] **即時更新**：在同一個 Google 帳號的兩個瀏覽器視窗（或裝置）登入，在其中一個新增 / 編輯 / 刪除筆記，確認另一個視窗在 3 秒內反映變更
- [ ] **刪除同步**：刪除一條筆記，確認 Firestore 中的文件也被移除
- [ ] **離線佇列**：關閉網路連線，新增一條筆記，確認本地顯示正常；恢復網路後，確認筆記出現在 Firestore
- [ ] **登入空間切換**：在訪客模式下新增筆記，登入後確認筆記清單顯示 Firestore 資料（不含訪客筆記）
- [ ] **登出恢復訪客筆記**：登出後，確認側邊欄顯示訪客模式下建立的筆記（從 browser.storage.local 恢復）
- [ ] **重新登入載入**：重新登入後，確認 Firestore 中的筆記自動載入至側邊欄
