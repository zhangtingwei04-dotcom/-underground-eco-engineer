# V0.9R｜透明蛇的同源頭頸連接、轉向與候選安全（公開中立 QA）

日期：2026-11-13（Asia/Taipei）｜只限 **Project OHM 公開中立合成工程測試**，未更動正式私人遊戲或任何玩家存檔。

## 承接 V0.9Q

V0.9Q 用 V0.9N 局部尺寸＋V0.9P 真 24 節貼地姿勢，讓**同一來源**生成透明軀幹網格和 93 個碰撞截面；但舊 V0.1 頭部附件和 V0.9Q 身體不是同一份幾何，也沒有無縫頭頸接合的驗證。原始 V0.9C/D/G 仍固定 2.28 世界單位與 0.13 bodyRadius，任何新尺寸都只是唯讀候選，不能當作新物理來源。

本輪優先避免「蛇頭和頸部分開飄動、接口裂開、突然轉向或穿入石頭」；仍以**中立頭部幾何代理**作測試，**不是**實際蛇種／虛構生物的解剖頭型，也不加表皮或花紋。

## 實作檔案與權限

- [`snake-head-neck-seam-v09r.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-head-neck-seam-v09r.mjs)：
  - `buildSnakeHeadNeckCandidateV09r` 先要求 V0.9Q 的原 V0.9C/D/G→V0.9N/P 體型與貼地候選通過。再從 V0.9Q 原本**第一個身體截面**（同一 XYZ、半徑、方向／normal／binormal）往前延伸 8 圈中立頭部代理；最後加鼻端封頂頂點。頭部與身體在**同一份 indexed mesh** 中共用原第一圈頸部頂點，不重建另一圈重疊網格來藏接縫。
  - 採用每節來源半徑以限量調整頭部寬／高；頭部 8 圈只是**數學測試曲線**，不代表真實蛇種頭部比例。頭部轉向 `headYawRad` 限在 ±0.18、上下 `headPitchRad` 限在 ±0.08 rad；接頸位置的偏移函數一階導數為原頸部方向，避免在接口直接出現角度突變。**沒有改寫原始 24 節來源、真頭部 collider、species head、NPC、遊戲狀態、skin 或任何存檔**。
  - 網格與新頭部 collision shell 由相同的 8 圈中心、寬高半徑資料生成；以保守**最大頭部橫截面寬度**檢查玻璃／V0.3d 原石頭 XY footprint，檢查頭部相對非相鄰身體 3D capsule 間隙，以及全部頭部可見頂點相對原 heightfield 的高度。任何碰撞／穿地／接縫錯誤就**不產生新網格候選**，不可強制播放。
  - `inspectSnakeHeadNeckTransitionV09r` 只接受**相鄰真 V0.9C source frame**，重播原 V0.9D/G 安全控制器，檢查 pose 和 relayState 完全一致；頭部每真實來源幀 yaw 變化不超過 0.035 rad、pitch 不超過 0.025 rad，再檢查兩端連續的頸部接縫、頭部跨幀玻璃／石頭的保守 2D swept AABB、頭部網格頂點的 5 個時間切片高度場，以及最大頂點位移。此種保守掃描仍**不能**證明完整 3D 三角面 swept collision、動力學或頭部可獨立實際轉動。
- [`snake-head-neck-seam-v09r.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-head-neck-seam-v09r.test.mjs)：四體型靜態頭頸、穩定 UV 和三角面拓撲、不同 yaw 的相同頸部來源；設置**身體仍合法但頭部會撞石頭**的測試，及**身體還在玻璃內、頭部前伸卻越界**的測試。檢查陡坡拒絕、假 frame 拒絕、轉頭跳角拒絕、原始場景和 source 完全不可變。
- 真 24 節來源 V0.7P→V0.9C `moving_return` 第 160 幀起，沿 V0.9L 核准的回程 24 真來源幀，在**四種體型各做 24 組**中立頭部左右與輕微上下轉動的 collision／連續 mesh 候選檢查，共 **96 個尺寸化跨影格 shadow QA**。仍不是 96 幀實際可玩變長蛇。

## 可重播數據

**[GitHub Actions #43331342727](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43331342727)**：新 V0.9R Node 真來源測試成功；8 項工作以該次 GitHub Actions 完整結論為準。Chrome 工作仍是**原 V0.9F 等舊版畫面測試**，並非 V0.9R 專屬的雙橫式美術影片／iOS Safari 實機驗收。

| 中立工程項目 | V0.9R 結果 |
|---|---|
| 完整共用 mesh | 1,617 頂點、3,216 三角形 |
| 新增頭部代理 | 8 個向前頭部環＋1 個鼻端封頂 |
| 原 V0.9Q 身體 | 1,488 頂點與原 93 截面**不改動** |
| 頸部接縫 | 16 個原身體頂點共用；頂點間隙 **0** |
| 頸部每條接縫邊 | 剛好 **2** 個三角面相連 |
| 四體型靜態表面 | 頭部網格頂點不穿地，檢查未檢出非鄰近膠囊重疊 |
| 原來源轉向與貼地 shadow | 幼體／成長中／成體／大型成體 **各 24/24 幀通過** |
| 靠頭前方新石頭／靠玻璃 | 原 V0.9Q 身體候選可能合格，V0.9R 頭碰撞仍**必須拒絕** |
| 假來源影格與超額轉頭速度 | **拒絕** |

四個合成體型的中立測試均保持相同頭頸拓撲，頭部模型與碰撞橫截面來自同一份 V0.9Q/V0.9R 幾何。頭部的 `sourceHeadUnmodified`、`sourceSizedMovementAuthorized` = **false**，沒有批准新的真正遊戲移動權限或皮膚。

## 真正限制／下一個研究關卡

1. **本版「無縫」只指頭頸 indexed mesh 的拓撲和幾何連接通過**，並非自然頭型、真實下顎或整條蛇肌肉 IK 已完成。舊 V0.1 種類頭部附件尚未與新共享來源替換；遊戲未有完成的蛇眼、鼻、嘴與新頭的完整生物學驗證。現有候選的頭部寬／高與頭身比例只是中立工程測試參數。
2. **頭頸碰撞代理與 V0.9Q 身體 shell 已同源，但真正來源 locomotion 仍固定尺寸**。V0.9R 絕不把 new head ring / 頭部視覺朝向當成已改寫的 V0.9C/D/G 物理頭 collider；不宣稱成長後所有尺寸都已能自行真實尋路、抬身、疊身或完整返家。
3. 頂點與保守跨幀頭部 AABB/heightfield QA **不等於**真正 mesh 三角形面內／面對面自交的連續時間 3D swept collision。還需要頭頸整體的側面碰撞、轉向期間對地支撐／摩擦、尾部跟隨與下一階段的逐段角度限制；不能以輸出 `headBodySeamCertified=true` 冒充動物解剖學或物理認證。
4. 尚未做 V0.9R 新網格專屬兩種橫式 Chrome 長時影片、目視細節審查或 iPhone Safari 真機 QA；**使用者偏好先做自檢後才展示接近成品的透明蛇**，因此不把未驗收的中立頭型作成正式成品圖供其審查。

保留低成本、透明、不加皮膚、原創私人 IP 與玩家存檔隔離。下一步重點：**可變體型真正統一來源動態＋頭頸角度連續性＋完整透明網格對環境與自身的時間化 3D 接觸**，視覺審查合格後才考慮導入正式遊戲。
