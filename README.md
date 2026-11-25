# 解答之書 · Book of Answers

一個可離線使用的多語言 PWA。默想一個問題，翻開書頁取得隨機答案。

## 功能

- 繁體中文、English、日本語介面與答案
- 每種語言 300 則對應答案；切換語言時維持同一則答案的語意位置
- 鍵盤操作、可見焦點與減少動態效果支援
- 可安裝為 App，並在離線時繼續使用
- 部署更新時優先載入網路上的最新版本；網路不可用時回退到快取

## 本機執行

這是純靜態網站。請以本機 HTTP 伺服器開啟，不要直接用 `file://` 開啟，否則語系載入與 Service Worker 無法正常工作。

```powershell
python -m http.server 8000
```

接著開啟 `http://localhost:8000/`。

## 專案結構

```text
index.html          頁面結構與可及性語意
css/style.css       視覺樣式與動畫
js/app.js           互動、語言切換、載入與安裝流程
locales/*.json      各語言介面文案與答案資料
service-worker.js   離線快取與更新策略
manifest.json       PWA 安裝設定
```

## 維護指南

### 新增或修改答案

三個 `locales/*.json` 的 `answers` 陣列必須維持相同順序與數量，因為語言切換會使用相同索引顯示對應答案。修改後請驗證 JSON，並確認三個檔案的答案數量一致。

### 新增語言

1. 建立 `locales/<語言代碼>.json`，沿用既有資料結構。
2. 在 `js/app.js` 的 `LOCALES` 加入語言代碼與按鈕標籤。
3. 確認新檔案已列入 `service-worker.js` 的 `APP_SHELL`。

### 部署與更新

Service Worker 對同網域檔案採用 network-first：連線時會更新快取，離線時則使用已快取的版本。每次修改後，請確認 `service-worker.js` 已隨部署一起發布；首次使用新版 Service Worker 時，使用者可能需要重新整理一次頁面。

## 瀏覽器支援

現代桌面與行動瀏覽器均可使用。安裝提示採用 `beforeinstallprompt`，通常支援 Android 與 Chromium 系瀏覽器；iOS 使用者可透過 Safari 的分享選單選擇「加入主畫面」。
