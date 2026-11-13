# Project OHM V0.9W｜蛇類拒食、消化、營養分配與休息期成長的公開中立 QA

日期：2026-11-13（Asia/Taipei）｜狀態：**公開中立合成程式／來源測試**；不是玩家正式遊戲、不是特定實際蛇種飼育處方、不是疾病診斷。歷史專案名稱或原創生物設定不在此庫公開。

## 使用者同意的遊戲原則

成長不是「餵一次、過時間就直接伸長身體」。合理的機制是：

```text
玩家提出食物 → 蛇有自己的食慾、可接受或拒食
    ├─ 拒食 → 記錄可見行為，食物未吃、無消化、無營養、無成長，不扣好感
    └─ 吃下 → 胃內內容物；尚未轉成營養，不改骨架
               ↓ 合適的時間、溫度與內部狀況
            消化和吸收（同時產生能量成本）
               ↓
            生理維持 → 能量儲備 → 可累積的成長潛力
               ↓
            V0.9V pendingGrowth（移動中仍鎖體長、骨長與局部半徑）
               ↓
            安全休息或蛻皮完成後休息
               ↓
            V0.9V 小步體型增長＋24 節姿勢/頭頸/整體網格/場景檢查
```

拒食可以因蛻皮前的食慾下降、環境干擾、溫度不適、剛進食尚在消化、不合適食物、季節／繁殖狀況及個體差異而出現；但**拒食不能被當作必然生病，也不保證不會有健康問題**。玩家應能觀察到「沒吃」，不能無故由 AI 得到精確的隱藏病因。**只有環境不合適或存在持續異常與體況惡化線索，才提供保守觀察提醒**；不能靠短時間餵食按鈕刷成長數值。

## 公開來源與證據強度

| 來源 | 可支持的科學/臨床背景 | 不可直接推論 |
|---|---|---|
| [VCA Animal Hospitals — Feeding Pet Snakes](https://vcahospitals.com/know-your-pet/snakes---feeding) | 食慾減少可與新環境、干擾、溫度、蛻皮、繁殖、季節或健康問題有關 | 所有蛇的拒食機率、精確多久應餵一次 |
| [VCA — Common Problems in Pet Snakes](https://vcahospitals.com/greenback/know-your-pet/snakes-problems) | 蛻皮、繁殖季、環境溫度、壓力、食物種類／大小會影響食慾 | 可以單靠拒食推斷疾病 |
| [WSAVA / VIN — Causes, Diagnosis and Treatment of Reptile Anorexia (2014)](https://www.vin.com/apputil/content/defaultadv1.aspx?id=7054670&pid=12886) | 正常生理、照護與醫療因素需區分；溫度上下限與晝夜活動時段的重要性 | 溫度愈高就愈好、固定次數拒食就是疾病 |
| [Merck Veterinary Manual — Routine Health Care of Reptiles](https://www.merckvetmanual.com/all-other-pets/reptiles/routine-health-care-of-reptiles) | 部分蛇蛻皮前食慾下降，且蛻皮是外層皮膚更新 | 每次蛻皮都代表立即長大 |
| [Tattersall et al. 2004, JEB, doi:10.1242/jeb.00790](https://pubmed.ncbi.nlm.nih.gov/14718501/) | 蛇類消化有後食代謝成本，部分蛇會調整偏好體溫 | 適用每種蛇的消化精確時數 |
| [McCue 2008, Specific Dynamic Action Review](https://pubmed.ncbi.nlm.nih.gov/18597096/) | 消化成本與餐食組成、大小、體況和環境相關 | 可以直接把本文數字作所有生物的遊戲固定倍率 |
| [2023 Children's python 水分和消化期偏好溫度研究](https://pubmed.ncbi.nlm.nih.gov/37455645/) | 水分狀態可影響消化期間溫度行為 | **無法證明低水分會按照本原型的係數降低營養吸收**，原文亦指出消化/吸收實際影響待研究 |

**所有以下數值僅為可測的合成工程 fixture，不是臨床或真實生理參數**：正常情境測試的拒食基礎機率、蛻皮前／干擾／季節加權、48「合成小時」消化期、0.8 合成吸收比例、成本率與成長轉換率。各虛構物種未來需獨立研究並校正，不能以此提供真實寵物餵食或醫療建議。

## 程式與安全界面

- [`snake-feeding-digestion-v09w.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-feeding-digestion-v09w.mjs)
  - `createSnakeFeedingLabV09w`：只有中立合成的個體 ID、假設能量儲備、目前胃中能量、世界小時、待用成長潛力、拒食次數與有限事件回執，**不寫正式玩家存檔**。
  - `offerSnakeFoodV09w`：同一個 offerId 與同樣參數可安全重放，不會重複取得食物或營養；同一 ID 改變參數拒絕。**食物不合適、過大、環境無法安全進食**為確定拒絕；其餘如蛻皮前、干擾、季節、繁殖依合成個體種子給出可重播的不同拒食機率，而不是所有蛇每次蛻皮都拒食。未吃下沒有胃內容物、無吸收、無成長，也不扣與玩家的關係數值。**即使已接受，僅提出「庫存應由正式宿主驗證後扣除」的要求；此模組自己不扣玩家物品**。
  - `advanceSnakeDigestionV09w`：經過合成世界時間，才會從胃內容物產生吸收；先分配基本生理維持，剩下才分給內部儲備及待用成長潛力。溫度與水分使用的是**合成調節值**，不是特定生物研究換算。沒有胃內容物時，純經過時間不能憑空產生成長。營養不足時可由內部儲備支持維持，不是所有儲備都能直接變成骨長。
  - `queueAbsorbedGrowthForSafeRestV09w`：把**真正完成消化吸收後**剩下的成長潛力，經過單次及總量安全上限，交給**已存在的 V0.9V `pendingGrowth`**。即使此時正在移動，也只修改待用進度；絕不執行 V0.9V 幾何變形、V0.9T 骨架縮放、V0.9U 網格或玩家存檔。
- [`snake-feeding-digestion-v09w.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-feeding-digestion-v09w.test.mjs)：100 種中立合成個體種子對照普通／蛻皮前／強干擾／季節／繁殖情境，另測確定性拒食、重複 ID、防篡改、消化中拒食、環境不適的消化暫停、消化後才產生待用成長、反覆拒食但體況正常不自動標病、體況惡化或其他警訊才提高觀察優先級，最後**完整接到 V0.9V 休息時才改長度的 1,617 頂點透明網格 QA**。

### 尚未實作的功能

- 正式物種個體營養、真正餵食物品庫存交易、獵物大小判準、食物喜好、人工生物生態動態、行動點與「拒食」頭部動作動畫。
- 消化中的腹部局部鼓起／消退、排泄／水分動態、長期身體體況、蛻皮自主行為、臨床疾病指標、繁殖與季節的真正時間來源。
- 同一個個體與正式玩家存檔的身分綁定、防作弊事件簽章、雲端／離線 48h 一致性、手機 Safari 專屬真機測試。
- **V0.9V 已認證的休息期成長機制會繼續保留，**絕不能因 V0.9W 消化成功就立即在移動途中加長骨架。
- 不加外皮、不增加付費服務、不公開私人原創生物設定與角色故事。

## QA 狀態

[GitHub Actions — Public OHM Snake and Terrarium QA](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions)；本輪新測試的確切工作流結果，以最新程式/測試 commit 對應之 run 為準。舊 Chrome 視覺測試不能代表 V0.9W 餵食動畫已完成（本輪沒有製作動畫）。

本輪代表**可測的工程行為模型**，不能宣稱 48 小時就是所有真實蛇消化週期，或因連續拒食就能確診。
