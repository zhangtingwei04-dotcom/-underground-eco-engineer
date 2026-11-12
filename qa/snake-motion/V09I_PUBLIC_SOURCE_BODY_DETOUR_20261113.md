# 歐姆計劃 V0.9I｜透明蛇的全身佔用繞行、來源動態重播與中途重新規劃

日期：2026-11-13（Asia/Taipei）。性質：**公開中立合成工程 QA**，非私人遊戲正式動物動畫、真實物種解剖認證或玩家可玩版本。

## 為何開發

V0.9F 透明蛇形態已有頭／頸／身／尾候選，但 V0.9C 返程會擠成過緊的圈，V0.9G 在第 284 幀保守停止；V0.9H 試算回頭的 ± 轉向，兩邊分別到 284 幀出現緊彎與 271 幀遇到場景碰撞。因此「在原地改左右轉」不足以產生自然且可行的路線。本輪改以真正不同的暫時前進／加大轉彎路線來探索可用空間。

## 新增原始碼

- [snake-body-detour-v09i.mjs](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-body-detour-v09i.mjs)：從**同一個已驗證的 V0.9C moving_return 狀態**產生五個不同的暫時路線：`forward_open`、`wide_left`、`wide_right`、`arc_left`、`arc_right`。起點由原本來源蛇頭與速度計算，終點仍保留原本的 `startFloor`，中途加入不同橫移量的兩個 staging points。沒有重設 24 節骨架、改骨長、傳送或直接拉動蛇身。
- 前置的 **2D 障礙預檢**：以現有 V0.3d 場景物件為唯一 AABB 來源，針對暫時線段做有膨脹邊界的連續區間判斷；同時使用來源蛇的非局部（自第 5 節後）XY 身體連線做保守取樣，以免繞路點直接切過尾巴。這只是**局部平面佔用 proxy**，不是 3D 所有三角面完整 swept collision，也不會把 2D 通過直接當可走。
- 逐影格預演：每一條通過靜態預檢的候選會用真 V0.9C + V0.7U controller 行進 **160 幀**（可調 30–180），每影格經 V0.9D 原本的 3D capsule 安全檢查及 V0.9G 多節轉彎半徑保護。任何失敗保守拒絕。
- `advanceSnakeBodyDetourV09i` 僅在其中一條路線的完整預演通過後，採用它的 staging route 真正**提交一個新來源影格**。預演中的影格都不被偽造為玩家已移動。若全失敗，`return_wait_for_space` 保守等待。
- [snake-body-detour-v09i.test.mjs](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-body-detour-v09i.test.mjs)：原 V0.7P→V0.9C 真 24 節來源到第 160 幀，測試五條真不同 staging 路線、scene revision 失效、來源前後不可變，並**把預演選出的路線真實播放到預演結尾，逐點核對蛇頭位置**；之後延長測試與中途兩次重新規劃。

## 實際 trace（2026-11-13）

初始來源在第 160 幀進入返程，選出的中立 route 候選如下。

| 路線 | 起始階段 2D staging 預檢 | 160 幀真來源預演 | 第 320 幀頭部 floor XY |
|---|---|---|---|
| forward_open | 通過 | 通過 | (708.45, 44.89) |
| wide_left | 通過 | 通過 | (697.77, 70.08) |
| wide_right | 阻擋 | 不執行 | — |
| arc_left | 通過 | 通過 | (694.09, 74.27) |
| arc_right | 阻擋 | 不執行 | — |

- 選擇 `arc_left`（依 160 幀末頭部到原起點的距離，再以 source 間隙 tie-break），一格真來源提交後，繼續**逐影格重播到第 320 幀**，實際頭部位置與預演相差小於 `1e-7` floor pixels。
- **若不再中途改道**：原路線可繼續至 **第 705 幀**，接下來再次觸發 `next_source_return_turn_too_compact` 而安全停止。此事不能被 160 幀預演成功掩蓋：短段安全 ≠ 已能完整返程。
- **第 600 幀中途再次評估**：從完全同一個當前 24 節來源狀態生成五個新 staging 路線，這次五條皆通過 160 幀預演，選 `arc_left`，真來源重播至 **760 幀**（頭部 ≈ `(662.61,197.49)`），跨越原本第 705 幀的停點。
- **第 760 幀第二次中途評估**：五條 staging 候選再度都通過 160 幀來源預演，選 `arc_left`，真來源重播到 **第 920 幀**（頭部 ≈ `(601.23,174.54)`），來源節數及安全門檻仍未放寬，未把 `moving_return` 偽稱為 `return_head_arrived`。
- 這是**中途改道確實能跨過舊停止點的正面來源動態證據**，不是自然蛇類行為、實際三維自體疊身的物理認證，也不是完整往返證明。

## CI 與已知限制

GitHub Actions [#43267146542](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43267146542)：新 V0.9I source-backed Node test 通過；原 V0.9D/V0.9F 舊版 Chrome 兩種橫式視覺回歸仍在此 workflow。**本輪沒有為新 V0.9I 生成或人工逐張檢查專屬 Chrome/iPhone Safari 橫式動態圖**。

新 V0.9I 的暫時候選只做 **兩段 staging 線段的局部場景與 body footprint proxy**，並在有限 160 幀實際來源動態中受原安全檢查；到最終家門目標的整條回程、所有視覺 mesh 表面三角面、跨幀 3D swept self/scene collision、摩擦／肌肉／支撐力和尾端完整抵達，**均未認證**。中途重新規劃是 QA 測試中的顯式操作，正式遊戲內還沒有可自動完整調度且驗證過的全程決策器。

下一階段：以本次測試獲得的真 24-joint source state 為起點，建立**有界的週期性重規劃控制器**：真正監測轉彎壓力、到家的進度、空間不足時休息，避免一味往前繞而不返回；每一段再執行 source V0.9D/G 檢查與視覺候選碰撞。維持透明、不加鱗片／花紋，私人原創物種／NPC／存檔不進 public。
