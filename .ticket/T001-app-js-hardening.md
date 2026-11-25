---
id: T001
title: app.js 健壯性修正與精簡
status: todo
depends_on: []
files:
  - js/app.js
  - css/style.css
---

## Goal

修正 `js/app.js` 的兩個健壯性問題：儲存空間被封鎖時整個 App 打不開，以及切換語言失敗時書本被鎖住。同時刪掉兩處不必要的程式碼。這四項都改同一個檔案，所以合成一張單。

## Scope

1. **localStorage 存取不可讓腳本崩潰**：`pickInitialLocale()` 裡的 `localStorage.getItem(STORAGE_KEY)`，以及 `setLocale()` 裡的 `localStorage.setItem(STORAGE_KEY, code)`，各自只包一層 `try/catch`。在 Chrome「封鎖所有 Cookie」時，只要存取 `localStorage` 就會拋出 `SecurityError`，而它位於 IIFE 頂層，會讓整支腳本停止。讀取失敗時，改用既有的 `navigator.language` 判斷邏輯；寫入失敗時就不儲存，語言切換照常進行。
2. **切換失敗時不要鎖住已載入的語言**：`showLoadError()` 目前一律設定 `isReady = false`，並把 `bookCover` 設成 `aria-disabled="true"`。改成只有在 `cache[localeCode]` 不存在、也就是目前沒有任何語言可用時，才停用書本。錯誤訊息仍要照常顯示。
3. **封面提示改用純文字**：`renderStaticText()` 裡的 `els.coverHint.innerHTML = escapeHtml(...).replace(/\n/g, "<br/>")` 改成 `els.coverHint.textContent = data.ui.coverHint`，然後刪除 `escapeHtml()`。`css/style.css` 的 `.hint` 規則加上 `white-space: pre-line`，讓 `\n` 仍然顯示為換行。
4. **語言標籤直接用 localeCode 查找**：`renderStaticText()` 結尾的 `localeMeta` 目前有兩層備用查找，最後再退回 `"?"`，改成 `LOCALES.find(l => l.code === localeCode).label`。`renderStaticText` 都是在 `localeCode` 已設定後才被呼叫：boot 時使用初始值，`setLocale` 則先設定 `localeCode` 再呼叫。

不要改動其他行為。保留現有註解。

## Acceptance

- `node --check js/app.js` 通過。
- `grep -n "escapeHtml\|innerHTML" js/app.js` 沒有結果。
- `grep -n "localStorage" js/app.js` 列出的每次存取都在 `try` 區塊內。
- `showLoadError` 只有在 `!cache[localeCode]` 時才把 `isReady` 設為 `false`。
- `css/style.css` 的 `.hint` 規則含有 `white-space: pre-line`。

## Open decisions

- localStorage 失敗時的 catch 要做什麼。建議值：不記錄，直接使用備用行為，並加一行註解說明這是預期情況（儲存空間被封鎖）。這是可預期的使用者設定，不是程式錯誤，所以不需要 console 訊息。

## Manual test

- 在 Chrome 設定「封鎖所有 Cookie」後開啟頁面：封面文字會依瀏覽器語言顯示，點書本可以翻開，切換語言也正常（重新整理後不記得語言是預期行為）。
- 三種語言的封面提示都在原本的位置換行，畫面和修改前一致。
- 第一次造訪時，在 Service Worker 快取完成前用 DevTools 設定 Offline，再按語言按鈕：會出現錯誤訊息，但原本語言的書仍然可以點開。

## Source

稽核報告第 1、4、6、7 項。
