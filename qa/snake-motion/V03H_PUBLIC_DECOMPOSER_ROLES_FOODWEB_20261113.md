# Project OHM｜ECO V0.3h 生態箱微型食物網角色校正（公開中立 QA）

日期：2026-11-13（Asia/Taipei）｜實作性質：**獨立唯讀影子模型，不覆寫 V0.3a 權威生態核心、玩家存檔或正式遊戲**。

## 1. 修正的生物學分工

土壤有機質循環不等於「全部小蟲都是分解者」：

- **腐生真菌、細菌**：微生物分解者，參與分解有機化合物；不是所有真菌都屬腐生類。
- **鼠婦**：碎屑取食者、落葉破碎者，影響有機材料大小與微生物接觸；不能自動保證變成即時肥料。
- **跳蟲**：許多種類吃真菌、細菌，也可取食腐植與其他材料，兼有微型消費者／部分碎屑作用；不能一概視為「萬能清潔工」，也不能單憑牠們存在直接礦化。
- **苔蘚、蕨類**：有合適光照時進行光合作用的**生產者**與微棲地，不屬於分解者；地熱不是光合作用的光源。
- **甲蟲**：應依物種食性區分為碎屑取食、食菌、植食或捕食，沒有「所有甲蟲皆分解」的規則。

依據：
- USDA NRCS, [Soil Biology Primer](https://www.nrcs.usda.gov/resources/education-and-teaching-materials/soil-biology-primer)。
- USDA NRCS, [Soil Tech Note 11A Biological Underground Community](https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community)。
- Utah State University Extension, [Springtails](https://extension.usu.edu/planthealth/ipm/notes_nuisance/springtails)。
- [Effects of terrestrial isopods on woodland leaf litter decomposition](https://pubmed.ncbi.nlm.nih.gov/28312524/)（1987 年研究；鼠婦促進分解具有情境依賴，不能保證所有底材都加速）。

## 2. 既有專案資料兼容性

原有 [`terrarium-biota-v03a.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/terrarium-biota-v03a.mjs) 是**唯一權威**：它持有 `litterUnits`（落葉）、`fragmentedUnits`（碎屑）、`mineralUnits`（處理後有機質的工程代理）以及真菌/跳蟲/鼠婦指數，且共用 V0.2b 土壤水量與遊戲時鐘。舊分類 `decomposers` 及跳蟲直接進入代理池的係數將來需修正，但**不能直接破壞 V0.3a schema**。

本次新增 [`terrarium-foodweb-roles-v03h.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/terrarium-foodweb-roles-v03h.mjs)，包含：

- `getTerrariumFoodWebRoleV03h`：獨立公開中立分類表，適合未來 UI 以職責而非萬能「分解者」標籤呈現。
- `previewTerrariumFoodWebRoleFlowV03h`：只讀取**已驗證**的 V0.3a 生態快照，另以中立合成 `bacteriaIndex` 建立替代規則候選：
  - 鼠婦／落葉碎屑取食者：促進 `litter → fragmented`。
  - 腐生真菌＋細菌：促進 `fragmented → processedProxy`。
  - 跳蟲：作為微型消費者指數，**不直接給礦化倍率**；未來要模擬食菌與菌群反饋需再建立物種差異。
  - 苔蘚：不在此程式內增加植物覆蓋或產生有機物，光照生長仍遵守原 V0.3b 的光源和 V0.3a 植物群落權威。
- 任一環境條件下，這個**假設**的三池總帳守恆，不讓地熱、岩石或未輸入的有機物變出新的有機質。注意這是**工程代理池**，**不是**真實碳/氮/磷守恆或呼吸 CO₂ 模型。
- 所有溫度、濕度、菌群與碎屑係數皆是**遊戲測試值**，不可作真實土壤分解速度或爬蟲飼養標準。

## 3. 新來源實際測試

[`terrarium-foodweb-roles-v03h.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/terrarium-foodweb-roles-v03h.test.mjs) 由真正 V0.3a 生成中立生態箱來源，測試純微生物、純鼠婦、純跳蟲、乾燥、完全沒有有機來源以及異常權威帳本資料的 fail-closed。

**[GitHub Actions #43354791709](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43354791709)：8/8 Jobs 成功**，其中新 V0.3h 的 Node 來源測試真實通過；其它 7 個 Chrome QA 是以前的畫面與生態箱回歸，**沒有**新增的 V0.3h 專屬手機 Safari 視覺成果。

可重播的**中立工程代理數字**：

| 影子對照（24 合成時數） | 結果 |
|---|---|
| 合成較濕、真菌＋細菌＋鼠婦群落 | 落葉→碎屑 648 單位、碎屑→處理池 322 單位 |
| 只有鼠婦，沒有真菌/細菌代理 | 落葉→碎屑 998 單位，碎屑→處理池 **0** |
| 只有跳蟲，沒有微生物／鼠婦代理 | 不憑空產生處理池或「自動清潔」 |
| 沒有任何有機材料來源 | 整體來源與輸出仍為 **0** |
| 乾燥的中立環境 | 本替代模型的碎屑／處理池轉移暫停 |
| 初始有機代理池總和 10,630 | 分流後仍 **10,630**（僅限工程帳本） |

以上數字是合成壓測，不代表真實經過一天的鼠婦取食量或微生物分解率。**V0.3a 實際原演算法沒有被本模組替換，也沒有在正式遊戲中由上述 648／322 驅動。**

## 4. 尚未完成

- 把 V0.3h 的替代候選經過正式 schema 遷移與回歸提拔至 V0.3a 新權威版本（包括獨立細菌指數、新備份/舊存檔、觀察日誌），這次沒有做。
- 真正微生物生物量、菌食反饋、糞便/腐敗獵物清潔限制、空氣中的碳循環、對植物肥力的量化反應；不能把 `mineralUnits` 直接當植物可用氮。
- 在實際歐姆原創生態箱建立對應物種圖示、圖鑑與真正可觀察分解事件；公開中立庫不存放私人設計。
- 專屬像素圖修圖以及新版本橫式 Chrome/iPhone Safari 體驗驗收；已通過的舊 Chrome 測試不代表新 UI 已可見。

**成果總結：已新增可執行且驗證成功的微型食物網角色校正和有來源的分解影子規則；保留現有核心，先校正，後逐步安全接合。**