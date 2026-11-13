# Project OHM V0.9V｜蛇類只在安全休息期更新骨架尺寸的中立工程 QA

日期：2026-11-13（Asia/Taipei）｜**已完成公開中立 Node 來源回歸**，不代表正式遊戲、真蛇生物學或視覺成品已完成。

## 玩家已確認的規則

- **移動／探索／進食：固定當下骨長、局部體徑和可見網格尺寸**。內部可累積「成長潛力」，但不會在走路途中忽然拉長或變胖。
- **自然休息／睡眠／蛻皮完成後的休息**：僅在明確進入合法休息狀態後，依累積進度逐次嘗試小幅變長；每個中間骨架／頭頸／整條網格都重新驗證地面、石頭、玻璃、自體接觸。失敗即保留原安全姿勢、尚未使用的成長量，不移走石頭、傳送尾巴或縮小碰撞。
- **蛻皮進行中鎖定尺寸**；完成蛻皮本身不附帶固定成長，必須有真正累積的成長量且環境容得下才能更新。
- 生物學上真蛇不只在蛻皮一瞬間成長；本規則是**遊戲骨架／碰撞和可見網格的安全提交時機**，不是「生理上只在休息長大」的事實。
- 幼體／成長中／成體／大型成體仍是 V0.9N 的**合成工程倍率**，不代表真實物種年齡、成長速率或所有虛構生物的法則。

## 已實作檔案

- [`snake-rest-growth-lifecycle-v09v.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-rest-growth-lifecycle-v09v.mjs)：與現有 **V0.9T 獨立體型骨架**、**V0.9U 共用透明網格**分離的生命週期工程 wrapper。
- [`snake-growth-envelope-v09n.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-growth-envelope-v09n.mjs)：新增唯讀 `sampleSnakeSizeMorphProfileV09v`，沿既有 V0.9N 參數提供 23 節相對骨長權重和 24 個局部半徑成長目標。**不改原 V0.9N 固定來源投影規則**。
- [`snake-variable-size-locomotion-v09t.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-variable-size-locomotion-v09t.mjs)：新增唯讀 `inspectSnakeRestSizeChangeSafetyV09v`：原姿勢＋新姿勢雙重 V0.9T 來源場景與長度稽核，沿**尺寸也在變化**的 5 個時間切片檢查全身地面、玻璃、石塊與非相鄰 3D capsule 代理；仍採保守 swept XY AABB，不以固定成人體徑假放行。
- [`snake-rest-growth-lifecycle-v09v.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-rest-growth-lifecycle-v09v.test.mjs)：四體型「移動中只累積→休息中微量成長→蛻皮中不成長→蛻皮後不自動成長→恢復移動」以及尾端成長空間不足時必須保留已通過狀態的可重播測試。

### 生命週期狀態轉移

```text
V0.9T 移動中（moving） ── 背景累積 pendingGrowth，但骨長與半徑鎖定
          ↓ 明確選擇合法休息
resting / asleep ── 每次最多 +0.012 合成階段進度的微量成長
          ↓ 開始蛻皮
shedding_in_progress ── 所有變形鎖定，只有事件完成才恢復休息
          ↓ 蛻皮完成
post_shed_rest ── 不自動成長；有 pendingGrowth 才提出可驗證步驟
          ↓ 安全地恢復活動
V0.9T moving_sized ── 用已核准的新 23 條骨長及 24 段半徑繼續走
```

- 使用 `createSnakeRestGrowthSessionV09v` 建立候選來源；`accumulateSnakeGrowthPotentialV09v` 只修改尚未實際生效的進度，不更新姿勢。每次累積 `amount` 工程上限 `0.1`，整體暫存上限 `0.3`；不接受一次帶入大量值造假。
- `enterSnakeGrowthRestV09v` 只允許從 `moving` 進入 `resting`、`asleep` 或 `post_shed_rest`。**真正遊戲中「休息是否成立」仍必須由可信宿主檢查**；這個中立工程 wrapper 沒有自行偵測玩家操作或遊戲時鐘。
- `beginSnakeSheddingV09v` 和 `completeSnakeSheddingV09v` 分別限制蛻皮正在進行與蛻皮結束，沒有「每次蛻皮 = 一次必然長大」的強制尺寸提交。
- `applySnakeSafeRestGrowthV09v` 在 24 節當前真 V0.9T 姿勢之上按本體型的骨節方向提出下一小步（**不呼叫原成人 V0.9C 重播來縮放**），蛇頭 XY 固定；每一新節距和局部半徑依原 V0.9N 剖面比例小幅更新，每段在高度場上求出新中心高與水平投影，再要求 V0.9T 重新稽核。**每節骨長不同，但必須與新目標精準相符**。
- 確認完整 V0.9U 頭頸 body 仍是 **1,617 頂點、3,216 三角面**，且原 V0.9R 共用頸部 indexed seam 不裂開，V0.9S 全面靜態三角面與**五個時間切片的表面變形、場景和高度場**都合格，才允許只在**工程 rest session**內提交下一個體型。失敗保留舊 session 原始引用、未消耗成長量。
- `resumeSnakeAfterGrowthRestV09v` 將原 V0.9T 來源從 `resting_growth` 明確切回 `moving_sized`，不重建一條成人縮放影子、不突然把尾部送回初始點；恢復後 23 條已更新骨長與 24 局部半徑必須保持固定，直到下次安全休息。

## 實際 GitHub QA（2026-11-13）

**[Actions #43340181356](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43340181356)：8/8 jobs 全部成功。** 新 V0.9V Node source tests 成功，既有 Chrome 等舊版畫面/場景 regression 也未退步；**沒有 V0.9V 專屬 Chrome 動態影片或 iPhone Safari 真機品質檢查**。

| 合成階段 | 移動中的成長量未立即生效 | 休息中實際更新 | 休息後 V0.9T 再移動 | 最後工程體長（world） |
|---|---|---:|---:|---:|
| 幼體（0） | 通過 | 2 小步（0 → 0.024） | 5 幀，安全 | 1.15368 |
| 成長中（1） | 通過 | 2 小步（1 → 1.024） | 5 幀，安全 | 1.72368 |
| 成體（2） | 通過 | 2 小步（2 → 2.024） | 5 幀，安全 | 2.296416 |
| 大型成體（3） | 通過 | 已到合成階段上限，0 步 | 5 幀，安全 | 2.964 |

每個體型另有**成長前 6 幀移動**；所有尺寸更新前後都保持 source locomotion `verifiedFrames` 不增加，蛻皮進行中身體不變；蛻皮完成不自動加尺寸。恢復移動後仍能使用新的骨長／半徑生成 V0.9U 透明頭身網格。

**重點：狹窄洞口/石塊測試。** 原幼體和左後方同一固定石塊初始安全。測試使用合法分批累積的 `pendingGrowth=0.24`，休息期間每步最多 `0.012`，前 **8 次**實際更新通過，但**第 9 次**因變長後會與原場景碰撞而拒絕；系統維持上一個可行 24 節姿勢，未使用成長量 **0.144** 保留，且仍能以最後安全體型重新開始移動。**沒有移動石頭、縮小蛇身或發生狀態突然傳送**。超過單次輸入上限的 `0.24` 一次提交也會被拒絕。

## 仍未完成／不能宣稱

1. **這是獨立工程生命週期候選，不是正式遊戲的自然成長引擎。** 並未接入玩家生態營養、健康、年齡、時間、物種資料、蛻皮動畫或角色 AI；休息由測試/宿主手動標記，還沒有現場自動辨識，不能把「休息狀態」當作自行已驗證的行為。
2. 目前按 V0.9N **合成倍率**微調同一個體的 23 條骨長和 24 局部半徑，這能測資料安全，但不代表任何真實或虛構物種的實際成長速率。成長原理與蛻皮時機仍需由科學研究和每個原創物種設定決定。
3. **V0.9T 的移動與 V0.9U 網格已可使用休息期的新尺寸繼續前進**，但其安全仍是高度場／保守場景 AABB、非鄰近 capsule 和 V0.9S 的**有限時間、有限面內取樣**；不是精確連續 3D swept-triangle 碰撞、肌肉/摩擦/重量/疊身支撐或全部躲藏空間的力學證明。
4. 工程中立測試的 `sourceFramesCommitted=0` 指**未對正式遊戲提交動作**；rest session 裡的 `completedRestSteps` 則確有更新工程骨長／半徑，兩者不可混淆。**沒有寫入正式 Phaser Scene、Supabase `player_saves`、localStorage/IndexedDB、私人原創美術、外皮或故事。**
5. 未完成大型複雜生態箱、連續多天生長與存檔升版、跨裝置同步，以及 V0.9V 專用橫式透明蛇長時動畫視覺審核。**老版 Chrome 工作成功不代表新模型看起來已像成品。**

**後續方向：**在 V0.9V 安全閘門上追加真正「休息位置／躲藏洞內空間」偵測，將合成成長改成與虛構物種資料和生態需求連動，做成長後更長時間的獨立網格移動和直觀橫式影片檢查，再考慮逐步整合私人正式遊戲。
