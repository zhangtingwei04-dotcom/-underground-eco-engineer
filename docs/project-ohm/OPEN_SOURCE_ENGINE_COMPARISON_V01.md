# 歐姆計劃｜公開遊戲引擎／框架比較與研究路線 V0.1

- 登錄日期：2026-11-10
- 用途：Ohm Archive 開源工程參考與自研引擎探索
- 研究狀態：**已核對一批專案的官方 GitHub/授權頁；尚未逐一執行其範例、測量效能或移植程式碼**
- 原則：不因研究外部引擎而放棄《鱗片與種子》已使用的 Phaser。研究先行、按需試作、保留既有功能、免費優先、注意商用授權和第三方素材。

## A. 前期優先研究

| 優先 | 引擎／框架 | 專案官方來源 | 主體授權（個別內容另核對） | 值得學習的機制 | 與 Ohm Engine 的關係 |
| --- | --- | --- | --- | --- | --- |
| P1 | Babylon.js | https://github.com/BabylonJS/Babylon.js | Apache-2.0 | JavaScript 3D、場景圖、攝影機、光影、動畫及物理介面 | S02-B 纜車、洞穴攝影機和 3D／2D 共存 |
| P1 | PlayCanvas Engine | https://github.com/playcanvas/engine | MIT | 網頁輕量執行核心、Entity/Component、資產管理、WebGL/WebGPU | 手機 Web 效能、模組與資料載入，長期跨平台介面 |
| P1 | Bevy | https://github.com/bevyengine/bevy | MIT 或 Apache-2.0（雙授權；外部素材例外） | Rust、ECS、System 排程、資料導向實體與元件 | NPC 排班、動物個體和環境規則；架構觀念優先於移植 Rust |
| P1 | Cocos Creator Engine | https://github.com/cocos/cocos-engine | runtime 核心 MIT；**Creator 編輯器另有使用條款** | C++／TypeScript、2D／3D、原生手機與 Web 適配、動畫和渲染 | 手機平台策略、2D/3D 場景共用和資產生命週期 |
| P1 | GDevelop | https://github.com/4ian/GDevelop | 核心／GDJS／newIDE／Extensions 的主要內容 MIT；名稱與商標獨立 | 視覺化事件、條件流程、IDE 和擴充插件 | NPC 事件工具、任務條件與歐姆實驗室編輯器 |

### 後期研究或特定用途

| 優先 | 引擎／框架 | 官方來源 | 主體授權 | 可研究內容 | 現階段限制 |
| --- | --- | --- | --- | --- | --- |
| P2 | Stride | https://github.com/stride3d/stride | MIT（部分外部檔案例外） | C# 引擎模組、資產管線、編輯器、3D 渲染 | 技術堆疊與現有 JS 較遠；只研究架構 |
| P2 | MonoGame | https://github.com/MonoGame/MonoGame | Microsoft Public License（Ms-PL），含獨立授權依賴 | 基礎遊戲循環、渲染接口、跨平台內容管線 | C# 與桌面／手機方向；目前無需移植 |
| P2 | raylib | https://github.com/raysan5/raylib | zlib/libpng | 簡潔遊戲循環、輸入、繪圖、相機與底層 2D／3D API | 適合研究「最小自研引擎」應具備什麼 |
| P3 | Open 3D Engine（O3DE） | https://github.com/o3de/o3de | Apache-2.0 或 MIT 擇一（細節、第三方文件／元件另核） | 大型引擎模組、渲染、資源管線、外掛/Gem 架構 | 規模龐大、建置成本高，初期只作架構參考 |
| P3 | Defold | https://github.com/defold/defold | **Defold License（source available），非直接等同 MIT/Apache** | 輕量、2D、跨平台、Lua 腳本、封裝流程 | 可學習公開架構，不能不查授權就視為一般開源程式碼 |
| P2（繪圖庫，非完整引擎） | PixiJS | https://github.com/pixijs/pixijs | MIT（依實際版本另核） | 高效能 2D 渲染、批次繪製、紋理、UI 特效 | 與 Phaser 的繪製能力比較，未來渲染器候選 |

### 已列入歐姆計劃的既有研究

- **Godot Engine**：https://github.com/godotengine/godot — MIT 為主，場景與節點、Signals、核心／平台／呈現分離；詳見 [Godot Engine 參考 V0.1](./GODOT_ENGINE_REFERENCE_V01.md)。
- **Phaser**：https://github.com/phaserjs/phaser — 現階段主遊戲使用的 HTML5 2D 遊戲框架，MIT；不立即替換。
- **Three.js**：https://github.com/mrdoob/three.js — Web 3D 程式庫，MIT；已在 [地熱纜車研究](../research/transport/CABLE_TRAIN_MOTION_RESEARCH_INDEX_V01.md) 規劃作為曲線運動試作參考。

## B. 依歐姆計劃功能選擇研究對象

1. **纜車沿固定路徑轉彎**：優先 Three.js（現有路線）、Babylon.js（相機／場景系統），PlayCanvas（完整 Web 引擎的 Entity/Component 與渲染管理）。先做 3 秒純幾何可視驗證，再比較功能與效能。
2. **NPC、動植物及生態狀態**：Bevy 的 ECS 作為架構概念；與現有 Ohm Core 的資料及系統設計比較，不先引進 Rust。
3. **場景、工作台、事件編輯器**：Godot 的 Node／Signal、GDevelop 的事件編輯，以及 Cocos Creator 的資產與場景管理。
4. **手機效能／跨平台**：PlayCanvas、Cocos 的平台適配思想，以及 Phaser 現有運行指標；不在沒有量測時預設另一個引擎更快。
5. **長期低階自研**：raylib、MonoGame 作為簡明執行循環／繪圖的參考；O3DE 的大型框架研究放到遠期。
6. **2D 像素 UI、動態層**：Phaser + PixiJS 以渲染概念和效能差異為主，不用雙引擎同時負責正式遊戲畫面。

## C. 授權和商業使用風險

- 專案 **公開原始碼 ≠ 可以任意重製**；在引用前須核對實際分支／版本 LICENSE、個別第三方套件、模型、範例資產和編輯器條款。
- **MIT**：可修改和商用，但若散布相關程式碼或其實質部分，需附原始著作權及授權聲明。
- **Apache-2.0**：含版權、LICENSE、適用 NOTICE、修改標記及其他條件；根據實際版本和第三方元件核對。
- **Ms-PL**：是開源授權但**不等同 MIT**，特別留意原始碼散布等條件。
- **zlib**：不可宣稱自己是原始作者，修改版本應清楚標示，原始授權通知需保留。
- **Cocos Creator**：引擎核心 MIT 不代表編輯器閉源組件與產品名稱均可重新發行；其官方編輯器條款有額外限制。
- **Defold**：可免費開發遊戲，然而是自訂 Defold License 的 source-available 專案，涉及複製／修改／重新發行引擎時必須詳讀個別限制。
- 研究文件僅自寫摘要與連結，**未將任何第三方引擎程式碼、範例圖、遊戲資產帶入 Project OHM**。

## D. 統一驗證流程

對每個引擎／框架紀錄：
- 官方 repo／docs／LICENSE／COPYRIGHT URL、檢查日期、版本、授權和第三方內容；
- 相同小實驗的需求、時間、畫面與效能（手機幀率／記憶體、資源大小、載入時間）；
- 自己可實作的核心原理、需要保留的版權條件、和既有 Ohm Core／Phaser 的整合代價；
- 「已找到／已核對／已單獨試作／已測試／已整合」五個不同狀態，不能把觀察理解冒充完成品。

## E. 下一個小目標

優先補完 `docs/research/transport/CABLE_TRAIN_MOTION_RESEARCH_INDEX_V01.md` 的 **S02-B v09 3 秒交通結構試作**。起步不再增加框架依賴，先以 Three.js 的曲線位置／切線及連續纜索模型證明前進感，之後再比較 Babylon.js／PlayCanvas 是否真正改善效果。

*最後更新：2026-11-10；本資料為技術研究參考與初步授權盤點，具體程式採用前須重新查核對應版本授權。*
