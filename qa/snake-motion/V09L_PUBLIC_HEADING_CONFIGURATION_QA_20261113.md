# 歐姆 V0.9L｜透明蛇頭部朝向、轉彎半徑與全身佔位的來源預演

- 研究／測試紀錄日期：2026-11-13（Asia/Taipei）
- 類別：**公開中立合成工程 QA，不是正式《鱗片與種子》可玩動物，也不是自然蛇種動態科學認證。**
- 最新驗證：**[Public OHM Snake and Terrarium QA #43273249294](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43273249294)，8/8 jobs success**（新 V0.9L Node source-backed 測試與既有 Chrome 等回歸）。

## 為何需要這個版本

此前 V0.9J / V0.9K 在真 24-joint 來源蛇身上可安全移動及有界休息，目標導向的 V0.9K 甚至能改變 1200 幀內的暫時繞行決策，但最終都沒有真正返回。核心限制之一是只能從幾個固定「向前、左右延伸」的 XY staging 點選路，缺乏考量**來源蛇頭現在朝向、頸部切線與彎曲所需的空間**。不能靠縮短蛇骨、跳幀、放寬碰撞或增加虛構外皮遮掩這個問題。

## 本輪實作

1. 新增 [`snake-heading-turn-v09l.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-heading-turn-v09l.mjs)。只讀原 V0.9C 的真正 `moving_return` 24 節來源 pose 與 V0.7U 出發向量，計算蛇頭 heading、頭至第 3 節的 neck tangent 與兩者角度差；提出左右各四條半徑不同的**XY 頭部圓弧預案**（設計半徑 65/90/120/155 floor pixels，兩個 stage 的弧度 0.39/1.12）。合成設計下限 62px 是**遊戲動態品質門檻，不代表任何實際蛇種的生物學轉彎半徑**；提出圓弧不等於已經移動來源蛇身。
2. 只為 **V0.9L** 在 [`snake-body-detour-v09i.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-body-detour-v09i.mjs) 提供嚴格的可選自訂 staging 候選入口：只接受 1–8 個有界、有限數字的 XY staging 兩點和中立 ID。候選仍沿用**同一 V0.3d 場景 AABB、玻璃邊界、非局部真來源尾部 XY footprint** 逐段預檢；超出飼養箱的有限圓弧直接列為 **`staging_geometry_blocked`**，不得通過、不能讓異常直接中斷其他候選的合法檢查。最終路線回原始 `startFloor`，候選不能修改家園位置或蛇來源姿勢。
3. 完整來源預演：候選只有通過靜態場景／尾巴 prefilter 才會在每個預演影格繼續調用原 V0.9C/V0.7U、V0.9D 真來源非鄰近 3D capsule 自碰撞和 V0.9G 長段彎曲 guard。V0.9K 再依目標二維格點距離、頭/尾距離及真正已造訪位置評分。只有獲得完整 horizon 安全來源證據的 route 才可能獲得**一個真正的安全影格提交**；不會把 120 幀 shadow 模擬當作已完成的移動。
4. [`snake-return-autopilot-v09j.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-return-autopilot-v09j.mjs) 增加 **opt-in** `routeSelectionMode:'configuration_turn_v09l'`，既有 `legacy_nearest_head` 與 `goal_revisit_v09k` 保持不變；仍強制來源逐影格驗證、場景變更保守停止、完整影格／改道數上限、休息後不自動偷走一步，沒有正式遊戲動作授權。
5. [`snake-heading-turn-v09l.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-heading-turn-v09l.test.mjs) 採真 V0.7P→V0.9C return source；測八條不同的原頭部 heading 圓弧、來源 scene/body gate、120 幀 shadow 與**同來源真實重播的頭部座標誤差小於 1e-7 floor pixels**、不可變原 pose/world、過期場景拒絕；並驗證 opt-in controller 480 真影格及相同預算的舊 V0.9K 對照。

## 真來源測試：初次轉向與連續改道

以相同合成場景中真正返程 **source frame 160** 為起點（真頭部 heading 約 **0.1713 rad**、neck tangent 差約 **0.2360 rad**）：

| 候選半徑（floor px） | 向箱內「左轉」 | 向箱邊「右轉」 |
|---:|---|---|
| 65 | 120 幀來源預演通過 | 場景/玻璃空間阻擋 |
| 90 | 120 幀來源預演通過 | 場景/玻璃空間阻擋 |
| 120 | 120 幀來源預演通過 | 場景/玻璃空間阻擋 |
| 155 | 120 幀來源預演通過 | 場景/玻璃空間阻擋 |

最初 V0.9L 選中 `left_r155`，由原來源控制器實際提交一格並重播全部 120 幀，真頭部與預演座標一致。

在**有界自主模式**下，從 source 160 真走 **480 幀**到 640、重新規劃 **4 次**，選擇依序：
- source frame 160：`left_r155`
- frame 280：`left_r65`
- frame 400：`left_r120`
- frame 520：`left_r90`

所有新來源影格均經原本 V0.9D/G 關卡，最後因達到 `maxReturnFrames:480` 進入 `resting_budget_exhausted`，而非偽造抵達。**沒成功讓頭、尾或全身完成返回原起點。**

## 和 V0.9K 的同場景、同預算 A/B

兩種模式均從相同來源第 160 幀、相同場景／地形、`120` 幀每段／`480` 幀總上限／`4` 次改道出發：

| 真來源 480 幀後 | V0.9K 地圖距離選路 | V0.9L 頭向與弧線選路 |
|---|---:|---:|
| 蛇頭至原點 | **208.80px** | **152.03px** |
| 蛇尾至原點 | **78.92px** | **94.27px** |
| 真的完成返回？ | 否 | 否 |
| 因預算結束而休息？ | 是 | 是 |

V0.9L 的頭部距離改善約 **56.77px**，但尾端距離**退步約 15.34px**。**這是單一合成情境，結果是混合的，並未證明更自然、真正返家或統計上更好**；不能因蛇頭數字改善就忽略拖尾可能不合理。此同條件對照是保留 V0.9K 舊策略的原因。

## 尚未完成與下一關

- V0.9L 是源頭朝向與固定圓弧 staging 的**局部 2D configuration proxy**，不等於真正的全身 configuration-space / time-dependent A*、到終點可行性的完整證明，且目前的 neck heading discrepancy 是診斷指標，**不是**對肌肉負載或被迫扭曲的獨立力學證明。
- 真來源 V0.9D 3D capsules + V0.9G 長段轉彎 gate 保留，但**未驗證**所有透明 mesh 三角面對本體／環境的跨影格 swept collision、正常抬身與疊身支撐、摩擦與力矩。
- CI 的 V0.9F 兩種橫式 Chrome 是**舊版畫面回歸**，沒有針對 V0.9L 480 幀全程產生專用雙橫式截圖／影片人工審查，更沒有 iPhone Safari 真機驗收。不能把原基準的 8/8 成功說成 V0.9L 視覺成品。
- 私人正式遊戲、玩家存檔、雲端資料、原創生物/IP、NPC、付費工具均**未變更**。繼續維持透明體，直到源動態和 mesh、視覺接觸品質合格才考慮原創外皮。

下一步：應把 **尾巴是否真正跟上、全身是否能完整停在合法目標區**作為到達判據；研究更長視野的、含 heading/curvature/body occupancy 的真正時間化配置規劃，必要時中止或另選合法休息地點。避免只挑漂亮的頭部進度而增加尾部問題。
