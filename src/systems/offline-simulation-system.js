/**
 * 《鱗片與種子：地下生態物語》 - 離線生態模擬與生物衰減系統
 * 負責在玩家重新登入時，根據離線時間差計算生態箱與生物的狀態變化
 */

export class OfflineSimulationSystem {
    /**
     * 執行離線生態結算
     * @param {Object} saveJson 完整的遊戲存檔資料物件
     * @param {string} survivalMode 'cozy' 或 'challenge'
     * @param {string} updatedAtISO 存檔最後更新的時間字串 (ISO 8601)
     * @returns {Object} { updatedSaveJson, offlineReport }
     */
    static simulateOfflineProgress(saveJson, survivalMode, updatedAtISO) {
        if (!updatedAtISO) {
            return { updatedSaveJson: saveJson, offlineReport: null };
        }

        const lastTime = new Date(updatedAtISO).getTime();
        const currentTime = Date.now();
        const diffMs = currentTime - lastTime;

        // 若離線時間小於 1 分鐘，不作額外結算
        if (diffMs < 60 * 1000) {
            return { updatedSaveJson: saveJson, offlineReport: null };
        }

        const diffHours = diffMs / (1000 * 60 * 60);
        console.log(`【離線模擬】玩家離線時間: ${diffHours.toFixed(2)} 小時 (模式: ${survivalMode})`);

        // 初始化存檔內的生態數據結構（若無則給予預設值）
        saveJson.terrariums = saveJson.terrariums || [];
        saveJson.creatures = saveJson.creatures || [];

        let reportEvents = [];

        // 針對每個生態箱進行離線環境與資源計算
        saveJson.terrariums.forEach((terrarium, index) => {
            const result = this._processTerrariumOffline(terrarium, diffHours, survivalMode);
            if (result.message) {
                reportEvents.push(`生態箱 #${index + 1}: ${result.message}`);
            }
        });

        // 針對生物（如豬鼻蛇）進行離線生理衰減計算
        saveJson.creatures.forEach((creature) => {
            const result = this._processCreatureOffline(creature, diffHours, survivalMode);
            if (result.message) {
                reportEvents.push(`寵物 [${creature.name || '未命名小蛇'}]: ${result.message}`);
            }
        });

        // 更新存檔的時間戳
        saveJson.last_simulated_at = new Date().toISOString();

        const offlineReport = {
            offlineHours: diffHours,
            events: reportEvents,
            mode: survivalMode
        };

        return { updatedSaveJson: saveJson, offlineReport };
    }

    /**
     * 處理單一生態箱的離線數值變化
     */
    static _processTerrariumOffline(terrarium, hours, survivalMode) {
        // 確保數值欄位存在
        terrarium.humidity = terrarium.humidity ?? 50;
        terrarium.temperature = terrarium.temperature ?? 26;

        let message = null;

        if (survivalMode === 'challenge') {
            // Challenge 模式：離線期間環境會向基準值或極端值漂移（簡化模擬：水分隨時間蒸發）
            const moistureLoss = Math.min(hours * 1.5, 30); // 最多蒸發 30%
            terrarium.humidity = Math.max(0, terrarium.humidity - moistureLoss);

            if (terrarium.humidity < 20) {
                message = `濕度降至危險水平 (${terrarium.humidity.toFixed(1)}%)，植物生長受阻！`;
            }
        } else {
            // Cozy 模式：環境自動調節，溫和微調
            message = '微氣候在自動調節系統維持下保持穩定。';
        }

        return { terrarium, message };
    }

    /**
     * 處理單一寵物的離線生理變化（飢餓、口渴、健康）
     */
    static _processCreatureOffline(creature, hours, survivalMode) {
        creature.hunger = creature.hunger ?? 80;
        creature.thirst = creature.thirst ?? 80;
        creature.health = creature.health ?? 100;

        // 限制最大計算時數（例如最多結算 48 小時，避免長期不上線導致直接死亡）
        const effectiveHours = Math.min(hours, 48);

        let message = null;

        if (survivalMode === 'challenge') {
            // 每小時消耗飢餓與口渴
            const hungerLoss = effectiveHours * 2.5;
            const thirstLoss = effectiveHours * 3.0;

            creature.hunger = Math.max(0, creature.hunger - hungerLoss);
            creature.thirst = Math.max(0, creature.thirst - thirstLoss);

            // 若水份或飢餓歸零，扣減健康值
            if (creature.hunger === 0 || creature.thirst === 0) {
                const healthLoss = effectiveHours * 1.0;
                creature.health = Math.max(0, creature.health - healthLoss);
                message = `因長時間缺乏食物或水，健康狀況下降至 ${creature.health.toFixed(1)}%！`;
            } else {
                message = `度過了安穩的離線期（飢餓度: ${creature.hunger.toFixed(0)}%, 口渴度: ${creature.thirst.toFixed(0)}%）。`;
            }
        } else {
            // Cozy 模式：寵物永不死亡，飢餓和口渴維持在低風險區間
            creature.hunger = Math.max(20, creature.hunger - effectiveHours * 0.5);
            creature.thirst = Math.max(20, creature.thirst - effectiveHours * 0.5);
            message = '在療癒模式下，寵物度過了一個舒適且受到妥善照顧的假期。';
        }

        return { creature, message };
    }
}