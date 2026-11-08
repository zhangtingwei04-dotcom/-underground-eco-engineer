# 西部豬鼻蛇與玉米蛇：日常行為／環境選擇原始研究證據 v0.1

**建立日期：** 2026-11-08（Asia/Taipei）  
**專案：**《鱗片與種子：地下生態物語》  
**範圍：** *Heterodon nasicus*（部分資料稱 Plains Hog-nosed Snake）及 *Pantherophis guttatus*。  
**定位：** 已查到的科學證據、證據限制、未來遊戲可用行為標籤；**不是已寫入遊戲的行為權重／每分鐘次數／飼養指引**。

## 先確立的原則

1. **行為不是固定排程。** 覺醒時活動、休息、躲藏、挖掘、攀爬與吐舌等項目，必須依物種、生命階段、環境與當下情境選擇，不可用這幾篇論文直接捏造「一日活動 X 小時」。
2. **區分野外與圈養。** 實驗室的豐富化偏好，不等於野外每日活動預算；野外單地區的季節行為，也不等於全物種生理需求。
3. **有權選擇才有行為。** 對玉米蛇，可攀爬／伸展／躲藏的設施是可使用的資源；對豬鼻蛇，可挖掘的底材及微棲地選擇很重要，但不能把任何資源的個別因果貢獻寫死。
4. **觀察指標不等於病理診斷。** 探索多寡、吐舌或躲藏不能被單一規則判定為健康、恐懼、依戀或疾病。
5. **數據與效能分離。** 學術實驗方法與統計可以入研究庫；遊戲優先採情境式事件和離線摘要，無須逐幀求解所有動物生理數值。

## SDB-01｜西部豬鼻蛇偏好環境豐富化：實驗直接證據

- **來源：** Nagabaskaran, G., Skinner, M., & Miller, N. (2022). *Western Hognose Snakes (Heterodon nasicus) Prefer Environmental Enrichment*. Animals 12(23):3347.
- **DOI：** https://doi.org/10.3390/ani12233347
- **原文：** https://www.mdpi.com/2076-2615/12/23/3347 ；可讀全文：https://pmc.ncbi.nlm.nih.gov/articles/PMC9739432/
- **對象／方法：** 16 隻約 3–4 個月的幼蛇；生態箱分成標準／豐富化兩側，各有一處躲藏。豐富化側設可挖掘底材、互動物件與較大水盆，標準側紙巾底材與較小水盆；加熱使一側較溫暖；連續 6 天，每天觀察 4 次。
- **研究結果：** 幼蛇偏好豐富化側（文中整體偏好分數平均 0.68 ± 0.22 SD），而且偏好會隨觀察天數增加；豐富化側較涼時偏好更強。研究描述蛇常在豐富化側底材掘入。
- **證據限制：** 豐富化是多物件一起加入；不能分離哪一項造成偏好，也不能據此推論「豬鼻蛇喜歡寒冷」或成年豬鼻蛇的最佳飼養溫度。偏好與個性膽量的關聯未獲充分支持。
- **遊戲候選標籤：** `burrowing`, `shelter_selection`, `exploring`, `microhabitat_choice`；有可挖底材才可能掘入；選擇多點微棲地，而非只往熱點。
- **取得狀態：** 網路全文可閱讀；本次未另外取得 PDF 實體檔或原始 OSF 數據。

## SDB-02｜豬鼻蛇野外活動季與洞穴：地區自然史與報告

- **原始自然史文獻：** Hoaglund, E. P. & Smith, C. E. (2012). *Lessons learned: Notes on the natural history of the Plains Hognose Snake (Heterodon nasicus) in Minnesota*. Reptiles & Amphibians 19(3):163–169.
- **DOI：** https://doi.org/10.17161/randa.v19i3.13899；期刊：https://journals.ku.edu/reptilesandamphibians/article/view/13899
- **研究摘要：** 明尼蘇達州研究族群活動季的資料提示個體可能有大部分時間在地表，另有夜行、食卵、繁殖和共同冬眠的紀錄。
- **補充官方綜述：** COSEWIC (2019), *Assessment and Status Report on the Plains Hog-nosed Snake (Heterodon nasicus) in Canada*：https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/plains-hog-nosed-snake-2019.html
- **官方整理：** 加拿大族群主要日間活動，出沒於沙質草地，使用洞穴作為庇護與越冬場所；報告也整理了某些族群夜間回用洞穴及季節棲地變化的野外追蹤研究。
- **重要差異：** 2012 年明尼蘇達州原始研究提及共同冬眠觀測；COSEWIC 2019 對加拿大族群概述多為單獨越冬。兩者涉及不同族群與證據，不可任意擇一當成全物種「必然群居／獨居」。
- **遊戲候選標籤：** `surface_activity`, `burrow_refuge`, `seasonal_activity`, `foraging`, `night_observation_exception`。
- **限制：** 2012 年此處引用的是公開摘要；尚未逐頁驗證 PDF。COSEWIC 是彙整性報告，不是單一行為實驗；日／夜活動應留季節及族群差異。
- **取得狀態：** 期刊公開摘要／PDF 入口已找到；加拿大報告全文 HTML 可閱讀；未另外下載原始 PDF。

## SDB-03｜玉米蛇利用豐富化場域：實驗直接證據

- **來源：** Hoehfurtner, T., Wilkinson, A., Nagabaskaran, G. & Burman, O. H. P. (2021). *Does the provision of environmental enrichment affect the behaviour and welfare of captive snakes?* Applied Animal Behaviour Science, 105324.
- **DOI：** https://doi.org/10.1016/j.applanim.2021.105324
- **出版者：** https://www.sciencedirect.com/science/article/pii/S0168159121001118
- **對象／方法：** 15 隻人工繁殖成年玉米蛇，評估生態箱中的行為、焦慮相關測驗及環境偏好。
- **研究結果：** 個體會使用提供的攀爬枝、攀爬板、懸吊躲藏處、苔蘚容器與較大水盆；可運用箱體較高處。選擇測試偏好豐富化環境；一些行為指標有利於福利改善的解讀。
- **證據限制：** 焦慮相關測驗效果有限，不應誇稱所有壓力指標都顯著改善。額外資源是一起改變，不能將單項裝飾當作已驗證的特定獎勵。
- **遊戲候選標籤：** `climbing`, `elevated_resting`, `hide_use`, `water_contact`, `exploring`。
- **取得狀態：** 出版者頁面摘要與部分內文索引可查；未取得完整 PDF。

## SDB-04｜玉米蛇生態箱長度與伸展：實驗直接證據

- **來源：** Hoehfurtner, T., Wilkinson, A., Walker, M. & Burman, O. H. P. (2021). *Does enclosure size influence the behaviour & welfare of captive snakes (Pantherophis guttatus)?* Applied Animal Behaviour Science 243:105435.
- **DOI：** https://doi.org/10.1016/j.applanim.2021.105435
- **出版者／摘要：** https://www.sciencedirect.com/science/article/abs/pii/S0168159121002227
- **研究方法：** N=12 成年玉米蛇；交叉比較約為身長 2/3 的小箱與長於蛇身的大箱，每種條件約 32 天，並測行為及偏好。
- **結果：** 大箱中活動增加，會全身伸展；活動狀態下對大箱有明顯偏好，但**休息時未觀察到相同偏好**；其他行為測驗的差異並不完全一致。
- **限制：** 小樣本、有限時間及研究設施條件。不能由此推出精確的遊戲舒適度分數、所有蛇種的箱體尺寸比例或每小時活動量。
- **遊戲候選標籤：** `full_body_stretch`, `active_exploration`, `rest_posture`, `space_constraint`；未來將箱體可用空間列為可行行為的條件，但不要將這份實驗直接變成惩罰性每日打卡。
- **取得狀態：** 出版者摘要與可檢索的部分方法／結果可讀；未取得完整正式 PDF。

## SDB-05｜玉米蛇辨別熟悉與陌生人類氣味：實驗直接證據

- **來源：** Nagabaskaran, G., Burman, O. H. P., Hoehfurtner, T. & Wilkinson, A. (2021). *Environmental enrichment impacts discrimination between familiar and unfamiliar human odours in snakes (Pantherophis guttata)*. Applied Animal Behaviour Science 237:105278.
- **DOI：** https://doi.org/10.1016/j.applanim.2021.105278
- **出版者：** https://www.sciencedirect.com/science/article/pii/S0168159121000654
- **研究方法：** N=11 玉米蛇，分別在豐富化與標準環境生活 4 週後交叉交換，再做熟悉處理者與陌生者氣味的雙選刺激測試。
- **結果：** 豐富化條件下較多時間探索陌生氣味；標準環境條件下沒有呈現相同的辨識偏好。測量的是**靠近／調查氣味的時間**。
- **限制：** 不能據此說明蛇「愛主人」或證實牠知道對方的人類身份；沒有證實情感關係、持久記憶、全物種普遍反應。研究所用拼字 *Pantherophis guttata* 應保留為原文，其目前通常接受學名為 *P. guttatus*。
- **遊戲候選標籤：** `scent_sampling`, `novelty_investigation`, `habituation_context`；如要表現對熟悉研究員反應改變，仍應以化學線索、物種認知與多次研究驗證為基礎，避免擬人化。
- **取得狀態：** 出版者摘要和部分方法／結果可讀；未取得完整 PDF。

## 後續行為資料表格欄位

`species_id`、`life_stage`、`wild_captive`、`observation_context`、`behavior_tag`、`trigger`、`duration_or_frequency_if_reported`、`evidence_level`、`sample_size`、`geographic_scope`、`doi`、`source_access`、`limitations`。

### 不填入的數值（目前證據不足）

- 「每條豬鼻蛇每天挖洞幾次、挖多久」：這五篇沒有可直接通用的數字。
- 「玉米蛇每天攀爬多少分鐘、多少次吐舌」：沒有經對應環境驗證的通用值。
- 「蛇因為喜歡玩家所以出來迎接」：缺乏本批研究支持；不作現實科學結論。
- 「任何蛇天生偏好較低溫度」：豬鼻蛇的該項觀察只限有豐富化且熱區位置操控的條件。

## 相關研究與下一步

- 既有主要來源網站清單：`HERPETOLOGY_RESEARCH_SOURCES_20261108_V01.md`。
- 既有更廣泛蛇類索引：`SNAKE_ECOLOGY_EVIDENCE_INDEX_20261108_V01.md`。
- **下一步優先：** 查找兩物種在不同時間的實測活動預算／野外追蹤，以及幼蛇與成年蛇的狀態差異、蛇類吐舌與捕食實驗。
- 本批為研究紀錄，不改 Phaser、玩家存檔或正式物種數值；需要效能測試後才考慮轉入遊戲機制。
