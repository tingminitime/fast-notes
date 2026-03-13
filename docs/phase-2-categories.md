# Phase 2 — 分類管理

**前置功能需求**：[Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)

本階段在 Phase 1 筆記功能的基礎上，新增分類（Category）的建立、指派與刪除功能，讓使用者能依主題組織筆記並進行篩選瀏覽。

---

## 涵蓋使用者故事

- **US-07** — 新增筆記分類
- **US-08** — 將筆記指派到分類
- **US-09** — 刪除分類

---

## EARS 需求規格

### US-07 新增筆記分類

```
1. WHEN the user creates a new category with a unique name,
   THE EXTENSION SHALL save the category and make it available for assigning to notes.

2. IF the user enters a category name that already exists,
   THEN THE EXTENSION SHALL reject the input and display a duplicate-name error message.

3. IF the user submits an empty category name,
   THEN THE EXTENSION SHALL prevent creation and prompt the user to enter a valid name.
```

### US-08 將筆記指派到分類

```
1. WHEN the user creates or edits a note,
   THE EXTENSION SHALL provide a category selector listing all available categories.

2. WHEN the user assigns a category to a note and saves,
   THE EXTENSION SHALL store the category association and display it alongside the note.

3. WHEN the user filters by a category,
   THE EXTENSION SHALL display only notes belonging to that category.
```

### US-09 刪除分類

```
1. WHEN the user requests to delete a category that contains notes,
   THE EXTENSION SHALL warn the user that associated notes will become uncategorized.

2. WHEN the user confirms category deletion,
   THE EXTENSION SHALL remove the category and set all associated notes to an uncategorized state.
```

---

## 實作範圍

### 資料模型擴充

```typescript
interface Category {
  id: string   // crypto.randomUUID()
  name: string // trimmed, unique
}

// 擴充 Phase 1 的 Note interface
interface Note {
  id: string
  text: string
  createdAt: number
  categoryId: string | null  // 新增欄位，null = 未分類
}
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `stores/categories.ts` | Pinia store — 分類 state / actions |
| `stores/categories.test.ts` | Store 單元測試 (TDD) |
| `stores/notes.ts` | 擴充 Note interface，更新 `deleteNote` 相關邏輯 |
| `stores/notes.test.ts` | 補充含 `categoryId` 的測試案例 |
| `components/CategoryManager.vue` | 分類清單 + 新增 / 刪除 UI |
| `components/CategoryFilter.vue` | 篩選列（全部 / 各分類 tab 或 select） |
| `components/NoteEditor.vue` | 加入分類選擇器（CategorySelector） |
| `components/NoteItem.vue` | 顯示所屬分類標籤 |
| `entrypoints/sidepanel/views/HomeView.vue` | 整合 CategoryFilter，依選取分類篩選筆記 |

---

## Tasks

### 分類 Store（`stores/categories.ts`）

- [ ] 建立 `stores/categories.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `addCategory` — 新增唯一名稱後清單 +1
  - [ ] 測試 `addCategory` — 重複名稱回傳 false 並顯示錯誤
  - [ ] 測試 `addCategory` — 空白名稱回傳 false
  - [ ] 測試 `deleteCategory` — 刪除後清單不含該 id
- [ ] 實作 `stores/categories.ts`，使所有測試通過（TDD green）
  - [ ] `state`: `categories: Category[]`
  - [ ] `getter`: `categoryById(id)` — 依 id 查找
  - [ ] `action`: `addCategory(name: string): boolean`
  - [ ] `action`: `deleteCategory(id: string): void`

### 筆記 Store 擴充（`stores/notes.ts`）

- [ ] 更新 `Note` interface，加入 `categoryId: string | null`
- [ ] 更新 `stores/notes.test.ts`，補充含 `categoryId` 的測試
  - [ ] 測試 `notesByCategory(categoryId)` getter — 正確過濾
  - [ ] 測試 `deleteCategory` 後關聯筆記的 `categoryId` 變為 `null`
- [ ] 實作 `notesByCategory(categoryId: string | null)` getter
- [ ] 在 `deleteCategory` action（或由 categories store 呼叫）中重置關聯筆記的 `categoryId`

### 元件（Components）

- [ ] 建立 `components/CategoryManager.vue`
  - [ ] 顯示分類清單
  - [ ] 新增分類輸入欄（空白 / 重複名稱顯示錯誤）
  - [ ] 每個分類旁有刪除按鈕，含有筆記時顯示警告提示（ConfirmDialog）
- [ ] 建立 `components/CategoryFilter.vue`
  - [ ] 「全部」選項 + 各分類 tab / chip
  - [ ] 選取後 emit `filter-change` 事件並更新筆記清單
- [ ] 修改 `components/NoteEditor.vue`
  - [ ] 加入分類 `<select>` 或 combobox，列出所有分類（含「未分類」選項）
  - [ ] 儲存時帶入選取的 `categoryId`
- [ ] 修改 `components/NoteItem.vue`
  - [ ] 筆記卡片上顯示所屬分類名稱 badge（未分類則不顯示）
- [ ] 更新 `entrypoints/sidepanel/views/HomeView.vue`
  - [ ] 加入 CategoryFilter，依 activeCategory 過濾傳給 NoteList 的筆記清單
  - [ ] 提供入口開啟 CategoryManager（例如設定按鈕）
