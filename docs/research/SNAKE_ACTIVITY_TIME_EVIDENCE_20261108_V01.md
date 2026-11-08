# 西部豬鼻蛇與玉米蛇：活動時段／行為比例證據 v0.1

建立日期：2026-11-08（台灣）｜對象：`Heterodon nasicus`、`Pantherophis guttatus`

**重要：本文件中「特定時段的野外目擊」「研究時段掃描抽樣的百分比」「野外無線電追蹤定位」都不是同一種資料，更不等於 24 小時全天活動占比。** 分別存放，禁止任意插值或造出每日作息表。此記錄尚未變更遊戲程式／玩家存檔。

## 研究來源與證據

### AT-01｜豬鼻蛇活動時段（堪薩斯州自然史資料）

- 名稱：Fort Hays State University / Center for North American Herpetology, `Western Hog-nosed Snake`。
- URL：https://webapps.fhsu.edu/cnah/kansas/species/heterodon-nasicus
- 類型：大學／區域物種自然史彙整，引用 Platt (1969) 等歷史研究。
- 發現：Kansas 族群在日間活動，主要在上午與下午晚些時段活動；非活動時會掘入疏鬆沙土，冬季也會深埋越冬。
- 限制：地區與季節性物種概述，未提供全天分段採樣原始矩陣；**不能直接推得時段百分比／精確出洞時刻**。
- 可供遊戲：`daytime_activity`, `morning_evening_peaks`, `burrow_refuge`，依地區／季節調整。

### AT-02｜豬鼻蛇微型追蹤：伊利諾州 2011 年 6 月（2019 自然史短報）

- 作者：Durso, A. M. & Mullin, S. J. (2019), `Heterodon nasicus (Plains Hog-nosed Snake). Movement`, *Herpetological Review* 50(2):393–394.
- 原始短報 PDF（作者網站）：https://yufuke.main.jp/pdf/Fuke%202019%20HR
- 研究方法：4 隻約 9 個月大的幼體，外貼無線電發報器，因發報器在 1–5 日內脫落，只取得短期定位；每天至多 8 次，每個定位點**不是連續 24 小時影像紀錄**。
- 發現：18 次短距移動，平均 4.4 ± 0.5 m（SE）；上午與傍晚較常記錄到移動；中午 12:00–16:00 有 12 次相鄰定位未改變位置。
- 限制：N=4、單地點、只在六月、設備脫落、稀疏定位；位置未變不等於完全不移動或睡著，更不能換算全天休息比例。
- 相關文獻：短報引用 Hoaglund & Smith (2012), https://doi.org/10.17161/randa.v19i3.13899，表示其無線電追蹤顯示蛇約 71% 時間位於地表。**71% 是該研究的「地表位置」而不是「在移動／清醒」的比例；本次屬後續短報二次引述，原始採樣細節尚待全文確認**。
- 可供遊戲：`field_tracking_sample`, `possible_midday_pause`, `surface_vs_burrow`；不要將 71% 當作玩家飼養箱每天出洞固定機率。

### AT-03｜加拿大豬鼻蛇追蹤綜述：地方、性別與季節差異

- 來源：COSEWIC (2019), `Assessment and Status Report on the Plains Hog-nosed Snake (Heterodon nasicus) in Canada`。
- 官方：https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/plains-hog-nosed-snake-2019.html
- Manitoba 1981–1982：62 條標記蛇、其中 16 條成年蛇帶無線電發報器，每隻每天重新定位 1–7 次；部分活動中心包括會在夜間反覆使用的洞穴；個體棲地使用隨季節改變。
- Minnesota 2018：33 條植入發報器，16 條可供活動範圍分析，MCP 0.22–33.29 ha；注意測量方法差異會影響估計。
- 限制：這些是空間追蹤與再定位結果，並無完整逐分鐘活動預算，也不是可圈養套用的移動距離標準。
- 可供遊戲：`individual_variability`, `seasonal_habitat_choice`, `burrow_reuse`。

### AT-04｜玉米蛇圈養「有無躲藏箱」時段抽樣：有直接百分比的研究

- 作者：Huo, X., Dongutit, N., Sarnnok, W., Kumroptanasan, P. & Saowaphak, P. (online 2024-10-08；2025 卷期), `Effects of enrichment and handling on the behavior of captive corn snakes (Pantherophis guttatus)`, *Veterinary Integrative Sciences* 23(2), e2025060.
- DOI（期刊頁）：https://doi.org/10.12982/VIS.2025.060
- 論文頁：https://he02.tci-thaijo.org/index.php/vis/article/view/270413
- 期刊公開完整 PDF：https://he02.tci-thaijo.org/index.php/vis/article/download/270413/184971/1163895
- 研究：N=8（2 雄、6 雌）人工繁殖玉米蛇；各蛇單獨 50×36×16 cm 容器；前四週有鋸木屑、水盆，後四週加躲藏箱；房間溫度未主動控制。每期前 3 週的星期六，每週 **10:00–11:00 與 14:00–15:00**，每 5 分鐘掃描一次行為，並非連續全天錄影。
- 表3：無躲藏箱（期1）對比有躲藏箱（期2），單位為**被掃描時的平均百分比 ± SE**：
  - 活動總類：15.19±2.98% vs 8.51±1.54%，`p=0.052`，**未達原文 p<0.05 標準，不可宣稱顯著**。
  - 移動：8.77±2.00% vs 2.43±0.64%，p=0.004。
  - 掘入底材：1.30±0.30% vs 0.17±0.12%，p=0.001。
  - 泡水：17.45±4.19% vs 0.35±0.20%，p<0.001。
  - 靜止／休息：9.32±1.31% vs 8.55±1.63%（不顯著）；休息 22.66±5.35% vs 32.73±5.49%（不顯著）。
  - 躲藏箱使用：無躲藏箱期不適用；有躲藏箱期 22.40±4.30%。不可說是一天 22.4% 時間。
  - 觀察不到個體：37.67±5.36% vs 29.25±6.40%（不顯著），原文表示常埋在底材裡。
- 表4：有躲藏箱時，躲藏箱內緊密盤繞 25.61±4.80% 的觀察次數；**這不是 24 小時盤繞比例，也不是整體「偏好」機率**。
- 限制：小樣本，固定處理順序（先無後有），光線及房內溫度的實驗條件不能代表標準飼養設定；研究只在兩個白天時段抽樣且隔週觀測，還可能受環境時間／處理方式混雜因素影響。作者也指出活動總類的前後差異不顯著。**同一張表的分類可能有重疊，勿把類別百分比相加當全天 100%**。
- 遊戲：可定義 `locomotion`, `investigation`, `digging`, `resting`, `hiding`, `soaking`、`unknown_not_visible` 與 `fully_stretched` 行為；有躲藏資源可能改變外露活動比例，但不可將表中數值直接寫入全部玉米蛇的行為機率。
- 取用：完整論文 PDF 連結已核實可線上解析；**未將 PDF 下載成此工作階段實際檔案**。

### AT-05｜玉米蛇野外夜間鳥巢捕食：精確事件時間，不能當全日活動

- 作者：Degregorio, B. A., Weatherhead, P. J. & Sperry, J. H. (2016), `Ecology and predation behavior of corn snakes (Pantherophis guttatus) on avian nests`, *Herpetological Conservation and Biology* 11(1):150–159.
- 機構研究頁：https://experts.illinois.edu/en/publications/ecology-and-predation-behavior-of-corn-snakes-pantherophis-guttat/
- 野外鳥巢攝影資料：97 次蛇類捕食事件中約 25% 由玉米蛇造成。該地研究中，玉米蛇鳥巢捕食進入時間落在 **20:24–02:20**，而其他三種蛇不全在夜間捕食。
- 限制：紀錄的是**「到達鳥巢進行捕食」的時間**，不是所有活動、一般覓食或所有地區玉米蛇必然夜行。文中推測白天可能利用視覺定位鳥巢，屬解釋而非直接證實。
- 遊戲：可設 `nocturnal_nest_foraging_possible`，但一般日夜活動權重需參考其他生態資料。

### AT-06｜玉米蛇肯塔基州季節出現與目擊偏差

- 作者：Bird, W. M., Peak, P. & Baxley, D. L. (2015), `Natural history and meristics of an allopatric population of red cornsnakes, Pantherophis guttatus, in central Kentucky, USA`, *Journal of North American Herpetology* 1:6–11.
- DOI：https://doi.org/10.17161/jnah.vi1.11899；期刊：https://journals.ku.edu/jnah/article/view/11899
- 方法：2003–2004 年捕獲 101 條；77% 由人工覆蓋物法取得；遭遇數量在 4–5 月及 8–9 月較多。
- 限制：**遭遇記錄的月份高峰不代表蛇全天活動比例高峰**，也可能受觀察方法、天氣、乾旱與偵測率影響。研究本身指出 2004 年乾旱可能影響記錄數量。
- 遊戲：季節活動與棲地選擇可留變數，**不可直接把 77% 當作蛇偏好人工遮蔽物的比例**。

## 快速區分研究數字

| 數字 | 意義 | 不能當成 |
|---|---|---|
| 71% | 某野外豬鼻蛇研究的地表位置比例（二次引述） | 71% 時間在移動 |
| 12:00–16:00 | 四隻幼豬鼻蛇短期追蹤常出現重複定位的時段 | 全物種固定午睡時間 |
| 15.19% / 8.51% | 八隻玉米蛇在兩個白天抽樣時段的活動觀察比例（無／有躲藏箱） | 玉米蛇每日活動比例；且差異未達 p<0.05 |
| 22.40% | 有躲藏箱期間，掃描觀察到使用躲藏箱的比例 | 全天 22.4% 在箱內 |
| 20:24–02:20 | 當地攝影記錄玉米蛇造訪鳥巢捕食的時間區間 | 所有玉米蛇每日只在此時外出 |
| 77% | 肯塔基州研究使用人工覆蓋物方法捕獲個體的比例 | 蛇每天 77% 在遮蔽物下 |

## 取得狀態與下一步

- 已有「公開完整 PDF」入口：AT-04、AT-02、AT-06（AT-02 作者短報合集含其他研究）。
- 已可直接讀取完整 HTML 的官方資料：AT-03。
- 目前只有期刊／機構摘要與概述：AT-05 等，全文可以另查研究期刊。
- **尚未找到這兩物種跨季節、跨年齡、連續 24 小時可通用的逐時段活動預算資料，不應編造每日作息表。**
- 後續可找夜間紅外線行為觀察、無線電追蹤高頻記錄及原始行為掃描數據；新增資料須記 `method`, `sampling_times`, `denominator`, `sample_size`, `region`, `season`, `life_stage`, `full_text_status`。

研究來源網站優先清單：`HERPETOLOGY_RESEARCH_SOURCES_20261108_V01.md`；其他行為研究：`HOGNOSE_CORN_SNAKE_DAILY_BEHAVIOR_EVIDENCE_20261108_V01.md`。

## Cloudflare D1 同步驗證（2026-11-08）

- 本次在既有獨立研究資料庫 `scales-seeds-biology-research` 新增 **4 筆論文索引**（2019 豬鼻蛇短期移動、2025 玉米蛇躲藏箱掃描、2016 玉米蛇鳥巢捕食、2015 玉米蛇肯塔基州自然史）；既有 2012 豬鼻蛇自然史索引沿用。
- 新增 **6 條研究發現**：豬鼻蛇時段移動、2012 二次引述的地表比例、玉米蛇抽樣活動比例、躲藏比例、夜間鳥巢捕食、季節遭遇。
- 實際查詢核對 D1 目前合計：**24 篇 studies、29 條 findings、25 條 study_species 關聯**。
- **D1 純索引與研究摘要，不表示全文 PDF 已被備份**。未更動遊戲內容、主程式或玩家存檔。
