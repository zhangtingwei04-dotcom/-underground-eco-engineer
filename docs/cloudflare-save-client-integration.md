# Cloudflare 存檔客戶端整合階段（2026-11-08）

## 已加入
- `src/systems/cloudflare-save-client.js`：獨立的 Cloudflare Worker API client。
- 從已有 Supabase 登入 session 取得存取憑證，請求時用 Bearer header 傳送。
- 支援 `load()`、`save(save, expectedRevision, schemaVersion)`、`listRevisions()`。
- 單次上傳 512 KiB 上限；網路及登入異常回傳明確錯誤。
- 409 版本衝突**不得自動重試或覆蓋**；跨裝置較新資料必須經過對照和明確決定。

## 尚未完成與安全界線
- **此模組尚未接入 `SaveSystem`，正式遊戲仍保留原來的本地 / Supabase 存檔流程。**
- 尚未以實際登入帳號驗證寫入、讀取、版本衝突及雙帳號隔離。
- Cloudflare `GET /health` 與未登入 `GET /v1/save` 已由瀏覽器截圖確認；D1 三張資料表已由管理 API 確認。
- 目前沒有自動雲端同步，也尚未提供回復舊版存檔 endpoint；`save_revisions` 是歷史紀錄，復原流程仍需設計。
- 下一步在獨立測試帳號驗證 API（不要求玩家傳送密碼或 token 給開發者）；驗證通過後加入可關閉的 feature flag，逐步啟用。
- 若多個系統各自 new Supabase client，要確認共用相同登入 session；不要自動將訪客存檔轉移到任意登入帳號。
- 不要對其他玩家開放存檔的讀取、下載和恢復。
