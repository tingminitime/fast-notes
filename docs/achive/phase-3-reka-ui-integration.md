# Phase 3 — Reka UI 元件整合

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 2 — 分類管理](./phase-2-categories.md)

本階段使用 `reka-ui` 無樣式 UI 元件庫，搭配 Tailwind CSS v4，取代 Phase 1 與 Phase 2 中所有手寫的 HTML 表單元素與互動元件，提升可及性（a11y）、鍵盤操作體驗與未來元件擴展性。

> **注意**：`reka-ui` 為無樣式（unstyled）原始元件庫，所有視覺樣式仍以 Tailwind CSS 撰寫。

---

## 涵蓋元件範圍

本階段不新增使用者可見功能，目標為 **1:1 功能替換**：介面行為保持一致，但底層元件改為 reka-ui 實作。

### 替換對照表

| 原始實作 | 替換為 reka-ui 元件 | 涉及檔案 |
|---------|-------------------|---------|
| `<button>` (新增/儲存/取消) | `Primitive as="button"` 或原生 button + reka-ui 行為封裝 | `NoteEditor.vue`, `CategoryManager.vue`, `HomeView.vue` |
| `<input type="text">` (分類名稱輸入) | 原生 `<input>` 搭配 `Label` | `CategoryManager.vue` |
| `<textarea>` (筆記內容輸入) | 原生 `<textarea>` 搭配 `Label` | `NoteEditor.vue` |
| `<select>` (分類選擇器) | `SelectRoot` + `SelectTrigger` + `SelectContent` + `SelectItem` | `NoteEditor.vue` |
| 自製 `ConfirmDialog.vue` | `AlertDialogRoot` + `AlertDialogContent` | `ConfirmDialog.vue` |
| 分類篩選按鈕群組 | `ToggleGroupRoot` + `ToggleGroupItem` | `CategoryFilter.vue` |
| 分類 badge `<span>` | `Primitive as="span"` (保持現行實作，加入 `Label` 語意) | `NoteItem.vue` |
| 表單欄位標籤 `<label>` | `Label` | `NoteEditor.vue`, `CategoryManager.vue` |

---

## EARS 需求規格

### 功能等效性

```
1. THE EXTENSION SHALL maintain identical user-facing behaviour after replacing
   HTML form elements with reka-ui components.

2. THE EXTENSION SHALL preserve all existing keyboard interactions
   (Tab, Enter, Escape, Space) on replaced components.

3. THE EXTENSION SHALL maintain WAI-ARIA compliance on all interactive elements
   after the migration.
```

### 樣式一致性

```
1. THE EXTENSION SHALL preserve existing Tailwind CSS visual styles
   when migrating to reka-ui components.

2. THE EXTENSION SHALL apply Tailwind utility classes directly to reka-ui
   component elements via the `class` attribute or `asChild` composition pattern.
```

---

## 實作範圍

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `components/ConfirmDialog.vue` | 重寫：以 `AlertDialogRoot` / `AlertDialogContent` 取代自製 Dialog |
| `components/CategoryFilter.vue` | 重寫：以 `ToggleGroupRoot` / `ToggleGroupItem` 取代手寫 button 群組 |
| `components/NoteEditor.vue` | 修改：`<select>` 改為 `SelectRoot` 系列元件；表單欄位加入 `Label` |
| `components/CategoryManager.vue` | 修改：表單欄位加入 `Label` |

### 不需修改

- `stores/` — 資料層不受影響
- `entrypoints/sidepanel/views/HomeView.vue` — 模式切換邏輯不受影響，按鈕保持現行 HTML
- `NoteItem.vue` — category badge 以現行 `<span>` 保留，加入 `Label` 語意即可
- `NoteList.vue` — 列表結構不受影響

---

## 各元件詳細規格

### `ConfirmDialog.vue`

使用 `AlertDialogRoot` 替換現行自製 Dialog，對外 props/emit 介面保持不變：

```typescript
// Props（不變）
defineProps<{
  open: boolean
  title: string
  message: string
}>()

// Emits（不變）
defineEmits<{
  confirm: []
  cancel: []
}>()
```

reka-ui 元件結構：

```vue
<AlertDialogRoot :open="open">
  <AlertDialogPortal>
    <AlertDialogOverlay class="..." />
    <AlertDialogContent class="...">
      <AlertDialogTitle>{{ title }}</AlertDialogTitle>
      <AlertDialogDescription>{{ message }}</AlertDialogDescription>
      <AlertDialogCancel @click="$emit('cancel')">取消</AlertDialogCancel>
      <AlertDialogAction @click="$emit('confirm')">確認</AlertDialogAction>
    </AlertDialogContent>
  </AlertDialogPortal>
</AlertDialogRoot>
```

### `CategoryFilter.vue`

使用 `ToggleGroupRoot` 取代手寫 button 群組，`v-model` 介面保持不變：

```typescript
// v-model: string | null（不變）
```

reka-ui 元件結構：

```vue
<ToggleGroupRoot
  type="single"
  :model-value="modelValue ?? 'all'"
  @update:model-value="val => emit('update:modelValue', val === 'all' ? null : val)"
>
  <ToggleGroupItem value="all" class="...">全部</ToggleGroupItem>
  <ToggleGroupItem
    v-for="cat in categoriesStore.categories"
    :key="cat.id"
    :value="cat.id"
    class="..."
  >
    {{ cat.name }}
  </ToggleGroupItem>
</ToggleGroupRoot>
```

### `NoteEditor.vue` — Select 替換

使用 `SelectRoot` 系列元件取代 `<select>`，`selectedCategoryId` 的 ref 繫結保持不變：

```vue
<Label for="category-select">分類</Label>
<SelectRoot v-model="selectedCategoryId">
  <SelectTrigger id="category-select" class="...">
    <SelectValue placeholder="未分類" />
  </SelectTrigger>
  <SelectPortal>
    <SelectContent class="...">
      <SelectViewport>
        <SelectItem :value="null">
          <SelectItemText>未分類</SelectItemText>
        </SelectItem>
        <SelectSeparator v-if="categoriesStore.categories.length" />
        <SelectItem
          v-for="cat in categoriesStore.categories"
          :key="cat.id"
          :value="cat.id"
        >
          <SelectItemText>{{ cat.name }}</SelectItemText>
          <SelectItemIndicator>
            <Icon icon="mdi:check" />
          </SelectItemIndicator>
        </SelectItem>
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</SelectRoot>
```

### `CategoryManager.vue` — Label 整合

為現有 `<input>` 加入 `Label` 元件，其餘結構不變：

```vue
<Label for="category-input">分類名稱</Label>
<input id="category-input" v-model="newName" ... />
```

---

## Tasks

### 安裝確認

- [x] 確認 `reka-ui` 已列於 `package.json` dependencies（已安裝）

### `ConfirmDialog.vue` 重寫（TDD）

- [x] 建立 `components/ConfirmDialog.test.ts`，撰寫失敗測試（TDD red）
  - [x] 測試 `open: false` 時 Dialog 不顯示
  - [x] 測試 `open: true` 時 `title` 與 `message` 正確渲染
  - [x] 測試點擊確認按鈕時 emit `confirm`
  - [x] 測試點擊取消按鈕時 emit `cancel`
- [x] 以 `AlertDialogRoot` 重寫 `components/ConfirmDialog.vue`，使所有測試通過（TDD green）

### `CategoryFilter.vue` 重寫（TDD）

- [x] 建立 `components/CategoryFilter.test.ts`，撰寫失敗測試（TDD red）
  - [x] 測試預設渲染「全部」按鈕，及每個分類各一個 ToggleGroupItem
  - [x] 測試 `modelValue: null` 時「全部」按鈕處於 active 狀態（`data-state="on"`）
  - [x] 測試點擊分類按鈕後 emit `update:modelValue` 並帶入對應 categoryId
  - [x] 測試點擊「全部」按鈕後 emit `update:modelValue` 並帶入 `null`
- [x] 以 `ToggleGroupRoot` / `ToggleGroupItem` 重寫 `components/CategoryFilter.vue`，使所有測試通過（TDD green）

### `NoteEditor.vue` — Select 替換（TDD）

- [x] 在 `components/NoteEditor.test.ts` 補充測試（TDD red）
  - [x] 測試分類選擇器渲染 `SelectTrigger`（以 `data-testid` 或 role 辨識）
  - [x] 測試「未分類」為預設選項（`selectedCategoryId` 為 `null`）
  - [x] 測試選擇分類後 emit `save` 帶入正確 `categoryId`
- [x] 以 `SelectRoot` 系列元件取代 `<select>`，使所有測試通過（TDD green）
- [x] 為 Textarea 與 Select 加入 `Label` 元件

### `CategoryManager.vue` — Label 整合

- [x] 為分類名稱 `<input>` 加入 `Label` 元件（`for` / `id` 對應）
- [x] 確認現有 `CategoryManager` 測試仍全數通過

### 驗證

- [x] 執行 `pnpm test`，確認所有測試通過（包含既有 Phase 1、2 測試）
- [x] 執行 `pnpm compile`，確認 TypeScript 無型別錯誤
- [x] 執行 `pnpm lint`，確認無 ESLint 違規

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證 reka-ui 元件的互動行為。

- [x] **Select 鍵盤操作**：在「新增筆記」的分類選擇器，使用 Tab 聚焦、Enter 展開、方向鍵選擇、Enter 確認，確認行為正確
- [x] **AlertDialog 鍵盤操作**：觸發刪除確認 Dialog，確認 Escape 鍵可取消，Tab 鍵可在「取消」與「確認」按鈕間切換
- [x] **ToggleGroup 鍵盤操作**：在分類篩選列，使用方向鍵切換分類，確認 `activeCategory` 正確更新
- [x] **無障礙驗證**：使用瀏覽器 Accessibility Inspector 確認 AlertDialog 有正確的 `role="alertdialog"`、Select 有正確的 `role="combobox"` 與 `aria-*` 屬性
- [x] **視覺回歸**：確認所有替換後的元件在 Chrome 側邊欄中視覺呈現與 Phase 1、2 完成時一致
