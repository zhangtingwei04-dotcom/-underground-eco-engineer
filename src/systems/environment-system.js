// 地下生態工程師 - 地底環境模擬系統 (Environment Simulation System)

window.GameEnvironmentSystem = {
    /**
     * 依據方塊所在的深度（行數 Row），動態計算該區域的基礎溫度與濕度
     * @param {number} row - 方塊所在的列座標 (深度)
     * @param {number} maxRows - 地圖的總列數
     * @returns {Object} 計算出的環境數值 { temperature, humidity }
     */
    calculateBlockEnvironment: function(row, maxRows = 6) {
        const config = window.GameConfig ? window.GameConfig.ecoBalance : { baseTemperature: 22.5, baseHumidity: 40 };
        
        // 深度比例 (0.0 代表地表，1.0 代表最深處)
        const depthRatio = row / Math.max(1, maxRows - 1);

        // 溫度演算法：地表 20°C，每深一層遞增，最深可達 32.5°C
        const temperature = parseFloat((20.0 + (depthRatio * 12.5)).toFixed(1));

        // 濕度演算法：地表潮濕 75%，隨深度遞減至 25%
        const humidity = parseFloat((75.0 - (depthRatio * 50.0)).toFixed(0));

        return { temperature: temperature, humidity: humidity };
    },

    /**
     * 對整個生成好的地圖網格進行第一次環境初始化鋪設
     * @param {Array} mapData - 2D 地圖資料矩陣
     */
    initializeMapEnvironment: function(mapData) {
        if (!mapData) return;
        const maxRows = mapData.length;

        for (let r = 0; r < maxRows; r++) {
            for (let c = 0; c < mapData[r].length; c++) {
                const env = this.calculateBlockEnvironment(r, maxRows);
                
                mapData[r][c].temperature = env.temperature;
                mapData[r][c].humidity = env.humidity;
                
                // 修復 Bug：正確寫入 mapData[r][c] 而非原本錯誤的 mapData[r][r]
                if (env.humidity < 40) {
                    mapData[r][c].environmentType = "dry";
                } else if (env.humidity > 65) {
                    mapData[r][c].environmentType = "moist";
                } else {
                    mapData[r][c].environmentType = "normal";
                }
            }
        }
        console.log("【環境系統】已成功為全地圖方塊鋪設動態深度溫濕度。");
    },

    /**
     * 檢查生物當前所在環境並計算壓力值
     */
    updateCreatureComfort: function(creature, currentBlock) {
        if (!creature || !creature.base_stats || !currentBlock) return;

        const stats = creature.base_stats;
        const traits = creature.behavior_traits || {};
        
        if (stats.current_stress === undefined) stats.current_stress = 0;
        if (stats.max_stress === undefined) stats.max_stress = 100;

        // 豬鼻蛇喜好乾燥
        if (traits.preferred_humidity === "dry") {
            if (currentBlock.humidity > 60) {
                stats.current_stress = Math.min(stats.max_stress, stats.current_stress + 2);
            } else if (currentBlock.humidity < 40) {
                stats.current_stress = Math.max(0, stats.current_stress - 1);
            }
        }

        if (stats.current_stress >= 80 && traits.can_play_dead) {
            console.log(`【行為觸發】警告！${creature.id} 壓力過大，觸發「裝死 (Play Dead)」！`);
        }
    }
};