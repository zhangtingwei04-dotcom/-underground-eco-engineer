# V0.9N｜透明蛇成長尺寸、整身碰撞與漸進擴張的公開中立 QA

日期：2026-11-13（台灣時間）｜狀態：**純工程候選和測試通過，不是已整合到正式遊戲的動物成長動畫。**

## 背景

V0.9M 的全身抵達判定以一條固定 `24-joint / 2.28 world units / bodyRadius=.13` 的中立合成來源為基準。若原本是幼體、日後體長增加，原本能完整停在目標區或出入的洞穴可能變得不適合。不能把「頭在終點」誤判「全部蛇身抵達」，也不能把固定尺寸的 V0.9C/D/G 來源控制器強行套在已改長的骨架上。

## 實作

- [`snake-growth-envelope-v09n.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-growth-envelope-v09n.mjs)：以**原 V0.9D 已驗證的 24 節固定來源**為來源，只讀推導四種工程體型的 24 節候選及 23 條連線。總長與骨節權重連續變化，頭部／軀幹／尾部體徑各有不同的比率，並與現有 V0.7Y slender 曲線相乘；不是在渲染時把蛇整張等比例拉大。保留同一蛇頭錨點，原姿勢、場景與存檔皆不修改。
- 模組計算每一節的當前半徑／2D 占位、全部 23 條 source 連線對 V0.3d 實體石頭 AABB、玻璃邊界及非鄰近身體段的保守平面碰撞，目標圓區容納的節點數。與 V0.9M 不同，此處的 diagnostic padding 會依**目前模擬尺寸的每節半徑**，而不是沿用成人常數。
- `inspectSnakeGrowthTransitionV09n` 只允許 0 到 3 模擬成長進度之間，每次最多 **0.2** 的候選差值。除檢查前後姿勢外，還以**每條移動連線的保守 swept AABB** 查場景實體及玻璃空間；這可能過度拒絕，但不會任意放寬碰撞容許。**這是工程候選的保守平面檢查，不是 3D 所有曲面掃掠的證明。**
- `inspectSnakeSyntheticHideFitV09n` 同時檢查**合成洞口寬度與全身容納長度**，且明確不宣稱現實寵物躲藏箱或福利標準。
- [`snake-growth-envelope-v09n.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-growth-envelope-v09n.test.mjs)：原 24 節骨架四種體型測試、15 段漸進增長、靠近石塊的成長拒絕、原真 V0.7P→V0.9C 返程來源第 160 幀不可變、以及與**已存在** [V0.1 growth-motion 顯示模組](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-growth-motion-adapter.mjs) 的四個長度／24 節／UV 拓撲接口一致性測試。**接口相容不代表兩套程式已共用物理碰撞權威或完成 3D mesh 正式整合。**

## 實際測試結果

以下**四階段是合成工程測試分組，絕非真蛇／任何虛構物種的年齡對應、生長率、最大體長或實際頭身比例**：

| 模擬階段 | 長度 (world) | 最大半徑 (world) | 相同目標區內 24 節 |
|---|---:|---:|---:|
| juvenile／幼體 | 1.14 | 0.072678 | 24 |
| growing／成長中 | 1.71 | 0.091506 | 24 |
| adult／成體 | 2.28 | 0.114400 | 19 |
| large_adult／大型成體 | 2.964 | 0.140392 | 14 |

所有四種體型在刻意安排的開放空間中通過本輪靜態環境與 2D 非相鄰身體段代理檢查。但**同一個目標區並非所有體型都能放下整條蛇**，所以幼體的 24/24 不能被繼承當作成體的到達結果。

同一組**27px 寬出入口、210px 長合成躲藏區**，幼體的簡化寬度／長度條件可通過，成體兩者都不通過。靠近原 V0.3d 石頭時同一條蛇幼體候選無碰撞，但成年候選會碰石頭；逐段生長在進度 **0.4→0.6** 左右停止，沒有移動原石頭、縮小蛇體或傳送尾巴。15 個最大 0.2 進度的連續增量在另一個空曠環境全部通過保守 2D 過渡預檢；這**不是**15 次真實時間生長，也沒有真正執行 V0.9C 動畫。

## GitHub Actions

- [Run #43278276712](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43278276712)：四體型、身體目標、合成躲藏處、15 個逐段成長、靠石塊拒絕、真 24 節來源不可變的測試成功，整體 **8/8**。
- [Run #43278678468](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43278678468)：增補和舊 V0.1 成長骨架顯示模組的 4 組長度、24 節及 UV 接口測試，整體 **8/8**。既有 Chrome 畫面仍只測過去 V0.9F 等模型，**不是** V0.9N 新尺寸的專屬雙橫式 Chrome／iPhone Safari 動態驗收。

## 必須繼續保留的限制

現在的**動態權威仍固定 `2.28 world units / .13 bodyRadius`**。新模組的 `sourceMotionAuthorized=false`、`originalControllerMustPauseOnResize=true`，不能繞過 V0.9C/D/G 或偽裝成已允許移動、雲端存檔已更新。不同體型的**頭部形狀、頸部、骨節密度、重力支撐和貼地接觸**還沒有全部與 V0.9N 的體長、半徑一起物理整合；目前也沒有長大時的真 3D swept mesh、真實動物年齡／生長速率、完整行為學或玩家存檔更動。

**下個決策關卡**：整合現有 V0.1 Growth Motion Bridge 的 body/head mesh、V0.9N 尺寸曲線與 V0.9D/G 改造成真正適應不同大小的同一套來源安全控制；完成動態來源、場景與自身碰撞及視覺品質後才移進私人遊戲，最後再考慮原創外皮。
