# 分輪計畫

基底分支：`master`

## 分工表

| 輪次 | subagent | 單子 | 重點 | 依賴 |
|------|----------|------|------|------|
| 1 | A | T001 app.js 健壯性修正與精簡 | 只把兩次 localStorage 存取各自包進 try；只有在 `!cache[localeCode]` 時才停用書本；`.hint` 加 `white-space: pre-line` 後換行要和原本一致 | 無 |
| 1 | B | T002 Service Worker 網路請求加上逾時改用快取 | 逾時後快取沒有命中時要繼續等網路回應；保留背景更新快取 | 無 |
| 1 | C | T003 新增語系檔一致性檢查腳本 | 只用 Node 內建模組；不一致時以非零 exit code 結束並指出檔案 | 無 |
| 1 | D | T004 刪除語系檔中未使用的 ui key | 只刪 `install`、`offlineReady`、`langLabel`；`answers` 不動 | 無 |

## 設計決策建議值

要改就直接改「建議值」欄，重排時會保留。

| 單子 | 決策 | 建議值 | 理由 |
|------|------|--------|------|
| T001 | localStorage 失敗時 catch 怎麼處理 | 不記錄，直接用備用行為，並加一行註解說明是預期情況 | 儲存空間被封鎖是使用者設定，不是程式錯誤 |
| T002 | 逾時秒數 | 3000 ms | 弱網路下明顯變快，一般慢速網路也不會太早改用舊版本 |
| T002 | 套用範圍 | 所有同網域 GET | App 由 HTML、CSS、JS 和 JSON 共同組成，只加快 HTML 沒有用 |
| T003 | 腳本位置 | `scripts/check-locales.mjs`，用 `node` 直接執行 | 專案沒有 `package.json`，不新增依賴 |
| T003 | README 是否寫上檢查指令 | 本輪不改 README | 避免和其他單子搶同一個檔案，之後再另外處理 |

## 流程

一個 session 只做一輪。

1. 開工前確認，有一項不符就停下回報：
   - 前面輪次的單子都已 `done`。
   - 主 checkout 在基底分支上，工作區乾淨。
   - 未完成的單子都在分工表中；有不在的，要先用 `/ticket-planner` 重排才能開工。
2. 依「需要同意的 git 操作」為本輪每張單建立 worktree 與分支。
3. 每張單交給一個 subagent，同輪平行進行。指示中附上單子全文、相關的設計決策、worktree 路徑與環境建置方式。subagent 只在自己的 worktree 內實作、測試、commit，完成後回報。
4. 主 agent 審每個分支的 diff，對照單子的 `Acceptance` 與 `files`。
5. 逐一 rebase 到基底分支，再用 `git merge --ff-only` 合併。
6. 本輪全部合併後，在主 checkout 跑完整檢查。
7. 檢查通過才把本輪單子的 `status` 改為 `done`，並移除本輪的 worktree 與分支。

任何一步失敗就停下回報，不自行補救，也不開下一輪。

## 環境風險

| 檢查項目 | 指令 | 結果 | 影響與處理 |
|----------|------|------|------------|
| 工作區 | `git status --porcelain` | `?? .gitignore`、`?? .ticket/`、`?? README.md` | 工作區不乾淨，流程第 1 步會停下。開工前請先 commit 這三項（`.gitignore` 目前是空檔），或確認不需要它們 |
| `.ticket/` 追蹤 | `git ls-files .ticket`、`git check-ignore .ticket` | 沒有被追蹤，也沒有被忽略（check-ignore exit 1） | 未 commit 時 worktree 內看不到 ticket，subagent 只能依靠指示中附上的單子全文。commit 之後，每輪結束更新的 `status` 也要 commit |
| 目前分支 | `git branch --show-current` | `master` | 基底分支是 `master`（系統資訊裡寫的 `main` 在本機和遠端都不存在） |
| 既有 worktree | `git worktree list` | 只有主 checkout `D:/code/projects/book-of-answers [master]` | 沒有衝突，worktree 放在 `../book-of-answers-worktrees/` |
| 殘留分支 | `git branch --list "ticket/*"` | 無 | 沒有衝突 |
| 依賴與忽略目錄 | `ls -a` | 沒有 `package.json`、`node_modules`、`.venv` | 純靜態網站，worktree 不需要安裝依賴 |
| `.env` | `ls .env*` | 不存在 | 不影響 |
| Node | `node --version` | `v26.13.0` | 可以執行 `node --check` 和檢查腳本 |

沒有檢查到的項目：沒有瀏覽器自動化環境，Service Worker 和頁面行為無法用指令驗證，只能手動測試。

Worktree 內的環境建置：

```bash
# Static site, no dependencies to install
cd ../book-of-answers-worktrees/<ticket>
node --version
```

完整檢查指令（分輪時只確認指令，沒有執行）：

```bash
node --check js/app.js
node --check service-worker.js
node scripts/check-locales.mjs   # exists after T003 is merged
```

## 需要手動實測的項目

| 可測時機 | 單子 | 項目 |
|----------|------|------|
| 第 1 輪合併後 | T001 | Chrome 設定「封鎖所有 Cookie」後開啟頁面：封面依瀏覽器語言顯示，可以翻書、切換語言 |
| 第 1 輪合併後 | T001 | 三種語言的封面提示都在原本的位置換行，外觀和修改前一致 |
| 第 1 輪合併後 | T001 | 第一次造訪時，在 SW 快取完成前設定 Offline 並切換語言：出現錯誤訊息，但原本語言的書仍然可以點開 |
| 第 1 輪合併後 | T002 | DevTools 自訂約 10 秒延遲後重新載入已快取的 App：約 3 秒內出現 |
| 第 1 輪合併後 | T002 | 完全離線時重新載入仍可使用；正常網路下部署新版後，重新整理一次就能拿到新版本 |

## 需要同意的 git 操作

指示做某一輪，即同意該輪列出的操作；清單外的操作要先問。

### 第 1 輪

```bash
# Create one worktree and branch per ticket
git worktree add ../book-of-answers-worktrees/T001-app-js-hardening -b ticket/T001-app-js-hardening
git worktree add ../book-of-answers-worktrees/T002-sw-network-timeout -b ticket/T002-sw-network-timeout
git worktree add ../book-of-answers-worktrees/T003-locale-check-script -b ticket/T003-locale-check-script
git worktree add ../book-of-answers-worktrees/T004-remove-unused-ui-keys -b ticket/T004-remove-unused-ui-keys

# Run by each subagent inside its own worktree
git add js/app.js css/style.css
git commit -m "harden locale storage and load error handling in app.js"
git add service-worker.js
git commit -m "fall back to cache when network is slow in service worker"
git add scripts/check-locales.mjs
git commit -m "add locale consistency check script"
git add locales/en.json locales/ja.json locales/zh-TW.json
git commit -m "remove unused ui keys from locales"

# After review, one ticket at a time: rebase, then merge from the main checkout
git -C ../book-of-answers-worktrees/T001-app-js-hardening rebase master
git merge --ff-only ticket/T001-app-js-hardening
git -C ../book-of-answers-worktrees/T002-sw-network-timeout rebase master
git merge --ff-only ticket/T002-sw-network-timeout
git -C ../book-of-answers-worktrees/T003-locale-check-script rebase master
git merge --ff-only ticket/T003-locale-check-script
git -C ../book-of-answers-worktrees/T004-remove-unused-ui-keys rebase master
git merge --ff-only ticket/T004-remove-unused-ui-keys

# After the full check passes
git worktree remove ../book-of-answers-worktrees/T001-app-js-hardening
git worktree remove ../book-of-answers-worktrees/T002-sw-network-timeout
git worktree remove ../book-of-answers-worktrees/T003-locale-check-script
git worktree remove ../book-of-answers-worktrees/T004-remove-unused-ui-keys
git branch -d ticket/T001-app-js-hardening
git branch -d ticket/T002-sw-network-timeout
git branch -d ticket/T003-locale-check-script
git branch -d ticket/T004-remove-unused-ui-keys

# Only when .ticket/ is tracked: commit the status updates
git add .ticket/T001-app-js-hardening.md .ticket/T002-sw-network-timeout.md .ticket/T003-locale-check-script.md .ticket/T004-remove-unused-ui-keys.md
git commit -m "mark round 1 tickets done"
```

---

限制：不 push，不碰 `.env`。
