# Project OHM｜ECO V0.3j 五區生態箱可觀察微型群落與實際 Chromium 開發預覽

日期：2026-11-13（Asia/Taipei）  
狀態：**公開中立可運行的開發預覽與來源 QA；Chrome 三尺寸測試通過，GitHub QA 8/8。** 不是正式原創生物外觀、正式玩家生態箱或精確生物個體追蹤。

## 1. 需求與接續階段

前版 V0.3h 將原來「鼠婦、跳蟲、真菌都是同一種分解者」修為不同群落角色：腐生真菌與細菌屬於微生物分解者；鼠婦主要作為落葉碎屑取食者；跳蟲屬於食菌／微型消費者（實際物種可取食多種資源）；苔蘚與蕨類是光合生產者。V0.3i 再在真實 V0.3d 五區場景之上，把舊 V0.3a 權威分解結果和新 V0.3h 替代候選分開比較，**不疊加和不修改正式存檔**。

本次 V0.3j 將這些角色變成開發預覽**可見的、各具差異的活動線索**，同時保留 source V0.3d 光照/石頭/水量、有機物帳、時鐘與 V0.3i 的雙模型分流，讓開發者能看見群落與底材條件的關係，而不是憑空加入固定小蟲動畫。

## 2. 新增交付與可操作功能

- [**V0.3j 生態活動來源模組** `terrarium-micro-activity-v03j.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/terrarium-micro-activity-v03j.mjs)：
  - `previewTerrariumMicroActivityV03j` 讀取真正 `isValidTerrariumSceneGeometryV03d` 五區狀態、呼叫前版 `previewTerrariumSceneFoodWebV03i`，然後建立**每區三個獨立角色的可見提示狀態**；不改 V0.3a 中的真菌/鼠婦/跳蟲指數，不替微生物新增存檔欄位。
  - **鼠婦**：有合適環境、落葉且有群落代理時呈現 `litter_foraging`；乾燥時則成為 `under_shelter`／不顯示取食。這是**代表性視覺提示，不是量測到的每隻鼠婦攝食**。
  - **跳蟲**：有適當基質和可利用食物時呈現 `microbe_grazing` 或 `on_detritus`；只有開發者**明確開啟干擾測試**才有 `disturbance_jump`，不代表所有跳蟲每次都會跳。
  - **菌絲**：有腐生真菌代理、適當環境和有機材料才呈現 `filaments_near_organics` 或 `possible_decomposition`。來源 V0.3h 裡的微生物處理量同時受到**真菌與細菌合成指數**影響，**不能把處理單位全算成真菌實際工作量**。
  - 無來源有機材料或基質明顯不適時，拒絕假裝有大量分解與取食畫面。苔蘚保持植物角色，不被列為分解者。
  - `sampleTerrariumMicroActivityFrameV03j` 生成**八個固定相位**的 2D 像素位置指引，同一場景、種子和動畫相位可重現，並且**不會因每次畫面刷新而改變 V0.3d 生態鐘、帳本或群落指數**。標記數量是畫面預算，**不是個體數量或繁殖結果**。
- [**可實際操作的 Canvas 開發預覽頁** `terrarium-micro-activity-v03j.html`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/visual/terrarium-micro-activity-v03j.html) 與 [**瀏覽器互動程式**](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/visual/terrarium-micro-activity-v03j.mjs)：
  - 5 區中立土壤環境、落葉小片、植物和固定來源石頭；鼠婦（分節身體）、跳蟲（可跳開）、菌絲（分枝）的簡易像素圖示。
  - 四種開發控制：「模擬 +1 小時」「干擾測試開/關」「暫停／繼續」「重置」；只作用於**此網頁自己建立的中立場景副本**，沒有登入、外部網路請求、Google/GitHub/雲端存檔或玩家資料。
  - 每區顯示原 V0.3a 與候選 V0.3h 的三個有機物代理池對比、底材含水代理、植物生產者類別和候選碎屑/微生物處理量；兩套模型的輸出**不能加總**。
  - 對降低動態效果的系統偏好做自動暫停處理；手機較窄畫面以捲動的橫式 Canvas 顯示，資訊卡會轉成 2 或 1 欄。
  - 畫面**不含**任何歐姆原創虛構物種的獨特名字、專屬蛇皮、場景劇情或私人設計資料；僅中立土壤分解與程序化測試圖示。
- [**來源回歸測試** `terrarium-micro-activity-v03j.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/terrarium-micro-activity-v03j.test.mjs)：真 V0.3d 五區、V0.3i 真與影子、有機物帳、水/光場景仍為唯一來源；濕/乾、無有機材料、受干擾與未受干擾、八相位、非法來源資料 fail-closed；所有影格不修改世界時間或存檔。
- [**真 Chromium 三尺寸與按鈕 QA** `terrarium-micro-activity-v03j-browser-qa.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/terrarium-micro-activity-v03j-browser-qa.mjs)：使用實際 Chrome 開啟 ESM Canvas 頁面，驗證 DOM、圖片截圖格式/非空、按鈕模擬一小時及有機物守恆、切換干擾、暫停和重置。已接進原有 [`.github/workflows/public-snake-qa.yml`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/.github/workflows/public-snake-qa.yml) 的五區生態箱 Chrome job，**沒有增加第九個常駐工作**。

## 3. 已通過實際測試

[**GitHub Actions #43358902768**](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43358902768)：**8/8 個 jobs 成功**，其中新 V0.3j 真實 source-backed Node QA 成功；三種 Chrome viewport 截圖與按鈕也實際運作：

| Chrome 工程視窗 | 新 V0.3j Canvas 截圖 | JS 五區與按鈕 |
|---|---|---|
| 1280×800 寬橫式 | 133,160 bytes PNG | 通過 |
| 932×680 短橫式 | 104,797 bytes PNG | 通過 |
| 430×930 手機寬直式 | 61,373 bytes PNG | 通過 |
| Chrome 互動注入驗證 | - | 模擬 +60 分鐘、干擾測試、暫停、重置、不寫正式存檔均通過 |

這是**實際 Chromium**，但不等於 Apple iPhone Safari 真機或正式遊戲 UI/效能驗收；截圖是工程完整性檢查，不是人工確認每個像素都已達到美術品質。

五區來源測試：合成有機池總量原值 **8,550**，跑原來源一小時後仍 **8,550**；濕且有落葉的 zone_3 同時有鼠婦取食、跳蟲攝食與菌絲活動提示；乾燥 zone_0、無有機輸入 zone_2 不冒出虛假取食；中立影格某時刻只畫 **21 個代表性標記**（不是「21 隻生物」），八相位不改 source time。菌絲／跳蟲／鼠婦的合成來源資訊和分解池只做概念測試。

## 4. 科學背景與限制

- Utah State University Extension: [Springtails](https://extension.usu.edu/planthealth/ipm/notes_nuisance/springtails) — 跳蟲可攝食真菌、細菌與其他有機材料，活動/出現與水分、基質相關。
- Penn State Extension: [Introduction to Invasive Terrestrial Isopods](https://extension.psu.edu/introduction-to-invasive-terrestrial-isopods) — 陸生鼠婦通常需要潮濕、遮蔽的環境，並不是所有類群都以同一方式防禦。
- USDA NRCS: [Soil Biology Primer](https://www.nrcs.usda.gov/resources/education-and-teaching-materials/soil-biology-primer) — 土壤食物網由微生物、碎屑取食者、微型消費者與生產者共同作用，不能全部歸到同一個分解器。
- 來源依賴的 `bacteriaIndex`、動物的影格/步速、菌絲可見線條、溫度閘門、有機物轉移單位，**均是工程合成參數**，不是任何真實微型生物或原創物種的量測或飼養建議。
- 不模擬逐隻鼠婦或跳蟲的繁殖與死亡、逐菌種菌絲擴張、病原、土壤元素化學或完整真實分解鏈；不宣稱所有寵物排泄物都能由生態箱自動清除。
- 沒有新增玩家的每日義務、成長任務或登入懲罰；目前的對照面板僅供開發者查看，不當作玩家一定要管理的行政數值。

## 5. 後續品質工作

- 先在**私人**歐姆世界將中立角色對應到正式原創圖鑑與微型生物可觀察事件，不把此公開測試資料直接當玩家可見的生態秘密或實際種群。
- 動態原型下一步細化鼠婦腳步/身體段節、跳蟲被打擾時的原地移動/跳躍、菌絲邊緣微變化，但仍以 **source-driven 觸發**而非固定每秒亂數新行為。
- 開發者對照工具可再增加來源檢查、長期運行/離線預覽及「新候選接合」前的舊存檔遷移驗收；正式 V0.3a 核心公式目前未動。
- 既有蛇類 V0.9T/U 身體動態、V1.0A 暖土型像素皮方向不受影響。

**這輪已實際交付：有分工、有環境觸發、可操作的五區微型生物活動 Canvas 預覽與對應 Node/Chrome 實驗 QA，而非假稱正式遊戲已出現獨立微生物 AI。**