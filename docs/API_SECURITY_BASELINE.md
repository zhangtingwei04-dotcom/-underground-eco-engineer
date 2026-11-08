# API 安全防護基礎 v0.1（2026-11-08）

## 目前完成
- 建立 `cloudflare/security-guard.mjs`：不依賴 Cloudflare API 的純 JavaScript 請求檢查。
- 定義可用路由與 HTTP 方法，拒絕未知路由、錯誤方法。
- 寫入操作只接受 JSON，限制 Content-Length（存檔 512 KiB；還原 2 KiB）。
- 預留 `SAVE_RATE_LIMITER` 介面，讓以後可接 Cloudflare Workers Rate Limiting binding。
- 新增 `tests/security-guard.test.mjs` 供 Node.js 及 GitHub Actions 自動測試。

## 目前未完成／不能誤稱完成
**這些檢查目前是原始碼基礎模組，尚未接入已部署的 `cloudflare/worker.js`；正式 API 尚未因此啟用新規則。**
**未設定 SAVE_RATE_LIMITER binding，目前沒有新的 429 限流功能。** 現有驗證流程與 D1 不作更動。
現在的存檔 Worker 已有身分驗證、同源規則、修訂版衝突及寫入大小檢查，但不等同於完整 WAF、嚴格的全域速率限制或抗作弊系統。

## 啟用前的驗證順序
1. 在測試 Worker 部署組合後的 security-guard + worker，先驗證 `GET /health`、CORS preflight、正常存檔讀寫、還原、409。
2. 加入限流 binding 的話，先以溫和閾值測試，觀察合法玩家同步頻率，再調整政策；切勿直接對所有 API 使用過低上限。
3. 測試惡意/錯誤請求：不支援的方法、非 JSON 上傳、超大封包、無憑證、其他帳號訪問。
4. 驗證 429 回應與 Retry-After、回滾流程。
5. 確認全部通過後，再部署到正式 Worker。
6. 之後有自有網域時，評估 Cloudflare WAF、自訂規則、Bot 防護與緊急應對。
7. 正式發行前另外完成資料庫權限審查、身分驗證、經濟系統安全、獨立備份演練及依賴套件檢查。

## 成本控制
初期使用目前既有服務與免費 CI，不購買付費防火牆，也不保證未來所有限流方案都免費。若需更嚴格計數，評估 Durable Objects 或其他支援的 Cloudflare 方案，確認實際費用後才決定。

## 模組設計原則
安全規則（純邏輯）和 Cloudflare 平台實作（binding）分開。前端永遠不包含服務端密鑰；所有玩家存檔權限由後端判斷。公開的源碼不是私密保護措施。
