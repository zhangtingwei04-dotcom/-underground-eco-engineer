# 佛羅里達灌叢蜥蜴：轉向、停頓、速度與加速研究 v0.1

整理日期：2026-11-08
來源：使用者上傳 `doi_10_5061_dryad_z8w9ghxh1__v20230713.zip`，來源 DOI：https://doi.org/10.5061/dryad.z8w9ghxh1
原始研究資料包內含 `README.md` 及 `LizardSpeedandPause_WalkerMcBrayer.xlsx`；ZIP CRC 檢查通過。
研究資料標題：*Rapid acceleration offsets the costs of intermittent locomotion in lizards when turning*。
README 引述相關出版物：Cheyenne Walker & Lance McBrayer（2023），*Stop, then go! Rapid acceleration offsets the costs of intermittent locomotion when turning in Florida scrub lizards*，Journal of Experimental Zoology Part A。
研究物種：Florida scrub lizard（佛羅里達灌叢蜥蜴；拉丁學名需連同正式論文再核對，勿根據俗名推測資料欄）。
**進度：已實際讀取 ZIP、README、Excel 五張工作表與主要表頭，尚未逐列完成統計分析；未將原始資料加入公開遊戲倉庫；未實作動畫。**

## 來源授權與校驗
- README `Dataset Attribution and Usage` 明確標示 **CC0 1.0 Universal**，研究者希望對資料再利用感興趣者與其聯絡討論潛在合作；這是禮貌請求，不等於 CC0 額外附加限制。
- README 中正式資料 DOI 留有 `xxx` 佔位符，故以實際 Dryad 來源 https://doi.org/10.5061/dryad.z8w9ghxh1 作為資料引用入口。
- ZIP 大小：9,824,662 bytes。
- XLSX 原始內容 SHA-256：`30f59c42c6f0b6518705deecd2e7943740dd5c110358232f80c71b1ebcc0198a`。
- ZIP SHA-256：`fe355b088584bb32ff9819ef424c37bfe5a1496076ba9c8410335551bbcea79d`。

## Excel 工作表與實際資料範圍
| 工作表 | 工作用途 | 實際非空列數（含表頭） |
|---|---|---:|
| `Variable information` | 欄位定義、單位、停頓與跑道位置 | 19 |
| `pause vs no pause data` | 45°、90° 轉向前／中／後的停頓及比例彙整 | 70 |
| `pause vs linear speed and SOT` | 轉向速度 `SOT`、轉向前後直線速度，混有旁側統計彙整 | 72 |
| `pause vs speed BIA` | 轉向前 `before`、轉向中 `in`、轉向後 `after` 的速度與彙整 | 70 |
| `pause vs acceleration` | 不同路段的最大加速度 `amax`、試驗分類與彙整 | 183 |

**注意：** `pause vs speed BIA` 的 Excel 工作表元資料宣告 `max_row=1,048,561`，但只有前 70 列有內容，其他主要是格式／空白列，**絕不能視為超過百萬筆實測資料**。
- 表內含統計彙整區塊，以上「非空列數」不等於全部為獨立試驗；也不能直接相加得出樣本量。
- 三份停頓／速度明細表的第一欄主要為動物編號；有跨表重複，應使用個體／條件鍵值再做合併。

## README 與 Variable information 定義
- `Track Angle`：**45° 或 90°**。
- `Speed`、`Speed of turn (SOT)`：**m/s**。
- `Acceleration (amax)`：**m/s²**。
- `Pauses`：奔跑、停止、再奔跑的**間歇性運動**。
- 跑道全長 **1.9 m**；開始轉彎在 **0.9 m**，轉彎結束在 **1.1 m**；研究以至 **1.4 m** 處的動作作為分析。
- `0,0`：轉向前和轉向中都沒有停頓。
- `1,0`：轉向前有一次停頓、轉向中沒有。
- `0,1`：轉向前沒有停頓、轉向中有一次。
- `0-P`：起點至第一次停頓位置；`0.9-P`：轉彎區起點到停頓；`P-1.1`：停頓點到轉彎區終點。
- **缺值**：README 定義為空白儲存格；不可混同於零次停頓或零加速度。
- `pause vs acceleration` 某些 `amax` 欄位儲存為帶空白的字串；在數值分析前應清理並檢查極端值，不可將其直接與標準浮點值混用。

## 與《鱗片與種子》的關係
- 對四肢爬蟲運動模型：將 `pause`、`turn_angle`、`before/in/after_turn_speed`、`segment_acceleration` 當作研究輸入分類；未來與守宮附著、巨蜥受力及板蜥捕食資料分離。
- 說明**動物停止後重新加速**可能是重要行為策略，不能把所有蜥蜴動畫做成永遠不停頓的連續直線移動。
- 資料是實測速度／加速／停頓與比較表，**不是逐幀四肢關節骨架或影片**；研究物種的數值不能推廣為所有守宮／石龍子／巨蜥的固定速度。
- 後續如做統一研究資料索引，可分類為 `locomotion-summary`、`turning`、`intermittent-movement`；保留 CC0、DOE／README、原檔 checksum 和試驗條件。
- 使用者目前選擇 **先累積大量真實研究數據，之後再統一實作**；本次只做文獻／原始資料建檔，不動遊戲存檔及正式 Phaser 場景。

## 待查
1. 檢查研究正式發表的物種學名、全部樣本及試驗設計。
2. 清理 `pause vs acceleration` 文字混合數字與可疑極值，核對實際量測方式。
3. 依研究 README 追溯表格資料的個體 ID、實驗次數，統計實際有效試驗量，而不是 Excel 佈局列數。
