# 歐姆 V0.9K 公開中立 QA：透明蛇目標導向與真造訪歷史避讓

日期：2026-11-13（Asia/Taipei）｜狀態：**中立工程研究，非正式遊戲動畫認證**

## 問題及本次做法

V0.9J 在原合成蛇身（24 joint、2.28 world units）能安全前進、每 160 幀自動重新規劃，但完成 1200 來源影格後仍不能返回起點。在 V0.9I 的五條候選中只看試算終點頭部距離，容易缺乏全身目標與長期路線概念。

V0.9K 不為了返程而鬆綁碰撞，不重新生成蛇或移動尾巴。本輪：

1. [V0.9I 來源](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-body-detour-v09i.mjs)：在原本 V0.9C/0.7U+V0.9D/G 的 160 幀逐影格真來源影子預演之後，**唯讀**回報最後尾端 XY、每 40 幀的頭部 XY 位置。預覽中的虛構移動**不會**計入實際造訪歷史。
2. [V0.9K 排序器](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-goal-return-selection-v09k.mjs)：**只從 V0.9I 已 source-backed accepted 的候選中選**。取 source scene 的 V0.9B 雙向可達 2D 格點路線，把候選預演終點至家園的剩餘地圖距離、尾巴離家距離、頭部末端朝離家更遠的趨勢、先前真來源頭部造訪過的地區一起排名。針對多次重複進入相同 28px 週邊的候選，保守避讓。
3. [V0.9J 連續控制器](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-return-autopilot-v09j.mjs)：新增**選用** `routeSelectionMode:'goal_revisit_v09k'`，保留原 `legacy_nearest_head` 方便同條件對照。每次重新規劃後僅由既有 V0.9D/G 安全閘門提交下一個真來源影格；整個 1200 幀上限、改道 8 次上限、場景變更及失敗休息不被放寬。
4. [新 V0.9K 單元與真連續動態測試](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-goal-return-selection-v09k.test.mjs)：嚴格測試五候選、蛇尾預演、格點可達性、造訪去重、不可變來源、路線中途失敗及範圍限制。由既有 V0.7P→V0.9C 真 24 節 return 狀態做 1200 連續真來源提交，沒有假裝通過未驗證的動作。

## 可重播證據：同一合成場景、真來源 160→1360 幀

[GitHub Actions #43270985863](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43270985863) **8/8 jobs 成功**：V0.9K 新 Node 來源 test 通過；原有 V0.9F 雙橫式 Chrome 畫面與其他 snake/terrarium 回歸也通過，**不等於 V0.9K 長時間新路線已有其專屬 Chrome 或 iPhone Safari 畫面證據**。

| 來源改道影格 | 原 V0.9J 舊選法 | V0.9K 排序選法 |
|---:|---|---|
| 160 | arc_left | arc_left |
| 320 | arc_left | arc_left |
| 480 | arc_left | arc_left |
| 640 | arc_left | arc_left |
| 800 | arc_left | **wide_left** |
| 960 | forward_open | **wide_left** |
| 1120 | forward_open | **wide_right** |
| 1280 | forward_open | forward_open |

- 真來源動作 **1200 幀**、決策 **8 次**、最後 source frame **1360**，`resting_budget_exhausted` 依法停止；繼續 tick 不產生新動作。
- V0.9K 最後頭離原點約 **192.18px**、尾約 **164.76px**。先前 V0.9J 同一合成場景的結果約 **196.77px**／**165.26px**。單一場景的差異僅約 **4.59px／0.50px**，沒有足夠依據稱作完整尋路成功或顯著品質改善。
- 無頭部抵達、沒有尾部完整抵達、無完整安全 return；`fullBodyReturnVerified=false`。選法不同是有實測來源證據，但仍可能繞遠。
- 另有測試把選中候選的預演軌跡標為「**已實際到訪的舊座標**」，純選擇器會因重訪密度過高放棄該候選。這證明選擇器能抑制重複走廊，不代表本次 1200 幀真實軌跡已出現多次相同重訪。
- 即使格點回家路徑可達，**2D graph 是目標啟發式，不是整個蛇身可通過的證據**；每一幀仍由真來源 V0.9C、V0.9D capsule、V0.9G 曲率判斷。3D 表面和跨影格 swept-collision 尚未驗證。

## 下一個品質關卡

不再只調排名分數與延長影格。下一階段應研究含**蛇頭方向、彎曲/掉頭半徑、整身時變佔位、環境幾何及落點**的 configuration-space 路徑，讓規劃器有機會真正完成返程或明確決定不回去。需要新 V0.9F 透明 mesh 的真自體／場景動態接觸 QA，長期雙橫式 Chrome 和 iPhone Safari 檢驗，且**維持沒有表皮、沒有新付費、私人原創物種與存檔不外傳**。
