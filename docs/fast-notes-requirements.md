# Fast Notes — 使用者故事與 EARS 需求規格文件

本文件依據 Fast Notes 產品摘要，整理各功能領域的使用者故事，並在每個故事下附上對應的 EARS (Easy Approach to Requirements Syntax) 需求描述，以利開發團隊實作與驗收測試。

---

## 目錄

1. [側邊欄介面](#1-側邊欄介面)
2. [筆記管理](#2-筆記管理)
3. [分類管理](#3-分類管理)
4. [Google 帳號登入與雲端同步](#4-google-帳號登入與雲端同步)
5. [端到端加密與資料安全](#5-端到端加密與資料安全)
6. [跨瀏覽器支援](#6-跨瀏覽器支援)
7. [後續規劃功能](#7-後續規劃功能)

---

## 1. 側邊欄介面

### US-01 — 側邊欄快速開啟

> 身為一位**瀏覽器使用者**，  
> 我希望能夠**點擊擴充功能圖示後立即開啟側邊欄**，  
> 以便**在不離開當前網頁的情況下快速存取我的筆記**。

**EARS Requirements**

```
1. WHEN the user clicks the Fast Notes extension icon,
   THE EXTENSION SHALL open the sidebar panel within the current browser window.

2. WHEN the sidebar is open,
   THE EXTENSION SHALL display the user's note list without navigating away from the current page.

3. IF the sidebar is already open,
   THEN THE EXTENSION SHALL collapse and hide the sidebar.
```

---

### US-02 — 側邊欄跨頁面持久顯示

> 身為一位**瀏覽器使用者**，  
> 我希望能夠**在切換網頁時保持側邊欄開啟**，  
> 以便**不需要在每個頁面重新開啟工具**。

**EARS Requirements**

```
1. WHILE the sidebar is open,
   THE EXTENSION SHALL remain visible and functional when the user navigates to a different URL in the same tab.

2. IF the browser tab is closed,
   THEN THE EXTENSION SHALL preserve the sidebar open/closed state for when the tab is restored.
```

---

## 2. 筆記管理

### US-03 — 新增筆記

> 身為一位**筆記使用者**，  
> 我希望能夠**在側邊欄中快速新增一條筆記**，  
> 以便**立即記錄腦中的想法或當前網頁的重要資訊**。

**EARS Requirements**

```
1. WHEN the user clicks the 'New Note' button,
   THE EXTENSION SHALL display a text input area for entering note content.

2. WHEN the user submits a new note with non-empty content,
   THE EXTENSION SHALL save the note and display it in the note list immediately.

3. IF the user submits a note with empty content,
   THEN THE EXTENSION SHALL prevent saving and display an inline validation message.
```

---

### US-04 — 編輯現有筆記

> 身為一位**筆記使用者**，  
> 我希望能夠**點擊任一筆記進入編輯模式並修改內容**，  
> 以便**隨時更新或補充之前記下的資訊**。

**EARS Requirements**

```
1. WHEN the user clicks on an existing note,
   THE EXTENSION SHALL enter edit mode and display the note content in an editable text field.

2. WHEN the user saves changes to a note,
   THE EXTENSION SHALL update the note content and display the updated version in the list.

3. WHEN the user discards changes,
   THE EXTENSION SHALL revert the note to its previously saved content.
```

---

### US-05 — 刪除筆記

> 身為一位**筆記使用者**，  
> 我希望能夠**刪除不再需要的筆記**，  
> 以便**保持筆記清單的整潔**。

**EARS Requirements**

```
1. WHEN the user triggers the delete action on a note,
   THE EXTENSION SHALL display a confirmation prompt before permanently deleting the note.

2. WHEN the user confirms deletion,
   THE EXTENSION SHALL permanently remove the note and update the displayed list.

3. WHEN the user cancels the deletion prompt,
   THE EXTENSION SHALL close the prompt and retain the note unchanged.
```

---

### US-06 — 快速複製筆記內容

> 身為一位**筆記使用者**，  
> 我希望能夠**一鍵複製某條筆記的文字內容至剪貼簿**，  
> 以便**快速將筆記中的資訊貼到其他地方使用**。

**EARS Requirements**

```
1. WHEN the user clicks the copy button on a note,
   THE EXTENSION SHALL copy the full text content of that note to the system clipboard.

2. WHEN the copy action succeeds,
   THE EXTENSION SHALL display a brief visual confirmation indicator to the user.

3. IF the clipboard API is unavailable or access is denied,
   THEN THE EXTENSION SHALL display an error message explaining the failure.
```

---

## 3. 分類管理

### US-07 — 新增筆記分類

> 身為一位**筆記使用者**，  
> 我希望能夠**自訂並新增筆記分類標籤**，  
> 以便**依主題或用途組織我的筆記，方便日後查找**。

**EARS Requirements**

```
1. WHEN the user creates a new category with a unique name,
   THE EXTENSION SHALL save the category and make it available for assigning to notes.

2. IF the user enters a category name that already exists,
   THEN THE EXTENSION SHALL reject the input and display a duplicate-name error message.

3. IF the user submits an empty category name,
   THEN THE EXTENSION SHALL prevent creation and prompt the user to enter a valid name.
```

---

### US-08 — 將筆記指派到分類

> 身為一位**筆記使用者**，  
> 我希望能夠**在新增或編輯筆記時選擇所屬分類**，  
> 以便**讓每條筆記都有明確的歸屬，便於分類瀏覽**。

**EARS Requirements**

```
1. WHEN the user creates or edits a note,
   THE EXTENSION SHALL provide a category selector listing all available categories.

2. WHEN the user assigns a category to a note and saves,
   THE EXTENSION SHALL store the category association and display it alongside the note.

3. WHEN the user filters by a category,
   THE EXTENSION SHALL display only notes belonging to that category.
```

---

### US-09 — 刪除分類

> 身為一位**筆記使用者**，  
> 我希望能夠**刪除不再使用的分類**，  
> 以便**維持分類清單的整潔**。

**EARS Requirements**

```
1. WHEN the user requests to delete a category that contains notes,
   THE EXTENSION SHALL warn the user that associated notes will become uncategorized.

2. WHEN the user confirms category deletion,
   THE EXTENSION SHALL remove the category and set all associated notes to an uncategorized state.
```

---

## 4. Google 帳號登入與雲端同步

### US-10 — 使用 Google 帳號登入

> 身為一位**需要跨裝置使用的使用者**，  
> 我希望能夠**以 Google 帳號登入擴充功能**，  
> 以便**在不同裝置或瀏覽器上存取同一組筆記資料**。

**EARS Requirements**

```
1. WHEN the user clicks the 'Sign in with Google' button,
   THE EXTENSION SHALL initiate the Firebase Authentication OAuth flow.

2. WHEN authentication succeeds,
   THE EXTENSION SHALL store the session credentials securely and display the authenticated user's profile name.

3. IF the authentication flow fails or is cancelled by the user,
   THEN THE EXTENSION SHALL display an appropriate error or status message and remain on the login screen.
```

---

### US-11 — 筆記自動同步至雲端

> 身為一位**已登入的使用者**，  
> 我希望能夠**讓我的筆記自動儲存並同步到雲端**，  
> 以便**無論使用哪台裝置都能看到最新的筆記內容**。

**EARS Requirements**

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

### US-12 — 登出帳號

> 身為一位**已登入的使用者**，  
> 我希望能夠**從擴充功能登出我的 Google 帳號**，  
> 以便**在共用裝置上保護我的帳號安全**。

**EARS Requirements**

```
1. WHEN the user clicks the sign-out button,
   THE EXTENSION SHALL terminate the active session and clear all locally cached user data.

2. WHEN the user is signed out,
   THE EXTENSION SHALL display the login screen and prevent access to the note list
   until the user signs in again.
```

---

## 5. 端到端加密與資料安全

### US-13 — 筆記端到端加密儲存

> 身為一位**重視隱私的使用者**，  
> 我希望能夠**確保我的筆記在傳輸與儲存過程中都是加密的**，  
> 以便**即使資料庫被存取，我的筆記內容也不會以明文形式洩漏**。

**EARS Requirements**

```
1. THE EXTENSION SHALL encrypt all note content using AES-GCM 256-bit encryption
   before transmitting data to Cloud Firestore.

2. THE EXTENSION SHALL derive the encryption key using PBKDF2
   based on the authenticated user's Firebase UID.

3. THE EXTENSION SHALL perform encryption and decryption operations exclusively on the client side.

4. WHILE storing notes,
   THE EXTENSION SHALL ensure that Cloud Firestore receives and stores only ciphertext,
   never plaintext note content.
```

---

### US-14 — 本地解密筆記瀏覽

> 身為一位**已登入的使用者**，  
> 我希望能夠**在側邊欄中正常閱讀我的筆記，而無需手動解密**，  
> 以便**加密對我是透明的，使用上不增加額外步驟**。

**EARS Requirements**

```
1. WHEN the extension loads the user's notes from Firestore,
   THE EXTENSION SHALL automatically decrypt each note's ciphertext using the locally derived key
   before displaying it.

2. IF decryption of a note fails due to a key mismatch or data corruption,
   THEN THE EXTENSION SHALL display a placeholder error for that note and log the failure
   without exposing raw ciphertext to the user.
```

---

## 6. 跨瀏覽器支援

### US-15 — 在多種主流瀏覽器上使用

> 身為一位**使用不同瀏覽器的使用者**，  
> 我希望能夠**在 Chrome、Edge 與 Firefox 上安裝並使用 Fast Notes**，  
> 以便**無論習慣使用哪款瀏覽器，都能享有一致的體驗**。

**EARS Requirements**

```
1. THE EXTENSION SHALL be installable and fully functional on Google Chrome
   via the Chrome Web Store.

2. THE EXTENSION SHALL be installable and fully functional on Mozilla Firefox
   via Firefox Add-ons.

3. THE EXTENSION SHALL be installable and fully functional on Microsoft Edge
   via the Edge Add-ons store.

4. THE EXTENSION SHALL provide a consistent user interface and feature set
   across all three supported browsers.
```

---

## 7. 後續規劃功能

### US-16 — 匯出筆記備份

> 身為一位**使用者**，  
> 我希望能夠**將我的筆記匯出為 JSON 或 Markdown 格式的備份檔案**，  
> 以便**在本地保留一份筆記副本，避免資料遺失**。

**EARS Requirements**

```
1. WHERE the export feature is enabled,
   WHEN the user initiates an export,
   THE EXTENSION SHALL generate a file containing all notes in the user's chosen format (JSON or Markdown).

2. WHERE the export feature is enabled,
   WHEN the export is complete,
   THE EXTENSION SHALL prompt the browser's native file save dialog
   so the user can choose a download location.
```

---

### US-17 — 匯入筆記備份

> 身為一位**使用者**，  
> 我希望能夠**將備份的 JSON 或 Markdown 筆記檔案匯入到 Fast Notes**，  
> 以便**在新裝置或重新安裝後快速還原筆記資料**。

**EARS Requirements**

```
1. WHERE the import feature is enabled,
   WHEN the user uploads a valid JSON or Markdown backup file,
   THE EXTENSION SHALL parse the file and add its contents as new notes in the user's account.

2. WHERE the import feature is enabled,
   IF the uploaded file is malformed or in an unsupported format,
   THEN THE EXTENSION SHALL reject the file and display a descriptive error message to the user.
```

---

### US-18 — Markdown 預覽

> 身為一位**使用者**，  
> 我希望能夠**在閱讀模式下以 Markdown 格式預覽筆記的排版**，  
> 以便**提升筆記的可讀性，尤其是結構化的筆記內容**。

**EARS Requirements**

```
1. WHERE the Markdown preview feature is enabled,
   WHEN the user switches a note to preview mode,
   THE EXTENSION SHALL render the note's Markdown syntax as formatted HTML output.

2. WHERE the Markdown preview feature is enabled,
   WHEN the user switches back to edit mode,
   THE EXTENSION SHALL display the raw Markdown source text.
```

---

*文件版本：MVP v1.0　　產品：Fast Notes　　框架：EARS (Easy Approach to Requirements Syntax)*