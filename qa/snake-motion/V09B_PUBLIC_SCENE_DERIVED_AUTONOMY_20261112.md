# 公開中立 V0.9B｜場景幾何自動短程尋路與源頭蛇身驗證

日期：2026-11-12 (Asia/Taipei)  
公開主分支來源提交：`35227d0b9e2c2eaa1c4104d4d385fbca3d35a466`  
測試：[GitHub Actions 43242734864](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43242734864) — **5/5 jobs success**，其中 Node 單元組實際執行 `snake-scene-route-v09b.test.mjs` 並印出 PASS，另外 4 個既有 Chrome / 生態箱 QA 也通過。  
狀態：**公開、合成、中立的獨立 QA；沒有修改私人正式遊戲，沒有獨立開發引擎完成宣告。**

## 1. 本輪已證實的新功能

- `src/ohm-core/snake-scene-route-v09b.mjs`：來源使用既有 V0.3d `scene.objects` (1000 × 400 地板座標和 scene revision)。動態建立限定格點圖、所有物件按 AABB 加安全邊界、8 鄰點無對角穿角，逐段確認線段不穿過膨脹後障礙。**不再手寫從場景到目的地的各段路徑。**
- `findSnakeSceneRouteV09b`：來源地板位置與站點座標 → 搜尋路線 → **反方向重新搜尋** → 回報 `SAFE_GRID_BIDIRECTIONAL`；目標在岩石內／沒有穿越圖時回報 `APPROACH_ONLY` 和可接近安全替代位置，並明確標 `destinationArrived:false`。起點被阻擋回報 `BLOCKED_START`。revision 不符回報 `STALE_SCENE`。
- `planSnakeSceneAutonomyV09b`：使用當前 V0.7P 13 節來源蛇頭的 floor XY；對符合生態站點資料且有 XY 雙向圖的候選站點，從路徑第一段**推導 7 個候選短程 departure vectors**。這些向量不由測試手寫，實際選哪一個由 V0.8E source 預演決定。V0.9A 依需要評分選擇「遮蔽／探索／休息」，並在 source 幾何與 24 節蛇身真實運動預演失敗時停止或退而選擇別的有效候選。
- 動作完成仍必須呼叫 V0.9A `verifySnakeAutonomousSegmentV09a`，讓 V0.7S–V0.7U 連續運動 60 幀通過，**僅報短程動作完成**，不虛報已進入躲藏點、喝到水、捕食、玩家觀察紀錄。
- 測試同時確認來源輸入無副作用、相同資料確定性重播、24 節維持、動態品質限制和沒有畫皮。

## 2. 實際 GitHub CI 驗證資料

- **Workflow**: `Public OHM Snake and Terrarium QA`；run `43242734864`；5 jobs 全部成功。
- Node 日誌：`V0.9B source head floor {"x":581.25,"y":35}`。
- 在測試需求 `security:1, activity:0` 下，自行選出 `hide_a`；兩個站點 XY source graph 均報 `SAFE_GRID_BIDIRECTIONAL`。選出的實際可動方向為 `hide_a_route_1`，`departure {x:0.093862, y:-0.034495}`，`turnRadians:0.24`。
- 選中路線的物理預演為 60 source frames；最高彎角約 `0.576253` radians，在 V0.8E 的 `0.65` 門檻以下；累積蛇頭行程約 `0.164367` source units。**數值是這份固定合成測試的量測，不是現實蛇的運動統計。**
- 另外測試動作真正再次執行 60 幀、24 關節和 source collision/continuity gate。腳本末行記錄：`PASS V0.9B source AABB routed heading derived from scene: reversible 2D graph, approach not arrival, true 24-joint short preflight, deterministic shelter/explore/rest, revision gate`。
- 既有四項工作包含橫式 Chrome 實際擷取、透明蛇 Alpha 與 V0.8D 影格及生態箱畫布；它們是**未變更基準的回歸 QA**。本輪**尚未為 V0.9B 產生新連續動畫 Chrome 專屬截圖**，不得以舊畫面通過宣稱新 AI 視覺已完成。

## 3. 重要技術邊界

- **XY 可去/可回只是地面中心線的可逆通行代理**，不是整條蛇實際完成來回移動、回程轉彎、坡度、攀爬、鑽土和頭身 3D 物理求解。回傳 `graphTwoWayOnly:true`／`fullBodyReturnVerified:false`。
- 目的地由實驗用的 `siteFloors[id] = {x,y}` 明確提供。程式從**地圖幾何自動找到路線**，但不是從遊戲畫面上自動辨認「哪一塊石頭是躲藏洞」，也不是對所有場景做完整智慧導航。
- 動作只是從目前休息姿態啟動的 60 幀短程。**沒有**連接動態中變更場景的 V0.8F 持續循環，沒有無限時長安全路線，也沒有真的到達行動點。
- 2D 膨脹安全邊界預設 22 畫素，是**保守的工程代理值，不是已經量測所有蛇的幾何碰撞半徑或生理數值**。所有地圖都仍須以 canonical 24 節 source 模組核對。
- V0.9B 還沒有 V0.9A 之外的動物學行為或個體記憶；虛構動物物種正式性格、習性、熱調節不能從合成 generic snake 測試推定。
- 未新增 3D 外皮、美術、NPC、玩家存檔、外部專有動物模型或任何 Rain World 程式；絕不自動導入私人主專案。

## 4. 下一項最小工程門檻

1. 路線從「中心線可往返」升級到**完整蛇身通行和真實折返動作能被 source 幾何預演**，先支援直行、簡單繞石，遇到不可回退的地形拒絕。
2. 用 source revision 中途改變測試 V0.8F 的 paused safe-stop；更新後不強迫舊向量續跑。
3. 加入一個**真實 Chrome 兩種橫式視窗的新 AI 連續運動 QA**，不是沿用舊畫面。
4. 後續才評估將通用、無機密的純函式模組逐項納入私人 Ohm Core；進正式遊戲需要存檔和生物研究審核。

**結論**：V0.9B 已完成「場景 source 地圖 → 自動 XY 路線及回程圖 → 生成短程方向 → 真實來源 24 節蛇身預演」，但**不是已完成長距離／來回的 3D 自主尋路，也不是最終動畫品質驗收**。
