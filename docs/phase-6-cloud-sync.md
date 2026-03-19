# Phase 6 — 雲端同步（Firestore）

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)
- [Phase 5 — 本地持久化與訪客模式](./phase-5-local-persistence.md)

本階段將 Phase 5 的本地持久化筆記 store 串接 Cloud Firestore，實現登入使用者的筆記自動雲端同步與跨裝置即時更新。離線時本地變更將被佇列，待連線恢復後自動補送。

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
```

---

## 實作範圍

### Firestore 資料結構

```
users/{uid}/notes/{noteId}
  - id: string
  - text: string          // Phase 7 後改為 ciphertext
  - createdAt: number
  - categoryId: string | null
  - updatedAt: number     // server timestamp
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `firebase.config.ts` | 加入 Firestore 實例初始化 |
| `services/firestore.ts` | Firestore CRUD 操作封裝（add / update / delete / subscribe） |
| `services/firestore.test.ts` | 單元測試（mock Firestore SDK）(TDD) |
| `stores/notes.ts` | 整合 Firestore service；登入後啟動 `onSnapshot` 監聽 |
| `stores/notes.test.ts` | 補充同步相關測試案例 |

---

## Tasks

### Firebase / Firestore 設定

- [ ] 在 Firebase Console 啟用 Cloud Firestore（Production mode）
- [ ] 設定 Firestore Security Rules（僅允許已認證使用者讀寫自己的資料）：
  ```
  match /users/{uid}/notes/{noteId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```
- [ ] 更新 `firebase.config.ts`，加入 `getFirestore()` 初始化

### Firestore Service（`services/firestore.ts`）

- [ ] 建立 `services/firestore.test.ts`，撰寫失敗測試（TDD red，mock `firebase/firestore`）
  - [ ] 測試 `saveNote` — 呼叫 `setDoc` 並帶正確路徑與資料
  - [ ] 測試 `deleteNote` — 呼叫 `deleteDoc` 並帶正確路徑
  - [ ] 測試 `subscribeNotes` — 呼叫 `onSnapshot` 並在回呼觸發時更新資料
- [ ] 實作 `services/firestore.ts`，使所有測試通過（TDD green）
  - [ ] `saveNote(uid, note)` — `setDoc` with merge
  - [ ] `deleteNote(uid, noteId)` — `deleteDoc`
  - [ ] `subscribeNotes(uid, callback)` — `onSnapshot`，回傳 unsubscribe fn

### 筆記 Store 整合（`stores/notes.ts`）

- [ ] 補充 `stores/notes.test.ts` 同步相關測試
  - [ ] 測試登入後自動觸發 `subscribeNotes`
  - [ ] 測試登出後呼叫 unsubscribe，清空本地 notes
- [ ] 更新 `stores/notes.ts`
  - [ ] 在 `addNote` / `updateNote` / `deleteNote` 中呼叫對應 Firestore service
  - [ ] 登入時（watch `authStore.isAuthenticated`）啟動 `subscribeNotes`，以 snapshot 更新本地 `notes`
  - [ ] 登出時停止訂閱並清空 `notes`

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證。

- [ ] **基本同步**：登入後新增一條筆記，確認在 Firebase Console → Firestore 中出現對應文件
- [ ] **即時更新**：在同一個 Google 帳號的兩個瀏覽器視窗（或裝置）登入，在其中一個新增 / 編輯 / 刪除筆記，確認另一個視窗在 3 秒內反映變更
- [ ] **刪除同步**：刪除一條筆記，確認 Firestore 中的文件也被移除
- [ ] **離線佇列**：關閉網路連線，新增一條筆記，確認本地顯示正常；恢復網路後，確認筆記出現在 Firestore
- [ ] **登出清空**：登出後，確認側邊欄筆記清單清空，Firestore 資料仍保留
- [ ] **重新登入載入**：重新登入後，確認 Firestore 中的筆記自動載入至側邊欄
