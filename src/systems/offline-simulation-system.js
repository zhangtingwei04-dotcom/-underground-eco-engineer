/**
 * 《鱗片與種子：地下生態物語》
 * 離線生態模擬與生物衰減系統
 *
 * 負責玩家重新登入時，
 * 根據離線時間計算生態箱與生物的狀態變化。
 *
 * 本系統採用統一遊戲規則：
 * 不區分 Cozy、Challenge 或其他生存模式。
 */

export class OfflineSimulationSystem {

    /**
     * 離線結算設定
     */
    static CONFIG = {
        MIN_OFFLINE_MINUTES: 1,
        MAX_CREATURE_SIMULATION_HOURS: 48,

        // 生態箱每小時濕度下降幅度
        HUMIDITY_LOSS_PER_HOUR: 0.5,

        // 最多降低 15% 濕度
        MAX_HUMIDITY_LOSS: 15,

        // 生物每小時飢餓值下降幅度
        HUNGER_LOSS_PER_HOUR: 1.0,

        // 生物每小時水分下降幅度
        HYDRATION_LOSS_PER_HOUR: 1.5,

        // 健康值歸零前的最低保護
        MIN_STATUS_VALUE: 0,
        MAX_STATUS_VALUE: 100,

        // 飢餓或水分歸零後，每小時健康下降幅度
        HEALTH_LOSS_PER_HOUR: 0.5
    };

    /**
     * 執行離線生態結算
     *
     * @param {Object} saveJson 完整遊戲存檔資料
     * @param {string} updatedAtISO 存檔最後更新時間
     *
     * @returns {Object}
     * {
     *   updatedSaveJson,
     *   offlineReport
     * }
     */
    static simulateOfflineProgress(saveJson, updatedAtISO) {

        // 驗證存檔
        if (
            !saveJson ||
            typeof saveJson !== 'object' ||
            Array.isArray(saveJson)
        ) {
            throw new Error('離線模擬失敗：無效的存檔資料');
        }

        if (!updatedAtISO) {
            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        // 驗證時間格式
        const lastTime = new Date(updatedAtISO).getTime();

        if (!Number.isFinite(lastTime)) {
            console.warn('[離線模擬] 存檔時間格式錯誤，取消本次結算');

            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        const currentTime = Date.now();
        const diffMs = currentTime - lastTime;

        // 時間異常或離線不足 1 分鐘，不進行結算
        if (
            diffMs < this.CONFIG.MIN_OFFLINE_MINUTES * 60 * 1000
        ) {
            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        const diffHours = diffMs / (1000 * 60 * 60);

        // 初始化資料結構
        if (!Array.isArray(saveJson.terrariums)) {
            saveJson.terrariums = [];
        }

        if (!Array.isArray(saveJson.creatures)) {
            saveJson.creatures = [];
        }

        const reportEvents = [];

        console.log(
            `【離線模擬】玩家離線時間：${diffHours.toFixed(2)} 小時`
        );

        // 生態箱離線結算
        saveJson.terrariums.forEach((terrarium, index) => {

            if (!terrarium || typeof terrarium !== 'object') {
                return;
            }

            const result = this._processTerrariumOffline(
                terrarium,
                diffHours
            );

            if (result.message) {
                reportEvents.push(
                    `生態箱 #${index + 1}：${result.message}`
                );
            }
        });

        // 生物離線結算
        saveJson.creatures.forEach((creature) => {

            if (!creature || typeof creature !== 'object') {
                return;
            }

            const result = this._processCreatureOffline(
                creature,
                diffHours
            );

            if (result.message) {
                reportEvents.push(
                    `寵物 [${creature.nickname || creature.name || '未命名生物'}]：${result.message}`
                );
            }
        });

        // 更新離線結算時間
        const simulationTime = new Date().toISOString();

        saveJson.last_simulated_at = simulationTime;

        const offlineReport = {
            offlineHours: Number(diffHours.toFixed(2)),
            events: reportEvents,
            simulatedAt: simulationTime
        };

        console.log('【離線模擬】離線結算完成');

        return {
            updatedSaveJson: saveJson,
            offlineReport
        };
    }

    /**
     * 處理單一生態箱的離線環境變化
     *
     * 統一規則：
     * 生態箱濕度會隨時間緩慢下降。
     */
    static _processTerrariumOffline(terrarium, hours) {

        terrarium.humidity = this._normalizeStatus(
            terrarium.humidity,
            50
        );

        terrarium.temperature = this._normalizeStatus(
            terrarium.temperature,
            26
        );

        const effectiveHours = Math.min(
            hours,
            this.CONFIG.MAX_CREATURE_SIMULATION_HOURS
        );

        const humidityLoss = Math.min(
            effectiveHours * this.CONFIG.HUMIDITY_LOSS_PER_HOUR,
            this.CONFIG.MAX_HUMIDITY_LOSS
        );

        const previousHumidity = terrarium.humidity;

        terrarium.humidity = Math.max(
            0,
            previousHumidity - humidityLoss
        );

        let message = null;

        if (terrarium.humidity < 20) {

            message =
                `濕度降至危險水平 (${terrarium.humidity.toFixed(1)}%)，請盡快補充水分！`;

        } else if (humidityLoss > 0) {

            message =
                `濕度由 ${previousHumidity.toFixed(1)}% 降至 ${terrarium.humidity.toFixed(1)}%。`;
        }

        return {
            terrarium,
            message
        };
    }

    /**
     * 處理單一生物的離線生理變化
     *
     * 統一規則：
     * 1. 飢餓值隨時間下降。
     * 2. 水分值隨時間下降。
     * 3. 飢餓或水分歸零時，健康值才會下降。
     * 4. 最多計算 48 小時，避免長期離線造成過度懲罰。
     */
    static _processCreatureOffline(creature, hours) {

        creature.hunger = this._normalizeStatus(
            creature.hunger,
            80
        );

        creature.health = this._normalizeStatus(
            creature.health,
            100
        );

        // 優先使用 hydration，兼容舊存檔 thirst 欄位
        const originalHydration =
            creature.hydration ??
            creature.thirst ??
            80;

        const hydration = this._normalizeStatus(
            originalHydration,
            80
        );

        const effectiveHours = Math.min(
            hours,
            this.CONFIG.MAX_CREATURE_SIMULATION_HOURS
        );

        const previousHunger = creature.hunger;
        const previousHydration = hydration;

        // 飢餓值下降
        const hungerLoss =
            effectiveHours * this.CONFIG.HUNGER_LOSS_PER_HOUR;

        creature.hunger = Math.max(
            0,
            creature.hunger - hungerLoss
        );

        // 水分值下降
        const hydrationLoss =
            effectiveHours * this.CONFIG.HYDRATION_LOSS_PER_HOUR;

        const newHydration = Math.max(
            0,
            hydration - hydrationLoss
        );

        // 寫回正式水分欄位
        creature.hydration = newHydration;

        // 如果舊存檔仍有 thirst 欄位，同步更新
        if (Object.prototype.hasOwnProperty.call(creature, 'thirst')) {
            creature.thirst = newHydration;
        }

        let message = null;

        // 檢查是否因飢餓或缺水而影響健康
        if (
            creature.hunger <= 0 ||
            creature.hydration <= 0
        ) {

            const healthLoss =
                effectiveHours * this.CONFIG.HEALTH_LOSS_PER_HOUR;

            creature.health = Math.max(
                0,
                creature.health - healthLoss
            );

            message =
                `生物出現飢餓或缺水狀況，健康值目前為 ${creature.health.toFixed(1)}%。請盡快照顧牠！`;

        } else if (
            creature.hunger < 30 ||
            creature.hydration < 30
        ) {

            message =
                `生物需要照顧（飢餓值：${creature.hunger.toFixed(1)}%，水分：${creature.hydration.toFixed(1)}%）。`;

        } else if (
            hungerLoss > 0 ||
            hydrationLoss > 0
        ) {

            message =
                `離線期間狀態變化：飢餓值 ${previousHunger.toFixed(1)}% → ${creature.hunger.toFixed(1)}%，水分 ${previousHydration.toFixed(1)}% → ${creature.hydration.toFixed(1)}%。`;
        }

        return {
            creature,
            message
        };
    }

    /**
     * 數值正規化
     * 確保數值介於 0 至 100
     */
    static _normalizeStatus(value, fallback) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(
            this.CONFIG.MAX_STATUS_VALUE,
            Math.max(
                this.CONFIG.MIN_STATUS_VALUE,
                number
            )
        );
    }
}

window.OfflineSimulationSystem = OfflineSimulationSystem;
