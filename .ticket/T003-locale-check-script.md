---
id: T003
title: 新增語系檔一致性檢查腳本
status: todo
depends_on: []
files:
  - scripts/check-locales.mjs
---

## Goal

三個語系檔用相同索引對應同一則答案，但 `js/app.js` 用 `currentIndex % data.answers.length` 讀取答案，數量不一致時不會報錯，只會悄悄顯示意思不同的答案。專案目前沒有任何測試，所以要加一個指令，在數量或結構不一致時失敗。

## Scope

- 新增 `scripts/check-locales.mjs`，只使用 Node 內建模組（`node:fs`、`node:assert`），不新增依賴，也不新增 `package.json`。
- 讀取 `locales/` 底下所有 `*.json`，並以 assert 檢查：
  - 每個檔案都是合法 JSON，且有 `meta.lang`、`ui`，以及非空的 `answers` 陣列（與 `js/app.js` 的 `loadLocale()` 驗證條件相同）。
  - 所有檔案的 `answers.length` 相同。
  - 所有檔案的 `ui` key 集合相同。
- 失敗時輸出哪個檔案的哪一項不一致，並以非零 exit code 結束；成功時輸出一行摘要。

## Acceptance

- `node scripts/check-locales.mjs` 在目前的 repo 上以 exit code 0 結束（目前三個檔案都是 300 則，`ui` key 也相同）。
- 在暫時複本中刪掉某個檔案的一則答案後，執行腳本會以非零 exit code 結束，並指出是哪個檔案。驗證完要還原。

## Open decisions

- 腳本位置與名稱。建議值：`scripts/check-locales.mjs`，因為專案沒有 `package.json`，用 `node` 直接執行最簡單。
- 是否同時在 README 的「新增或修改答案」段落寫上這個指令。建議值：這張單不改。README 可在之後另外處理，避免和其他單子搶同一個檔案。

## Manual test

None

## Source

稽核報告第 3 項。
