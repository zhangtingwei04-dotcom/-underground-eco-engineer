// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生物外觀與基因生成系統 (Creature Morph & Texture System - Phase 1)

window.CreatureMorphSystem = {
    /**
     * 1. 根據生物種類設定與隨機種子，生成具備獨立基因與外觀參數的個體資料 (C 方案)
     */
    generateIndividual: function(speciesData, forcedSeed = null) {
        const seed = forcedSeed || Math.floor(Math.random() * 899999 + 100000);
        return this.generateFromSeed(speciesData, seed);
    },

    /**
     * 根據固定 Seed 重建外觀資料，確保存檔讀取時外觀完全一致
     */
    generateFromSeed: function(speciesData, seed) {
        const morphs = (speciesData && speciesData.morphs) ? speciesData.morphs : [];
        
        // 簡單偽隨機因子選定品系 (確保同 Seed 結果相同)
        const morphIndex = seed % (morphs.length || 1);
        const selectedMorph = morphs[morphIndex] || {
            id: "wild_type",
            color_tint: "#B88A61",
            blotch_tint: "#5C381E",
            pattern_style: "standard_blotches"
        };

        const category = (speciesData && speciesData.category) ? speciesData.category : "snake";

        return {
            creature_id: (speciesData ? speciesData.id : "creature") + "_" + seed,
            identity: {
                name: (speciesData ? speciesData.species_name_zh : "未知生物") + " (個體 #" + seed + ")",
                personality: "curious",
                profession: "explorer"
            },
            appearance: {
                base_color: selectedMorph.color_tint || "#B88A61",
                blotch_color: selectedMorph.blotch_tint || "#5C381E",
                pattern_style: selectedMorph.pattern_style || "blotched",
                pattern_density: 0.65,
                pattern_contrast: 0.8,
                // 物種專屬質感預設：蛇類細鱗、蜥蜴粗糙、青蛙濕潤、甲蟲硬殼、鼠類絨毛
                scale_texture: category === "snake" ? "fine" : (category === "lizard" ? "rough" : "smooth"),
                grain_texture: "pencil_noise",
                pixel_style: "soft_pixel"
            },
            generation: {
                seed: seed,
                morph_id: selectedMorph.id,
                randomized: true
            }
        };
    },

    /**
     * 2. 三層式生物繪製與渲染接口 (Creature Renderer Interface)
     * 第一層：身體形狀與底色 (Base Shape & Tint)
     * 第二層：基因花紋與遮罩 (Pattern & Mask