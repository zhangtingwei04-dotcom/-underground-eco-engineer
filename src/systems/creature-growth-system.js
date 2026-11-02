// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：成長階段與外觀動態演化系統 (Creature Growth System)

window.CreatureGrowthSystem = {
    // 生命階段定義
    STAGES: {
        JUVENILE: { id: "juvenile", name_zh: "幼體期", age_required: 0 },
        SUBADULT: { id: "subadult", name_zh: "亞成體", age_required: 5 },
        ADULT: { id: "adult", name_zh: "成年期", age_required: 15 },
        SENIOR: { id: "senior", name_zh: "老年期", age_required: 30 }
    },

    /**
     * 更新個體的年齡與成長狀態
     */
    progressAge: function(creatureInstance, daysPassed = 1) {
        if (!creatureInstance.life) {
            creatureInstance.life = { age: 0, life_stage: "juvenile" };
        }

        creatureInstance.life.age += daysPassed;
        const currentAge = creatureInstance.life.age;

        // 根據年齡自動切換生命階段
        let newStage = "juvenile";
        if (currentAge >= this.STAGES.SENIOR.age_required) {
            newStage = "senior";
        } else if (currentAge >= this.STAGES.ADULT.age_required) {
            newStage = "adult";
        } else if (currentAge >= this.STAGES.SUBADULT.age_required) {
            newStage = "subadult";
        }

        const oldStage = creatureInstance.life.life_stage;
        creatureInstance.life.life_stage = newStage;

        // 如果跨越到亞成體或成年期，觸發基因潛能顯現（例如長出白點或特殊斑紋）
        if (oldStage !== newStage) {
            this.triggerMorphEvolution(creatureInstance);
        }

        return {
            stageChanged: oldStage !== newStage,
            currentStage: newStage,
            age: currentAge
        };
    },

    /**
     * 脫皮事件觸發：脫皮後有機會讓隱性特徵或白點更加顯現
     */
    triggerEcdysisEvent: function(creatureInstance) {
        // 模擬脫皮成功後的視覺更新
        const genetics = creatureInstance.genetics;
        if (genetics && genetics.genotype.trait_potency > 0.7) {
            creatureInstance.phenotype.has_speckles = true;
            if (!creatureInstance.phenotype.special_markings.includes("post_shed_speckles")) {
                creatureInstance.phenotype.special_markings.push("post_shed_speckles");
            }
        }
        return {
            shedSuccess: true,
            message_zh: "寵物順利完成蛻皮，外觀色彩變得更加鮮明俐落！"
        };
    },

    /**
     * 內部方法：依據基因潛能與成長，解鎖隱藏的外觀特徵（如白點）
     */
    triggerMorphEvolution: function(creatureInstance) {
        const genetics = creatureInstance.genetics;
        if (!genetics) return;

        // 基因潛能較高的個體，在成長後開始顯現特徵
        if (genetics.genotype.trait_potency >= 0.6) {
            creatureInstance.phenotype.has_speckles = true;
            creatureInstance.phenotype.special_markings.push("growth_mutation_spots");
        }
    }
};