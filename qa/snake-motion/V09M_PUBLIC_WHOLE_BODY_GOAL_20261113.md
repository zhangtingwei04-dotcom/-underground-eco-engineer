# V0.9M 公開中立 QA｜蛇的 24 節全身抵達判定與目標選路

日期：2026-11-13（Asia/Taipei）。**只限公開中立合成工程 QA；非正式私人遊戲、原創物種或生物學認證。**

## 為何要做

V0.9L 從來源蛇頭 heading 和頸部切線提出不同半徑的合法轉彎候選，可逐幀進行 V0.9C、V0.9D、V0.9G 安全測試。在同條件 480 幀測試中，V0.9L 頭部比 V0.9K 更靠近起點，但尾部卻更遠。這證明「頭部距離」不能代替「整段蛇身能不能進入安全目標區」。

## 程式與驗收範圍

- [新模組 `snake-whole-body-goal-v09m.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-whole-body-goal-v09m.mjs)：`inspectSnakeWholeBodyGoalV09m` 只讀原真 24 節姿態，對**24 個節點和 23 條連線**檢查目標圓盤、玻璃邊界、既有 V0.3d 石頭／物件的 padded AABB、V0.9D 非相鄰 3D source capsule 安全。以世界座標 `bodyRadius=.13` 與 V0.7C `scale=.008` 計算出最大身體半徑投影約 16.25px，故不允許把 2D 檢查邊距縮小至 17px 以下，預設採 18px。
- **絕不造假抵達**：就算目標區真的含全部 24 節，輸出 `eligible2DCenterline=true` 仍只代表**來源中心線的 2D 靜態候選**；`fullBodyReturnVerified`、`swept3DSurfaceCertified`、`groundSupportCertified` 全部是 `false`，不寫玩家記錄、存檔或新皮膚。
- [V0.9I](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-body-detour-v09i.mjs) 的 source-backed shadow 回報**末端 24 節原始 pose**，而不是只回報蛇頭或尾巴。預演絕不視為已真正行走。
- V0.9M `chooseSnakeWholeBodyReturnV09m` 在**V0.9L / V0.9I 真來源預演安全**、**V0.9K 二維可達圖及先前真到訪證據**的候選中，加入全身平均、最遠節點、RMS、頭尾距離差及目標內節點數做選路評分。這是目標導向的保守研究，不能將「評分較低」冒充物理上必然更好。
- [V0.9J 有界控制器](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-return-autopilot-v09j.mjs) 新增**選用** `routeSelectionMode:'whole_body_goal_v09m'`；不改原有三種模式。每一真正來源影格還要由 V0.9C、V0.9D、V0.9G 合格通過；每影格記錄全身在目標區的唯讀指標。保留 max frame、replan、progress、場景變動即停止的原規範。
- [V0.9M 測試](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-whole-body-goal-v09m.test.mjs)：用原 V0.7P → V0.9C 真來源，確認「蛇頭已入區但尾巴還在外面」不會過關；額外合成一個 24/24 節都在目標圓盤的姿態，證明它**仍不代表 3D 返程認證**；並加入**24/24 位於目標區但穿過原場景實體石頭**必須拒絕，且 padding 不可小於蛇身半徑。

## 第一輪同場景 480 真來源幀 A/B：不能把非改進寫成進步

*以下數值來自 [GitHub Actions #43275061842](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43275061842) 已通過的 **V0.9M Node source-backed regression**。該次整個 workflow 只有 7/8 jobs 成功：舊 V0.9F Chrome 靜態測試在 `document.body` 尚未出現時提前讀取 `dataset` 而失敗，與 V0.9M 的骨架來源測試不同。已另修正該測試的 DOM 等待判斷；**不得宣稱此輪 8/8 成功**。後續對應 run 需依實際結果另外記錄。*

兩版都從相同原始來源第 160 幀、120 幀預演與重規劃間隔、最多 480 動態幀、4 次改道、相同場景與安全閘門出發；最後都在第 **640** 幀 `resting_budget_exhausted`，沒有完成返程。

| 指標 | V0.9L 頭向＋半徑模式 | V0.9M 全身目標模式 |
|---|---:|---:|
| 蛇頭至 home | **152.03px** | 157.28px |
| 蛇尾至 home | 94.27px | **91.88px** |
| 24 節平均至 home | **100.14px** | 103.13px |
| 最遠骨節至 home | **153.51px** | 160.86px |
| 當前全身中心線位於目標區節數 | **19/24** | 17/24 |
| 真正整身返回？ | **沒有** | **沒有** |

V0.9M 選出的半徑序列為 `left_r155`、`left_r120`、`left_r65`、`left_r90`；V0.9L 為 `left_r155`、`left_r65`、`left_r120`、`left_r90`。現有 M 的全身距離分數與入區節數比 L 還差，**證據不支持宣稱 M 路線較佳**。真正進展是擴大整身 QA 和安全判準，並揭示短視野的全身評分未能保證長期成效。

## 待解決

仍需進行**真正時變全身配置空間**（頭向、可用轉彎半徑、全部骨節與尾巴位置）規劃，不應以單一段局部代價函數取代長時返程；未來要確保進入合法全身停留區域，而不僅讓一部分骨節進圈。V0.9D 是 3D capsule 靜態近似，**跨幀三角網格 swept collision、實際對地支撐／摩擦、V0.9M 專屬 Chrome/iPhone Safari 橫式長時影像 QA 仍未認證**。保留透明蛇、不加原創蛇皮、不更改正式私人遊戲及玩家存檔、不引入新付費服務或公開私人 IP。
