# 生物像素表現與渲染架構 V1｜《鱗片與種子：地下生態物語》

日期：2026-11-08
狀態：**設計推薦與已發現的現況差距；方案待美術及效能原型驗證，尚未更動正式遊戲程式／資產。**

## 1. 推薦總結

**採「自然寫實的精緻像素生物 + 依物種區分的外觀／動作資料 + 先逐格後曲線、必要時才使用 Mesh 的混合動畫架構」。**

不同生物可用不同細節密度；同一物種在場景、圖鑑、攝影中的畫法亦可分工。但都要遵守溫暖自然、清楚輪廓、合理光影、真實解剖、個體差異，以及和歐姆研究站世界相容的美術語言。與 `ART_DIRECTION_HARMONIOUS_PIXEL_STYLES_V01.md` 相容。

本規格不要求每種生物都是 Q 版，也不要求每張圖都是同像素尺寸。**可愛感來自姿態、自然反應、局部細節與場景光影，不靠過度擬人化。**

## 2. 生物像素細節分層（不完全同畫法）

| 分層 | 用途 | 風格 | 實作建議 |
|---|---|---|---|
| A. **遊戲場景生物** | 玩家在生態飼養箱、探索地點觀察 | 物種輪廓準確、動作自然、適度細節；背景不搶眼 | 透明 PNG／atlas；依鏡頭遠近選用素材版本 |
| B. **放大觀察／圖鑑生物** | 玩家查看鱗片、頭型、花紋、研究筆記 | 較高細節、可讀辨識特徵、略有手工像素插畫感 | 獨立立繪，不強制和動畫逐格共用貼圖 |
| C. **微型生物／背景生態** | 跳蟲、鼠婦、較小昆蟲、遠景族群 | 簡潔但物種輪廓可靠，不需所有個體都有獨立大動畫 | 遠距簡化貼圖／低頻動畫／族群表示，不逐隻模擬 |

**物種優先：** 西部豬鼻蛇與玉米蛇先做；其他爬蟲與兩棲類從相同資料契約延伸。假想物種另建分類，不把魔法特徵寫進真實物種資料。

**像素規格原則：**
- 先建立每種生物的**標準造型板**：側面、斜角側面、頭部放大、身體紋路、腹部、尾端、尺度參考；再生成動畫。
- 每個資產要有邊界留白、對齊基準／接地錨點、透明背景、正確像素比例及固定光線方向。視角和生態箱視角要一致。
- 初步可用 **128×64、256×128 等工作格**做低／高詳細版本比較，這是**測試候選，不是定稿尺寸**；按蛇體長寬、近攝倍率和手機上呈現的實際像素而定。
- UI 使用圖片放大時要按貼圖類型決定 nearest-neighbor 或平滑；真正像素圖避免非整數縮放造成不均勻的格子與模糊。
- 特殊近景圖不需故意很粗糙。精緻像素與較大的解析度可共存，**同場景像素密度和光影需過渡合理**。

## 3. 動畫混合架構：先易後難

### 方案 A：逐格 Sprite Sheet／Texture Atlas（初期首選）
可用於：休息、抬頭、吐舌、盤繞、短距離移動、進躲避處、蛻皮狀態**外觀提示**等。

優勢：實際素材可預覽、Frame 動畫可審核、跨手機和 Phaser 容易上線；較易對每張圖保持物種輪廓與藝術品質。局限：長蛇連續滑行與任意轉向，需要很多預繪姿態，會造成檔案膨脹。

**建議起步動作：** `idle`／`tongue_flick`／`look_around`／`short_slither`／`hide_enter`，再依研究增加 `burrow`（豬鼻蛇）、`climb`（玉米蛇）。**防禦性死亡偽裝不是可隨機播放的「可愛待機」**。

### 方案 B：蛇身中心線＋分段姿態＋紋理貼附（中期）
可用於：更連續的長身體轉彎、移動、身體進入洞穴、沿枝條改變姿態。

- 獨立描述身體**中心線、粗細分布、朝向、接觸面及採樣點**；動畫姿態和行為決策分離。
- 以生物學研究確認可出現的運動模式；一開始可用**美術近似**，清楚標示並不宣稱達到實驗級生物力學。
- 紋路及腹面顏色需跟隨身體座標移動，不能只有圖形「S 型」平移，或隨轉彎圖案留在畫面原地。
- 身體「頭／中段／尾」分段可以作為原型，但若接縫、斑紋突然斷裂或像機械節點，必須改良成細分段與連續貼圖，或改回逐格。
- 不同動作以 renderer adapter 決定採逐格還是曲線，避免強迫所有物種用同一種骨架。

### 方案 C：Mesh 變形／高級材質（後期選配）
可用於：高品質蛇身紋理隨曲線變形、更細緻扭轉與局部遮擋。

**風險：** Phaser Mesh 是 WebGL-only，沒有 Canvas counterpart（官方：https://docs.phaser.io/phaser/concepts/gameobjects/mesh）；須確認目標瀏覽器 WebGL 支援、GPU 負擔、手機記憶體及 fallback。**不能當跨平台底層唯一渲染方案**。

### 推薦實作順序
**A → A+B → 必要時 A+B+C**。一個物種可按行為使用不同 renderer，但外部事件和生物資料 API 相同；其他物種如青蛙、守宮或鼠婦可使用更適合牠們形態的純逐格或局部骨架方法，不要硬套蛇身模型。

## 4. 核心資料和繪圖系統的責任分界

```text
文獻／飼養來源（來源、適用條件、可信度）
              │
物種資料（真實 ID、允許的能力、身體構造）
              │
個體資料（固定 ID、外觀 seed、生命階段、實際狀態）
              │
行為／運動規則 Ohm Core（純資料與事件；不碰 Phaser）
              │ 例：motion_changed / posture_changed
              ▼
Creature Visual Adapter（依物種與視角選動畫；映射舊版欄位）
              │
       ┌──────┴──────┐
       ▼             ▼
  Sprite renderer  Curve/Mesh renderer
       └──────┬──────┘
              ▼
      Phaser Scene（現在）／未來 Ohm Renderer
```

**資料必須分成：**
1. `species_id`：跨平台穩定的物種識別，可能需要兼容既有 `hognose_snake`、`corn_snake` 和 Ohm Core 的 `pantherophis-guttatus` 等不同 ID 格式，**先建立映射，不直接改舊存檔**。
2. `individual_id`：個體永久識別，與畫面名稱分開。
3. `appearance`：`morph_id`、色素參照、`pattern_topology`、固定 `pattern_seed`、生命階段；**遺傳資料與外觀繪圖分開**。
4. `motion`：物種允許的動作狀態及事件，和觀察日誌、壓力與能量條件分離。
5. `visual_assets`：圖片 atlas、幀名字、鏡頭／錨點／圖層設定，**不要放入存檔當作科學事實**。

**以 `schemaVersion` 管理資料結構**，舊存檔保留不變。生命階段和身體大小影響實際呈現尺寸，但不要未經研究校正就把「每過幾天等比例放大」當真實生長曲線。

## 5. 玉米蛇與豬鼻蛇具體區分

### 西部豬鼻蛇
- 造型：上翹吻端、偏短厚的頭部輪廓、相應背部斑塊及逐漸變細的尾部；**不可用一般長尖鼻蛇頭套顏色代替**。
- 首批動畫：靜止呼吸的美術微動、吐舌、探頭、底材表面移動、進入可挖掘底材、在躲藏處休息。
- 防禦行為如展頸／假死只能在**有合理威脅條件**、研究支持、符合動物福利的事件中呈現；**不是逗趣常規待機**。
- 造景：挖掘與遮蔽，符合偏乾燥但有局部濕度微棲地的環境，不能將其居所一律變成高濕雨林。

### 玉米蛇
- 造型：較修長身體、與豬鼻蛇不同的頭形、不同斑塊／條紋／腹側圖案；斑紋與姿態應隨身體正確變化。
- 首批動畫：靜止、吐舌、地面滑行、轉頭、藏身；再增加穩固枝條攀爬、不同高度停留等。
- 需允許正常個體差異；不能把「有攀爬能力」寫成每隻蛇每天必定攀爬或固定比例。

## 6. 個體花紋與色型：不要只用染色

- **第一批先做「真實物種正常型」的可辨識造型**，再加少量有可靠資料和可控素材的顏色／花紋變體。
- `base_color` 和 `blotch_color` 可作初步視覺參數；但 Motley／Stripe 等**花紋結構**不同，不能只套一個 hue/tint 濾鏡。
- `pattern_seed` 用來重建同一隻蛇的外觀，必須可重複、可測試；不能每次讀取存檔就換花紋。
- `genotype` 或繁殖機率不得只由外觀 seed 推導；需依科學與飼主記錄核實的性狀建立後續遺傳。
- 初期採「少量手工審查過的基本輪廓＋可選顏色層／花紋素材」比生成大量完全自由形狀更可控。

## 7. 已檢查的 GitHub 程式現況及需避免重做

**已存在且值得沿用：**
- `src/ohm-core/reptile-motion.mjs`：`MOTION_MODES`、`BEHAVIOR_TAGS`、`validateMotionProfile`、`createMotionState`、`requestMotion`；**目前只有狀態契約／轉移檢查，沒有蛇身動畫和 AI**。
- `src/ohm-core/corn-snake-profile.mjs`：包含 `referenceMorphId` 與 `patternSeed` 的玉米蛇外觀容器；**不是可顯示的正式花紋或真實遺傳模擬**。
- `src/systems/creature-factory.js`、`src/systems/species-config-system.js`、`src/systems/creature-behavior-system.js`：既有物種、個體和行為資料管道，需先檢查目前使用位置再決定適配器接線。

**目前舊渲染系統的限制：**
- `src/systems/creature-morph-system.js` 中 `renderCreatureWithTexture()` 目前使用 Graphics 的數個圓形及三角形畫身體、用圓形畫斑點；無真實物種的完整身體比例、可變形紋理及完整逐格動畫。
- 同檔案 `playCrawlAnimation()` 主要是整個容器 Tween 位移，附加簡單上下波浪，不是真實蛇軀幹連續曲線行進。**可以保留作過渡示意，不能當成完成的科學蛇類運動模擬**。
- `src/systems/creature-behavior-system.js` 有隨機抽取日常行為的簡化邏輯。現有某些描述會預設或擬人化動物心理，且單靠一個行為就推定健康／壓力不充分；正式與動畫和玩家圖鑑串接前應先核對證據與可測量前提。
- `src/entities/hognose.json` 已定義 `pet_layers` 和動畫候選、色型，但**檔案路徑／動畫名稱不等於該套素材真實存在或已能播放**。當前 `generateFromSeed()` 用 seed 對 morph 陣列取模、並產生 `randomized:true`，仍需避免把示意色型、出現頻率或體色直接等同現實遺傳。
- 目前有**物種 ID 命名差異**：`hognose_snake`、`corn_snake` 與 Ohm Core `pantherophis-guttatus` 等；不直接強制改名、移除別名或重寫舊存檔，先在轉接層兼容。

**原則：** 不為同一功能重開第二套龐大行為引擎或外觀系統。先保留能運作的既有路徑，做獨立 renderer demo，再規劃逐步接線與測試。

## 8. 驗收標準與首個小型測試

**建議一個 demo：在同一個可測試的 2D 飼養箱畫面，呈現一隻正常型玉米蛇與一隻正常型豬鼻蛇，或分別切換兩種環境，不要求它們在同一飼養箱共養。**

最小驗收：
- 從輪廓與頭型可分辨兩種蛇，不看文字也不混淆。
- 每隻至少有自然靜止、吐舌、短距離移動；豬鼻蛇挖掘／玉米蛇攀爬做下一步。
- 以不同個體 ID／seed 反覆刷新，外觀一致、體色不亂跳，花紋和身體動作無明顯脫節。
- 生物移動時不穿透枝條、石頭、箱體邊緣；底材遮擋有正確前後層次。
- 在 iPhone 的直式／橫式與桌面測試縮放、清晰度、幀率和載入；性能不足時降級動畫，不刪除已核定的研究與物種資料。
- 動物行為事件及觀察日誌符合實際發生的畫面，且不因動畫播放就錯誤判定健康或性格。
- 只使用原創、已獲合法授權或可合法引用之參考；不把圖片搜索素材直接當成遊戲資產。

## 9. 需試做後再決定的事項

- 實際工作像素密度／每種蛇的主要圖塊尺寸與場景鏡頭尺度。
- 完整 sprite atlas 與局部身體變形如何分工；先確認兩種蛇的可讀性。
- 花紋遮罩如何隨身體弧度貼附且不產生像素破碎；需要時再評估 Mesh。
- 動畫更新頻率與遠景降級條件，以實機測試為準；不要先宣稱某固定 FPS 最佳。
- 圖鑑插圖是高解析 pixel illustration 還是另用較精細像素稿；以整體風格一致性評估。

## 10. 來源與參照

- 官方 Phaser Sprite 使用與 atlas 載入：https://docs.phaser.io/phaser/concepts/gameobjects/sprite
- Phaser 動畫逐格原理：https://www.phaser.io/oss/docs/phaser/concepts/animations
- Phaser Mesh 渲染限制：https://docs.phaser.io/phaser/concepts/gameobjects/mesh
- 專案既有美術方向：`docs/ART_DIRECTION_HARMONIOUS_PIXEL_STYLES_V01.md`
- 專案既有 Ohm Core 規格：`docs/OHM_CORE_REPTILE_MOTION_FOUNDATION_V01.md`
- 玉米蛇物種／紋路研究：`docs/species/CORN_SNAKE_REAL_SPECIES_FOUNDATION_V01.md`
- 生態箱照護參考：`docs/research/BIOACTIVE_REPTILE_VIVARIUM_REFERENCES_20261108_V01.md`

**此次只新增設計文件，不產生美術素材、不重寫現有 Phaser 行為、不修改 Github Pages、Cloudflare D1、Supabase 或玩家存檔。**

## 11. 使用者確認的 V1 生物像素概念圖

2026-11-08 使用者確認首張生物像素美術概念整合圖「很不錯」，並要求保存。已於 ChatGPT 檔案庫保留原始 PNG：
`/鱗片與種子/美術參考/scales-seeds-creature-pixel-concept-v1-20261108.png`（1536 × 1024，SHA-256 `c1dd1e606619d8b1812cd4a281eed81316531604beff7bd8f949c3c7bd44da54`）。

它是**風格參考，不是已製作完成的 sprite sheet、動畫或可直接套用的動物素材**。接下來以此為氛圍基準生成單一物種的透明原畫，校對豬鼻蛇／玉米蛇真實特徵，再試作獨立動作；**不因參考圖表現而覆蓋已確認首頁或重寫生態系統**。詳細保存資訊見 `docs/ART_DIRECTION_HARMONIOUS_PIXEL_STYLES_V01.md` 第 10 節。

## 12. 玉米蛇動態 v0.3 已交付試驗版本（2026-11-08）

- 蛇類逐段路徑跟隨的第一個**純程式幾何技術版本**已納入 `src/ohm-core/corn-snake-motion.mjs`；獨立畫面 `corn-snake-lab.html` 已改為蛇頭沿底材曲線移動、轉彎、身體依序跟隨，顯示與舊版原地擺動的差異。可在 https://zhangtingwei04-dotcom.github.io/-underground-eco-engineer/corn-snake-lab.html 檢視。
- 既有 pattern seed 和外觀下拉保留；`tests/corn-snake-motion.test.mjs` 已加入前進、折返、路徑跟隨、邊界及重現性檢查。核心邏輯已在修改時做直接函式檢查，GitHub main 檔案已驗證；**仍需真機畫面驗收及 CI 狀態確認**。
- 此版本**沒有真正碰撞、尋路、枝條攀爬、完整動物生理或正式像素貼圖**；路線是預設閉環，適合優先評估視覺上是否有「蛇自己往前爬」的感覺。
- 此次只改獨立實驗頁、底層純函式與相關測試／文件，不影響已運作的主畫面、研究進度、現有動物或玩家雲端存檔。

### v0.3 GitHub Actions 驗收補記（2026-11-08）

- `corn-snake-motion.mjs`、`tests/corn-snake-motion.test.mjs` 與 `corn-snake-lab.html` 均已逐檔回讀確認存在於 `main`。
- 源碼／試驗頁更新對應 commit `30326d3d16627f0189be514abf2b09892c527897`，其 [Ohm Core checks](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/42478988230) 已 **success**；玉米蛇曲線與固定花紋測試步驟 **success**。
- 對應的 [Pages build and deployment](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/42478987385) 亦 **success**。
- **實機視覺驗收尚待進行。** GitHub Actions 不能證明真實蛇類運動已經驗證或美術已完成。
