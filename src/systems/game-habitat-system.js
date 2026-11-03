/**
 * 《鱗片與種子：地下生態物語》 - 棲息地與休息區建設系統 (game-habitat-system.js)
 * 負責建造地下休息設施，並套用生物精力恢復與減壓加成
 */

export const GameHabitatSystem = {
    /**
     * 嘗試建造休息區
     * @returns {Object} 建造結果與提示訊息
     */
    buildRestArea: function() {
        if (!window.gameEngineState || !window.gameEngineState.inventory) {
            return { success: false, message: "背包系統尚未初始化" };
        }

        const inv = window.gameEngineState.inventory;
        const costSand = 3;
        const costStone = 1;

        // 檢查背包資源是否充足
        if ((inv.sand_particle || 0) < costSand || (inv.raw_stone || 0) < costStone) {
            return { 
                success: false, 
                message: `資源不足！建造休息區需要 [細沙 x${costSand}] 與 [碎石 x${costStone}]。` 
            };
        }

        // 扣除資源
        inv.sand_particle -= costSand;
        inv.raw_stone -= costStone;

        // 記錄已建造的設施數量
        if (!window.gameEngineState.habitat) {
            window.gameEngineState.habitat = { rest_area_count: 0 };
        }
        window.gameEngineState.habitat.rest_area_count += 1;

        console.log("【棲息地系統】成功建造休息區！當前休息區數量:", window.gameEngineState.habitat.rest_area_count);
        return { 
            success: true, 
            message: `🎉 成功建造地下休息區！消耗 細沙 x${costSand}、碎石 x${costStone}。` 
        };
    },

    /**
     * 套用休息區對生物的加成效果（例如加速精力恢復與減壓）
     * @param {Object} creature 生物實體
     */
    applyRestAreaEffect: function(creature) {
        if (!window.gameEngineState || !window.gameEngineState.habitat) return;
        const count = window.gameEngineState.habitat.rest_area_count || 0;
        if (count <= 0 || !creature || !creature.base_stats) return;

        const stats = creature.base_stats;

        // 每個休息區額外提供精力恢復與降壓效果
        if (stats.current_energy < stats.max_energy) {
            stats.current_energy = Math.min(stats.max_energy, stats.current_energy + (2 * count));
        }
        if (stats.current_stress && stats.current_stress > 0) {
            stats.current_stress = Math.max(0, stats.current_stress - (1 * count));
        }
    }
};

window.GameHabitatSystem = GameHabitatSystem;