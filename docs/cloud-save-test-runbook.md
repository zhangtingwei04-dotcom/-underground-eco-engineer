# 雲端存檔測試頁（2026-11-08）

新增 `cloud-save-test.html`，在不修改 `LoginScene`、`SaveSystem` 或既有本機存檔的前提下，讓開發者使用專門測試帳號做 API 驗證。

- Supabase Auth 直接在瀏覽器登入，憑證不需要發給 ChatGPT。請只在自己控制的 GitHub Pages 網域使用此頁，並先確認網址與 HTTPS。
- 預設僅可讀取存檔是否存在，以及列出歷史版本筆數，不印出存檔 JSON。
- 測試寫入需要先確認雲端沒有現有存檔，且再次同意，才能建立一份 `_testOnly` 測試資料。
- 使用測試帳號寫入成功後，將檢查讀回資料與預期的 409 版本衝突。
- 本頁不允許覆蓋已存在的玩家存檔，沒有刪除或回復功能。
- 如果專案目前沒有正式登入入口，這個獨立頁面只作為測試用途；尚未代表真正的遊戲已完成登入或同步整合。
- 不要使用有真實遊戲進度的帳號測試寫入。
- `CloudflareSaveClient` 仍未接管正式遊戲，預設完全不影響舊存檔流程。

驗證需求：測試帳號成功登入；GET /v1/save 回傳 found=false；PUT 返回 revision=1；再次 GET 讀回測試標記；以 expectedRevision=0 再次 PUT 返回 409；GET /v1/revisions 有一筆紀錄。尚待人工端對端驗證。
