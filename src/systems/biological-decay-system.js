// 鱗片與種子：地下生態物語 | 豬鼻蛇生理衰減與離線進度計算
// Scales & Seeds: Underground Ecosystem Tales - Biological Decay System

export class BiologicalDecaySystem {
    constructor() {
        // 基礎衰減速率定義（單位：每小時衰減點數，總分以 100 為上限）
        this.DECAY_RATES = {
            // 飽足感 (Hunger / Satiety)
            // 成蛇可維持 7~10 天不進食；幼蛇 3~5 天
            satiety: {
                hatchling: 1.2, // 幼蛇：約 3.5 天 (83小時) 從 100 降至 0
                juvenile: 0.8,  // 亞成蛇：約 5.2 天 (125小時)
                adult: 0.5      // 成蛇：約 8.3 天 (200小時)
            },
            // 水分 (Hydration)
            // 隨時間與環境濕度蒸發，水盆有水時會自動補充
            hydration: 0.6,    // 無水狀態下約 7 天降至 0

            // 乾淨度 (Cleanliness)
            // 隨時間自然累積排泄物與舊皮屑
            wasteAccumulation: 0.4, // 每小時增加 0.4 髒汙度，約 10 天達到 100% 臨界值

            // 壓力值 (Stress)
            // 受到環境溫度不適、髒汙高、頻繁騷擾影響
            baseStressRecovery: 0.5 // 環境舒適時，每小時自動恢復/降低 0.5 壓力
        };
    }

    /**
     * 計算離線或時間流逝後的豬鼻蛇生理狀態更新
     * @param {Object} hognose 豬鼻蛇實體資料
     * @param {Object} terrarium 生態箱環境資料
     * @param {number} elapsedHours 流逝的小時數
     */
    processDecay(hognose, terrarium, elapsedHours) {
        // 1. 取得體型階段對應的進食代謝率
        const stage = hognose.growthStage || "juvenile"; // hatchling | juvenile | adult
        const satietyDecayRate = this.DECAY_RATES.satiety[stage] || 0.8;

        // 2. 飽足感衰減
        hognose.satiety = Math.max(0, hognose.satiety - (satietyDecayRate * elapsedHours));

        // 3. 水分衰減與水盆自動補充邏輯
        if (terrarium.hasWaterDish && terrarium.waterLevel > 0) {
            // 水盆有水：豬鼻蛇自動喝水維持 100% 水分，但消耗水盆存量
            const waterConsumed = elapsedHours * 1.5; // 每小時蒸發與飲用量
            terrarium.waterLevel = Math.max(0, terrarium.waterLevel - waterConsumed);
            hognose.hydration = 100;
        } else {
            // 無水狀態：水分開始下降
            hognose.hydration = Math.max(0, hognose.hydration - (this.DECAY_RATES.hydration * elapsedHours));
        }

        // 4. 生態箱髒汙累積
        terrarium.wasteLevel = Math.min(100, (terrarium.wasteLevel || 0) + (this.DECAY_RATES.wasteAccumulation * elapsedHours));

        // 5. 綜合環境算算壓力值 (Stress Calculation)
        let stressDelta = 0;

        // 溫度不適 penalty (最適溫度範圍 26°C ~ 30°C)
        if (terrarium.temperature < 24 || terrarium.temperature > 32) {
            stressDelta += 0.8 * elapsedHours;
        }
        // 髒汙過高 penalty
        if (terrarium.wasteLevel > 70) {
            stressDelta += 0.5 * elapsedHours;
        }
        // 水分過低 penalty
        if (hognose.hydration < 30) {
            stressDelta += 0.6 * elapsedHours;
        }

        // 若環境良好，壓力值自然下降
        if (stressDelta === 0) {
            hognose.stress = Math.max(0, hognose.stress - (this.DECAY_RATES.baseStressRecovery * elapsedHours));
        } else {
            hognose.stress = Math.min(100, hognose.stress + stressDelta);
        }

        // 6. 狀態判定與警告觸發 (Status Evaluation)
        hognose.statusEffects = this.evaluateStatusEffects(hognose, terrarium);

        return {
            hognose,
            terrarium,
            summary: {
                elapsedHours: elapsedHours.toFixed(1),
                satietyLeft: hognose.satiety.toFixed(1),
                hydrationLeft: hognose.hydration.toFixed(1),
                stressLevel: hognose.stress.toFixed(1),
                activeStatus: hognose.statusEffects
            }
        };
    }

    /**
     * 判定是否觸發異常狀態 (如拒食、擬死發怒、脫皮困難)
     */
    evaluateStatusEffects(hognose, terrarium) {
        const effects = [];

        // 飽足感過低或壓力過高 ➔ 觸發【拒食 (Refusing Food)】
        if (hognose.satiety < 20 || hognose.stress > 60) {
            effects.push({
                id: "refusing_food",
                name_zh: "拒食狀態",
                description: "小傢伙因為太餓或環境壓力大而情緒緊張，暫時不願意吃東西。"
            });
        }

        // 壓力大於 80 ➔ 觸發豬鼻蛇招牌【裝死/假死 (Playing Dead)】或【防禦膨頸】
        if (hognose.stress >= 80) {
            effects.push({
                id: "playing_dead",
                name_zh: "戲劇性裝死",
                description: "受驚過度！翻過身來肚子朝上吐舌頭裝死，需要保持安靜讓牠休息。"
            });
        }

        // 濕度低於 40% 且處於脫皮期 ➔ 觸發【脫皮不順 (Stuck Shed)】
        if (hognose.isShedding && terrarium.humidity < 40) {
            effects.push({
                id: "stuck_shed",
                name_zh: "脫皮卡皮",
                description: "環境太乾燥導致舊皮無法順利撕落，需要艾米或老馬克的特別保養劑處理。"
            });
        }

        return effects;
    }
}

window.BiologicalDecaySystem = BiologicalDecaySystem;