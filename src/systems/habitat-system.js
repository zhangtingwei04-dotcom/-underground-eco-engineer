// 地下生態工程師 - 棲息地與休息區建設系統 (Habitat System)

window.GameHabitatSystem = {
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
 * 《鱗片與種子：地下生態物語》 - 野外生態放歸系統 (habitat-release-system.js)
 * 負責判定區域是否符合生物習性，不給提示，以自然台詞反饋生態邏輯
 */

export class HabitatReleaseSystem {
    // 地下區域的生態屬性定義
    static WILD_REGIONS = {
        'dry_gravel_tunnel': {
            name: '乾爽沙礫隧道',
            has_deep_sand: true,
            has_vertical_branches: false,
            humidity: 'low'
        },
        'mossy_canopy_oasis': {
            name: '蕨類樹冠綠洲',
            has_deep_sand: false,
            has_vertical_branches: true,
            humidity: 'medium_high'
        },
        'damp_crystal_cave': {
            name: '潮濕水晶溶洞',
            has_deep_sand: false,
            has_tight_crevices: true,
            humidity: 'high'
        }
    };

    /**
     * 嘗試在指定區域放生生物
     */
    static attemptRelease(creature, regionId) {
        const region = this.WILD_REGIONS[regionId];
        const speciesId = creature.speciesId;

        // 判定 1: 玉米蛇需要攀爬枝條
        if (speciesId === 'corn_snake' && !region.has_vertical_branches) {
            return {
                success: false,
                dialogue: '這附近的岩壁光禿禿的，完全沒有可以攀爬的樹枝與樹皮結構……小傢伙留在這裡會過得很辛苦的。'
            };
        }

        // 判定 2: 豬鼻蛇需要深層底材與適合挖洞的環境
        if (speciesId === 'hognose_snake' && !region.has_deep_sand) {
            return {
                success: false,
                dialogue: '這裏的地面都是硬邦邦的岩石與濕黏泥土，牠的鼻子沒辦法在這種地方順利挖洞棲息……我們再找找看別的地方吧。'
            };
        }

        // 驗證成功
        return {
            success: true,
            dialogue: `這裡的環境太適合牠了！看著牠順利爬入${region.name}的深處，希望牠在新的天地裡自由生活。`
        };
    }
}

window.HabitatReleaseSystem = HabitatReleaseSystem;
    /**
     * 套用休息區對生物的加成效果（例如加速精力恢復或減壓）
     */
    applyRestAreaEffect: function(creature) {
        if (!window.gameEngineState.habitat || window.gameEngineState.habitat.rest_area_count <= 0) return;
        if (!creature || !creature.base_stats) return;

        const stats = creature.base_stats;
        const count = window.gameEngineState.habitat.rest_area_count;

        // 每個休息區額外提供精力恢復與降壓效果
        if (stats.current_energy < stats.max_energy) {
            stats.current_energy = Math.min(stats.max_energy, stats.current_energy + (2 * count));
        }
        if (stats.current_stress && stats.current_stress > 0) {
            stats.current_stress = Math.max(0, stats.current_stress - (1 * count));
        }
    }
};