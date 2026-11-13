# Project OHM｜ECO V0.3i：既有五區生態箱 × 微型食物網修正版的唯讀對照

日期：2026-11-13（Asia/Taipei）  
狀態：**ECO V0.3i 公開中立來源 Node QA 8/8 已通過**。這是場景級實際接合的**對照與驗證**，不是已將 V0.3h 分解群落候選係數寫入正式運作核心。

## 目的

原生態箱 V0.3a 已擁有五區場景來源、有機質落葉／碎屑／處理後代理池，與唯一 V0.2b 水量時間、V0.3b 植物光照及 V0.3d 场景幾何；ECO V0.3h 則另提出更接近生態職責的**微生物分解者（真菌＋細菌）、鼠婦碎屑取食者、跳蟲食菌消費者、苔蘚/蕨類光合生產者**分工。

本輪使用者已同意「更新像素概念板的微型生物文字，接著逐步把經驗證的分解循環接進生態箱」，因此新增 V0.3i：不破壞舊玩法，從**同一份實際 V0.3d 生態場景**把舊/新兩種模型分開算，辨認差異，先驗證結果再決定權威系統升級。

## 交付內容

- [`terrarium-scene-foodweb-preview-v03i.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/terrarium-scene-foodweb-preview-v03i.mjs)：輸入已通過 `isValidTerrariumSceneGeometryV03d` 的場景，使用**真實 V0.3d `advanceTerrariumSceneGeometryV03d` 函數**推進 1～4 合成小時，獲得既有權威場景的完整下一步；另外以相同起點/時段，對每區執行**唯讀** `previewTerrariumFoodWebRoleFlowV03h`，產生另一份建議池子。兩組輸出**不能合併、不能重複計入營養、不能擅自提交到正式生態核心**。
- [`terrarium-scene-foodweb-preview-v03i.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/terrarium-scene-foodweb-preview-v03i.test.mjs)：建立實際五區 V0.3d 場景與光源/石頭遮蔽、乾燥區、苔蘚/蕨類/無植物區、既有有機物及水量帳；確認 V0.3i 的權威結果**逐欄完全等於單獨呼叫 V0.3d**，新候選只是從初始池子算，沒有二次加進來源或偷改 scene。再測 27+33 分鐘分段與單一 60 分鐘一致、原有帶來源落葉事件仍只加一次、非法時鐘或 5 區指數錯誤必須 fail-closed。
- 依賴前版 [V0.3h 中立分解群落角色分類與影子演算法](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/V03H_PUBLIC_DECOMPOSER_ROLES_FOODWEB_20261113.md)。

## 已通過的 CI

[**GitHub Actions #43356462406**](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43356462406) **8/8 jobs 成功**，其中 Node 來源套件確實執行 `terrarium-scene-foodweb-preview-v03i.test.mjs`，其餘 7 個 Chrome 工作是原有景觀、生態箱和舊版蛇動畫回歸，**並不是這張新概念板的文字、橫式介面或 iPhone Safari 視覺驗收**。

真實執行的中立合成一小時輸出：某個潮濕、較多落葉的區域（zone_3）：

| 工程有機池（單位不代表真碳或真營養） | 舊 V0.3a 權威結果 | V0.3h 唯讀替代結果 |
|---|---:|---:|
| `litterUnits` | 3,983 | 3,989 |
| `fragmentedUnits` | 715 | 705 |
| `processedProxyUnits`（舊名 `mineralUnits`） | 2 | 6 |
| 工程代理總和 | **4,700** | **4,700** |

場景五區**總有機代理池 8,550**，權威推進後仍 **8,550**；石頭遮蔽持續影響 V0.3d 真正的植物光照，V0.2b 水量總帳沿用原程式，細菌指數僅存在於此對照函式參數與影子結果中，**未被新增至玩家存檔或原 V0.3a schema**。

## 科學與實作限制

1. **角色不等於每一隻個體的全部食性**：跳蟲可吃微生物及部分腐植，鼠婦也可能與微生物共食；首版影子模型依「主要角色」做工程假設，不是完整群落交互作用，也沒有完整微生物族群、自身生物量、呼吸、CO₂／氮磷元素流。
2. **合成係數不是自然分解時數**：上表 1 合成小時的 3,983 / 3,989 等數字，只為偵測程式差異和源頭帳本有無被污染。不能向玩家宣稱一小時內鼠婦實際破碎了多少克落葉。
3. **材料必須有來源**：真空、地熱、礦物和苔蘚圖像不能憑空生出落葉池；僅權威場景有帶來源的外部事件才增加有機材料。
4. **圖鑑和介面未實際入版**：此次已另行生成更新版像素概念板，但不是新 V0.3i 專屬 Phaser/iPhone Safari 成品；公開 QA 不含任何原創物種圖、私人像素花紋和人物細節。
5. **兩套模型結果不能當成雙份生態作用**：未來若要提拔新微生物分工成權威，需單獨設計 schema 升版、舊存檔資料遷移、重播/離線幂等、跨平台回歸，再取代舊 V0.3a 相關係數；不得在現版直接疊加 V0.3h 的作用。
6. **本項不改正式遊戲、玩家保存檔或蛇骨架/外皮**，也未新增訂閱費用。

此版正式交付的是**使用真五區場景作為唯一資料源的生態食物網雙模型安全對照**，而不是生態物種參數校準或正式玩家世界分解更新。