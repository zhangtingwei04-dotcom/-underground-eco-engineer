# 角響尾蛇 Crotalus cerastes 側行運動原始數據驗收 v0.1

- 日期：2026-11-08
- 使用者提供：`doi_10_5061_dryad_7h44j0zw8__v20220405.zip`
- 研究：Tingle, J.L., Sherman, B.M., Garland, T. Jr. (2022). *Scaling and relations of morphology with locomotor kinematics in the sidewinder rattlesnake Crotalus cerastes*. Journal of Experimental Biology. DOI: https://doi.org/10.1242/jeb.243817
- 資料入口：https://doi.org/10.5061/dryad.7h44j0zw8
- **狀態：已直接讀取 ZIP、README、主要 CSV 與三維座標，已完成結構檢查；未加入遊戲引擎，未將原始資料上傳遊戲倉庫。**

## 下載檔案實際盤點
- ZIP 60,247,162 bytes；348 個條目 = **347 CSV + 1 README.txt**，ZIP CRC 檢驗通過。
- `1_morphology.csv`：**74 隻**角響尾蛇形態資料，15 欄（身長、體重、性別、頭寬、鱗片數等）。
- `2_kinematics_sand_2.0b.csv`：**63 個**沙地側行運動試驗記錄、32 欄，包含標記點抬升高度、峰值速度、重心近似路徑／速度／加速度、側行頻率／波長／幅度及波形傾斜角度。
- `3_full_data_representative_trials_1.csv`：**26 隻**代表個體的各一筆研究用試驗、29 欄；資料集 README 明確指出用於正式統計的代表資料為 26 隻。
- `4_DLTdv5_output_*.csv`：**344 個**檔案＝**86 個追蹤片段 × 4 種輸出**（`offsets`、`xypts`、`xyzpts`、`xyzres`）。涉及 30 個檔案內識別碼；不代表研究總共只有 30 隻野外個體。
- 其中 `86` 份 `xyzpts.csv` 共 **87,399 個影格資料列**（單一片段 155～2486 影格），每影格 10 個體表標記點 × 3 個軸向（30 欄）。
- 三維追蹤座標欄位約 **3.98% 為空白**（不含特殊數值的額外檢驗）；正式建模前需做好缺測標記、數據清理與插值。
- 除 10 個背部標記點外，`xyzres` 為重建殘差，不是另一套骨架位置；`xypts` 為兩個相機觀測，`offsets` 為相機對齊設定。

## 關鍵單位警告
**README 明確標記 DLTdv5 的 `xyzpts.csv` 原始座標單位是「像素（pixels）」！**
- **不能直接將原始 X/Y/Z 當成公分或公尺。** 真正的平均速度等物理單位在已校正的 `2_kinematics` 和 `3_representative_trials` 摘要內，例如 `cm/s`、`cm/s²`、`Hz`、`cm`、`deg`。
- `morphology.csv` 的吻肛長為 `mm`、體重為 `g`。
- 原始片段的影格率需從方法及個別實驗校正資訊核對；此驗收不把其預設為某個固定 fps。
- README 提到部分代表分析點有先移除離群值，不可把全部軌跡當成已清洗的高品質動畫。

## 科學與遊戲使用範圍
- **側行運動（sidewinding）** 對部分沙地蛇類是重要模式，不能當作玉米蛇、球蟒等所有蛇類的默認運動。
- 研究用途：沙地特定環境的蛇身輪流接觸與離地、身體波形、側行速度、性別／年齡／體型差異。
- Ohm Core 候選：`locomotionMode=sidewinding`、`bodyMarkerTrajectory`、`supportContactPhases`、`substrate=sand`、`sourceMeasurementUnits`、`missingDataMask`、`speciesEvidence`。
- 目前是研究證據，**沒有變成可運作的 Phaser 動畫，也不是直接可用的玩家寵物物種資料**。
- Dryad 資料授權須查驗本版本的元資料；不必把第三方原始研究 ZIP 直接提交到公開遊戲專案倉庫。
- 與其他原始資料採相同工作流程：原始資料保留在獨立研究庫；GitHub 主倉只記錄來源、測量方法、摘要與轉換規格。

## 後續建議
先累積更多生態／動作研究，遵守使用者「先大量蒐集，再集中開發」決策。後續統一建置研究資料 manifest（來源 DOI、檔案版次、授權、物種、單位、欄位、檢查狀態）和轉換器，不急著每新增一篇研究就寫一段動畫。
