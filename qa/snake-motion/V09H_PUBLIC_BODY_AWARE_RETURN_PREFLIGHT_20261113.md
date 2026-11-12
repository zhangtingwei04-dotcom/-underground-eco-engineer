# 歐姆透明蛇 V0.9H｜24 節來源骨架折返雙方向預演（公開中立 QA）

日期：2026-11-13（Asia/Taipei）

## 問題與範圍

V0.9G 以保守的多節身體轉彎半徑，在第 284 幀阻止後續過緊捲曲，但「及時停止」不等於「找到能安全掉頭的回程路線」。V0.9H 嘗試在返程切換時就預演兩個方向，**先拒絕沒有來源證據的返程選擇**，並保留休息／等待空間的可能。

這是公開、通用、透明無外皮的合成蛇幾何 QA。正式《鱗片與種子》的玩家存檔、私人 NPC／物種、美術素材及生態權威未受影響。

## 本次實作

- `src/ohm-core/snake-return-space-preflight-v09h.mjs`：在 V0.9C 真正進入 `moving_return` 的來源狀態上，保留同一套 24 joints、V0.7U relay、V0.3d scene/terrain 與來源頭部碰撞，以 `returnTurnSign=+1/-1` 產生兩個**不修改來源的影子預演**。
- 兩個方向都逐幀執行既有 `advanceSnakeRouteWithTurnSpaceGuardV09g`，其內仍使用 V0.9D 真 3D 非相鄰骨節膠囊風險檢查及 V0.9C/V0.7U 真來源移動，任何拒絕即停止該方向預演；**沒有**直接挪動姿態、縮短骨架、跳過來源碰撞，也**沒有**把預測路線當作實際已走。
- 將檢視區間從最初的 90 幀加長到預設 **160 幀**，容許 12–180，因為 90 幀內兩個方向表面都通過，無法查出稍後的回程失敗。報告每個方向的第一個拒絕原因、最後可接受來源影格、來源膠囊間隙和頭部位置；若兩個方向在窗口內都可以走，額外計算兩個終點是否**真的在空間上分離**，不能只因 sign 不同便宣稱有不同路徑。
- `advanceSnakeReturnWithPreflightV09h`：只在預演方向完整通過 horizon 的條件下，以原本真來源控制器提交最多**一個**新安全步；沒有合格方向便回 `return_wait_for_space`、`renderablePose:null`，**不新增任何來源移動或偽造抵達**。若以後確實需要繞行，仍須另行設計全身路線規劃器，V0.9H 本身沒有找到新的路線。
- 新增 `tests/snake-return-space-preflight-v09h.test.mjs`：使用 V0.7P 完成後的真來源狀態，運行到 V0.9C 真正啟動回程，再分別試算，驗證前後 pose、terrain、scene、wall 未變、狀態可重播、錯誤視窗及場景過期均保守拒絕。

## 實際 GitHub Actions 結果

**[Public OHM Snake and Terrarium QA #43264936226](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43264936226)：8/8 工作 success。** 新 V0.9H Node 真來源模組在「returnSourceFrame=160」開始預演：

| 方向 | 最後可接受的真來源影格 | 失敗原因 |
|---|---:|---|
| +1 | 284（預演 124 幀） | `next_source_return_turn_too_compact`（頭部／全身轉彎半徑過小） |
| -1 | 271（預演 111 幀） | `source_source_xy_footprint_blocked`（場景障礙物 XY 占用阻擋） |

- **selectedSign=null**：兩個候選在 160 幀預演範圍內都不能成立，無法宣稱安全往返。實際提交階段**沒有移動**，回 `return_wait_for_space`。
- `distinctSteeringProven=false`：沒有兩條都通過的可靠實際來源行動軌跡可作安全替代比較。
- 故此次成果是「**返程前預警與合法停留**」，不是「新蛇已學會自然回頭」，也不是成功解決了 2D 空間已占滿、3D 疊身支撐或新透明 mesh swept collision。
- 本輪 8/8 仍包含既有 V0.9F 舊透明形態 Chrome 兩種橫式 QA；並**沒有新 V0.9H 160 幀雙方向的獨立 Chrome／Safari 動畫截圖**。不能把舊影格當新版美術審查通過。

## 下一步

使用目前來源碰撞＋折返預演框架，改做**真正不同的全身佔用避讓行動選擇**：在可用的箱內空間先檢查繞路、較大轉向弧線和其他合法停留點，考慮蛇尾及玻璃／石頭、必要時休息；每條候選仍須經真 24 joints 完整動態 source QA，不允許事後修改已通過的源骨長。通過全身回轉、視覺和跨裝置實機審查後，才討論併入私人主遊戲及原創蛇皮。
