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

        HUMIDITY_LOSS_PER_HOUR: 0.5,
        MAX_HUMIDITY_LOSS: 15,

        HUNGER_LOSS_PER_HOUR: 1.0,
        HYDRATION_LOSS_PER_HOUR: 1.5,

        MIN_STATUS_VALUE: 0,
        MAX_STATUS_VALUE: 100,

        HEALTH_LOSS_PER_HOUR: 0.5
    };

    /**
     * 執行離線生態結算
     *
     * 時間判斷優先順序：
     * 1. last_simulated_at
     * 2. updatedAtISO（相容舊版呼叫方式）
     * 3. saveJson.updatedAt（第一次結算使用）
     */
    static simulateOfflineProgress(saveJson, updatedAtISO) {

        if (
            !saveJson ||
            typeof saveJson !== 'object' ||
            Array.isArray(saveJson)
        ) {
            throw new Error('離線模擬失敗：無效的存檔資料');
        }

        // 判斷是否已經有離線結算時間
        const hasSimulationTimestamp =
            saveJson.last_simulated_at !== undefined &&
            saveJson.last_simulated_at !== null &&
            saveJson.last_simulated_at !== '';

        let timestamp;

        if (hasSimulationTimestamp) {

            timestamp = saveJson.last_simulated_at;

        } else {

            timestamp =
                updatedAtISO ??
                saveJson.updatedAt;
        }

        // 沒有任何可用時間資料，不執行離線結算
        if (
            timestamp === undefined ||
            timestamp === null ||
            timestamp === ''
        ) {
            console.warn(
                '[離線模擬] 找不到有效的存檔時間，取消本次結算'
            );

            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        const lastTime = new Date(timestamp).getTime();

        if (!Number.isFinite(lastTime)) {

            console.warn(
                '[離線模擬] 存檔時間格式錯誤，取消本次結算'
            );

            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        const currentTime = Date.now();
        const diffMs = currentTime - lastTime;

        // 防止未來時間或過短時間造成異常結算
        if (
            diffMs <
            this.CONFIG.MIN_OFFLINE_MINUTES * 60 * 1000
        ) {
            return {
                updatedSaveJson: saveJson,
                offlineReport: null
            };
        }

        const diffHours = diffMs / (1000 * 60 * 60);

        if (!Array.isArray(saveJson.terrariums)) {
            saveJson.terrariums = [];
        }

        const reportEvents = [];

        console.log(
            `【離線模擬】玩家離線時間：${diffHours.toFixed(2)} 小時`
        );

        // 1. 生態箱離線結算
        saveJson.terrariums.forEach((terrarium, index) => {

            if (
                !terrarium ||
                typeof terrarium !== 'object'
            ) {
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

        // 2. 收集所有生物
        // 同時兼容舊版 saveJson.creatures
        // 與新版 terrariums[].creatures
        const creatures = this._collectCreatures(saveJson);

        // 3. 生物離線結算
        creatures.forEach((creature) => {

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

        // 4. 記錄本次結算完成時間
        const simulationTime = new Date().toISOString();

        saveJson.last_simulated_at = simulationTime;

        const offlineReport = {
            offlineHours: Number(diffHours.toFixed(2)),
            events: reportEvents,
            simulatedAt: simulationTime
        };

        console.log(
            '【離線模擬】離線結算完成'
        );

        return {
            updatedSaveJson: saveJson,
            offlineReport
        };
    }

    /**
     * 收集存檔中的所有生物
     *
     * 支援：
     * 1. 舊版 saveJson.creatures
     * 2. 新版 saveJson.terrariums[].creatures
     *
     * 使用 Set 避免同一個物件被重複結算。
     */
    static _collectCreatures(saveJson) {

        const creatures = [];
        const seenCreatures = new Set();

        const addCreature = (creature) => {

            if (
                !creature ||
                typeof creature !== 'object' ||
                seenCreatures.has(creature)
            ) {
                return;
            }

            seenCreatures.add(creature);
            creatures.push(creature);
        };

        // 相容舊版頂層生物資料
        if (Array.isArray(saveJson.creatures)) {

            saveJson.creatures.forEach(addCreature);
        }

        // 讀取各生態箱內的生物
        if (Array.isArray(saveJson.terrariums)) {

            saveJson.terrariums.forEach((terrarium) => {

                if (
                    !terrarium ||
                    typeof terrarium !== 'object' ||
                    !Array.isArray(terrarium.creatures)
                ) {
                    return;
                }

                terrarium.creatures.forEach(addCreature);
            });
        }

        return creatures;
    }

    /**
     * 處理單一生態箱的離線環境變化
     *
     * 相容兩種資料結構：
     * 1. terrarium.environment.humidity
     * 2. terrarium.humidity
     */
    static _processTerrariumOffline(terrarium, hours) {

        const environment =
            terrarium.environment &&
            typeof terrarium.environment === 'object' &&
            !Array.isArray(terrarium.environment)
                ? terrarium.environment
                : terrarium;

        environment.humidity = this._normalizeStatus(
            environment.humidity,
            50
        );

        environment.temperature = this._normalizeStatus(
            environment.temperature,
            26
        );

        const effectiveHours = Math.min(
            hours,
            this.CONFIG.MAX_CREATURE_SIMULATION_HOURS
        );

        const humidityLoss = Math.min(
            effectiveHours *
            this.CONFIG.HUMIDITY_LOSS_PER_HOUR,

            this.CONFIG.MAX_HUMIDITY_LOSS
        );

        const previousHumidity = environment.humidity;

        environment.humidity = Math.max(
            0,
            previousHumidity - humidityLoss
        );

        let message = null;

        if (environment.humidity < 20) {

            message =
                `濕度降至危險水平 (${environment.humidity.toFixed(1)}%)，請盡快補充水分！`;

        } else if (humidityLoss > 0) {

            message =
                `濕度由 ${previousHumidity.toFixed(1)}% 降至 ${environment.humidity.toFixed(1)}%。`;
        }

        return {
            terrarium,
            environment,
            message
        };
    }

    /**
     * 處理單一生物的離線生理變化
     *
     * 健康值只會從飢餓或水分歸零的時間點開始下降。
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

        const hungerRate =
            this.CONFIG.HUNGER_LOSS_PER_HOUR;

        const hydrationRate =
            this.CONFIG.HYDRATION_LOSS_PER_HOUR;

        // 計算飢餓值歸零所需時間
        const hoursUntilHungerEmpty =
            previousHunger <= 0
                ? 0
                : previousHunger / hungerRate;

        // 計算水分歸零所需時間
        const hoursUntilHydrationEmpty =
            previousHydration <= 0
                ? 0
                : previousHydration / hydrationRate;

        // 計算飢餓值變化
        const hungerLoss =
            effectiveHours * hungerRate;

        creature.hunger = Math.max(
            0,
            previousHunger - hungerLoss
        );

        // 計算水分變化
        const hydrationLoss =
            effectiveHours * hydrationRate;

        const newHydration = Math.max(
            0,
            previousHydration - hydrationLoss
        );

        creature.hydration = newHydration;

        // 舊存檔有 thirst 欄位時，同步更新
        if (
            Object.prototype.hasOwnProperty.call(
                creature,
                'thirst'
            )
        ) {
            creature.thirst = newHydration;
        }

        // 找出飢餓或缺水最早發生的時間
        const hoursUntilFirstDepletion = Math.min(
            hoursUntilHungerEmpty,
            hoursUntilHydrationEmpty
        );

        // 只有基本需求歸零之後的時間才會造成健康下降
        const hoursWithoutBasicNeeds = Math.max(
            0,
            effectiveHours - hoursUntilFirstDepletion
        );

        const healthLoss =
            hoursWithoutBasicNeeds *
            this.CONFIG.HEALTH_LOSS_PER_HOUR;

        creature.health = Math.max(
            0,
            creature.health - healthLoss
        );

        let message = null;

        if (healthLoss > 0) {

            message =
                `生物曾出現飢餓或缺水狀況，健康值下降至 ${creature.health.toFixed(1)}%。請盡快照顧牠！`;

        } else if (
            creature.hunger <= 0 ||
            creature.hydration <= 0
        ) {

            message =
                '生物的飢餓值或水分已經歸零，請盡快照顧牠！';

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
            message,
            hoursWithoutBasicNeeds,
            healthLoss
        };
    }

    /**
     * 數值正規化
     *
     * 確保數值介於 0 至 100。
     * null、undefined、空字串使用預設值。
     */
    static _normalizeStatus(value, fallback) {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return fallback;
        }

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