# 公開中立 V0.9C：同一蛇身連續路線追蹤、蛇頭折返與場景變更安全續行

日期：2026-11-12（Asia/Taipei）
**性質**：合成 source-backed QA，非正式遊戲功能；沒有玩家資料、原創物種秘密、NPC、外皮、商用第三方素材。
**可重現的來源驗收 commit**：`75092ca7dceaf9b88044b169ed9bae2c36119110`。  
**GitHub Actions**：[Public OHM Snake and Terrarium QA #43246837991](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43246837991)，5 / 5 jobs success。這是新 V0.9C 原始碼與其測試同一次版本的驗證。

## 一、已實際做出並通過 Node 來源測試

### 1. 完整來源蛇身的長影格續行
- `src/ohm-core/snake-route-follower-v09c.mjs`：先取得 V0.9B 場景衍生二維路徑和 V0.9A／V0.8E 通過 V0.7S 真實碰撞的 60 幀起步姿態。
- 後續每個 frame 由路線前方的目標點產生小角度 steering（已調至每影格 `0.01` radians 上限），沿用**同一個** V0.7U → V0.7T → V0.7S 24 節蛇身 source／個體速度／更新計數。不在下一個路點重新建立一條蛇，也不只畫假的彎曲曲線。
- 每次移動皆透過 source 的真實場景碰撞／頭部驗證，以及 V0.8D 的轉折、每影格位移、旋轉品質限制，拒絕不能通過的 source step。場景 revision 或物件/terrain hash 不符時不畫新姿勢、要求先重新驗證。

### 2. 實際蛇頭的往返測試（不是只求地圖回程圖）
測試合成場景 `neutral_long_route`。全程同一 source，實際值：
- 初始 V0.7P 來源蛇頭地板座標：`(581.25, 35)`。
- 歐姆自主遮蔽目標地板座標：`(651.25, 35)`（合成點位；不是正式躲藏洞模型）。
- 起步 60 幀後，又走約 100 個實際 source frames，於 `160` 幀累計時蛇頭抵達目標 9 px 容差內，實測回報接近 `(642.75, 33.53)`。
- 之後系統由**最新頭部來源位置**重新建立往起點的二維路線，選擇優先朝生態箱**內部**的平緩 U-turn，沒有直接倒放歷史蛇身、更沒有瞬移；以更低轉向率走回來。
- **最終累計 `692` 個來源驗證影格、24 節**，蛇頭回到約 `(583.56, 43.35)`，與原起點差約 8.7 px，低於 9 px 的合成驗收容差；強制單元測試 assert `return_head_arrived`、實際座標誤差、`verifiedFrames>=600` 及骨節數 24。Node 日誌會印 `PASS V0.9C`。
- 以上證明**同一條具來源碰撞檢查的蛇身，能完成這個固定合成測試中的蛇頭往返**。不代表軀幹最後回到原姿態、骨骼肌肉／摩擦/自接觸 3D 物理、所有地圖全域可達或真實蛇類動作習性已驗證。
- 因未建立完整**自身軀幹碰撞**與接觸力模型，程式明確維持 `fullBodyReturnVerified:false`、`selfContactVerified:false`，不可對外宣稱「所有 3D 全身折返均驗證完成」。

### 3. 移動中換石頭：從停止，到明確批准後重新繼續
- 任何 source `sceneId`、`revision`、物件或 terrain 有變更時，`advanceSnakeRouteFollowerV09c` **拒絕沿用舊路線**，不會偷渡新座標。
- `probeSnakeRouteChangedSceneV09c` 使用現有 V0.8F 的**靜態 24 節蛇身與頭碰撞**，在更新後場景中嘗試有限短程方向預演；若改動後岩石直接壓在蛇頭／蛇身上，回報不可展示的 unsafe（`pose:null`），不創造移動或臨時新蛇。
- `resumeSnakeRouteAfterSceneChangeV09c` 在 **V0.8F 核准的 paused** 條件下，使用同一 source 蛇身安全續動一步，然後用新場景 revision 重新計算 V0.9B 的二維可去/可回圖；若無新路則停止，**不以先前路線繼續**。
- 實際 QA 修改了遠處物件：場景 revision `0→1`，來源暫停驗證成功，再允許 source `verifiedFrames:60→61` 並能安全在新場景再進一幀。另一個測試讓岩石直接重疊頭部，驗證拒絕。
- 這是**一個明確的中斷、安全預演與重新接線回合**，不等於不受限制的即時自動避障全系統或從遊戲攝影機直接辨識所有障礙。

## 二、QA 證據與文件

- `tests/snake-route-follower-v09c.test.mjs` 是新增專屬測試：去程、蛇頭回程、單步骨架品質、場景變更、V0.8F 暫停／續行、新幾何重新尋路、失敗停留、無假玩家觀察、不可寫入玩家存檔。
- [Actions #43246837991](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43246837991) 的五項：
  1. Snake and terrarium source-backed regression suite — success；
  2. Five-zone terrarium pixel Canvas verification — success；
  3. Real landscape Chrome screenshot validation — success；
  4. V0.8A real single-pass alpha A/B in landscape — success；
  5. V0.8D real intermediate-frame Chrome motion QA — success。
- **驗收範圍區分**：V0.9C 的 692 幀是**Node 內實際來源骨架動態幾何**而非新 AI 畫面逐幀 Chrome 截圖。其他 Chrome jobs 驗證原有橫式透明蛇與生態箱基準沒有退步；**尚未對 V0.9C 新的連續往返畫面做專屬 Chrome 雙視窗視覺驗收，也未由使用者手機 Safari 確認**。

## 三、明確保留的技術邊界

- 不改本作品 `Phaser` 正式場景、`Ohm Core` 私有主線、登入、玩家記錄、Supabase 或任何儲存格式。
- 初始生態選擇仍是合成 `generic_snake` 模組，外部站點座標必須提供；現實蛇習性和虛構物種真實福利數值均未實裝，不可當科學證據。
- 雖然每一影格的 V0.7S 檢查來源 rock/ground/body/head，**沒有證明蛇在所有地形的自接觸、摩擦受力、攀爬或跨房間**；而 `2D 回程通行圖` 不等於 3D 回程，這次成功來自真實受檢的**固定合成示例**。
- `head_arrived` 只有蛇頭與測試地板點距離容差，**不能生成** `entered_hide`／`drank_water`／`player_observed` 等事件。
- V0.9C 使用 bounded `node --test` 風格腳本和 60–692 幀 QA，不保證所有機型的效能；在手機仍需專屬視覺和性能測試。
- 《雨世界》作抽象 AI／地圖設計研究；未使用原作角色、程式碼、關卡、音效或動畫資料。

## 四、下一階段建議

1. **新增 V0.9C 真實連續播放的雙橫式 Chrome 逐幀擷取**：檢查頭身比例、實際折返造型、透明部分是否有視覺瑕疵，並由人眼審查。
2. 再補「非相鄰身體段的過近／自相交」幾何診斷與合理自然接觸範圍；若源頭 3D 形體不合理則停下修正，而非忽略。
3. 接上實際長時個體意圖與可觀察事件；生態需求與圖鑑記錄要避免把尚未抵達的行動當完成。
4. 經測試通過後，才評估選擇性引入私人遊戲，不直接複製原創設定到 public。

**總結**：V0.9C 已用現有來源 24 節透明蛇實現且 QA 驗證「自主選擇→場景生成路線→持續前進→頭部折返到起點附近→場景改動後停下且經批准可重算續行」，但**沒有完成新 AI 的畫面品質與全部生物力學驗證**。
