// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：個體基因與遺傳學模擬系統 (Creature Genetics System)

window.CreatureGeneticsSystem = {
    /**
     * 根據給定的 Seed 與物種基因定義，生成該個體的完整基因結構
     */
    generateGenetics: function(speciesData, forcedSeed = null) {
        const seed = forcedSeed || Math.floor(Math.random() * 899999 + 100000);
        
        // 模擬擬真爬蟲基因（例如：正常野生型、蟒紋、白化、極地高對比等隱性/顯性組合）
        const availableMorphs = (speciesData && speciesData.morphs) ? speciesData.morphs : [];
        
        // 透過 Seed 計算基礎顯現品系 (Phenotype)
        const primaryIndex = seed % availableMorphs.length;
        const primaryMorph = availableMorphs[primaryIndex] || availableMorphs[0];

        // 模擬隱性基因攜帶狀態 (Heterozygous, Het)
        // 例如：有機會隨機攜帶隱性基因，但在幼體時不一定表現出來
        const hiddenHetPool = availableMorphs.filter(m => m.id !== primaryMorph.id);
        const hasHiddenHet = (seed % 3 === 0) && hiddenHetPool.length > 0;
        const hiddenHetMorph = hasHiddenHet ? hiddenHetPool[seed % hiddenHetPool.length] : null;

        return {
            seed: seed,
            genotype: {
                primary_morph_id: primaryMorph.id,
                heterozygous_het: hiddenHetMorph ? hiddenHetMorph.id : null,
                // 基因特徵強度因子 (影響長大後是否長出白點或特殊斑紋)
                trait_potency: 0.5 + ((seed % 50) / 100) // 介於 0.5 ~ 1.0 之間
            },
            phenotype: {
                current_morph_id: primaryMorph.id,
                display_name_zh: primaryMorph.name_zh,
                color_tint: primaryMorph.color_tint,
                blotch_tint: primaryMorph.blotch_tint,
                // 初始外觀特徵標記
                has_speckles: false, // 成長後才有機會長出白點
                special_markings: []
            },
            // 基因檢測解鎖狀態
            science_insights: {
                is_genotype_scanned: false, // 需透過基因檢測設備解鎖
                observed_traits: []
            }
        };
    },

    /**
     * 模擬基因檢測設備掃描後的資料解鎖
     */
    scanGenetics: function(creatureInstance) {
        if (creatureInstance && creatureInstance.genetics) {
            creatureInstance.genetics.science_insights.is_genotype_scanned = true;
            return creatureInstance.genetics;
        }
        return null;
    }
};