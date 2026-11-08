# 爬蟲飼養資料問題修正與西部豬鼻蛇補充研究 V02

日期：2026-11-08（Asia/Taipei）
關聯：`BEGINNER_REPTILE_HUSBANDRY_EVIDENCE_AND_GAMEPLAY_V01.md`、`REPTILE_RESEARCH_INFORMATION_MATURITY_AUDIT_20261108_V01.md`；研究庫 D1 為 `scales-seeds-biology-research`。
**目的：修正社群／照護建議被誤當成單一確定飼養標準的風險，補上西部豬鼻蛇的原始研究和來源衝突紀錄。**
研究條目與遊戲設計建議分開；A/B/C/D 可信度按「每條主張」判斷，不針對整站。

## 一、本次查獲的研究資料問題與處置

| 編碼 | 問題 | 實際確認 | 修正與狀態 |
|---|---|---|---|
| ISSUE-01 | 西部豬鼻蛇僅偏重幼體的環境豐富化與保育報告 | 已找到 2014 野外防禦實驗、2017 同位素食性原始研究、1973 學位論文 | **補入下方三篇原始來源**；按來源條件標明限制，D1 寫入時查 DOI/標題避免重複 |
| ISSUE-02 | 綜合「hognose」照護頁把西／東／南部豬鼻蛇合併 | ReptiFiles 2018–2023 指南涵蓋 `Heterodon` 多種，溫濕度頁有分物種小節 | 只有明確寫 `western`／`H. nasicus` 的條目才可編入西部豬鼻蛇，否則列待核實 |
| ISSUE-03 | 某大學 Western Hognose 護理頁疑似錯用玉米蛇文本 | Bowling Green State University 的 Western Hognose 與 Corn Snake 頁**呈現大段相同飼養內容**，含地理分布、體長、餵食、共養等；Western 頁所述分布尤其不符該物種 | 此西部豬鼻蛇頁標為 **D：物種資料疑似錯置**，不採其飼養數值／體型／可共養主張，等待網站修正 |
| ISSUE-04 | 西部豬鼻蛇底材深度、箱體尺寸在不同指引不一樣 | ReptiFiles 底材頁 8cm 起、較大型雌蛇至少約10–13cm；2022 Magnuson DVM 資料列「數英寸」；救援指南依性別給不同最小箱體 | A/B 入門教學先確定**有可挖掘層、可選隱蔽區及不受傷的空間**；深度／尺寸列來源指定的 B/C，未建立全物種唯一標準 |
| ISSUE-05 | 玉米蛇相對濕度建議互相矛盾 | RSPCA 官網約40–50%；ReptiFiles 玉米蛇首頁40–60%，但其詳細濕度頁65–75%；時間、測點、環境差異未排除 | **未解決**：記錄每個來源和測點，遊戲不得直接固定單一百分比為科學真值；先教測量與微棲地選擇 |
| ISSUE-06 | 以野外體溫推算熱燈設定 | COSEWIC 引直腸／口腔體溫；ReptiFiles／獸醫照護表述的是環境空氣或局部曬背表面 | 保留 `body_temp`／`air_temp`／`basking_surface_temp`／`humidity_probe_location`，不混寫 |
| ISSUE-07 | 分析飼主／商店指南即當成可用科研實驗 | 圈養實務是有用的新手內容，但不等於定量實驗，也有商業利益或單一案例 | 簡單安全、交叉一致的內容可做 B 類新手提示；精確照護數字、健康診斷、繁殖／冬眠只能進 C 類待核對，直到專業驗證 |

## 二、補充的西部豬鼻蛇原始研究

### NEW-HN-01：27 隻野外個體的裝死防禦實驗（2014）

- Durso, Andrew M. & Mullin, Stephen J. (2014), *Intrinsic and Extrinsic Factors Influence Expression of Defensive Behavior in Plains Hog-Nosed Snakes (Heterodon nasicus)*, `Ethology` 120(2):140–148。
- DOI：https://doi.org/10.1111/eth.12188
- 大學學術典藏摘要：https://scholarscommons.fgcu.edu/esploro/outputs/journalArticle/Intrinsic-and-Extrinsic-Factors-Influence-Expression/99383432660606570
- 作者論文 PDF 入口：https://mullinlab.weebly.com/uploads/3/7/5/4/37545913/dursomullin14ethology.pdf （本批未另下載）
- **直接研究結果（摘要層級）：** 對 27 隻遇到的野外蛇模擬掠食者攻擊。較大體型個體裝死時間較長、雌性體型關聯較強；在較高環境溫度被遇見的蛇開始裝死較快。環境因素與裝死起始速度的關聯較明顯；個體因素與裝死持續時間的關聯較明顯。
- **限制：** `H. nasicus` 野外防禦實驗，**不可變成正常圈養日常會定期裝死的隨機動畫**；作者只分析受威脅情境下的反應。未核對全文每個統計模型參數。
- **遊戲建議：** 裝死只在**嚴重受驚／高威脅**的情境作罕見且不需刻意引發的防禦分支；玩家不應得到誘導恐懼的獎勵。

### NEW-HN-02：生命階段食性差異（2017）

- Durso, Andrew M. & Mullin, Stephen J. (2017), *Ontogenetic shifts in the diet of plains hog-nosed snakes (Heterodon nasicus) revealed by stable isotope analysis*, `Zoology` 120:83–91。DOI：https://doi.org/10.1016/j.zool.2016.07.004
- 原始摘要：https://pubmed.ncbi.nlm.nih.gov/27692795/ ；出版者：https://www.sciencedirect.com/science/article/pii/S094420061630068X
- **直接研究結果（摘要層級）：** 伊利諾州野生豬鼻蛇，採用鱗片、血液相關組織的碳／氮穩定同位素，透過貝氏混合模型推估：幼蛇的主要食物貢獻為六線賽跑蜥蜴及其蛋（約31–63%），成蛇轉以水龜蛋為主（約44–56%），青少年時期蟾蜍可能有6–27%貢獻。
- **限制：** 比例是**同位素模型對來源貢獻的估計**，不是胃內容物實際個數或所有飼養個體的餵食配方；原研究只在伊利諾州族群，跨區域外推不明。不同來源的食物被利用不代表適合直接活餵。
- **研究價值：** 提供 `life_stage` 與 `wild_diet` 分離的證據；**不要**把幼體、成體統一成同一野外食性模板。

### NEW-HN-03：東／西部豬鼻蛇比較生態研究（1973；學位論文）

- Kroll, James Clarence (1973), *Comparative physiological ecology of eastern and western hognose snakes (Heterodon platyrhinos and H. nasicus)*, Texas A&M University thesis/dissertation.
- 學位典藏：https://oaktrust.library.tamu.edu/items/6afb0698-70b9-40e1-a49b-53f8cb32d635 （PDF 可找到，**本批僅核對摘要，未下載全文**）。
- **摘要結果：** 使用遙測、標記重捕、組織、解剖與行為方法；文中研究族群的西部豬鼻蛇約 5 月出蟄、10 月入蟄，活動高峰從晚春延伸至秋，呈**日行性、每日雙峰活動**；其環境溫度相關報告有約31–34°C 的適宜範圍（摘要亦顯示均值31.8°C）。
- **限制：** 1973年某研究地點、歷史採樣方法，且「最佳環境溫度」定義仍需全文查驗。**不可當全年全球日照時程、室內熱區數值或普遍活動機率。** 報告的日行雙峰與其他地區晨昏／夜間例外記錄並不衝突：各自受測量時段、季節與族群條件約束。
- **著作權：** 學位典藏說明論文著作權仍歸作者，研究文本僅作摘述／引用，不將原始 PDF 公開轉傳至遊戲程式庫。

## 三、照護新手卡：初批 A/B/C/D 主張矩陣

> A＝動物福利／獸醫／直接實驗可佐證的低爭議原則；B＝專業照護與多方實務一致但未必有物種特定直接實驗；C＝特定數值或尚有分歧、只能保留來源作參考；D＝明顯不當、跨物種誤置、未經支持的危險主張。此級別**僅針對當條主張**，不是對來源網站總評。

| 主張 | 物種 | 分級 | 已核對依據／限制 | 遊戲入門內容 |
|---|---|---|---|---|
| 可挖掘底材、豐富化選擇比貧乏環境更受幼蛇偏好 | `H. nasicus` | A | Nagabaskaran et al. 2022, N=16；無法分離底材與物件單獨因果 | 提供可挖掘環境才可觸發挖掘，動物自己選 |
| 溫度應有暖涼區與適當躲藏 | `H. nasicus` | B | 2022 Magnuson DVM 與 ReptiFiles、救援指南相符；實際數值因區域／量測點而異 | 建立熱區／涼區／躲藏處，教測溫和安全 |
| 西部豬鼻蛇全箱平均濕度30–50% | `H. nasicus` | B（指南共識，非原始實驗） | Magnuson DVM 2022、ReptiFiles、Reptile & Rescue 均列此範圍；無物種特定濕度梯度優化實驗 | 可作具來源的指南例示；**尚不視為唯一生理標準** |
| 西部豬鼻蛇底材「必須正好 8cm／10cm／13cm」 | `H. nasicus` | C | 不同飼養指南深度不同；2022 實驗只測豐富化偏好沒有量化全生命階段的最適深度 | 玩家知道底材需足以進行挖掘；精確規格待研究 |
| 西部豬鼻蛇一律需要人為冬眠2–3個月 | `H. nasicus` | C | 網站有此一般建議，尚未證實所有健康圈養個體都必須如此；健康／繁殖條件不一 | 不做成強制年度倒數或未休眠懲罰 |
| 西部豬鼻蛇遇到玩家就必然裝死 | `H. nasicus` | D | 野外 N=27 防禦研究是受威脅條件下，並非日常迎接行為 | 不強迫觸發「裝死」取樂，保留尊重動物 |
| 玉米蛇有攀爬、躲藏與充分伸展空間的需求 | `P. guttatus` | A/B | RSPCA 動物福利指南 + 2021 兩篇玉米蛇空間／豐富化實驗 | 可用枝條、地面和高低躲藏點，讓蛇自主選 |
| 玉米蛇所有個體在任何條件都以某個單一濕度值最健康 | `P. guttatus` | C／未定 | RSPCA 約40–50%；ReptiFiles 快速頁40–60%，詳細頁65–75%；未釐清研究定義及測點 | 先教濕度測量、局部濕躲藏與通風，不寫死全域唯一值 |
| 玉米蛇和西部豬鼻蛇可用完全相同照護數值 | 兩種 | D | 不同棲地／物種與照護指南；野外體溫不等於燈具表面 | 每種蛇獨立資料，不混用 |
| 餵食／蛻皮異常可依單一外觀判定疾病／用藥 | 兩種 | D | 獸醫需結合歷史、檢查與必要檢驗；遊戲不得模擬自行確診 | 顯示「需要進一步觀察或尋求專業協助」 |

### 本批主要照護來源

- Magnuson, Melissa, DVM. (2022), *Introduction to Western Hognose Snake Care*, Canobie Lake Veterinary Hospital 站上 PDF：https://canobievet.com/wp-content/uploads/2025/01/Western-Hognose-Care-Sheet.pdf 。可讀文字，但**本批網頁 PDF 截圖未成功**；未存原始檔。
- ReptiFiles 西部豬鼻蛇照護：https://reptifiles.com/hognose-snake/care-guide/hognose-snake-temperatures-humidity ；底材：https://reptifiles.com/hognose-snake/care-guide/hognose-snake-substrate ；僅參考明確標 western 的段落。
- Reptile & Rescue 西部豬鼻蛇：https://www.hvreptilerescue.org/resources/care-guides/western-hognose-care-guide 。
- RSPCA 玉米蛇照護（HTML）：https://www.rspca.org.uk/adviceandwelfare/pets/other/cornsnake 。
- ReptiFiles 玉米蛇快覽：https://reptifiles.com/corn-snake/care-guide ；溫濕度細節：https://reptifiles.com/corn-snake/care-guide/corn-snake-temperatures-humidity 。
- 疑似混用玉米蛇文本的資料頁**不作為西部豬鼻蛇照護依據**：https://www.bgsu.edu/arts-and-sciences/biological-sciences/facilities-and-resources/bgsu-herpetarium/animals/reptiles/western-hognose-snake ，對照同站：https://www.bgsu.edu/arts-and-sciences/biological-sciences/facilities-and-resources/bgsu-herpetarium/animals/reptiles/corn-snake 。

## 四、待解問題

1. 收集西部豬鼻蛇不同**底材深度**對挖掘／健康／微環境偏好的原始量化研究，而非將單一飼養建議硬指定為最適點。
2. 對玉米蛇的**濕度差異**尋找直接實驗／獸醫福利量測，分開記錄`humidity_air`、`moist_hide`、`substrate_moisture`及測點。
3. 釐清東／西／南部豬鼻蛇與不同地區／野外和圈養活動時段的差異。
4. 用以上來源編寫兩種蛇的正式**新手飼養知識卡**之前，檢查各高風險數值是否有多方專業驗證。
5. 研究資料與遊戲規則分離；現階段**不修改 Phaser、玩家存檔或物種行為數值**。

## 五、研究庫同步驗證（本批）

- 3 篇補充文獻已實際寫入獨立 Cloudflare D1，study ID：**33（2014 野外防禦）、34（2017 同位素食性）、35（1973 學位論文）**。
- 新增4條分物種發現：裝死持續時間與個體大小、裝死開始時間與環境溫度、幼／成體食性轉變、1973 地區性日行雙峰時段。
- 實際查詢驗證更新後：**35 studies、46 findings、11 species、37 study_species 關聯**。其中西部豬鼻蛇的關聯研究 **9 篇**、發現 **12 條**。
- Kroll 1973 學位研究沒有 DOI，已確認 `studies.doi` 為資料庫 **NULL**，不是字串 `"null"`。
- D1 保存的是**論文與發現索引**；未另下載這三份原文 PDF，尚未將其內容轉成正式遊戲數值。
