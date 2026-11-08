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


## F. 新增：水蛇／海蛇游泳與潛水研究來源（2026-11-08）

**分類提醒：**「水蛇」是生態與俗稱，不是單一科；半水棲游蛇類與真正海蛇不能當作相同物種。此節只收研究線索；尚未下載原始數據或審核商業使用授權。

| 類群／物種 | 研究內容 | 可取得形式／限制 | 對 Ohm Core 的可能用途 |
|---|---|---|---|
| 菱斑水蛇 Nerodia rhombifer／歐洲水蛇 Natrix maura | 2026 年 Turning without fins，6 隻蛇的水中轉向運動學、流體分析（Natrix maura 5 隻、Nerodia rhombifer 1 隻） | 已公開相關資料集及 Python/Jupyter 重現程式；**資料集與程式授權尚待確認** | 將水中側向波動、方向變換和速度資料拆為獨立水中模式 |
| 北方水蛇 Nerodia sipedon | 2022 年水／空氣中的吐舌感官運動 | 論文與分析程式；原始高速攝影影片需向作者索取 | 水中探索、探測行為，不是游泳主動作 |
| 七種陸棲至水棲蛇類 | 2025 年 287 隻個體、九項游泳動態指標 | 論文；補充資料和原始資料可否取得待檢 | 水中移動速度、身體波長／頻率差異與物種參數約束 |
| Hydrophis stokesii、Hydrophis major 海蛇 | 2025 年 5 隻追蹤個體、106 次潛水，U／S 型潛水路徑 | 論文；軌跡原始檔／使用授權待核 | 潛入、上浮、呼吸和水深狀態，不等於逐格蛇身彎曲 |
| 自由游泳海蛇（研究資料） | 2017 年加速度與能量分配 | Dryad 公開 ZIP，含兩類 CSV；需核對欄位與授權 | 遊泳活動量與能量規劃；不直接替代身體姿態動畫 |

### 研究連結
- 2026 游泳轉向資料集： https://doi.org/10.48579/PRO/5Q27ST
- 2026 轉向分析程式與 Jupyter notebooks： https://zenodo.org/records/21564055
- 2026 轉向研究： https://doi.org/10.1103/c57h-kx57
- 北方水蛇水下吐舌： https://academic.oup.com/icb/article/62/4/852/6601462
- 2025 七種蛇游泳比較： https://www.zoores.ac.cn/en/article/doi/10.24272/j.issn.2095-8137.2025.113
- 2025 海蛇潛水研究： https://pmc.ncbi.nlm.nih.gov/articles/PMC12395837/
- 2017 海蛇活動量 Dryad CSV： https://datadryad.org/dataset/doi:10.5061/dryad.516s0

### 開發先後
1. 保持玉米蛇為首個**陸地移動**真實物種原型。
2. 使用水蛇研究建立共用 `aquatic` 動作能力／水面游泳測試；**不要將陸地貼地曲線直接當作游泳動畫**。
3. 水中方向轉換與身體變形需要不同呈現與環境耦合；先做純核心運動資料和獨立 Demo，再連接水箱／濕地場景。
4. 海蛇潛水屬更後期內容，需要深度、換氣及不同形態設定；不要與普通淡水水蛇混用。
5. 存檔、保育規則、毒性、安全與飼養合法性依物種另行審查；遊戲測試並不等於適合作為飼養箱寵物。


## G. 原始資料下載檢查（2026-11-08）

此次嘗試取得水蛇研究原始檔，確認 Zenodo 的 `egregorio/Snake-Swimming-Kinematics-v1.0.0.zip` 約 597.3 KB、Dryad 的 `dryad.516s0` 海蛇資料總約 143.49 KB；但本次執行環境對來源網站的實際檔案請求受限，**尚未成功下載任何原始檔案**。不得標示已匯入、已檢驗，亦不得把下載腳本誤認為下載後數據。

優先下載入口：
- [Zenodo 蛇類游泳運動學程式與 notebook](https://zenodo.org/records/21564055)
- [Dryad 海蛇活動量原始資料](https://datadryad.org/dataset/doi:10.5061/dryad.516s0)
- [水蛇游泳轉向實驗原始資料（data.InDoRES）](https://doi.org/10.48579/PRO/5Q27ST)

下次在可連線環境成功下載後，再計算 SHA-256、檢查 ZIP 內容、確定資料欄位與授權，分離研究資料和正式遊戲資產。
