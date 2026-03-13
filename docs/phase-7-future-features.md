# Phase 7 — 後續規劃功能

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)（匯出 / 匯入 / Markdown 預覽皆依賴筆記資料結構）
- [Phase 2 — 分類管理](./phase-2-categories.md)（匯出 / 匯入應包含分類資訊）

本階段為 MVP 完成後的後續功能，每個子功能相互獨立，可按優先順序個別實作。

---

## 涵蓋使用者故事

- **US-16** — 匯出筆記備份
- **US-17** — 匯入筆記備份
- **US-18** — Markdown 預覽

---

## EARS 需求規格

### US-16 匯出筆記備份

```
1. WHERE the export feature is enabled,
   WHEN the user initiates an export,
   THE EXTENSION SHALL generate a file containing all notes in the user's chosen format (JSON or Markdown).

2. WHERE the export feature is enabled,
   WHEN the export is complete,
   THE EXTENSION SHALL prompt the browser's native file save dialog
   so the user can choose a download location.
```

### US-17 匯入筆記備份

```
1. WHERE the import feature is enabled,
   WHEN the user uploads a valid JSON or Markdown backup file,
   THE EXTENSION SHALL parse the file and add its contents as new notes in the user's account.

2. WHERE the import feature is enabled,
   IF the uploaded file is malformed or in an unsupported format,
   THEN THE EXTENSION SHALL reject the file and display a descriptive error message to the user.
```

### US-18 Markdown 預覽

```
1. WHERE the Markdown preview feature is enabled,
   WHEN the user switches a note to preview mode,
   THE EXTENSION SHALL render the note's Markdown syntax as formatted HTML output.

2. WHERE the Markdown preview feature is enabled,
   WHEN the user switches back to edit mode,
   THE EXTENSION SHALL display the raw Markdown source text.
```

---

## 子功能一：匯出筆記備份（US-16）

### 匯出格式規格

**JSON 格式**
```json
{
  "version": "1.0",
  "exportedAt": 1710000000000,
  "notes": [
    {
      "id": "...",
      "text": "...",
      "categoryId": "...",
      "createdAt": 1710000000000
    }
  ],
  "categories": [
    { "id": "...", "name": "..." }
  ]
}
```

**Markdown 格式**
```markdown
# Fast Notes Export

## [分類名稱]

### 筆記標題（createdAt 日期）

筆記內容...

---
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `utils/export.ts` | 序列化筆記為 JSON / Markdown 字串 |
| `utils/export.test.ts` | 匯出格式單元測試 (TDD) |
| `components/ExportButton.vue` | 匯出按鈕，觸發格式選擇與下載 |

### Tasks

- [ ] 建立 `utils/export.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `exportAsJSON(notes, categories)` — 產生符合規格的 JSON 字串
  - [ ] 測試 `exportAsMarkdown(notes, categories)` — 依分類分組輸出 Markdown
- [ ] 實作 `utils/export.ts`，使所有測試通過（TDD green）
  - [ ] `exportAsJSON(notes, categories): string`
  - [ ] `exportAsMarkdown(notes, categories): string`
- [ ] 建立 `components/ExportButton.vue`
  - [ ] 提供 JSON / Markdown 格式選擇（下拉或兩個按鈕）
  - [ ] 使用 `URL.createObjectURL` + `<a download>` 觸發瀏覽器另存對話框

---

## 子功能二：匯入筆記備份（US-17）

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `utils/import.ts` | 解析 JSON / Markdown 備份檔案 |
| `utils/import.test.ts` | 匯入解析單元測試 (TDD) |
| `components/ImportButton.vue` | 檔案選取 input + 解析結果處理 |

### Tasks

- [ ] 建立 `utils/import.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `parseJSONBackup(content)` — 正確解析合規 JSON，回傳 `{ notes, categories }`
  - [ ] 測試 `parseJSONBackup` — 格式不合規時拋出描述性錯誤
  - [ ] 測試 `parseMarkdownBackup(content)` — 解析 Markdown 格式並回傳 notes 陣列
  - [ ] 測試空白 / null 輸入時拋出錯誤
- [ ] 實作 `utils/import.ts`，使所有測試通過（TDD green）
  - [ ] `parseJSONBackup(content: string): { notes: Note[]; categories: Category[] }`
  - [ ] `parseMarkdownBackup(content: string): { notes: Note[] }`
- [ ] 建立 `components/ImportButton.vue`
  - [ ] `<input type="file" accept=".json,.md">` 觸發檔案選取
  - [ ] 讀取檔案內容，呼叫對應 parser
  - [ ] 成功：將解析結果合併至 notes store，顯示匯入筆記數量
  - [ ] 失敗：顯示描述性錯誤訊息

---

## 子功能三：Markdown 預覽（US-18）

### 依賴套件

```bash
pnpm add marked   # 或 markdown-it
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `utils/markdown.ts` | 封裝 Markdown → HTML 轉換 |
| `utils/markdown.test.ts` | Markdown 渲染單元測試 (TDD) |
| `components/NoteItem.vue` | 加入預覽 / 編輯模式切換 |
| `components/NoteEditor.vue` | 加入預覽 tab |

### Tasks

- [ ] 安裝 Markdown 解析套件（`marked` 或 `markdown-it`）
- [ ] 建立 `utils/markdown.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `renderMarkdown(text)` — `# Hello` 轉換為 `<h1>Hello</h1>`
  - [ ] 測試 `renderMarkdown` — XSS 輸入被 sanitize（不渲染 `<script>` 標籤）
- [ ] 實作 `utils/markdown.ts`，使所有測試通過（TDD green）
  - [ ] `renderMarkdown(text: string): string` — 回傳 sanitized HTML
- [ ] 更新 `components/NoteItem.vue`
  - [ ] 顯示模式：渲染 Markdown HTML（`v-html` + sanitize）
  - [ ] 閱讀 / 編輯模式切換按鈕
- [ ] 更新 `components/NoteEditor.vue`
  - [ ] 加入「預覽」tab，即時渲染輸入中的 Markdown
