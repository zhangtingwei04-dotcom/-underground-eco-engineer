# Project OHM V1.0A｜中立可拆卸像素材質橋接、UV 固定與四體型移動驗證

日期：2026-11-13（Asia/Taipei）。**公開中立技術實驗，不包含歐姆原創物種名字、外觀、顏色組合或個體花紋。**

## 為什麼現在先做像素皮

使用者已同意先以一張暖色地下森林／木製紙張 UI／像素蛇生態圖鑑概念板的視覺方向開發像素皮，但不能以貼皮掩蓋尚未成熟的生物動態。現有 V0.9T/ U/ R/ S/ Z 已有真四體型 24 節骨架、1,617 頂點／3,216 三角面共用頭身透明網格、對場景/自身的有限時間檢查和 3D 直線洞穴進入來源 QA。**V1.0A 第一步只驗證把材質附著到既有穩定 UV，並保證不改幾何或碰撞體。**

### 新增來源檔案

- [`snake-pixel-surface-bridge-v10a.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-pixel-surface-bridge-v10a.mjs)
  - `createSnakeNeutralPixelAtlasV10a`：使用**純中立灰藍色條格**生成 128×64 RGBA 格紋資料，固定 seed、每個角度像素環的首尾對齊。(u) 沿頭到尾、(v) 沿周向；`NEAREST` 像素抽樣、環向 `REPEAT`。**這些數據僅供工程驗收，不是已經生成的正式 PNG 材質，更沒有私人原創根脈紋。**
  - `bindSnakePixelSurfaceV10a`：在 `transparent`、`flat_debug`、`pixel_debug` 之間切換，只建立**唯讀渲染材質計畫**；復用 V0.9U 已通過的 `mesh.positions`、`mesh.uv`、`mesh.triangles`、`collisionShell`，不改 24 節來源、23 骨長、24 個局部半徑或玩家世界。嚴格檢查 V0.9R 的 16 點頸部接縫、固定 1,617 頂點／3,216 面拓撲、UV 數量與範圍，錯誤就拒絕。
  - `inspectSnakePixelUVStabilityV10a`：比較連續兩幀渲染候選的 UV 數組、**同一個 atlas 物件引用**、各節骨長和半徑；材質不准因蛇在世界中移動而改變像素相對位置。注意**它不是 source authenticity 的取代品**，每幀真實骨架來源仍先用 V0.9U 的決定性重播、安全面檢查。
- [`snake-pixel-surface-bridge-v10a.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-pixel-surface-bridge-v10a.test.mjs)：測四種 V0.9T 獨立體型 × 每種連續 8 幀，共 **32 幀**，每幀先通過 V0.9U 來源與完整頭身網格驗證，再比較透明/素色/中立像素皮三模式的 geometry identity、UV 靜止、同源碰撞包絡和骨長／半徑不變；強制偽造錯誤 UV、斷裂頸圈、每幀重建不同 atlas 物件、錯誤色碼及未知模式均不得通過。

### 已驗證的客觀結果

[**GitHub Actions #43352003788**](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43352003788)：**8/8 jobs 全成功**，其中 Node 22 source-backed CI 的確執行新 V1.0A 測試，其它 Chrome 畫面／生態箱工作是**舊版歷史回歸**，不是 V1.0A 新像素皮的獨立 Chrome 畫面或 iPhone Safari 驗收。

| 合成階段 | 中心線身長 world | V1.0A 連續貼附 | UV/atlas 固定 | 骨長／半徑和碰撞體 |
|---|---:|---:|---|---|
| 幼體 | 1.14 | 8/8 | 通過 | 未變更 |
| 成長中 | 1.71 | 8/8 | 通過 | 未變更 |
| 成體 | 2.28 | 8/8 | 通過 | 未變更 |
| 大型成體 | 2.964 | 8/8 | 通過 | 未變更 |

**三模式** `transparent`、`flat_debug`、`pixel_debug` 都回傳相同 mesh/collider 來源。私人真正的物種色票、獨特根脈花紋和參考概念板**不在公開 QA**。UI 也還沒接入正式遊戲。

## 風險與下一步

1. **V1.0A 只有 CPU 端材質計畫，沒有真正的貼圖材質顯示/渲染。** 測試格紋只是 RGBA array；沒有接入 Phaser WebGL/Canvas、沒有 PNG 紋理匯出、沒有真正把相機像素密度和縮放匹配到所需的手工像素美術。
2. **UV 貼附穩定不等於背腹正確。** V0.9Q 的局部法向與 binormal 仍依沿身體移動的局部框架，`v=0` 不能未檢查就當成蛇背；需針對同一蛇的翻身／轉彎、身體縱軸做貼圖朝向和畸變檢查。
3. **需要接縫及像素密度實際畫面驗收。** 1,617 點／3,216 面、16 節環向分割度的貼圖是否在遠/近相機出現像素閃爍、鋸齒、不自然頭頸或尾尖切斷，尚未驗收；`NEAREST` 是一項可調工程建議。
4. **移動中禁止「因換外皮而變長」。** V0.9V 已限制成長只在安全休息時更新碰撞；皮只依當前已核准的骨架/半徑渲染，不能讓玩家用材質切換偷越體型與洞穴安全閘門。
5. **私人原創仍保密。** 公開程式只使用不具物種特徵的測試條格；正式生物花紋和種名留私人 repo，不能把原創種的精確色票、圖鑑和獨特種族設計當中立測試夾入公共庫。

**這輪達到的階段：已建並驗證「技術上可拆卸、穩定 UV、同源碰撞不變」的第一塊積木；還未達到「正式像素皮生成與畫面驗收」。下一步在私人 repo 做原創紋理樣本，再在橫式環境測真實可見效果。**