# 公開中立自主行為實驗 V0.9A｜從生態需求到真正 24 節蛇身的短程安全動作

日期：2026-11-12
狀態：**公共 QA 實驗**。此頁不是正式《鱗片與種子》的自主 AI，也不是完成一套地圖尋路、動物生理或現實物種行為研究；沒有私人內容／玩家資料。

## 本輪真正加入的程式

- `src/ohm-core/snake-autonomous-intent-v09a.mjs`
  - `planSnakeAutonomousSegmentV09a()`: 接受純合成中立個體、V0.1 生態快照、needs、可用場景點，**自行按需求挑選休息／遮蔽／探索**。不是手工直接指定最終決策。
  - 以原本的 `snake-ecology-action-adapter.mjs` 檢查點位條件，`snake-activity-points.mjs` 做有界、可解釋、可重播的目標排序。
  - 對**來源候選**的局部移動方向，調用 V0.8E，讓來源 V0.7S 24 節三維蛇身與頭／石頭／地面，每一影格通過物理碰撞與動態連續性檢驗，並會拒絕錯誤方向和過時 revision。
  - 行動選擇與短程動作分開；`verifySnakeAutonomousSegmentV09a()` 以同樣正規來源完成整段實測，只有 60 個源頭影格都通過才回報 `short_movement_segment_completed`。
  - 環境在計畫與執行間更動，直接拒絕，bodyMoved:false，沒有假完成事件。
- `tests/snake-autonomous-intent-v09a.test.mjs`: 不同需求選 shelter/explore/rest，來源預演拒絕壞彎角，真正 24 節完整 60 幀，來源變化取消、沒有可行候選就停留、確定性重現、測試輸入不被改寫。

## 重要邊界

- **自主的是「選擇生活目的」**，而非自行發明可到達全世界的路線。每個行動點仍需要外部提供的短程 departure vectors，V0.8E 才會依來源真實安全預演。
- `safe/reachable` 仍由場景快照提供；雖然 60 幀移動通過**實際來源碰撞**，不能宣稱已檢查完整去/回程，不能宣稱成功到達遮蔽洞或飲水點。
- 完成事件是 **「短程動作已通過源頭幾何」**，不是 `entered_hide`、`drank_water` 或玩家親眼觀察；不寫入正式日誌或 player_saves。
- 沒有熱生理、壓力、營養、健康、遺傳或任何真實物種專用計算；所有需求分數是**人工合成遊戲相對係數**，不是科學量測結果。
- 沒有繪製新皮膚或使用 Rain World 的程式、角色、場景、影片；中立物種 `generic_snake` 只是試驗身份。
- 目前 60 幀為 headless source correctness QA，不是 iPhone Safari 即時互動展示；正式視覺品質仍需另外逐幀審查。
- V0.8F 動態停止/改道源碼保留不變；本輪測試的是初始 V0.8E source preflight 和真實 24 節短程執行，**不是**已和 V0.8F 實際動中岩石更新控制完整接線。

## 下一步

1. 將站點的 world-space 座標和場景 source graph 轉成真正**自動生成**的候選 heading／可行走路線，並加入去/回程可達性；不能只由 authored vectors 代表 AI。
2. 加入真實場景碰撞 revision 連續監測、V0.8F 動中安全暫停和恢復，建立真正可不中斷運行的連續生活迴圈。
3. 才做角色記憶、行動連續性和低負擔觀察筆記；防止無玩家親眼目擊卻出現「牠今天爬了樹」。
4. 在正式推進私人核心前完成 source-backed Node + Chrome 長影格序列、兩種橫式 viewport 審查；不以單元綠燈宣稱外觀自然或正式可玩。

研究緣由：`docs/research/engines/RAIN_WORLD_CREATURE_AI_DECISION_RESEARCH_20261112_V03.md` 位於**私人庫**，公共測試庫不搬運該私人研究或作品資訊。
