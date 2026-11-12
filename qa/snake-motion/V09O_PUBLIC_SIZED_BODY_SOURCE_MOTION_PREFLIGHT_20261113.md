# Project OHM V0.9O｜不同體型透明蛇的動態來源重播與碰撞／地形預檢

記錄日期：2026-11-13（Asia/Taipei）。**限公開中立 synthetic QA**；沒有修改正式遊戲物種、原創 IP、雲端／本機玩家存檔，也沒有加蛇外皮。

## 承接 V0.9N、為何這次檢驗「動起來」

先前 [V0.9N](./V09N_PUBLIC_SYNTHETIC_GROWTH_AND_BODY_CLEARANCE_20261113.md) 已在幼體／成長中／成體／大型成體四個模擬尺寸上驗證靜態身體佔位、洞口寬度、石頭、玻璃及成長變長的保守 2D swept AABB。但固定來源 `V0.9C/V0.9D/G` 的 24 節骨架仍只授權總長 **2.28 world units**、固定 `bodyRadius=.13` 的移動；不同尺寸的候選不可以偷換成既有真來源動態。

本輪 **V0.9O** 正式建立「真來源逐幀 → 唯讀尺寸候選 → 逐段動態碰撞/接地稽核」的工程驗收工具；它對**同一條真來源路線**比較不同大小的尺寸風險，而不是將一段美術影片當成完整力學證據。

## 新增來源與測試

- [`snake-size-motion-preflight-v09o.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-size-motion-preflight-v09o.mjs)
  - `inspectSnakeSizeMotionFrameV09o`：只讀 V0.9D 認可的原 24 節來源 pose 和 V0.9G 轉彎診斷，呼叫 V0.9N 以各階段不同的**局部身體半徑與連線長度**投影候選；檢查當前完整身體對原 V0.3d 玻璃、所有石塊和非相鄰身體段的保守 2D 占位。每段沿線取 9 個高度場採樣點，檢查地形侵入，並記錄**可能懸浮**狀態；不會偷移動骨節來「自動貼地」。
  - `inspectSnakeSizeMotionTransitionV09o`：驗證傳來的前後影格能由**原 V0.9C + V0.9D/G 真來源重新演算成完全相同的 24 節 pose/relay state**，避免單純偽造 frame counter；接著用各尺寸前後骨節組成的**保守 swept link XY AABB** 檢查玻璃／場景石頭，並在五個時間切片 × 每段九個採樣位置檢查高度場。這會**可能過度拒絕合法動作**，是防漏放，不是精確 3D mesh swept triangles。
  - `previewSnakeSizeAwareRouteV09o`：從既有 V0.9L 來源有效的頭向轉彎路線起，對真 V0.9C/D/G 原來源最多 160 幀進行影子重播，每一幀重新驗證尺寸代理，直到完成或保守停留。**影子幀不寫回任何遊戲來源或存檔**，且沒有新增可變身長的正式動態權限。
- [`snake-size-motion-preflight-v09o.test.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-size-motion-preflight-v09o.test.mjs)：四體型、地形穿入、石塊、偽造來源步數拒絕、過期場景拒絕、真正的 24 節來源第 160 幀→逐幀預演 90 幀、原姿勢與場景不可變。

## 第一次可重播實測數據

以下是同一個**合成姿勢／場景／90 幀原來源路線**的診斷；四種分組只是工程試算，**不是現實或原創虛構蛇的年齡—長度—體徑的已證實公式**。

| 測試階段 | 靜態中段最低腹部至地形高差（world） | 90 幀原來源預演 | 工程判斷 |
|---|---:|---|---|
| 幼體（0） | +0.06232 | **90/90** | 候選不穿地，但原成體高度造成可見懸浮風險 |
| 成長中（1） | +0.04349 | **90/90** | 候選不穿地，但接地姿態未獨立重算 |
| 成體（2） | +0.02060 | **90/90** | 無負高度間隙，但尾端等部位仍可能離地；非支撐力學認證 |
| 大型成體（3） | **−0.00539** | **0/90，拒絕** | 尺寸變大後，沿用原中心線高度將身體穿入地面 |

- 特別的對照：把同樣的大型成體候選**合成來源高度**調高到 0.20 world units，可消除這一張靜態姿勢的穿地問題，但**不代表**連續時間力學、真支撐或成長已成功，因為原 V0.9C/D/G 並未允許這種更動。
- 靠石塊的合成姿勢：幼體通過、成體因原有石頭的 XY 占位而被拒絕。原始場景無障礙物移動，也未使用原本 V0.9M 的固定成人 padding 代替局部體型。
- 一個真來源回程影格通過尺寸代理的多層審查；另故意製作「frame+1 但姿勢／relay state 仍舊」的偽造資料，來源重播**確實拒絕**，不放行假影格。
- **[GitHub Actions #43280597074](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43280597074)** 新 V0.9O Node 來源 regression 已通過；其餘 workflow jobs 的完整最後結論，需按實際 run 狀態判斷。過去 V0.9F Chrome 畫面回歸不代表 V0.9O 新版體型已完成雙橫式新影片或 iPhone Safari 實機驗收。

## 下一步的工程優先順序

1. **尺寸動態來源統一**：現有 `V0.1 growth-motion-adapter` 能處理不同體長的圖像，但來源與 V0.9N/O 自撞／石頭的尺寸代理不同。須先統一頭頸／身體／尾部的骨長、寬度、質量／慣性假設，再改造動態安全源；**不能**直接將候選 24 節混入固定長度的 V0.9C。
2. **真正貼地**：不要縮放後把懸浮判定為通過。開發「每段不同半徑」的 terrain-contact 改位候選，保持骨節實際長度、可用坡度及場景有效占位；如果姿勢無法滿足則休息。且需真 3D 表面、地面支撐與摩擦驗證。
3. **真正 swept mesh / 貼地觀感**：透明頭身尾 mesh 自交、轉彎內緣、疊身是否支持、玻璃邊緣和石頭接觸的時間連續性；完成雙橫式 Chrome 和 iOS Safari 畫面 QA 後再考慮私人遊戲整合。
4. 此模組明確回傳 `sizeMotionAuthorityGranted=false`、`fullBodyReturnVerified=false`、`groundSupportCertified=false`、`skinApplied=false`、`saveModified=false`。目前**沒有**完成不同尺寸自由移動、真正在遊戲時間裡長大或完整返家。

**結論：**V0.9O 真正把不同體型的**動態來源影格、局部寬度和地形間隙**放在同一檢查中，發現「幼體可能懸浮、大型體型可能穿地」的尺寸差異；這是安全與診斷前進，不是物理成品或正式玩家功能。
