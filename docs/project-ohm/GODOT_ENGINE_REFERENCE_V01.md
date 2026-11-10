# 歐姆計劃｜Godot Engine 公開引擎技術參考 V0.1

- 登錄日期：2026-11-10
- 類別：開源遊戲引擎／軟體架構／編輯工具
- 研究對象：Godot Engine
- 狀態：**已核對官方架構與授權文件／未移植任何原始碼／未更換主遊戲引擎**
- 歐姆計劃定位：**Ohm Archive 工程技術研究來源**；將來經獨立實作與測試，才可成為 Ohm Core／Ohm Engine 模組

## 一、官方來源

1. 引擎程式碼：https://github.com/godotengine/godot
2. 引擎授權：https://godotengine.org/license/
3. 引擎架構概覽（穩定版）：https://docs.godotengine.org/en/stable/engine_details/architecture/godot_architecture_diagram.html
4. 場景／節點的基礎概念：https://docs.godotengine.org/zh-tw/4.x/getting_started/step_by_step/index.html
5. 訊號事件與解耦：https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html
6. 引擎原始碼架構導覽：https://docs.godotengine.org/en/stable/engine_details/architecture/index.html
7. Godot 的授權說明：https://docs.godotengine.org/en/stable/about/complying_with_licenses.html
8. 第三方元件授權清單：https://github.com/godotengine/godot/blob/master/COPYRIGHT.txt

## 二、授權與素材保護

- Godot Engine **主體採 MIT／Expat 授權**，允許閱讀、學習、改作、整合與商業發行，但散布來源或其實質部分時，須保留適用著作權及 MIT 授權聲明。
- Godot 內含**各自具有授權要求的第三方函式庫與素材**；使用時必須逐項確認其 LICENSE／COPYRIGHT，不因 Godot 主體是 MIT 就推定所有檔案皆可自由重用。
- Godot 官方說明文件的授權與 Godot 程式碼授權不同；若有複製文件或圖片，應另行核對其授權。此檔只保存自寫摘要與來源連結，不複製原圖與大量原文。
- 研究「節點樹、事件機制、編輯器架構」等技術**概念**後寫出自己的程式，與直接複製原始碼不同；若將來實際納入 Godot 程式碼，需建立來源／commit／LICENSE 紀錄並遵守義務。
- 原創遊戲《鱗片與種子》與 Project OHM 的名稱、世界觀、藝術素材需獨立管理；公開 GitHub 不提交未公開原創資料或敏感金鑰。
- 本檔不是法律意見；實際散布時以涉及檔案的授權文字為準。

## 三、可研究的架構與歐姆計劃對應

| Godot 技術面 | 原理 | 歐姆計劃目前的對應 | 可做的小實驗 |
| --- | --- | --- | --- |
| SceneTree／Node | 可重用場景與物件的樹狀組織 | `src/ohm-core/scene-registry.mjs` 只有場景描述與導航；**不是完整 Node 樹** | 研究場景組合、生命週期與事件；避免過早重造整套節點框架 |
| Signals | 物件以訊號傳遞事件，減少互相直接呼叫 | `src/ohm-core/world.mjs` 已回傳事件，但還沒有等同 Godot 的完整訊號系統 | 比較簡單事件佇列、觀察者與現有 Core 事件；先驗證必要性 |
| Core／Scene／Server／Drivers／Platform | 規則、場景、渲染／物理／音訊、設備平台分層 | 現有 `src/ohm-core/`、`src/ohm-platform/` 與 Phaser 呈現層 | 建立最小 adapter，讓同一規則可在不啟動 Phaser 的環境下驗證 |
| 資源與序列化 | 物件／資源可保存、載入與重用 | 跨裝置存檔與資料 schema 仍在整合中 | 測試版本化 JSON、資源參照與按需載入，不取代現有存檔 |
| 2D／3D 動畫與攝影機 | 變換、軌跡、動畫組合與畫面呈現 | 地熱纜車 S02-B v09、蛇類動態研究 | 先做純幾何車廂沿路徑移動及窗外視差，保留 Phaser／Three.js 技術試作 |
| 編輯器與檢視器 | 可視化場景、參數與資產編輯 | 已有 `editor.html`、`workbench.html` 的原型頁面；功能需逐項查證 | 以需求驅動逐項增加檢視工具，不先重製整套 Godot 編輯器 |

## 四、研究次序與不做事項

**第一批：**
1. 官方 Godot 架構圖與三層分離；對照 Project OHM 既有 Core / Platform。
2. 節點與場景的重用方式；哪些值得納入未來 Ohm Engine，不破壞現有 Phaser。
3. Signals 的觀察者概念；評估遊戲中 NPC、寵物、地圖事件是否真的需要通用事件總線。
4. 資源／動畫路線；優先用地熱纜車的純幾何測試觀察利弊。
5. 最後才評估編輯器、低階渲染或完整場景樹。

**目前不做：**
- 不把現有 Phaser 原型改寫成 Godot 專案。
- 不大量複製 C++ 引擎程式、Godot 文件、官方圖片或第三方素材。
- 不宣稱 Ohm Engine 已具有 Godot 同等完整功能。
- 不因研究大型引擎就把所有新技術打包進遊戲，維持行動裝置效能與按需載入。
- 不因 Godot 本身免費而忽視第三方資產授權。

## 五、接受標準

- 每個擬採用的設計需列出：場景需求、現有方案、Godot 的工程啟發、獨立試作位置、測試、效能、跨平台與存檔影響。
- 有明確證據顯示新方案在可維護性或功能上優於現有做法，才整合到遊戲。
- 來源、版本、授權、個別檔案是否為第三方內容、修改紀錄都可追溯。
- 研究資料保存在 Ohm Archive；只把成熟模組和必要數據帶入 Ohm Core／Ohm Engine。
