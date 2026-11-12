# 歐姆計劃 V0.9J｜透明蛇有界自動返程、頭尾進度與安全休息

- 日期：2026-11-13（Asia/Taipei）
- 程式範圍：公開中立 synthetic QA，不涉及正式遊戲、玩家存檔、原創物種／NPC／私人研究。
- **嚴格狀態**：此版完成「自主重新規劃／連續移動或休息」的工程測試，但**沒有完成真正返回起點，也沒有生物學或 mesh 碰撞認證**。

## 問題

V0.9I 的五種 staging detour（前進／左右寬轉／左右弧轉）曾使真正 24 節蛇骨架來源從 160 幀→920 幀連續移動，但當時中途第 600／760 幀重新規劃是**測試腳本人工觸發**，不是會自主判斷何時重規劃的控制器；也未驗證是否最後可以回家。V0.9J 希望在現有 V0.9C+V0.9D+V0.9G+V0.9I 上完成有上限的「下一步選擇、動態驗證、失敗休息」。

## 本輪實作

- 新增 [snake-return-autopilot-v09j.mjs](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-return-autopilot-v09j.mjs)。
- 接收**已通過來源 QA**、處於 `moving_return` 的原 24-joint `0.9C` 狀態，不會創造第二條蛇、重建姿態、變更 head collider、改節長、傳送或變更來源場景。
- 每 `160` 個來源影格（可設定 40–180）要求 V0.9I 自原**當前全身姿勢**產生五條不同的 staging 候選；每條仍逐幀執行 V0.9D 真 3D source capsules 的保守間隙檢查、V0.9G 多節曲率 gate 和 V0.9C 原 controller；160 幀 shadow 成功**最多只允許真正提交一幀**，下一幀仍驗證，不把預演影格宣稱已發生。
- 每幀量測 head 與 tail 到原點的距離、頭尾間距、24 節 body floor footprint bbox；在大範圍 U-turn 中頭可能短暫越來越遠，因此判定是否沒有進展時**同時檢查頭與尾**。這些 XY 參數只是路線調度和品質監控，不是 3D mesh/full body physics 證明。
- 有界預設值：最多 `1200` 個返回來源影格、`8` 次 replan、頭部離原點最多 `260` floor pixels、連續 `4` 個窗口頭與尾都無明顯改善時停留。另有場景或 terrain revision mismatch、V0.9D/G 拒絕、無合格 route 的保守休息；停止後重複 tick 不會再移動。
- 進入 head-only return 範圍也只會記為 `head_only_arrived`，**絕不**宣稱尾部已返回或完成完整三維接觸與力學。
- 增加 [snake-return-autopilot-v09j.test.mjs](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-return-autopilot-v09j.test.mjs)，從既有 V0.7P→V0.9C 真來源 160 幀開始，逐步走到控制器終止；測試真 source 幀一幀一幀增加、原始場景與頭身姿勢未改、無偽造抵達／存檔寫入、budget 頂限、source revision mismatch 停止、休息狀態 inert。亦取**實際第 1280 幀骨架**用嚴格停滯門檻驗證 `resting_no_progress`。

## 實際測試結果

**[GitHub Actions #43269224125](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43269224125) 8/8 jobs success**，含新 V0.9J Node regression、既有 V0.9F Chrome 雙橫式動態/靜態與生態箱回歸（**非新 V0.9J Chrome 專屬畫面驗收**）。

- 真實來源從第 **160** 幀起，V0.9J 逐幀提交 **1200** 個來源步，最後在第 **1360** 幀因已用完預設動態預算進入 `resting_budget_exhausted`，不再挪動任何來源骨節。重規劃 **8 次**。
- 方案選取時間與 ID：160/320/480/640/800 選 `arc_left`；960/1120/1280 改選 `forward_open`。選路確實會隨來源姿態變化；沒有宣稱全程能完成回家。
- 早期觀察：frame 160 時 head 到 home `61.52px`、tail `198.98px`；frame 800 時 head `190.29px`（暫時遠離）、tail `52.98px`（明顯靠近），**因此單看蛇頭就判定迷路，會錯判正常的全身跟隨過程**。新版需同時檢查兩者的窗口進度。
- 到 frame 1280 時，當段 head／tail 距離都退步，嚴格 `maximumStallWindows=1` 測試從**真第 1280 幀來源姿態**證實立即 `resting_no_progress` 且**不增加來源幀**；正常保守門檻仍允許多個窗口，但有 hard stop。
- frame 1360 停止時 head 到 home `196.77px`、tail `165.26px`，`headOnlyArrivalVerified=false`，`fullBodyReturnVerified=false`。這證實**此輪沒有真正返回起點**，不可因成功走了 1200 幀就當成自然路線完成。
- `maxReplans=1` 專項測試：到可規劃次數上限便 `resting_budget_exhausted`；變更場景版本則 `resting_scene_changed`；靜止後重複 tick 將返回同一無動作控制狀態。

## 仍需克服

1. **不能一直朝 staging 繞圈**：目前 V0.9I 的候選在 160 幀 horizon 中以**候選期末頭部離 home 距離**做排序，但長期仍可能繞開目標。需要增設目標導向的**有界路徑成本／遠期終點可達性**、防重複同一區域、周遭 body-tail 時變佔用與合法休息目標，才能真正自主返回。
2. **碰撞未完全驗證**：V0.9D 是來源非鄰近 3D capsule 近似，V0.9G 是頭端多節曲率；新 V0.9F 透明頭身 render mesh 尚無全幀 swept triangle collisions、真實物理支撐、摩擦與合法上下疊身。
3. **視覺未驗證 V0.9J**：8 項工作包含原有 V0.9F Chrome，但還沒替 1360 幀 V0.9J 真動作產生 1440×900／932×480 的逐幀影像與人工審視，也未在 iPhone Safari 實機測穩定速度和自然觀感。無外皮、無像素化、無正式原創生物。
4. **正式遊戲未合併**：公開代碼僅做 neutral synthetic QA，沒有對 `src/scenes`、生態、存檔、雲端、私人 repo 的遊戲邏輯進行不經驗收的整合。

結論：**已建立可以自主選路、逐步前進和有界休息的工程控制器；尚未建立能真正可靠返家的完整蛇類自主尋路。** 後續以品質為優先，不能靠繞更久或放寬碰撞來宣稱成功。
