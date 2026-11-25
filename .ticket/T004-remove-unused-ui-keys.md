---
id: T004
title: 刪除語系檔中未使用的 ui key
status: done
depends_on: []
files:
  - locales/en.json
  - locales/ja.json
  - locales/zh-TW.json
---

## Goal

三個語系檔中的 `ui.install`、`ui.offlineReady`、`ui.langLabel` 沒有任何程式碼讀取，翻譯人員卻仍要維護，所以要刪除。

## Scope

- 從 `locales/en.json`、`locales/ja.json`、`locales/zh-TW.json` 的 `ui` 物件刪除 `install`、`offlineReady`、`langLabel` 三個 key。
- 不要動 `answers` 和其他 key。注意 `js/app.js` 的 `els.langLabel` 是 DOM 元素，不是這個文案，不受影響。

## Acceptance

- 三個檔案都能被 `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <檔案>` 正常解析。
- `grep -rn "offlineReady\|\"install\"\|\"langLabel\"" locales` 沒有結果。
- `grep -n "ui\.install\b\|ui\.offlineReady\|ui\.langLabel" js/app.js` 沒有結果（確認確實沒有程式碼讀取）。
- 三個檔案的 `answers.length` 仍然都是 300。

## Open decisions

None

## Manual test

None

## Source

稽核報告第 5 項。
