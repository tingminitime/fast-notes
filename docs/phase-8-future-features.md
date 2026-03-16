# Phase 8 — 後續規劃功能

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)（Markdown 預覽依賴筆記資料結構）
- [Phase 2 — 分類管理](./phase-2-categories.md)（i18n 需涵蓋分類相關 UI 文字）

本階段為 MVP 完成後的後續功能，每個子功能相互獨立，可按優先順序個別實作。

---

## 涵蓋使用者故事

- **US-18** — Markdown 預覽
- **US-19** — i18n 語言切換（zh-TW / en-US）

---

## EARS 需求規格

### US-18 Markdown 預覽

```
1. WHERE the Markdown preview feature is enabled,
   WHEN the user switches a note to preview mode,
   THE EXTENSION SHALL render the note's Markdown syntax as formatted HTML output.

2. WHERE the Markdown preview feature is enabled,
   WHEN the user switches back to edit mode,
   THE EXTENSION SHALL display the raw Markdown source text.
```

### US-19 i18n 語言切換

```
1. WHEN the extension is first installed,
   THE EXTENSION SHALL detect the browser's UI language and apply zh-TW if the locale
   matches Chinese (Traditional), otherwise default to en-US.

2. WHEN the user selects a language from the language switcher,
   THE EXTENSION SHALL immediately re-render all UI text in the chosen language
   without requiring a page reload.

3. THE EXTENSION SHALL persist the user's language preference to localStorage
   so that the selected language is restored on next open.

4. THE EXTENSION SHALL provide complete translations for zh-TW and en-US covering
   all visible UI strings (labels, placeholders, error messages, confirmation dialogs).

5. IF a translation key is missing in the selected locale,
   THE EXTENSION SHALL fall back to en-US to prevent blank UI text.
```

---

## 子功能一：Markdown 預覽（US-18）

### 依賴套件

```bash
pnpm add markdown-it
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `utils/markdown.ts` | 封裝 Markdown → HTML 轉換 |
| `utils/markdown.test.ts` | Markdown 渲染單元測試 (TDD) |
| `components/NoteItem.vue` | 加入預覽 / 編輯模式切換 |
| `components/NoteEditor.vue` | 加入預覽 tab |

### Tasks

- [ ] 安裝 Markdown 解析套件（`markdown-it`）
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

---

## 子功能二：i18n 語言切換（US-19）

### 依賴套件

```bash
pnpm add vue-i18n
```

### 語言檔案結構

```
locales/
  zh-TW.json   # 繁體中文（預設）
  en-US.json   # 英文
```

**語言檔範例（部分）**

```json
// zh-TW.json
{
  "note": {
    "new": "新增筆記",
    "edit": "編輯筆記",
    "delete": "刪除筆記",
    "empty": "尚無筆記",
    "placeholder": "輸入筆記內容…",
    "copy": "複製",
    "copied": "已複製！",
    "confirmDelete": "確定要刪除這則筆記嗎？"
  },
  "category": {
    "new": "新增分類",
    "manage": "管理分類",
    "all": "全部",
    "uncategorized": "未分類",
    "namePlaceholder": "輸入分類名稱…",
    "duplicate": "分類名稱已存在",
    "confirmDelete": "刪除此分類後，相關筆記將變為未分類。確定繼續？"
  },
  "common": {
    "save": "儲存",
    "cancel": "取消",
    "confirm": "確認",
    "language": "語言"
  }
}
```

```json
// en-US.json
{
  "note": {
    "new": "New Note",
    "edit": "Edit Note",
    "delete": "Delete Note",
    "empty": "No notes yet",
    "placeholder": "Enter note content…",
    "copy": "Copy",
    "copied": "Copied!",
    "confirmDelete": "Are you sure you want to delete this note?"
  },
  "category": {
    "new": "New Category",
    "manage": "Manage Categories",
    "all": "All",
    "uncategorized": "Uncategorized",
    "namePlaceholder": "Enter category name…",
    "duplicate": "Category name already exists",
    "confirmDelete": "Notes in this category will become uncategorized. Continue?"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "language": "Language"
  }
}
```

### 初始化與語言偵測邏輯

`plugins/i18n.ts` 使用 `createI18n`（Composition API 模式）建立全域 i18n 實例：

```typescript
import { createI18n } from 'vue-i18n'
import zhTW from '../locales/zh-TW.json'
import enUS from '../locales/en-US.json'

const LOCALE_KEY = 'fast-notes-locale'
const SUPPORTED_LOCALES = ['zh-TW', 'en-US'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale))
    return stored as SupportedLocale
  return navigator.language.startsWith('zh') ? 'zh-TW' : 'en-US'
}

export const i18n = createI18n({
  legacy: false,          // 啟用 Composition API 模式
  locale: detectLocale(),
  fallbackLocale: 'en-US',
  messages: { 'zh-TW': zhTW, 'en-US': enUS },
})
```

在 Vue 元件中透過 `useI18n()` 存取翻譯：

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <button>{{ t('note.new') }}</button>
</template>
```

語言切換時同步更新 `locale.value` 與 `localStorage`：

```typescript
import { i18n } from '@/plugins/i18n'

function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('fast-notes-locale', locale)
}
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `locales/zh-TW.json` | 繁體中文翻譯字串 |
| `locales/en-US.json` | 英文翻譯字串 |
| `plugins/i18n.ts` | `createI18n` 初始化；語言偵測（localStorage → `navigator.language`）；匯出 `i18n` 實例 |
| `plugins/i18n.test.ts` | 語言偵測邏輯單元測試 (TDD) |
| `components/LanguageSwitcher.vue` | 語言切換 UI，切換時更新 `i18n.global.locale.value` 與 localStorage |
| `entrypoints/sidepanel/main.ts` | 掛載 i18n plugin（`app.use(i18n)`） |
| 所有含 UI 文字的 `.vue` 元件 | 將硬編碼字串替換為 `t('...')` |

### Tasks

- [ ] 安裝 `vue-i18n`
- [ ] 建立 `locales/zh-TW.json` 與 `locales/en-US.json`，涵蓋所有 UI 字串
- [ ] 建立 `plugins/i18n.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `localStorage` 存有 `zh-TW` 時，`detectLocale()` 回傳 `zh-TW`
  - [ ] 測試 `localStorage` 存有 `en-US` 時，`detectLocale()` 回傳 `en-US`
  - [ ] 測試 `localStorage` 無設定且 `navigator.language` 為 `zh-TW` 時，回傳 `zh-TW`
  - [ ] 測試 `localStorage` 無設定且 `navigator.language` 為非中文時，回傳 `en-US`
- [ ] 建立 `plugins/i18n.ts`，使所有測試通過（TDD green）
  - [ ] 實作 `detectLocale()`（優先 localStorage，次用 `navigator.language`）
  - [ ] 以 `legacy: false` 建立並匯出 `i18n` 實例，設定 `fallbackLocale: 'en-US'`
- [ ] 在 `entrypoints/sidepanel/main.ts` 掛載 i18n plugin（`app.use(i18n)`）
- [ ] 建立 `components/LanguageSwitcher.vue`
  - [ ] 以 `useI18n()` 取得 `locale` ref，繫結至語言選單
  - [ ] 切換時同步寫入 `localStorage`
- [ ] 逐一更新所有 `.vue` 元件，將硬編碼 UI 字串替換為 `t('...')`
  - [ ] `components/NoteList.vue`
  - [ ] `components/NoteItem.vue`
  - [ ] `components/NoteEditor.vue`
  - [ ] `components/CategoryFilter.vue`
  - [ ] `components/CategoryManager.vue`
  - [ ] `components/ConfirmDialog.vue`
  - [ ] `entrypoints/sidepanel/views/HomeView.vue`
- [ ] 將 `LanguageSwitcher` 放置於側邊欄適當位置（例如頂部工具列或設定區）
