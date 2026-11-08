# 爬蟲／蛇類研究網站與資料來源清單 v0.1

- 建立日期：2026-11-08
- 用途：《鱗片與種子：地下生態物語》真實物種研究來源導覽與未來文獻蒐集規範。
- 注意：網站可打開 ≠ 論文 PDF 已下載；可以下載 ≠ 可直接將圖片、影片、資料檔重製於商業遊戲。每份研究仍須記作者、發表年、DOI、取用權限、物種與證據限制。
- 使用者已上傳的論文、已整理的研究摘要應以既有 docs/research 和獨立 D1 `scales-seeds-biology-research` 的記錄為準，避免重複入庫。

## 正式主要資料獲取地（2026-11-08 使用者確認）

**本文件中的專業網站正式列為《鱗片與種子：地下生態物語》爬蟲類與蛇類研究的主要資料獲取來源。** 未來蒐集資料時優先查詢，不代表只准使用這些網站；可信的研究機構、博物館、政府保育機關、原始論文 DOI、作者或大學典藏庫也可交叉驗證與補充。

### 優先順序與分工

1. **物種分類與學名：** The Reptile Database 為首選；以學名／同物異名建立索引，對日期敏感的分類變更應記版本及查詢日。
2. **真實生態與行為：** Herpetological Conservation and Biology、Reptiles & Amphibians、Journal of Herpetology／Herpetological Review（SSAR）、The Herpetological Journal（BHS）、Amphibia-Reptilia／Herpetology Notes（SEH）、Acta Herpetologica。首重原始研究與同儕審查資料。
3. **原始數據與重現分析：** Dryad；原始數據優先關聯原論文與 DOI，確認取用／再使用授權，記錄資料版本。
4. **分布與出現紀錄：** GBIF 與 HerpMapper；警惕採樣偏差、錯誤鑑定與敏感物種座標，不以單次出現推定完整分布。
5. **物種重點：** 先處理西部豬鼻蛇（Heterodon nasicus）、玉米蛇（Pantherophis guttatus），再擴充其他爬蟲和兩棲類。

### 納入研究資料庫的最低條件

- 必有：來源網站、論文／資料集標題、作者或發布機構、年份、學名、URL／DOI、查閱日、研究與觀察條件（已知時）。
- 每條結論標記：**直接觀察／研究假說或推論／遊戲設計轉譯／待核實**，並寫明適用物種與限制。
- 每份檔案明確標記：**可找到摘要、可讀完整內容、已實際取得 PDF／原始數據、下載失敗／須使用者協助**。不可把找到連結當作已下載。
- 重複來源應依 DOI、資料集 ID 或正式標題查重；優先補充既有條目，不建立混亂的第二套研究系統。
- 研究索引保存至既有 `docs/research` 與 Cloudflare D1 `scales-seeds-biology-research`（可用時）；與玩家存檔資料庫及正式遊戲程式分離。大型原始檔不自動上傳公開 GitHub 或 D1。
- 尊重原始出版與資料授權，免費來源優先；**不得為取得文獻自行訂閱或付費**。
- 若來源衝突，保留兩者證據及限制，再考慮新研究或原始方法；不強行合併。

## 核心站點

| 網站 | 官方網址 | 資料類型 | 免費取用狀態 | 適合遊戲研究的面向 |
|---|---|---|---|---|
| The Reptile Database | https://www.reptile-database.org/ | 全球現生爬蟲分類、學名、同物異名、分布、文獻 | 公開查詢；部分 checklist 可下載 | 物種主表、分類與學名 |
| Reptile Database data | https://www.reptile-database.org/data/index.html | 全球物種清單 Excel、參考文獻表 | 公開資料匯出，須檢視授權 | 物種名錄初始化與查重 |
| Herpetological Conservation and Biology | https://www.herpconbio.org/ | 同儕審查、爬蟲兩棲生態／野外自然史／保育 | 開放取用 | 物種行為、棲地、生命史 |
| Reptiles & Amphibians (University of Kansas) | https://journals.ku.edu/REPTILESANDAMPHIBIANS | 開放取用同儕審查期刊 | 開放取用 | 豬鼻蛇、玉米蛇野外觀察與保育 |
| Society for the Study of Amphibians and Reptiles (SSAR) | https://ssarherps.org/publications/ | Journal of Herpetology／Herpetological Review；物種 accounts | 付費與免費內容並存；部分物種 accounts 免費 | 動物行為、分類、生理與文獻追溯 |
| British Herpetological Society (BHS) | https://www.thebhs.org/publications/the-herpetological-journal | The Herpetological Journal 研究論文 | 舊刊及部分文章免費；新刊可能須訂閱 | 行為、溫度、防禦、飼養研究 |
| Societas Europaea Herpetologica (SEH) | https://seh-herpetology.org/publishing/ | Amphibia-Reptilia、Herpetology Notes | Notes 開放取用；Amphibia-Reptilia 部分需訂閱 | 短篇自然史、物種行為、分布 |
| Acta Herpetologica | https://oaj.fupress.net/index.php/ah/index | 義大利兩棲爬蟲學會學術研究期刊 | 開放存取 | 比較生態、行為與形態 |
| Dryad | https://datadryad.org/ | 論文關聯原始數據、CSV、動捕等 | 依資料集頁面下載，須核對授權 | 可重現的運動模型與生態數據 |
| GBIF | https://www.gbif.org/ | 博物館標本／觀測出現紀錄、時間、分布 | 公開查詢與資料下載；座標可能隱藏／具誤差 | 真實世界物種分布與出現紀錄 |
| HerpMapper | https://www.herpmapper.org/ | 兩棲爬蟲野外觀察公民科學與合作研究 | 部分敏感座標受限制；不是通用公開大檔庫 | 分布紀錄補充，須尊重敏感物種位置 |

## 建議檢索順序

1. 先在 Reptile Database 核對學名及同物異名；以 `Heterodon nasicus`、`Pantherophis guttatus` 為優先。
2. 到 Herpetological Conservation and Biology、Reptiles & Amphibians、BHS 與 SSAR 查原始研究；只把摘要已驗證的資訊當作摘要層級證據。
3. 依 DOI 搜尋 Dryad 或作者機構典藏庫的原始資料，紀錄檔案格式與內容；切勿將原始資料檔當成已下載，除非實際取得並驗證。
4. 物種地理分布可以交叉比對 GBIF 與物種資料庫；博物館紀錄／群眾觀測不能當作完整分布真值。
5. 研究記錄始終分成：直接觀測、作者假說／解釋、可借鑑的遊戲設計、證據不足／需再次查證。研究與遊戲即時模擬分離。

## 相關已驗證案例

- 玉米蛇／蛇運動研究的原始數據：Jurestovsky et al. (2021) Dryad：https://doi.org/10.5061/dryad.6wwpzgmwt（使用者提供大批 CSV 已曾整理；D1 原始檔索引不可當成完整備份）。
- 豬鼻蛇野外自然史：Hoaglund & Smith (2012), Reptiles & Amphibians：https://doi.org/10.17161/randa.v19i3.13899 。
- 曾上傳研究論文與來源請參見 `SNAKE_ECOLOGY_EVIDENCE_INDEX_20261108_V01.md` 與其他研究文件。

## 取用狀態

本表來源網址已經過 2026-11-08 線上檢索；**尚未替各網站下載完整論文庫或原始資料集**。將來以「網站可讀」「論文全文可讀」「原始 PDF 實際下載」「資料集實際取得」四種狀態分開記錄。
