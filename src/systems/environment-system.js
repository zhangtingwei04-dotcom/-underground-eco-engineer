// 地下生態工程師 - 地底環境模擬系統 (Environment Simulation System)

window.GameEnvironmentSystem = {
    /**
     * 依據方塊所在的深度（行數 Row），動態計算該區域的基礎溫度與濕度
     * @param {number} row - 方塊所在的列座標 (深度)
     * @param {number} maxRows - 地圖的總列數
     * @returns {Object} 計算出的環境數值 { temperature, humidity }
     */
    calculateBlockEnvironment: function(row, maxRows = 6) {
        // 讀取全域 GameConfig 的基礎設定，若讀不到則啟用安全防底數值
        const config = window.GameConfig ? window.GameConfig.ecoBalance : { baseTemperature: 22.5, baseHumidity: 40 };
        
        // 深度比例 (0.0 代表地表，1.0 代表最深處)
        const depthRatio = row / (maxRows - 1);

        // 溫度演算法：越深越熱。地表 20°C，每深一層加 2.5°C，最深可達 32.5°C
        const temperature = parseFloat((20.0 + (depthRatio * 12.5)).toFixed(1));

        // 濕度演算法：越深越乾燥。地表潮濕 75%，隨深度遞減，最深岩石層降到 25%
        const humidity = parseFloat((75.0 - (depthRatio * 50.0)).toFixed(0));

        return {
            temperature: temperature,
            humidity: humidity
        };
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
                // 計算當前方塊的溫濕度
                const env = this.calculateBlockEnvironment(r, maxRows);
                
                // 將環境數值動態綁定寫入方塊資料中
                mapData[r][c].temperature = env.temperature;
                mapData[r][c].humidity = env.humidity;
                
                // 依據濕度微調方塊描述（例如：乾燥的沙土、潮濕的泥土）
                if (env.humidity < 40) {
                    mapData[r][r] = mapData[r][c].environmentType = "dry";
                } else if (env.humidity > 65) {
                    mapData[r][r] = mapData[r][c].environmentType = "moist";
                } else {
                    mapData[r][r] = mapData[r][c].environmentType = "normal";
                }
            }
        }
        console.log("【環境系統】已成功為全地圖方塊鋪設動態深度溫濕度。");
    },

    /**
     * 檢查生物當前所在方塊的環境，是否符合其偏好，並動態增減其壓力值（Stress）
     * @param {Object} creature - 生物實體數據 (如豬鼻蛇)
     * @param {Object} currentBlock - 生物當前踩著或挖掘的方塊
     */
    updateCreatureComfort: function(creature, currentBlock) {
        if (!creature || !creature.base_stats || !currentBlock) return;

        const stats = creature.base_stats;
        const traits = creature.behavior_traits || {};
        
        // 初始化當前壓力值（邊界安全防禦）
        if (stats.current_stress === undefined) stats.current_stress = 0;
        if (stats.max_stress === undefined) stats.max_stress = 100;

        // 豬鼻蛇偏好乾燥環境 ("preferred_humidity": "dry")
        if (traits.preferred_humidity === "dry") {
            if (currentBlock.humidity > 60) {
                // 如果環境太濕（如淺層），豬鼻蛇壓力每週期 +2
                stats.current_stress = Math.min(stats.max_stress, stats.current_stress + 2);
                console.log(`【環境警告】環境過於潮濕！${creature.id} 的壓力正在上升。目前壓力: ${stats.current_stress}`);
            } else if (currentBlock.humidity < 40) {
                // 如果回到舒適的乾燥環境（如深層沙土），壓力自動恢復 -1
                stats.current_stress = Math.max(0, stats.current_stress - 1);
            }
        }

        // 判定壓力過大觸發特殊行為
        if (stats.current_stress >= 80 && traits.can_play_dead) {
            console.log(`【行為觸發】警告！${creature.id} 壓力過大，觸發「裝死 (Play Dead)」防禦機制！`);
        }
    }
};
