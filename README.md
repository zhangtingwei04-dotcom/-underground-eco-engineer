# 地下生態工程師 | Underground Eco-Engineer

一款結合地下探索、生物管理、環境模擬與棲息地建設的雙語生態經營遊戲。
A bilingual ecosystem simulation game combining underground exploration, creature management, environmental simulation, and habitat construction.

---

## 🧭 歐姆計劃｜PROJECT OHM

《鱗片與種子》同時是自研遊戲技術的第一個長期實驗場。**歐姆計劃**以「研究資料庫（Ohm Archive）／獨立遊戲核心（Ohm Core）／未來的自研引擎（Ohm Engine）」為逐步發展方向；目前仍以 Phaser 維持遊戲開發，不代表已有完整自研引擎。

- [歐姆計劃總規劃](./docs/project-ohm/README.md)
- [研究來源與可重用模組索引](./docs/project-ohm/REGISTRY_V01.md)
- [歐姆計劃工程基礎與規範](./docs/project-ohm/FOUNDATION_BASELINE_V01.md)
- [歐姆實驗室 V0.1｜獨立研究與模組管理](./ohm-lab.html)

---

## 🌱 遊戲核心概念 | Game Concept
玩家將扮演地下生態工程師，透過挖掘、資源管理、環境調節及生物培育，逐步建立一個完整且能持續運作的地下生態系統。
Players take on the role of an underground eco-engineer, building a sustainable underground ecosystem through excavation, resource management, environmental control, and creature care.

---

## ⚙️ 核心遊戲循環 | Core Gameplay Loop
1. **選擇生物**：配置合適的地下生物進入探索區域。
2. **挑戰方塊**：根據生物的挖掘能力挑戰不同硬度的方塊。
3. **消耗體力**：執行挖掘動作並扣除生物相應的精力值。
4. **拓展空間**：開拓地下空間、收集稀有資源。
5. **經營生態**：改善棲息環境，培育更高等級的生物與植物。

---

## 📖 共同開發與設計歷程 | Development Journal

重要設計討論、方案比較、玩家決策理由與開發過程，持續記錄於 [共同開發歷程紀錄](./docs/DEVELOPMENT_JOURNAL.md)。正式系統規則則整理於 `docs/` 下各系統規格文件。

---

## 🚀 專案現階段進度 | Project Progress

### 🔹 核心資料與初步邏輯
- [x] 建立 GitHub 雲端開發儲存庫 (Repository initialized)
- [x] 規劃繁體中文與英文雙語架構 (`src/locales/`)
- [x] 建立核心生物：豬鼻蛇屬性資料 (`src/entities/hognose.json`)
- [x] 設計挖掘與能量消耗系統 (`src/systems/digging-system.js`)
- [x] 建立地下方塊硬度資料 (`src/entities/blocks.json`)

### 🔸 前端與遊戲系統 (待實作)
- [ ] 完成 Phaser 遊戲專案初始化
- [ ] 建立地下土壤剖面地圖
- [ ] 實作可操作的挖掘介面
- [ ] 完成生物活動與環境模擬
- [ ] 加入本機存檔功能 (Save/Load system)
- [ ] 完成中英文語言切換機制
- [ ] 發布第一個公開測試版本 (Alpha Release)

---

## 🐍 核心生物 | Core Creature
### 豬鼻蛇 | Hognose Snake
* **基礎挖掘力 (Base Digging Power)**：15
* **特性 (Traits)**：擅長挖掘沙土，性格較為膽小。
* **特殊行為 (Special Behavior)**：受到威脅或壓迫時可能會觸發「裝死 (Play Dead)」防禦行為。

---

## 🪨 地下方塊資料 | Underground Blocks

| 方塊名稱 (Block) | 硬度數值 (Hardness) | 描述特點 (Description) |
| :--- | :---: | :--- |
| **沙土 (Sand)** | **5** | 鬆軟易挖，最適合新手生物活動。 |
| **泥土 (Soil)** | **15** | 普通硬度，與初期豬鼻蛇挖掘力持平。 |
| **岩石 (Rock)** | **50** | 堅硬無比，需要高挖掘力或工具輔助。 |

---

## 🛠️ 開發藍圖 | Development Roadmap
* [ ] **第一階段**：地下挖掘與地形系統、體力及資源管理。
* [ ] **第二階段**：生物屬性與能力系統、生物圖鑑及研究。
* [ ] **第三階段**：溫度與濕度環境模擬、植物與微生態系統。
* [ ] **第四階段**：棲息地建設與升級、多平台評估。

---

## 💻 開發技術 | Technologies
* **Game Engine**: Phaser 3
* **Languages**: TypeScript / JavaScript
* **Data Format**: JSON (Bilingual / Stats)
* **Version Control**: GitHub

---

## 🌐 語言支援 | Language Support
* 繁體中文 | Traditional Chinese (`zh-TW`)
* 英文 | English (`en`)
* *未來將保留多語言擴充能力。 (Future versions will support additional languages.)*
