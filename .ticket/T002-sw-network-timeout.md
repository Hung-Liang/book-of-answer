---
id: T002
title: Service Worker 網路請求加上逾時改用快取
status: todo
depends_on: []
files:
  - service-worker.js
---

## Goal

網路很慢時（請求卡住，但沒有失敗），已安裝的 App 會一直空白，直到瀏覽器的請求逾時。改成網路在一定時間內沒有回應時，就先使用快取，讓弱網路下也能快速開啟。

## Scope

- 修改 `service-worker.js` 的 `fetch` 事件處理器。目前做法是 network-first：`networkResponse` 失敗時才 `caches.match`。
- 在 `event.respondWith` 中，讓 `networkResponse` 和一個逾時計時器用 `Promise.race` 競速。逾時或網路失敗時，都走現有的快取備援邏輯：先 `caches.match(request)`，navigate 請求退回 `./index.html`，再不行就回傳 `Response.error()`。
- 逾時改用快取時，如果快取裡也沒有這個請求，就繼續等網路回應，不要直接回傳錯誤。這樣第一次造訪、還沒有快取時也不會被逾時打斷。
- 保留 `event.waitUntil` 背景更新快取的部分，讓網路回應晚到時仍然會寫入快取。
- 不改變 `CACHE_NAME`、`APP_SHELL`、install 與 activate。保留既有註解，並更新那段註解來說明逾時行為。

## Acceptance

- `node --check service-worker.js` 通過。
- 程式碼中有一個逾時常數，並由 `Promise.race`（或同等寫法）使用。
- 逾時後快取沒有命中時，仍會回傳網路回應，不會回傳 `Response.error()`。

## Open decisions

- 逾時秒數。建議值：3000 ms，這在弱網路下能明顯感受到加快，同時又不會在一般慢速網路下太早改用舊版本。
- 是否所有同網域請求都套用逾時，或只套用 navigate 請求。建議值：所有同網域 GET 都套用。App 是由 HTML、CSS、JS 和 JSON 一起組成的，只讓 HTML 加快，其餘檔案仍然會卡住。

## Manual test

- 在 DevTools 的 Network throttling 新增一個延遲約 10 秒的自訂設定。在 App 已快取後重新載入，頁面應該在約 3 秒內出現。
- 完全離線時，重新載入仍可正常使用。
- 正常網路下修改檔案並部署後，重新整理一次仍能拿到新版本。

## Source

稽核報告第 2 項。
