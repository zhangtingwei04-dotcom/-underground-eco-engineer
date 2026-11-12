# 《鱗片與種子》蛇類花紋科學證據紀錄 — 2026-11-12

用途：供未來**玉米蛇（*Pantherophis guttatus*）**、**西部豬鼻蛇／平原豬鼻蛇（*Heterodon nasicus*）**像素蛇皮建模使用。此文件只整理可核對的公開資料，不表示已在遊戲實作或確證所有人工繁殖品系的基因機制。

## 1. 玉米蛇：花紋與基因的證據分級

| 現象／研究 | 公開來源與研究方法 | 可採納程度 | 遊戲實作限制 |
| --- | --- | --- | --- |
| 野生型常見橘色底色、紅色背部與側面斑塊、深色斑緣 | Tzika 等，*Nature Communications* 2024，野生型與 Terrazzo 對照，實驗室觀察、基因定位與基因編輯 | **有文獻描述** | 這只是自然外觀基準，不可宣稱所有地理族群／個體完全一致 |
| PMEL 與 Terrazzo 類斑塊轉條紋的關聯 | Tzika 等 2024，定位、轉錄體、PMEL 基因剔除與顯微鏡觀察 | **實驗支持強** | 不能把「所有條紋蛇」都歸因同一 PMEL 等位基因；需區分 Terrazzo 與其他品系 |
| CLCN2 與 Stripe / Motley 花紋變化 | *BMC Biology* 2025；定位與表達分析，Stripe 等位基因插入、基因剔除的條紋表型 | **Stripe 機制有較直接實驗支持；Motley 相關表達證據與特定調控變異仍需分開看** | 不可把品系名稱轉成通用的生物學基因公式，也不可直接用一個基因決定全部花紋 |
| OCA2 與缺乏黑色素的 amelanistic 品系 | Saenko 等，*Scientific Reports* 2015；群體定位與候選基因序列分析 | **提出具體很可能致因的插入變異** | 色素生成與斑塊幾何是不同層次；缺黑色素不等於斑塊座標消失 |
| 黑色素細胞、黃色素細胞、虹色素細胞的分化 | *Nature Communications* 2026 的爬蟲比較研究，玉米蛇單細胞及色素細胞標記 | **支持以分層色素系統思考** | 目前 V1 只是抽象 pigmentSlot，沒有實際色素細胞物理渲染 |

**來源：**
- PMEL / Terrazzo (2024)：https://pmc.ncbi.nlm.nih.gov/articles/PMC11371805/
- CLCN2 / Motley–Stripe (2025)：https://pmc.ncbi.nlm.nih.gov/articles/PMC11948899/
- OCA2 / amelanism (2015)：https://pmc.ncbi.nlm.nih.gov/articles/PMC4657000/
- Reptile chromatophore differentiation (2026)：https://www.nature.com/articles/s41467-026-75281-5

## 2. 西部豬鼻蛇：有來源的形態基準

- 加拿大政府 COSEWIC 2019 物種評估：背側背景由淺棕、灰棕到紅棕等變化；沿背部有一排深色斑塊，兩側通常有多排較小斑點；腹鱗多為深色並伴淺色或暖色斑點；吻端上翹，體型相對結實，鱗片有稜。
- Illinois Natural History Survey 物種介紹：淺灰或褐色背景搭配背部深色斑塊、上翹吻鱗、腹部偏深色。個體間斑紋數量與型態有差異。
- 這些可作為**自然型花紋與體型的視覺研究方向**，而不是直接把商品名義的「Conda」「Superconda」等解釋為已找到特定因果基因。

**來源：**
- Government of Canada COSEWIC 2019：https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/plains-hog-nosed-snake-2019.html
- Illinois Natural History Survey：https://herpetology.inhs.illinois.edu/resources/species-lists/ilspecies/plains-hog-nosed-snake/

**證據缺口：**這次針對 *Heterodon nasicus* 的限量公開資料搜尋，未找到足以支撐把常見商業品系逐一映射至已驗證因果基因的同等品質實驗研究。**「本輪未找到」不是「證明不存在」**。未核實前，遊戲中的豬鼻蛇品系／遺傳層應先維持資料待驗證標記。

## 3. 對 V1 / V1.1 系統的決策

1. **生物身分與基因型**：未來另設帶證據等級的生物模組；絕不把 V1 的 `seed` 當成真正 DNA。
2. **外觀表型**：由可核對物種資料與品系證據決定哪些花紋類別可以採用；不能把「有漂亮的視覺效果」誤當科學結論。
3. **個體唯一性**：外觀允許每條蛇微小差異，但生成一次後就存入 immutable `patternBlueprint`；`patternId` 是配方識別，不取代生物個體存檔 ID。
4. **蛇皮附著**：目前 V1.1 只將 `u,v` 定位到已有碰撞驗證的透明 3D 三角網格，不生成鱗片或色素材質。即使未來變成像素風格，花紋應該跟隨身體局部座標，不每幀重新亂數。
5. **成長**：花紋 `u,v` 相對位置固定，物理長度變長時才按身體比例延展；顏色與皮膚生理變化若另有可靠證據才建新規則。
6. **稀有／特殊花紋**：只能依遊戲世界觀作虛構分類，不混入真實野生型的科學說明。

本文件是公開科學資料摘要，無私人素材、玩家資訊、未公開故事或遊戲資產。不代表任何商業品系遺傳機制已被實作。
