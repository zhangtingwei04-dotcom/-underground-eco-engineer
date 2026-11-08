# 天堂金花蛇跨越樹枝空隙研究（Graham & Socha 2021）v0.1

- 整理：2026-11-08
- 上傳 PDF：`jeb242923.pdf`（15 頁）
- 出處：Mal Graham & John J. Socha (2021). *Dynamic movements facilitate extreme gap crossing in flying snakes*. Journal of Experimental Biology 224, jeb242923. DOI: https://doi.org/10.1242/jeb.242923
- 論文直接提供的原始資料／程式入口：https://github.com/TheSochaLab/FlyingSnakeGaps
- **狀態：已閱讀論文；原始 3D CSV 尚未檢查或下載；未整合正式遊戲**

## 研究內容
- 物種：天堂金花蛇 `Chrysopelea paradisi`（飛蛇屬）。六隻圈養蛇，研究兩根同高水平支架間的空隙跨越。
- 共進行 289 次試驗，182 次納入分析；其中 45 次用純懸臂伸展（cantilever），137 次屬非懸臂動態跨越（non-cantilever，包括 recovery）。
- 六台 100–150 Hz 的 Vicon 動作捕捉攝影機，以及三台 120 fps GoPro；背部約等距十個標記點，自頭部到泄殖腔位置。
- 研究將每次實驗三維標記點軌跡匯出為 CSV，並經清理、短缺段插值、平滑與樣條曲線重建；研究時部分計算在每幀使用 1000 個樣條取樣點，此為處理結果，非 1000 個實測標記點。
- 在實驗中，短距離通常使用懸臂緩慢伸展；間隙增加會出現上拱、U 型／J 型彎曲與更動態的跨越，動作與支撐能力有物種和個體差異。
- 混合效應模型預測 `cantilever` vs `non-cantilever` 機率約在 **47.5% SVL** 時相等；研究情境數字，**不能直接當作遊戲固定動作切換距離**。
- 跨越距離可到約 120% SVL，是本研究中的測試表現，**不是一般蛇類的允許值**。

## Ohm Core 可採納的設計方向（規格候選、尚未實作）
- `branchContacts`、`bodyCenterline3D`、`targetSupport`：追蹤蛇身與當前／目標樹枝的接觸關係。
- `gapDistanceNormalizedBySVL`：以身體尺度表示環境間隙，留意吻肛長與全長不可混淆。
- `crossingMode`：`cantilever`、`dynamic_arch`、`dynamic_loop`、`recover` 等可審核研究用分類（正式狀態命名另定）。
- `centerlineInterpolation`：由稀疏標記點估算連續蛇身輪廓，但應保留來源測量點／插值點區分，避免宣稱合成數據就是原始實測。
- 跨越的成功／失敗判定須依實際接觸支撐和能力資料；不可直接把蛇移動軌跡畫在空中而不檢查接觸物。
- 一般蛇類可共用「慢速伸展」核心；特殊 J 型動態跨越、離枝／滑翔屬物種限定能力，不能全部賦給玉米蛇、球蟒和其他蛇種。

## 後續驗證
1. 查看 https://github.com/TheSochaLab/FlyingSnakeGaps 目前是否包含 CSV、R/Python 腳本和素材檔案，以及 LICENSE。
2. 只處理明確可合法再利用的資料；不能以論文可閱讀推定所有影片素材可商業使用。
3. 確認 CSV 各座標欄位、時間頻率、試驗 ID、缺測處理、世界尺度和重建精度。
4. 轉換可重現、分離研究檔的中立輸入格式，再交給 Phaser 驗證；未經測試不可宣稱已完成三維跨越動畫。
5. 保留玉米蛇地面移動作首個日常物種原型，樹枝跨越後續另設獨立測試頁。

## 論文位置
- 第 1 頁：摘要與主要結論。
- 第 3 頁：實驗數、標記點、攝影頻率與 CSV 輸出。
- 第 4–6 頁：動作判定、樣條插值、約 47.5% SVL 統計切換。
- 後段 Data availability：GitHub 原始資料及程式公開聲明。
