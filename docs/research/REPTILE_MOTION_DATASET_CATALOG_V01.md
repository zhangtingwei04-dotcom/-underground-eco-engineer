# 《鱗片與種子》真實爬蟲動態與行為研究資源目錄 v0.1

- 建立日期：2026-11-08
- 用途：收藏研究來源，逐步評估能否轉為 Ohm Core 動態、習性和攀爬等資料。
- 狀態：**來源頁面已確認；大部分原始資料尚未下載、逐欄驗證或匯入。**
- 原則：優先真實物種；運動實測、行為紀錄、照片／影片、論文應分開標註。未確認授權的素材不要直接導入遊戲或公開倉庫。

## A. 首批蛇類資源

| 物種／類群 | 研究與資料 | 公開型態 | 預計用途 | 狀態 |
|---|---|---|---|---|
| 玉米蛇 Pantherophis guttatus | Generation of Propulsive Force via Vertical Undulations in Snakes | Dryad 實驗與動作捕捉資料；DOI:10.5061/dryad.6wwpzgmwt | 蛇體中心線、障礙跨越、三維運動參照 | 來源確認，未匯入 |
| 緬甸蟒 Python bivittatus | Morphometric and arboreal habitat use data (2026 USGS) | 2 個 CSV、照片、2 段攀爬相關影片；包含 356 隻個體形態紀錄、112 次樹棲相關追蹤事件 | 大型蟒蛇攀爬、棲地與個體尺度 | **CC0**；來源確認，未匯入 |
| 緬甸蟒 Python bivittatus | Burmese python acceleration and location data, Everglades National Park (2020 USGS) | 加速度紀錄、GPS、體溫資料 | 活動量、環境與行為週期；不等於逐影格骨架 | **CC0**；來源確認，未匯入 |
| 球蟒 Python regius | Strike kinematics and performance in juvenile ball pythons (2017) | 高速攝影研究論文；目前**未確認可直接取得原始逐幀資料** | 出擊動作研究 | 論文確認，原始數據待查 |
| 紅尾蚺 Boa constrictor（**蚺科，非蟒科**） | Effects of ingesting large prey on the kinematics of rectilinear locomotion in Boa constrictor (2024) | Dryad 約 8.12MB CSV；每秒 30 影格；進食前後標記點追蹤 | 貼地直線運動與進食後的身體變化 | 來源／格式確認，授權待逐項審核，未匯入 |
| 紅尾蚺與杜氏蚺（**蚺科**） | Snakes mimic earthworms: propulsion using rectilinear travelling waves (2013) | 論文與補充影片／追蹤研究 | 緩慢腹側推進方式 | 研究確認，原始資料與重用授權待檢 |

## B. 官方或研究來源 URL

- 玉米蛇： https://datadryad.org/dataset/doi:10.5061/dryad.6wwpzgmwt
- 緬甸蟒 2026 樹棲資料： https://www.usgs.gov/data/morphometric-and-arboreal-habitat-use-data-burmese-pythons-python-bivittatus-and-associated （DOI 10.5066/P1UJJNVA；CC0）
- 緬甸蟒加速度資料： https://www.usgs.gov/data/burmese-python-acceleration-and-location-data-everglades-national-park-2010-2012 （DOI 10.5066/P91MLPXJ；CC0）
- 球蟒捕食動作： https://pubmed.ncbi.nlm.nih.gov/29356394/
- 紅尾蚺 CSV： https://datadryad.org/dataset/doi:10.5061/dryad.hmgqnk9q5
- 蚺類腹側直線移動： https://pmc.ncbi.nlm.nih.gov/articles/PMC3673153/

## C. 研究使用順序

1. 玉米蛇：維持第一個真實物種原型，先解決身體與底材接觸、中心線、前進與轉彎。
2. 紅尾蚺 2024 CSV：比對「貼地直線前進」的標記點與位移，可當另一種蛇類的參考，不能直接冒充玉米蛇測量數據。
3. 緬甸蟒 2026 資料：重點研究攀爬時的環境選擇與個體尺度，先做事件和姿態標記，不直接視為連續姿態追蹤。
4. 緬甸蟒活動量：用於未來環境／活動週期模型，但不能用加速度資料直接生成完整肢體動畫。
5. 球蟒：先保留高速出擊論文；未查得可信原始逐幀資料前，不宣稱已取得可下載動態數據。
6. 後續蛇類依物種與動作模式擴充；蟒科、蚺科與其他蛇類明確分開。

## D. 使用與授權管理

- USGS 兩份緬甸蟒資料頁標註 CC0，較適合優先評估資料重用；仍保留出處／版本與原作者資訊。
- Dryad 不同資料集授權可能不同，逐份檢查頁面及各檔案說明。
- 研究論文可以用來理解動作，不代表論文裡的照片、影片或資料都能直接嵌入商業遊戲。
- 首輪只存參考目錄與結構化的摘要；不要上傳第三方版權素材、未經查證的測量數值或大量資料集到 GitHub。
- 不宣稱「全網只有這些資料」；此表僅為當前人工蒐集的確認樣本。

## E. 未完成項目

- 下載原始檔並確認 CSV 欄位、數值單位、時間頻率與各組樣本。
- 將部分研究資料轉換到獨立的真實物種研究格式，附 citation、license、measured vs illustrative 標記。
- 設計 Phaser adapter 播放可驗證的身體中心線動態，而不改寫 Ohm Core 的物理與生態規則。
