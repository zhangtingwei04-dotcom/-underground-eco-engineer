# 《鱗片與種子》架構與安全基礎盤點（2026-11-08）

## 結論
目前是**能持續開發的 Phaser 網頁遊戲原型**，而不是已完成的獨立遊戲引擎。已有場景、飼養、生態、NPC、研究、存檔與雲端測試模組，但部分程式仍直接使用 `Phaser`、`window`、`localStorage`、外部服務。因此不能宣稱整個核心已引擎獨立、所有系統已整合、或安全性已通過正式發行審查。

## 本次已建立「可執行」的最小獨立核心
- `src/ohm-core/world.mjs`：無 Phaser、DOM、window、網路、IndexedDB、Supabase、Cloudflare 依賴的純 JavaScript 世界狀態 + 指令處理。
- `createWorld` 建立明確 schemaVersion、世界 ID、目前場景與時鐘。
- `dispatchWorld` 處理 `TRAVEL`／`OBSERVE`／`TICK`，回傳新狀態及事件，不直接修改輸入狀態；不使用玩家真實存檔。
- `validateWorld` 拒絕不合法 ID、版本、時鐘、觀察紀錄及未知指令。
- `tests/ohm-core.test.mjs`：11 項可在 Node 或瀏覽器執行的基本驗證。
- `ohm-core-test.html`：GitHub Pages 可開啟的互動演示，獨立於正式遊戲頁面。
- 這是**第一個獨立可跑的規則核心切片**，未接管正式 Phaser 遊戲，不等同於自製渲染引擎完成。

## 長期架構（保留逐步替換空間）
```text
  Game UI / Input: Phaser today | Ohm Renderer in future
                   ↓ commands/events
  Ohm Core: deterministic world state & rules, no platform APIs
                   ↓ ports (interfaces)
  Platform Adapters: browser/desktop/mobile; storage/auth/cloud
                   ↓
  Supabase Auth + Cloudflare Workers/D1 (server-side ownership enforcement)
```

依賴方向：Core 不得 import UI、Phaser、網頁儲存、資料庫 SDK 或外部服務；呈現層依賴 core 的公開介面。世界存檔 schemaVersion 需可遷移，不允許未知版本直接重置。

## 目前重點風險與處理優先級

### 發行前必須解決（高）
1. **存檔管理分裂**：`save-system.js`、`cloud-save-system.js`、`terrarium-save-system.js` 與新的 Cloudflare 客戶端並存；應確立單一資料所有權與明確遷移規則。正式同步目前未啟用。
2. **帳號與後端隔離**：Cloudflare 的 Supabase token 驗證已在專用測試帳號測過，但尚缺完整雙帳號隔離、失效憑證、批次與競態條件測試；任何 player_id 不可作為授權依據。
3. **完整性與反作弊**：目前伺服器主要控制存檔擁有者及修訂版，不代表已驗證每個遊戲數值或防作弊。若未來有交易、玩家互動或排行榜，必須定義伺服器可信任的規則。
4. **資料損失 / 還原**：D1 歷史版本不是獨立異地備份；尚需匯出、復原、保留策略、負載測試及定期備份演練。
5. **前端供應鏈**：`index.html` 的 Phaser 與 Supabase SDK 依 CDN 引入，後者使用 `@2` 未鎖定精確版本；需固定依賴版本並評估 SRI/CSP、資源服務可靠性。
6. **公開原始碼**：GitHub repository visibility 為 public，前端程式及提交的素材可被讀取。不得存入密碼、service_role key、私鑰、使用者存檔或商業秘密。評估後續私有倉庫／授權聲明／素材管理策略。

### 優先改善（中）
7. **Phaser / window 全域依賴**：場景與舊系統有全域值直接取用，未建立完整 adapter；往後新核心功能應優先在 `src/ohm-core` 製作，經 adapter 注入，而不是在核心內直接呼叫 Phaser。
8. **跨裝置世界時間**：離線模擬會參考裝置時間，需定義可信時間基準、重複結算保護與遷移策略。
9. **瀏覽器安全標頭**：靜態站點需要檢查 CSP、點擊劫持與第三方程式依賴；目前未完成實際部署標頭盤點。
10. **敏感資料最小化**：日誌不可記錄玩家 token、密碼、完整存檔；考慮私隱、刪除、資料保留和匿名化營運。
11. **權限管理**：開發用 Cloudflare OAuth 曾開啟 Full access；建置後應調整為最小必要權限、敏感操作需確認。
12. **Supabase Auth 顧問警告**：已啟用 public schema 的 `player_saves`、`player_save_backups` RLS；但 security advisors 報告 `Leaked Password Protection Disabled`。參考 https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection ，依方案可用性及成本評估啟用，不擅自宣稱已修正。
13. **部分文檔過期**：README 的待辦項目尚未更新成目前實作狀態，應依程式及測試結果更新，避免把設計完成誤認功能完成。

## 開發守門規則
1. 每次新增核心功能，先定義命令、輸入輸出、資料 schema、錯誤與安全邊界。
2. 至少有一個純核心測試，且不需要 Phaser/瀏覽器即可執行。
3. 需要瀏覽器平台功能時，透過 adapter；核心不得保存任何 access token。
4. 任何存檔修改要有版本衝突防護、備份與失敗恢復路徑。
5. 發布前要通過端對端登入、兩個不同帳號隔離、離線/重連、CORS、備份還原、資安與性能測試。
6. 尚未通過測試的模組需標註「已寫入程式／待實測」，不可宣稱可正式營運。
7. 成本維持免費優先；正式推出前逐項盤點費用及服務額度。

## 不應立刻做的事
- 不重寫全部現有系統，不移除 Phaser。
- 不把所有設計文件當作已實作。
- 不要求現在就完成新的渲染器、物理引擎或多人伺服器。
- 不將真實玩家資料導入初版 Ohm Core demo。

## 下一次技術里程碑
- 讓正式 Phaser 場景透過最小 adapter 呼叫 Ohm Core（受控示範，不改真實存檔）；
- 建立單一存檔 schema 驗證與遷移規則；
- 在測試／CI 中持續檢查核心能獨立執行。
