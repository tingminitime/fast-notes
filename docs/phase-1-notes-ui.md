# Phase 1 — 側邊欄介面與筆記管理

**前置功能需求**：無（此為基礎功能，其他 Phase 皆依賴本階段）

本階段完成核心筆記 CRUD 功能與側邊欄 UI，所有邏輯為純本地端操作（記憶體內），不涉及雲端或加密。

---

## 涵蓋使用者故事

- **US-01** — 側邊欄快速開啟
- **US-02** — 側邊欄跨頁面持久顯示
- **US-03** — 新增筆記
- **US-04** — 編輯現有筆記
- **US-05** — 刪除筆記
- **US-06** — 快速複製筆記內容

---

## EARS 需求規格

### US-01 側邊欄快速開啟

```
1. WHEN the user clicks the Fast Notes extension icon,
   THE EXTENSION SHALL open the sidebar panel within the current browser window.

2. WHEN the sidebar is open,
   THE EXTENSION SHALL display the user's note list without navigating away from the current page.

3. IF the sidebar is already open,
   THEN THE EXTENSION SHALL collapse and hide the sidebar.
```

### US-02 側邊欄跨頁面持久顯示

```
1. WHILE the sidebar is open,
   THE EXTENSION SHALL remain visible and functional when the user navigates to a different URL in the same tab.

2. IF the browser tab is closed,
   THEN THE EXTENSION SHALL preserve the sidebar open/closed state for when the tab is restored.
```

### US-03 新增筆記

```
1. WHEN the user clicks the 'New Note' button,
   THE EXTENSION SHALL display a text input area for entering note content.

2. WHEN the user submits a new note with non-empty content,
   THE EXTENSION SHALL save the note and display it in the note list immediately.

3. IF the user submits a note with empty content,
   THEN THE EXTENSION SHALL prevent saving and display an inline validation message.
```

### US-04 編輯現有筆記

```
1. WHEN the user clicks on an existing note,
   THE EXTENSION SHALL enter edit mode and display the note content in an editable text field.

2. WHEN the user saves changes to a note,
   THE EXTENSION SHALL update the note content and display the updated version in the list.

3. WHEN the user discards changes,
   THE EXTENSION SHALL revert the note to its previously saved content.
```

### US-05 刪除筆記

```
1. WHEN the user triggers the delete action on a note,
   THE EXTENSION SHALL display a confirmation prompt before permanently deleting the note.

2. WHEN the user confirms deletion,
   THE EXTENSION SHALL permanently remove the note and update the displayed list.

3. WHEN the user cancels the deletion prompt,
   THE EXTENSION SHALL close the prompt and retain the note unchanged.
```

### US-06 快速複製筆記內容

```
1. WHEN the user clicks the copy button on a note,
   THE EXTENSION SHALL copy the full text content of that note to the system clipboard.

2. WHEN the copy action succeeds,
   THE EXTENSION SHALL display a brief visual confirmation indicator to the user.

3. IF the clipboard API is unavailable or access is denied,
   THEN THE EXTENSION SHALL display an error message explaining the failure.
```

---

## 實作範圍

### 資料模型

```typescript
interface Note {
  id: string        // crypto.randomUUID()
  text: string      // trimmed on save
  createdAt: number // Unix timestamp ms, used for newest-first sort
}
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `stores/notes.ts` | Pinia store — state, getters, actions |
| `stores/notes.test.ts` | Store 單元測試 (TDD) |
| `components/NoteList.vue` | 筆記清單元件 |
| `components/NoteItem.vue` | 單條筆記元件（顯示、複製、刪除按鈕） |
| `components/NoteEditor.vue` | 新增 / 編輯表單元件 |
| `components/ConfirmDialog.vue` | 刪除確認彈窗元件 |
| `entrypoints/sidepanel/views/HomeView.vue` | 組合所有元件，呈現完整筆記頁面 |

---

## Tasks

### Store（`stores/notes.ts`）

- [ ] 建立 `stores/notes.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `addNote` — 新增非空白筆記後清單長度 +1
  - [ ] 測試 `addNote` — 空白內容不新增，回傳 false
  - [ ] 測試 `updateNote` — 更新後內容正確反映
  - [ ] 測試 `deleteNote` — 刪除後清單不含該 id
  - [ ] 測試 `sortedNotes` getter — 依 `createdAt` 降冪排序
- [ ] 實作 `stores/notes.ts`，使所有 Store 測試通過（TDD green）
  - [ ] `state`: `notes: Note[]`
  - [ ] `getter`: `sortedNotes` — newest-first
  - [ ] `action`: `addNote(text: string): boolean`
  - [ ] `action`: `updateNote(id: string, text: string): boolean`
  - [ ] `action`: `deleteNote(id: string): void`

### 元件（Components）

- [ ] 建立 `components/NoteEditor.vue`
  - [ ] textarea 輸入欄位
  - [ ] 儲存按鈕（送出時 trim，空白則顯示 inline 錯誤訊息）
  - [ ] 取消按鈕（還原或關閉表單）
- [ ] 建立 `components/ConfirmDialog.vue`
  - [ ] 接受 `message` prop
  - [ ] emit `confirm` / `cancel` 事件
- [ ] 建立 `components/NoteItem.vue`
  - [ ] 顯示筆記文字（截斷超長文字）
  - [ ] 複製按鈕：呼叫 Clipboard API，成功顯示短暫視覺回饋，失敗顯示錯誤訊息
  - [ ] 編輯按鈕：觸發編輯模式
  - [ ] 刪除按鈕：顯示 ConfirmDialog，確認後呼叫 deleteNote
- [ ] 建立 `components/NoteList.vue`
  - [ ] 遍歷 `sortedNotes`，渲染 NoteItem
  - [ ] 空清單時顯示引導提示文字
- [ ] 更新 `entrypoints/sidepanel/views/HomeView.vue`
  - [ ] 整合 NoteList + NoteEditor（新增模式）
  - [ ] 選取筆記後切換 NoteEditor 為編輯模式

### 側邊欄行為

- [ ] 確認 `entrypoints/background.ts` 的 icon 點擊開啟 / 關閉 side panel 行為符合 US-01
- [ ] 確認 WXT side panel 跨頁面持久顯示（US-02，框架層已支援，驗證即可）
