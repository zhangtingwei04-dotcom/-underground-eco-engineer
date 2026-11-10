# Project OHM｜研究來源與模組登錄索引 V0.1

> 日期：2026-11-10｜本頁是第一批**現有資料**的導覽，不代表已逐一核對所有文件的最新研究證據、所有外部授權或所有 CI 執行結果。

## A. 資料索引清單

| 識別碼 | 類型 | 已存在位置 | 現況與下一步 |
| --- | --- | --- | --- |
| OHM-RES-BIO-001 | 生物研究來源 | [真實爬蟲與研究資料索引](../research/HERPETOLOGY_RESEARCH_SOURCES_20261108_V01.md) | 已有研究資料／原始來源紀錄；逐筆核實全文、授權與適用物種 |
| OHM-RES-ECO-001 | 生態與環境 | [生態／植物／真菌／地質索引](../research/ECOSYSTEM_BOTANY_FUNGI_GEOLOGY_RESEARCH_MASTER_V01.md) | 用於環境模擬知識，不能把未核實推論寫成真實飼養建議 |
| OHM-RES-MOTION-001 | 蛇類動態 | [爬蟲移動數據集目錄](../research/REPTILE_MOTION_DATASET_CATALOG_V01.md) | 逐項對照動畫表現、來源版本、條件和數據適用性 |
| OHM-RES-TRANSIT-001 | 地熱交通 | [纜車運動與交通工程](../research/transport/CABLE_TRAIN_MOTION_RESEARCH_INDEX_V01.md) | 已建立索引，現階段缺可驗證的連續行駛與懸吊運動試作 |
| OHM-RES-D1-001 | 生物研究資料庫 | [Cloudflare D1 生物研究索引](../research/CLOUDFLARE_D1_BIOLOGY_CATALOG_V01.md) | 已建研究用 D1；禁止和玩家存檔資料庫混用 |
| OHM-RES-DESIGN-001 | 遊戲正式設計 | [遊戲主路線圖](../GAME_DESIGN_ROADMAP.md) | 遊戲世界觀／玩法規格不等於科學實證；持續對照實際遊戲版本 |
| OHM-RES-PLATFORM-001 | 多平台技術 | [跨平台策略](../CROSS_PLATFORM_STRATEGY.md) | 已有長期方向，平台適配與同步仍需逐步實作 |

## B. 可重用模組登錄

| 識別碼 | 模組 | 現有檔案或預定位置 | 狀態 | 引擎化下一步 |
| --- | --- | --- | --- | --- |
| OHM-MOD-001 | 世界狀態與指令 | `src/ohm-core/world.mjs` | 已有獨立實作及測試 | 逐步擴充資料 schema 和受控接線 |
| OHM-MOD-002 | 場景註冊／導覽 | `src/ohm-core/scene-registry.mjs` | 已有獨立實作及測試 | 加入地圖條件和 Phaser adapter 演示 |
| OHM-MOD-003 | 動物行為運動 | `src/ohm-core/reptile-motion.mjs`、`corn-snake-motion.mjs` | 已有部分獨立實作／測試 | 逐物種核實、量測效能、再逐項整合 |
| OHM-MOD-004 | 現實時段／離線處理 | `src/ohm-core/day-period.mjs`、`offline-catch-up.mjs` | 已有實作和部分測試 | 保留世界時間與瀏覽器時間分層，檢查存檔結算 |
| OHM-MOD-005 | 瀏覽器平台適配 | `src/ohm-platform/` | 已有時間相關 adapter | 日後擴充輸入、存檔及呈現接口 |
| OHM-MOD-006 | 纜車運動骨架 | 尚無正式模組；優先獨立試作 | **研究中／待實作** | 3 秒幾何測試：定速弧長、車廂間距、連續索道和內景視差 |
| OHM-MOD-007 | 自研渲染／編輯器 | 尚無正式模組 | **遠期願景／未實作** | 只在需求成熟與替換收益明確後啟動 |

**狀態規則：**「已有獨立實作」不代表已進入正式遊戲，也不代表所有平台與 CI 已驗證；只有能提供程式、提交紀錄與測試結果時才可註記為「已實作／已驗證」。

## C. 後續新增資料的統一模板

```yaml
id: OHM-RES-XXXX-001
title: "資料／工具名稱"
category: "biological | ecological | motion | transit | art | audio | npc | platform | other"
source_url: "https://example.org/source"
author_or_organization: "作者或機構"
accessed_on: "YYYY-MM-DD"
source_type: "paper | dataset | video | code | model | manual | original"
license: "unknown | CC0 | CC-BY-4.0 | MIT | other"
commercial_reuse: "unknown | yes_with_conditions | no"
original_material_location: "source link / private storage (do not publish confidential paths)"
evidence_status: "link_only | abstract_read | full_text_checked | independently_validated"
applies_to: "物種、場景或技術領域"
limitations: "證據範圍、模型精度及無法推論的部分"
proposed_use: "預計用途"
integration_status: "found | checked | licensed | prototype | tested | integrated | maintained"
test_reference: "測試檔、版本、日期或待驗證"
notes: "自寫摘要；虛構內容必須另外標示"
```

不可以把 `license: unknown` 當作授權許可；對應的權利確認前不可直接重製／重新散布第三方素材。不同檔案有不同權利時，應建立子紀錄。

## D. 模組提案模板

每個候選 Ohm Engine 模組都寫清楚：
1. **需求來源**：哪個遊戲場景、問題或研究催生它。
2. **功能責任**：輸入／輸出、狀態所有權、錯誤處理，避免與現有程式重複。
3. **平台依賴**：Core 是否可無 Phaser／DOM 執行，渲染／平台服務如何透過 adapter 使用。
4. **外部權利**：引用原始碼／模型／數據的完整出處、授權和必要聲明。
5. **測試關卡**：至少單元測試、真實場景演示、手機效能與存檔回退風險。
6. **實際狀態**：研究、隔離試作、已驗證、正式整合的區別。
7. **採用決定**：效能、複雜度與維護成本是否勝過現有 Phaser 做法。

> 不追求研究資料全部入庫後才開始開發；每做一段遊戲，就回填相關的來源、可用模組與驗收結果。
