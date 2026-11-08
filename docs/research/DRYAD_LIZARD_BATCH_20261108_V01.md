# 爬蟲研究資料批次驗收：石龍子、守宮／變色蜥、巨蜥（2026-11-08）

**進度：三份 ZIP CRC 檢查完成，表格／文字檔可讀；研究原始資料未上傳主遊戲程式倉庫，未製作正式動畫。**

使用者開發決策：**先大量累積有出處的爬蟲動態與習性資料，再集中規劃共用運動核心**。務必區分原始追蹤點、實驗統計表、研究程式和可商用素材授權。

## A. 石龍子／短肢石龍子地面行走與掘土

- Dryad：https://doi.org/10.5061/dryad.bcc2fqz9w
- 上傳 ZIP：`doi_10_5061_dryad_bcc2fqz9w__v20201019.zip`（190,855 bytes）
- ZIP：`Bergmann_et_al_Datasets.xlsx`（180,362 bytes）、`Bergmann_Analysis_Code.txt`（7,358 bytes）、`Phylogenies.txt`（2,699 bytes）。
- 已直接匯入 Excel，工作表包括 `Species Readme`、`Species Data`、`Indiv Morphom Readme`、`Individual Morphometrics`、`Head Readme`、`Head Data`、`Force Readme`、`Force Data`、`Run Readme`、`Run Data`、`Bury Readme`、`Bury Data`。
- `Phylogenies.txt` 註明：運動分析系統樹為 **14 種**，頭部長度的親緣資料為 **40 種 Brachymeles**，不能把 40 種直接當作 40 種都有完整動作捕捉。
- `Run Data` 依個體／底材收錄速度、體溫、形態等；`Bury Data` 包含掘土速度與四肢使用。`Force Data` 包含力量測量。
- 研究說明 `coarse` 底材編號 10、`fine` 底材編號 60。掘土零速度可能為個體拒絕掘入／無法掘入，**不是缺測值**；缺肢物種對四肢利用欄位的 NA 才另有含義。
- 研究是**物種與個體層級比較表／統計分析程式**，未見逐格 3D 骨架錄影。
- 對 Ohm Core 研究意義：掘土能力、底材粒徑、肢體退化／有無四肢與速度、形態差異，未來依物種驗證參數。

## B. 守宮與變色蜥附著與棲木使用

- Dryad：https://doi.org/10.5061/dryad.66t1g1k2v
- 上傳 ZIP：`doi_10_5061_dryad_66t1g1k2v__v20210910.zip`（598,399 bytes）
- ZIP CRC 通過：
  - `toepad_morphology_2021-08-05.csv`：**87 行**觀察、6 欄，包括 ID、species、sex、SVLmm、meanArea、meanLam。
  - `clinging_data_2021-08-05.csv`：**470 行**實驗觀察、12 欄，包括個體、物種、底材名稱／粗糙度／天然與人工、質量、`max.force.N`、`max.force.per.mass`。
  - `perch_use_2021-08-05.xlsx`：**已成功讀到工作表 `perch use 2021-08-05` 的資料欄位與觀察紀錄**，包括物種、個體、棲木高度、種類、觀察方式、材質；完整總行數尚未核實。
- **研究範圍與注意：** `clinging_data` 為每次材質／個體條件的量測列數，不是 470 隻動物；`toepad` 為 87 筆形態紀錄，不能無檢查視為 87 隻獨立野外個體；兩表 ID 命名未必一一對應。不要從未驗證縮寫推斷每個樣本物種。
- 對 Ohm Core：腳趾墊形態、附著力、表面粗糙度及棲木選擇分開建模；不以本資料單獨模擬完整肢體步態動畫。

## C. 巨蜥地面反作用力

- Dryad：https://doi.org/10.5061/dryad.rn8pk0p82
- 上傳 ZIP：`doi_10_5061_dryad_rn8pk0p82__v20210119.zip`（240,337 bytes）
- ZIP CRC 通過：
  - `rawDataSupplemental.xlsx`（110,656 bytes），已讀取 `Sheet 1`，表頭從 `force plate, species, individual, trial, side, foot, ident, animal, direction, kg, GRFintAll, GRFintX...` 開始。
  - `ReadMe.pdf`（83,120 bytes），已提取文字，解釋欄位、單位及地面反作用力／力積測量。
  - `varanus_GRF_R_analysis_script_DRYAD.R`（46,121 bytes），已讀取程式，使用 R 讀取 Excel，分析力值、力積與運動尺度。
- README 提供 `GRFintX/Y/Z`、`GRFmagPeak`、`GRFintPosX` 等，力積以牛頓秒、峰值力以牛頓計；含前／後腳、左右側、個體／次數、身長、步態與速度等欄位。
- **現階段僅驗證研究表格和欄位，未精算有效試驗總數、物種縮寫代表名稱或不同個體平均值。**
- 對 Ohm Core：可建立四足爬蟲支撐／受力資料的研究指標，但單靠力平台統計並無法直接還原完整跑步姿勢。

## 三份資料共同處理規範
1. 保持原始 ZIP 和研究 DOI、檔案日期版本的對應；主遊戲 GitHub 僅先放研究摘要和來源清單，**不要把大量原始研究檔和不明授權影片公開提交**。
2. 下一階段優先驗證每個 Dryad 版本的重用授權、物種代碼與單位，以及資料表完整行數、缺值和實測／推論欄位。
3. 正式轉檔前先區分 `kinematicTrajectories`（逐幀）、`kinematicSummary`（速度／姿態摘要）、`forceMeasurements`（力值）、`behavioralObservations`（棲地使用），不能混為同一套骨架動畫。
4. 不更動正式遊戲、玩家存檔或既有玉米蛇原型；依使用者決策繼續累積資料。
