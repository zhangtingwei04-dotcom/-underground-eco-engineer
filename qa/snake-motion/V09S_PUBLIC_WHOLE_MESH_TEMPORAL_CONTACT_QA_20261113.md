# Project OHM V0.9S｜全頭身透明網格三角面與跨幀 3D 接觸 QA

日期：2026-11-13（Asia/Taipei）。**公開中立合成工程測試，非已導入正式遊戲或生物學成品。**

## 前版限制與本輪交付

V0.9Q 使 24 節來源骨架、不同體型的局部半徑、透明 body mesh 與碰撞截面共享 V0.9N/P 資料。V0.9R 進一步將原 body 第一圈 16 個頂點直接用作 head-neck socket，加入中立頭部 8 圈與鼻端，在四種合成尺寸上通過每種 24 個真來源影格的頭頸接合、玻璃、石頭和有限 yaw/pitch 軌跡測試。

**未解決：**之前只有頭部網格頂點、身體碰撞代理及部分跨影格 AABB。若高度場凸起落在三角面**內部**，可能出現三頂點不穿地、面內卻穿地的漏洞；身體非相鄰的三角面彼此交叉時，單看 24 節骨架中心距離也不夠。V0.9S 將這兩類問題改為可被測試與拒絕的工程判準。

## 新程式與驗證

- [`snake-swept-mesh-contact-v09s.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-swept-mesh-contact-v09s.mjs)
  - `inspectSnakeMeshSurfaceV09s`：對 V0.9R 同一個完整 1,617 頂點、**3,216 三角面**的中立 head-neck-body mesh，每面取三頂點、重心、三邊中點，共 **22,512 個高度場樣本／候選**；在 V0.3d 世界中找面內穿地。對相隔至少 16 個面環（約 4 原骨節）的**非相鄰 3D 身體表面**，以每相鄰環的 3D AABB 作第一層，再以每三角面的 AABB 作第二層，必要時才做兩側三角面／邊段相交測試；近平行或共面不確定則保守拒絕。相鄰網格共享三角形邊本來就合法，不會被算作自撞。
  - `inspectSnakeMeshTemporalV09s`：要求相同 indexed triangles 與 UV，不接受換材質坐標或換網格拓撲造成的瞬間假動態；追蹤整條 1,617 頂點的**最大位移**與每條三角邊的伸縮比。對**所有 3,216 個三角面**，使用兩影格所有六頂點構成的保守 swept 3D AABB 的 XY 投影，檢查玻璃／場景原石頭；並在 3 個時間切片（可設 3–5）對每面三頂點＋重心採樣高度場。每個時間切片另外執行非相鄰三角面 3D 幾何檢查。
  - `inspectSnakeAuthenticatedMeshStepV09s`：先讓原 V0.9R 從**真正 V0.9C→V0.9D/G 相鄰來源影格**重播，精確核對原 24 節 pose 與 relayState，再將它的首尾中立頭頸 mesh 交給上述 V0.9S **全身網格**檢查。若來源影格、原 V0.9R、網格變形、面內穿地或場景占位有問題，結果 fail-closed，`sourceFramesCommitted=0`。
- [`snake-swept-mesh-contact-v09s.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-swept-mesh-contact-v09s.test.mjs)
  - 四種合成體型的所有面內高度場樣本與非相鄰自體碰撞空間。
  - **陽性穿地測試**：將小型 rounded rock 放在一個三角面內，使**原 1,617 個 mesh 頂點全部不穿地**，但該面的重心接觸地形；V0.9S 正確拒絕 `triangle_interior_hits_heightfield`，證明不能只看頂點。
  - **陽性自撞測試**：刻意造一個未授權、被竄改的遠端身體網格，使它和頭部表面重疊；3D 非鄰近三角面窄相檢查拒絕，**未**把假網格視作可玩的新來源。
  - UV/三角面改動、來源幀數造假、場景 revision 變動都應拒絕。
  - 真 V0.7P→V0.9C 第 **160 幀**回程來源，沿原 V0.9L 合格路線一幀一幀前進到 **170 幀**；對**四個合成體型各做 10 組完整頭身網格與有限 yaw/pitch** 檢查，共 **40 個尺寸化連續影格候選**；所有原正式動態與原場景完全不可變，預演沒有提交遊戲影格。

## 真正測到的數值

**[GitHub Actions #43332563859](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43332563859)：8/8 jobs 成功。** 新 V0.9S 來源 Node test 通過；舊 Chrome 畫面測試仍為 V0.9F/V0.9D 等歷史透明蛇版本，**不是 V0.9S 專屬動畫或 Safari 真機驗收**。

| 合成階段 | 靜態最小面內高度場間隙（world） | 10 幀最大網格頂點步距（world） | 10 幀最大三角邊伸縮比 |
|---|---:|---:|---:|
| 幼體 | 0.003500015 | 0.003717 | 1.02951 |
| 成長中 | 0.003500022 | 0.003870 | 1.02032 |
| 成體 | 0.003500010 | 0.004095 | 1.01265 |
| 大型成體 | 0.003500076 | 0.004479 | 1.01057 |

所有 40 個尺寸化真來源相鄰影格均經**全身 3,216 個面、三時間切片**檢查通過。原合成 24 節姿勢未見任何需要進入非相鄰 triangle-triangle 窄相判斷的環狀 AABB 重疊（log 的 `nonlocalNarrowphaseTrianglePairs=0`），因此**不能**宣稱測試自然動作已涵蓋每種自撞情境；但專門製造的頭／遠端身體表面重疊陽性測試確實被偵測並拒絕。

## 安全範圍與必須說清楚的限制

1. **這是保守 3D 三角面空間取樣及跨幀診斷，尚非精確的「整段連續時間 swept triangle vs swept triangle」求解。** 三個時間切片之間仍有未取樣的路徑；對原石頭使用 swept AABB 可過度拒絕；對高度場只取七個靜態面內位置或每時間切片四點，仍可能漏掉極細小、恰好避開取樣的地形凸起。不能宣稱完整 3D mesh 碰撞已認證。
2. **這不是新自然蛇類運動生成器。** 全身變形來自原 V0.9C/D/G 真 24 節來源姿勢與 V0.9N/P 的四體型幾何投影；頭部中立 yaw/pitch 來自 V0.9R 的有限偏轉。仍沒有真正按四種尺寸各自計算的物理權威動態、肌肉、摩擦、重量、身體疊起來的接觸支持／力學、精緻真蛇頭或虛構生物最終美術。
3. **早前 V0.9J/K/L/M 真回程始終沒完成全身真正返家**，這次未重新宣稱成功或修改返程終止條件。所有候選依然 `exactContinuous3DSweepCertified=false`、`newSizeMotionControllerGranted=false`、`sourceFramesCommitted=0`、`skinApplied=false`、`saveModified=false`，不改公開／私有玩家存檔或正式遊戲原創 IP。
4. **沒有 V0.9S 專屬橫式 Chrome 影片、iPhone Safari 實機視覺驗收**；不能因 8/8 GitHub 工作包含舊 Chrome 而稱新透明蛇已達成品級。使用者希望整段接近成品再觀看，所以不將工程頭部代理誤當最終視覺。

下一步應優先研發：真按體型變長的**單一權威移動控制器**、跨幀**更嚴格的連續 3D 自體與場景碰撞**、自體疊放時的支持／貼地，並實際檢查新頭頸透明網格的長時變形與手機橫式效果。在達到正式品質前保留透明狀態、不加外皮、不增加付費服務。
