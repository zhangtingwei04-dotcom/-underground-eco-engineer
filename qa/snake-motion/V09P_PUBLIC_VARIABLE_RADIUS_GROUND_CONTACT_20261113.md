# V0.9P｜透明蛇四體型逐節貼地、骨長守恆與安全跨幀的公開中立 QA

日期：2026-11-13（Asia/Taipei）。狀態：**已實作及通過中立來源工程測試，尚無 V0.9P 專屬正式遊戲畫面與真正可變體長的物理控制。**

## 研究起點

V0.9N 首先驗證四種合成身長下目標區和石塊碰撞不同。V0.9O 再將四種體型投影到同一原本真 24 節 V0.9C/D/G 動態來源，發現幼體沿用成體中心線可能懸浮，大型成體可能穿入地面。**如果只是將同一條蛇的骨架拉長或縮小而不重新求接地，就會使 V0.9M 全身抵達結果失真。**

本 V0.9P 使用先前獲得的 `sourcePose` 及 V0.9N 各節不同的半徑，建立**有界、可拒絕、保持所有 23 段 3D 骨節長度的高度場接地候選**。

## 公開工程檔案

- [`snake-size-terrain-contact-v09p.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-size-terrain-contact-v09p.mjs)：`solveSnakeSizeTerrainContactV09p` 建立不同體型的唯讀 24 節貼地姿勢；`inspectSnakeSizeTerrainTransitionV09p` 重新驗證真 V0.9C/D/G source step 及前後候選的跨影格場景／高度場；`previewSnakeSizeTerrainRouteV09p` 在 V0.9L 真來源安全選路上做逐幀 shadow 尺寸驗證。
- [`snake-size-terrain-contact-v09p.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-size-terrain-contact-v09p.test.mjs)：四階段、骨長誤差、細尾接地一致性、溫和/過陡坡度、靠石塊拒絕、真 160→161 幀來源授權與偽造幀拒絕，以及四體型各 60 幀預演。
- **[GitHub Actions #43322155428](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43322155428)：8/8 jobs success**（包含 V0.9P 新 Node 來源測試及既有 V0.9F 等 Chrome 視覺、terrarium 回歸）。

## 核心工程規範

- **不把已放大／縮小的 24 節候選當成既有 V0.9C/D/G 新權威來源**。現有 V0.9C/D/G 繼續只接受原本固定 2.28 world units／`bodyRadius=.13`，不能繞過固定來源安全檢查。
- 真來源 V0.9D 驗證通過後，透過 V0.9N 重新生成不同長度、頭／軀幹／尾的局部粗細；V0.9P 依每段局部半徑與來源高度場提出新的 z，並依 `sqrt(原節長²−端點高差²)` 調整 XY 投影，以保留**原 V0.9N 各節真正的 3D 長度**。原蛇頭 XY 固定，總身體 XY 改動有嚴格上限。
- 初版用整段兩端的最大半徑計算全部高度，會使細尾抬高；跨影格相同錯誤還會把合法細尾貼地判為穿地。本輪已改為**以線性插值的變半徑作為暫定每段中心線包絡**，在地面每段採樣位置相應計算高度。**玻璃和所有 V0.3d 石塊**仍使用**較大的半徑 padding**作保守阻擋，不因貼地修正降低本來的環境碰撞門檻。
- 對每條來源連線採樣高度場、原本來源石頭 XY AABB、玻璃和非鄰近 3D 局部半徑 capsule 做檢查；路線坡度過陡、骨長失真、XY 改動超限、身體碰撞／場景穿透或有限步未真正收斂，**全部 fail closed**。較高的原來源個別抬身意圖僅當其明確成立時才作**診斷性**保留，不代表肌肉和地面反力已得到科學證明。
- 連續幀影像不能只增加 `verifiedFrames`：必須從上個 V0.9C/D/G 真原始狀態重播出與新幀**相同原始 24 節 pose 和 relay state**，才能對兩個重新貼地姿勢做 padded swept 2D AABB 場景檢查、5 個中途時間切片 × 每段九點高度場及最大候選骨節步距檢查。原始場景 source revision 改變時不能繼續。
- V0.9P **只創造唯讀候選**：`gameIntegrationAuthorized=false`、`sourceFramesCommitted=0`、`groundSupportCertified=false`、`fullBodyReturnVerified=false`、`skinApplied=false`、`saveModified=false`。

## 真實來源工程測試結果

| 合成體型 | 長度（world units） | 平地最低腹部間隙（world） | 平地最高腹部間隙（world） | 有界真來源 shadow |
|---|---:|---:|---:|---|
| 幼體 | 1.14 | 0.0035 | 0.0035 | **60/60 幀** |
| 成長中 | 1.71 | 0.0035 | 0.0035 | **60/60 幀** |
| 成體 | 2.28 | 0.0035 | 0.0035 | **60/60 幀** |
| 大型成體 | 2.964 | 0.0035 | 0.0035 | **60/60 幀** |

平坦地面四種大小皆**2 次求解收斂**，23 段長度最大誤差約 `1.1×10^-16` world units。新 V0.9P 可在此合成場景將 V0.9O 的幼體潛在懸浮與大型成體靜態穿地調整為**安全候選**，但**不是在正式遊戲中讓同一條蛇真長大與自然移動**。

另測：靠 V0.3d 石塊處，幼體候選合格、成體被原石塊拒絕；溫和圓滑 heightfield 通過且骨長守恆，極端陡坡 fail closed；真原 24 節 source 160→161 幀可檢查，偽造 `frame+1` 卻沿用前一幀 pose／relay 會拒絕。四種 60 幀的結果**各是同一固定尺寸來源的 shadow 預演**，不是 240 幀的真實蛇類可變長度自主走路。

## 還不能說已做好的事

- V0.9P 不是**可變尺寸的同一權威來源動態**；現在的大小調整仍是驗收候選，不可把這些姿勢直接提交到原 V0.9C/D/G 或玩家存檔。仍要整合 V0.1 growth-motion 顯示骨架、V0.9N 局部半徑／骨長、V0.9P 接地與真正的尺寸式移動 controller。
- 3D 非鄰近中心線 capsule 仍是代理；沒有完成**真正透明頭身尾 mesh 的 swept triangle 碰撞、跨時自體接觸、地面摩擦、身體支撐力／肌肉**。目前不應視同任一真蛇種生物力學已認證。
- **8/8 CI 的 Chrome 是既有 V0.9F 等舊版影像 regression**，不是針對 V0.9P 新體型的專用雙橫式 Chrome 或 iPhone Safari 真機長時動畫和美術驗收。仍維持透明、無外皮、原創私人 IP 不公開、無新增付費工具。

下一步重點：讓 V0.9C/D/G 固定體型的安全控制逐步變成**具有尺寸、局部半徑與接地資料同源、可驗證動態的可變體型單一權威控制**；在每一步重新驗證場景和全身，任何不可達狀態安全停止。直到真 3D mesh 接觸與視覺接近正式版本前，不能將此中立測試直接宣稱可用於正式遊戲。
