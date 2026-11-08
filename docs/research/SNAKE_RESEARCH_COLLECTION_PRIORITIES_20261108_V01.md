# 蛇類生態研究：下一階段資料蒐集優先清單 v0.1

- 建立：2026-11-08。
- 專案：《鱗片與種子：地下生態物語》。
- 此文件是**待蒐集資料規劃**，不是研究內容已完成、不是正式遊戲數值、不是動物飼養指南。
- 研究網站先參考同目錄 `HERPETOLOGY_RESEARCH_SOURCES_20261108_V01.md`，以及各論文 DOI / 大學 / 政府野生動物資源。先依據 `SNAKE_ECOLOGY_EVIDENCE_INDEX_20261108_V01.md` 查重。
- 首批物種：`Heterodon nasicus`（西部／平原豬鼻蛇）、`Pantherophis guttatus`（玉米蛇）。保留地方族群、年齡、性別、野外或圈養、實驗環境差異。

## P0：最先收集

1. **行為譜（ethogram）與活動預算**：行為定義（探索、躲藏、挖掘、攀爬、靜止、吐舌、獵食、防禦、蛻皮期）、事件觸發、觀察時段、行為時長／頻次、個體差異。無直接研究支持時不可捏造「一天幾次」的數值。
2. **棲地選擇與微環境**：野外與人工環境的底材、遮蔽物、洞穴深度、樹枝、熱梯度、底材／空氣濕度與水源、時間與季節效應；不要只記錄平均溫度，優先記錄測量點和環境結構。
3. **健康與福利指標**：食欲、體重與體況、蛻皮完整性、皮膚與呼吸、異常重複動作或長期撞擊透明邊界、正常的探索與躲藏；區分觀察指標與尚待驗證的診斷標準。遊戲不將單一行為自動判定為疾病。
4. **捕食與化學感知**：氣味線索、吐舌、獵物偏好、伏擊／主動搜索、吞食後休息與消化；分開記錄不同獵物及年齡，避免跨物種照搬。

## P1：完成核心行為之後

5. **生長／首次蛻皮／一般蛻皮**：年齡、體長、質量、蛻皮間隔、環境與食物變數；首次蛻皮不能替代成體週期。
6. **繁殖生命史**：野外繁殖期、交配、產卵、巢位、孵化、初次進食、孵化後發育與季節差異；避免把人工養殖條件當成野外典型。
7. **地理分布與保育**：原生／外來、棲地類型、活動季節、目擊／標本座標及不確定度；敏感物種位置應保護。GBIF 出現紀錄不能等同完整分布。
8. **感官／認知／學習**：化學感知、視覺、震動、空間探索、習慣化、個體差異；不能推論擬人化情緒。
9. **基因與體色花紋**：形態、基因型／表現型、有來源的遺傳模式、已知健康問題；未核對原始遺傳文獻的商業「morph」名稱標示待核實。
10. **動作影片與測量資料**：補高品質攀爬、挖掘、吐舌、吞食、側行或手風琴式爬行影片、逐幀關鍵點或速度；保存採樣率、尺度、影格時長、來源授權。不得直接將第三方動畫和影像複製到商用遊戲。

## 已核對的延伸研究起點（2026-11-08）

- Nagabaskaran et al. (2022), `Western Hognose Snakes (Heterodon nasicus) Prefer Environmental Enrichment`, DOI: https://doi.org/10.3390/ani12233347；公開全文：https://pmc.ncbi.nlm.nih.gov/articles/PMC9739432/。幼蛇環境選擇：豐富化偏好；本研究無法分離各項豐富化資源的單獨效果。
- Hoehfurtner et al. (2021), `Does the provision of environmental enrichment affect the behaviour and welfare of captive snakes?`, DOI: https://doi.org/10.1016/j.applanim.2021.105324；研究摘要：https://czaw.org/resources/does-the-provision-of-environmental-enrichment-affect-the-behaviour-and-welfare-of-captive-snakes/。玉米蛇使用豐富化且有偏好，但焦慮測試沒有全面顯著反應。**尚未核對完整 PDF**。
- `Laying the groundwork for reptile welfare assessment in zoos and private keeping: A literature-based proposal` (2025), 免費全文：https://pmc.ncbi.nlm.nih.gov/articles/PMC12571689/。屬福利評估框架提議，不是西部豬鼻蛇／玉米蛇專屬驗證工具。
- `Identification of Animal-Based Welfare Indicators in Captive Reptiles: A Delphi Consultation Survey` (2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC8300299/。專家共識涉及鬣蜥科、蛇蟒科等四個類群，**不能直接當成豬鼻蛇、玉米蛇的已驗證福利量表**。
- Nebraska Heterodon nasicus 物種資料：https://herpneb.unl.edu/plains-hognose-snake/；Colorado Parks and Wildlife：https://cpw.state.co.us/species/western-hognose-snake。官方／大學物種概述，需與原始自然史研究交叉驗證。
- Tennessee Wildlife Resources Agency 玉米蛇物種資料：https://comptroller.extglb.tn.gov/content/tn/twra/wildlife/reptiles/snakes/red-cornsnake.html。用於棲地和捕食方向，不代表完整地理分布。

## 建議後續研究記錄欄位

`taxon_scientific_name`, `life_stage`, `sex`（若有）, `environment_wild_or_captive`, `geographic_scope`, `behavior_category`, `behavior_definition`, `trigger_or_context`, `measurement_value_and_unit`（若原文有）, `sample_size`, `study_design`, `source_title`, `authors`, `year`, `doi_or_url`, `evidence_class`（直接量測／作者推論／遊戲建議）, `limitations`, `access_status`, `license`, `checked_at`。

- 優先保留有效條件與不確定性；沒有樣本數、方法、測量單位，就不編造。
- 研究數據與遊戲模型分離，先留在 `docs/research`，符合品質再考慮加入獨立 Cloudflare D1 `scales-seeds-biology-research`；不修改玩家存檔、不新增付費服務、不在公開 GitHub 直接保留未核對授權的第三方原始影像／數據。
