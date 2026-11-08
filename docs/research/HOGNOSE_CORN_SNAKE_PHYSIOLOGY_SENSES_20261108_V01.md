# 西部豬鼻蛇與玉米蛇：體溫、消化、蛻皮、健康與學習證據 v0.1

查閱／建立：2026-11-08（台灣時間）  
用途：《鱗片與種子：地下生態物語》實際物種科學研究；只保留可核對證據及設計候選，**尚未寫入正式遊戲機制**。  
比對：`SNAKE_ECOLOGY_EVIDENCE_INDEX_20261108_V01.md`、`SNAKE_ACTIVITY_TIME_EVIDENCE_20261108_V01.md` 及 Cloudflare D1 `scales-seeds-biology-research` 既有索引。

## 重要限制

- 區分溫度的測量性質：蛇**體內測量體溫**、蛇腹部所選擇的**底材溫度**、**環境空氣溫度**並非相同量；不可以只因數字相似互換。
- 一篇研究中測到的溫度、餵食比例或疾病結果，**不是**可直接套用的飼養建議、標準溫控範圍或餵食計畫。
- `direct_measured`＝原研究觀測／實驗；`secondary_review`＝機構報告引用他人研究；`publisher_abstract`＝只讀到摘要；`design_candidate`＝尚待實作測試的遊戲轉譯。
- 「公開全文可讀」與「已下載實體 PDF／原始 CSV」分開記錄；此批未另外下載所有 PDF/CSV，也未將第三方原文存進 GitHub。

## PF-01｜玉米蛇進食後代謝、選溫和胃內通過（2013；公開完整研究）

- 來源：Sievert, L. M., Suita, Y., Mayes, D. M., Bontrager, L. R., Tuttle, M. & Everly, A. (2013). *Specific dynamic action, postprandial thermophily, and the impact of temperature on gastric digestion in the cornsnake Pantherophis guttatus*. Zoological Studies 52:33.
- DOI：https://doi.org/10.1186/1810-522X-52-33
- 期刊完整 HTML（公開）：https://link.springer.com/article/10.1186/1810-522X-52-33
- 【研究方法】不同子試驗，不要合併成一組樣本：(i) 8 隻幼蛇在 **26°C**、食物約蛇重 **10%** 時測進食後氧耗；(ii) 春季與秋季的空腹及 10%/25% 餐量之溫度梯度選擇測試；(iii) 8 隻 5 歲玉米蛇在 **22、25、28、32°C** 測食物中的追蹤標記由胃進入腸道的時間。
- 【直接觀察】氧耗量在進食後 **24 小時**達空腹的 **2.3 倍**，約 **72 小時**回到基線。這是這組特定測試條件的結果，不能推論所有蛇固定「三天消化完」。
- 【直接觀察】春季腹部下方所選底材溫度均值：空腹 25.8°C、吃 10% 餐量 28.3°C、吃 25% 餐量 27.9°C；秋季：空腹 26.1°C、吃 10% 餐量 29.2°C、吃 25% 餐量 27.9°C。春季組間總體差異顯著，但事後比較未分出特定組；秋季空腹組低於兩種進食組，兩組已餵食蛇間則無顯著差異。
- 【直接觀察】測胃內容物通過的子試驗在 22–32°C 之間，第一追蹤標記通過的差異**沒有顯著性**，另一追蹤標記 p<0.06，亦未達原設 p≤0.05 顯著性門檻。
- 【重要限制】體內溫度、底材溫度須分開；10%/25% 是研究用實驗餐量，**不可當作照護餵食比例**；氧耗曲線不等同便便時間，更不等同「健康倒數計時」。
- 【遊戲候選】`postprandial_state`、`substrate_temperature_selection`、`digestive_energy_cost`：餵食後可調整棲地選擇與可見行為，避免一吃完立刻恢復完全相同活動；不需模擬真正的氧耗量逐秒變化。
- 【取得】完整研究可線上讀取；尚未在本批建立 PDF 本地備份。

## PF-02｜玉米蛇幼體進食後約高選 6°C 底材（2005；出版者摘要／索引）

- 來源：Sievert, L. M., Jones, D. M. & Puckett, M. W. (2005). *Postprandial thermophily, transit rate, and digestive efficiency of juvenile cornsnakes, Pantherophis guttatus*. Journal of Thermal Biology 30(5):354–359.
- DOI：https://doi.org/10.1016/j.jtherbio.2005.02.001
- 出版者：https://www.sciencedirect.com/science/article/pii/S0306456505000276
- 【摘要及可索引內文】幼玉米蛇進食後選擇腹部下方底材溫度約 **29.1±0.9°C**，空腹約 **22.9±0.8°C**，差值略超過 6°C；研究在特定線性溫度梯度中測得。
- 【重要限制】目前只有出版者摘要／搜尋索引，未取得正式 PDF；是選擇的**底材溫度**，不是可直接使用的「生態箱設置熱區」或所有年齡的體溫。與 PF-01 的春秋差異不能硬湊成一個恆定增幅。
- 【遊戲候選】為 `feeding_state` 加上物種與個體狀態條件的熱區選擇偏向，尚不設定固定 +6°C 數值。

## PF-03｜西部豬鼻蛇體溫、洞穴微氣候與年齡食性（2019 政府綜述）

- 來源：COSEWIC. (2019). *Assessment and Status Report on the Plains Hog-nosed Snake Heterodon nasicus in Canada*。
- 公開全文：https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/plains-hog-nosed-snake-2019.html
- 【二次彙整｜體溫】報告引 Kansas 26 隻蛇直腸體溫範圍 **21.4–36.2°C**、眾數 **30.5°C**（Platt 1969），Manitoba 22 隻蛇口腔溫度 **19.0–35.0°C**、中位數 **30.5°C**（Leavesley 1987）；報告引述偏好**核心體溫**約 **29.5–33.0°C**。測量方法／地區不同，不能整合平均。
- 【二次彙整｜微棲地】地表可能升至 **50°C**，洞穴溫度通常低於偏好的核心體溫；洞穴可緩衝高溫與低溫。**不能拿50°C當可承受的體溫**。
- 【二次彙整｜食性年齡差】引 Illinois 穩定同位素研究：幼蛇食性推估以蜥蜴較多（31–63%），成蛇估計有龜卵（44–56%）與蟾蜍（6–27%）；這些是**該地同位素食物貢獻估計範圍**，不是直接胃內容物件數或全物種比例。
- 【限制】報告為地區保育與自然史綜述，涉及不同第一手研究；年齡差是否跨地區普遍存在未定。野外獵物也不代表應在圈養環境提供同樣獵物。
- 【遊戲候選】`thermal_refuge`、`burrow_heat_avoidance`、`age_specific_foraging`、`regional_prey_web`；候選設定須記實際研究地區，不可寫死跨族群數值。
- 【取得】公開完整官方 HTML 已讀；原始 Platt 1969、Leavesley 1987 與 Durso & Mullin 2017 等一手全文仍待進一步查核。

## PF-04｜玉米蛇蛻皮時的眼鏡狀鱗片變化（2014 線上發表／2015 卷期）

- 來源：Cazalot, G. et al. (2015), *Scanning laser ophthalmoscopy and optical coherence tomography imaging of spectacular ecdysis in the corn snake (Pantherophis guttatus) and the California king snake (Lampropeltis getulus californiae)*. Veterinary Ophthalmology 18(s1):8–14. Online 2014-05-02.
- DOI：https://doi.org/10.1111/vop.12174；摘要：https://pubmed.ncbi.nlm.nih.gov/24787982/
- 【直接觀察】**4 隻健康成年玉米蛇與 1 隻加州王蛇**，逐日眼部影像顯示該次蛻皮歷程約 5 日，眼鏡狀鱗片在蛻皮前變得混濁／可觀察變化，而蛻皮完成後回復透明。細胞代謝／血管變化機制屬作者推論。
- 【限制】5 隻樣本、單次蛻皮的**眼部變化觀察時程**，不是成年玉米蛇「每5天蛻皮一次」，也不是每隻蛇每次預蛻皮都恰好5天。
- 【遊戲候選】`ecdysis_preparation`、`spectacle_opacity`、`ecdysis_completion`；避免重複以固定位數倒數。
- 【取得】摘要已核對；尚未取得完整 PDF。

## PF-05｜玉米蛇真菌病與異常皮膚（2020 疾病實驗）

- 來源：McKenzie, C. M. et al. (2020), *Ophidiomycosis in Red Cornsnakes (Pantherophis guttatus): Potential Roles of Brumation and Temperature on Pathogenesis and Transmission*. Veterinary Pathology 57(6):825–837.
- DOI：https://doi.org/10.1177/0300985820953423；公開摘要：https://pubmed.ncbi.nlm.nih.gov/32862796/；期刊：https://journals.sagepub.com/doi/10.1177/0300985820953423
- 【實驗】透過**人工注射**真菌 `Ophidiomyces ophiodiicola` 於 23 隻玉米蛇，測嚴重疾病模型。研究記錄了局部皮膚病變、異常蛻皮以及嚴重的全身性病理後果；可能的接觸傳播只有初步支持。
- 【非常重要的限制】這不是自然感染率、不代表普通飼養個體一定會有類似嚴重結果，也不能將單一皮膚色變或蛻皮不順直接診斷成真菌感染；研究中溫度與冬眠效應的歸因依實驗模型與樣本限制。
- 【遊戲候選】研究資料庫保留 `skin_lesion_warning`、`abnormal_shedding`、`health_review_needed` 作為非特異性觀察標籤；遊戲內**不擬定醫療診斷或自行治療規則**，也不應讓離線行為造成無故死亡懲罰。
- 【取得】出版者文章線上索引可閱讀；未下載完整 PDF。

## PF-06｜熟悉人類氣味：2021 研究與 2025 複驗不一致

- **較早研究：** Nagabaskaran et al. (2021), *Environmental enrichment impacts discrimination between familiar and unfamiliar human odours in snakes (Pantherophis guttata)*，DOI：https://doi.org/10.1016/j.applanim.2021.105278。此研究的 11 隻玉米蛇在豐富化條件下呈現較常探索陌生氣味的反應。
- **新複驗：** Vonk, J. et al. (2025), *Scents for Serpentes: are familiar humans un-hiss-takable?*. Frontiers in Ethology 4. DOI：https://doi.org/10.3389/fetho.2025.1634578。完整全文：https://www.frontiersin.org/journals/ethology/articles/10.3389/fetho.2025.1634578/full
- 【新研究樣本】**19 隻蛇，9 個物種**，包括 **6 隻玉米蛇、1 隻西部豬鼻蛇**，檢驗熟悉人類氣味、陌生氣味與無氣味控制對移動、探索及吐舌反應的影響。
- 【直接觀察】新研究沒有觀察到整體統計顯著的氣味條件效應，也未複現 2021 年玉米蛇的陌生氣味探索偏好。
- 【限制】新研究每個刺激只進行單次短測試，且飼養條件、最近進食時間未完全控制；結果不能證明蛇**不會**辨認熟悉氣味，也不能證明必然會辨認。更不支持「蛇愛主人」這種擬人化解讀。
- 【方法價值】新研究公開了行為 **ethogram**：面向／靠近氣味源的探索、轉開／遠離刺激的迴避、突然停止移動、一般移動、張口、撲咬、部分／完整吐舌、往遮蔽物移動等，可作為觀察日誌的**分類參考**。
- 【遊戲候選】`familiar_scent_response_unknown`；對玩家的熟悉反應目前應以條件式弱提示與**研究尚未確定**標記呈現，不能寫成所有玉米蛇的固定伴侶羈絆。
- 【取得】2025 年公開完整 HTML 已閱讀；2021 年僅部分摘要與搜尋摘錄，未取得全部 PDF。

## PF-07｜玉米蛇可進行區辨訓練、逆轉學習與部分長期記憶（2026 新研究）

- 來源：Green, A., Andersen, L., Berenguer, A. L. & Zeyl, C. (2026-08-22), *Responses to operant conditioning in the corn snake, Pantherophis guttatus, using olfactory and visual stimuli*. Animal Cognition, 2026 peer-reviewed accepted early article.
- DOI：https://doi.org/10.1007/s10071-026-02095-9；完整研究公開頁：https://link.springer.com/article/10.1007/s10071-026-02095-9
- 【直接觀察】共 **15 隻玉米蛇**，分兩組（8+7），以食物獎勵訓練區分氣味及視覺提示。第1組經反覆逆轉學習後，重新達標的試次數逐次減少；該組在實驗結束後最多6個月的視覺線索測試有 **95% 正確選擇**。第2組 3 個月後對應選擇未高於隨機水準。
- 【限制】兩組訓練順序與次數不同，第1組先用氣味刺激訓練可能影響後續視覺測試；95% 是**該組特定視覺選擇任務**，不是所有玉米蛇對任何事件記得 6 個月。現在可讀公開論文摘要及補充檔案清單，尚未下載 CSV。
- 【遊戲候選】`associative_learning`、`cue_discrimination`、`context_habituation`；可以表現動物對穩定環境線索的學習，但不直接等同人類式記憶或抽象推理。
- 【資料取得】文章 Open Access，出版者列出 6 個補充 CSV、數個 DOCX；**原始補充 CSV 本批尚未實際下載或驗證內容**。必須查明欄位、試驗次數與再利用授權才能作行為建模。

## 待查明的重要缺口

1. **西部豬鼻蛇進食後體溫與消化時間：** 本批沒有找到直接對 *H. nasicus* 的量化實驗，**不能將玉米蛇 +6°C 或 72h 數據跨物種搬過去**。
2. **兩種蛇可重現的長期環境濕度／蛻皮成功率資料：** 本批未找到足夠的物種特定實驗數值；一般照護指南、首次蛻皮比較、眼部短期觀察不得當成長期濕度方程式。
3. **全天 24 小時活動預算與狀態轉換：** 現有定時抽樣與短期野外追蹤，不能直接變成一整天每小時的行為比例。
4. **健康預警的誤報與漏報：** 應優先找專業獸醫／動物福利機構資料，再決定玩家能觀察到哪些可疑徵象；不要以單一外觀推測病原體。
5. **2021 vs 2025 人類氣味辨識衝突：** 保留互相矛盾的研究發現及方法差異，等待更多複驗；不能自行合併成確定能力。

## 建議未來資料模型（研究庫，不是立即遊戲規則）

`species` + `life_stage` + `study_context` + `meal_condition` + `substrate_temp_vs_body_temp` + `thermal_refuge_available` + `behavior_category` + `result_measure` + `sample_size` + `source_doi` + `direct_or_secondary` + `uncertainty` + `access_status` + `game_candidate`。

**實務原則：** 保留科學高精度來源，遊戲僅用高層次情境狀態切換；不增加必須每天登入的飼育負擔，不讓一條蛇缺乏觀察機會就被判定患病。此次不修改 Phaser、玩家資料庫或既有玩家存檔。

## Cloudflare D1 入庫與驗證（2026-11-08）

- 已將本批 **6 篇新論文**索引加入既有獨立 `scales-seeds-biology-research`；沿用既有 COSEWIC 2019 條目，不重複建立。
- 已加入 **10 條具適用範圍與限制的研究發現**，包含進食代謝、底材溫度選擇、胃排空試驗、蛻皮眼部變化、真菌疾病警示、2025 年氣味辨識複驗、2026 年線索學習、豬鼻蛇的洞穴溫度與年齡食性。
- 查詢驗證庫內累計 **30 篇 studies、39 條 findings、32 條 study_species 關聯**。
- 研究庫目前**只保存文獻與研究結論索引，不表示 PDF、原始 CSV 或補充資料已下載／備份**；未更動遊戲本體、玩家存檔或其他付費資源。
