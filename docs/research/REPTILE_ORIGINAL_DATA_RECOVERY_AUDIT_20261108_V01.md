# 爬蟲原始資料庫：存檔與找回稽核 V01

日期：2026-11-08（Asia/Taipei）  
資料庫：Cloudflare D1 `scales-seeds-biology-research` （研究索引，非玩家存檔）  
**狀態：已核對來源與索引，未完成獨立雲端備份；不得宣稱原始 600MB 資料已在 GitHub／D1 保存。**

## 1. 現有資料庫實測

| 資料庫表 | 項目 | 數量 |
|---|---|---:|
| `datasets` | 研究資料集來源索引 | 5 |
| `data_files` | **單一** Dryad 蛇類垂直波動資料集的逐檔索引 | **42** |
| `data_files.format='csv'` | 實際 CSV | **38** |
| CSV 內 `...M.csv` | 動作捕捉類 | **16** |
| CSV 內 `...sp.csv` | 力量／其他採樣類 | **22** |
| `format='xlsx'` | README／試算表 | **1** |
| `format='m'` | MATLAB 分析程式 | **3** |
| `has_original_file=1` | D1 顯示有原檔 | **0** |
| `sha256 IS NOT NULL` | 具 SHA-256 校驗碼 | **0** |

**問題修正：** 之前若籠統寫「42 個 CSV」，應改為**42 個檔案索引，其中38個CSV、1個XLSX與3個MATLAB程式**。其他四套資料集目前僅有來源清單，未有逐檔目錄，不能當完整備份。

## 2. 已核實的找回來源

- **原始論文**：Jurestovsky, Usher & Astley (2021), *Generation of propulsive force via vertical undulations in snakes*, DOI：https://doi.org/10.1242/jeb.239020 。
- **Dryad 原始資料集**：https://doi.org/10.5061/dryad.6wwpzgmwt
- **公開資料頁**：https://datadryad.org/dataset/doi%3A10.5061/dryad.6wwpzgmwt
- **公開頁顯示**：2021-06-25 版本，整包資料約 **659.69 MB**；其中包括 38 份 CSV、說明試算表及 MATLAB 程式。
- **可用 API 說明**：https://github.com/datadryad/dryad-app/blob/main/documentation/apis/README.md ，Dryad API 會依 DOI 及版本提供檔案清單與下載路徑。
- **使用授權**：Dryad 公開研究數據一般使用 CC0（可再利用，仍應引註作者及 DOI）；來源：https://datadryad.org/publication_policy 、https://dev.datadryad.org/help/guides/reuse 。**與資料關聯的原始程式、外部 Zenodo 或其他作者 GitHub 檔案可能有不同授權，須分別核對**。
- **Cloudflare D1 更新**：本批已把四套以 Dryad DOI 收錄的資料集 `license_status` 標為「Dryad published research data: CC0 (2026-11-08 publisher policy); associated code/other works verify separately」。**未下載任何新原檔，`original_storage` 全維持 `external`**。唯一非 Dryad `FlyingSnakeGaps` GitHub 倉庫的 LICENSE 仍未確認。

## 3. 備份與驗證狀態

| 任務 | 狀態 | 原因／下一步 |
|---|---|---|
| 找得到原始資料位置 | **已核實** | DOI 和 Dryad 版本可尋回，不能保證未來每條 URL 不變 |
| 資料檔逐一建立索引 | **部分完成** | 只對一套 Dryad 建立 42 筆索引 |
| 原始檔 600+ MB 在本專案雲端獨立備份 | **未完成** | 沒有已證實的個人雲端儲存位置；不自動在 R2 開付費資源 |
| 逐檔 SHA-256 校驗 | **未完成** | 原始檔沒有保存在當前可執行工作空間 |
| 檔案版本、檔大小核對 | **待補** | 下載後逐一驗證 Dryad 檔名、版本、大小及雜湊 |
| 腳本重現、欄位名稱及單位 | **部分完成** | 既有 V08 資料稽核中有部分資料結構與抽樣資訊；需以原始 README 和 CSV 再核實 |
| 資料授權查證 | **部分完成** | Dryad 公開研究數據 CC0 政策已確認；其他程式及 GitHub 倉庫另核對 |

## 4. 低成本恢復方案（未啟用付費儲存）

1. **不要把 659MB 放進 GitHub 一般 Git 版本庫。** 只保留資料 DOI、版本、檔案索引、科學摘要及校驗資訊。
2. 待使用者能在其個人設備／合法雲端保存原始 ZIP，取得**一份實際完整下載的原始檔**後，核對檔案總數、實際位元組大小、資料版本。
3. 對完整壓縮檔和解開的每個 CSV、XLSX、MATLAB 程式建立 SHA-256；寫回 D1 `data_files` 的雜湊、實際存在的儲存位置，再把 `has_original_file` 改為 1。
4. **沒有實際保存的情況，絕不可把 `has_original_file` 改為 1。** 只有授權的儲存位置經確認可取回才更新。
5. 若來源檔能公開再下載，保留 DOI 作**來源找回管道**。獨立備份仍建議保留在使用者控制的空間，以免來源版本變動。
6. **目前不新增付費計畫，不修改玩家資料庫與 Phaser 程式。** 如果未來確有必要使用 R2 或其他雲端，應另比較免費額度、容量與讀取成本再決定。

## 5. 其他資料庫治理事項

- `studies`、`findings` 是研究書目與摘要，與 `data_files` 二進位原始檔不是同一層。新增研究結論不等於已備份 PDF。
- 各來源都記 `source_url`、`doi`、`version`、`access_status`、`original_storage`、`sha256`、`license_status`；無法驗證的欄位保持空值／未確認。
- 未來擴展其他四套資料集時先檢查檔名／來源 DOI 與授權，避免重複檔案或者將不同物種實驗混合。
- 這份紀錄為**找回與保存方案／目前風險說明**；不是已完成所有原始檔備份的成果。
