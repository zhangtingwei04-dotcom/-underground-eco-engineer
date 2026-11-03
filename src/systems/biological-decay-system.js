// 鱗片與種子：地下生態物語 | 豬鼻蛇生理衰減與髒汙連鎖系統
// Scales & Seeds: Underground Ecosystem Tales - Biological Decay & Waste System

export class BiologicalDecaySystem {
    constructor() {
        // 基礎衰減速率定義（單位：每小時衰減點數）
        this.DECAY_RATES = {
            satiety: {
                hatchling: 1.2, // 幼蛇代謝快
                juvenile: 0.8,  // 亞成蛇
                adult: 0.5      // 成蛇耐餓
            },
            hydration: 0.6,     // 水分蒸發率
            wasteAccumulation: 0.4, // 髒汙增加率
            baseStressRecovery: 0.5 // 環境舒適時的壓力恢復率
        };
    }

    /**
     * 計算離線或時間流逝後的豬鼻蛇生理與生態箱狀態更新
     * @param {Object} hognose 豬鼻蛇實體資料
     * @param {Object} terrarium 生態箱環境資料 (包含 hasWaterDish, hasCustomVentilation, wasteLevel 等)
     * @param {number} elapsedHours 流逝的小時數
     */
    processDecay(hognose, terrarium, elapsedHours) {
        const stage = hognose.growthStage || "juvenile";
        const satietyDecayRate = this.DECAY_RATES.satiety[stage] || 0.8;

        // 1. 飽足感衰減
        hognose.satiety = Math.max(0, hognose.satiety - (satietyDecayRate * elapsedHours));

        // 2. 水分衰減與水盆自動補充
        if (terrarium.hasWaterDish && terrarium.waterLevel > 0) {
            const waterConsumed = elapsedHours * 1.5;
            terrarium.waterLevel = Math.max(0, terrarium.waterLevel - waterConsumed);
            hognose.hydration = 100;
        } else {
            hognose.hydration = Math.max(0, hognose.hydration - (this.DECAY_RATES.hydration * elapsedHours));
        }

        // 3. 生態箱髒汙累積（若有老莫安裝的「客製化高效通風風扇」，髒汙與異味累積速度減緩 20%）
        const wasteMultiplier = terrarium.hasCustomVentilation ? 0.8 : 1.0;
        terrarium.wasteLevel = Math.min(100, (terrarium.wasteLevel || 0) + (this.DECAY_RATES.wasteAccumulation * wasteMultiplier * elapsedHours));

        // 4. 壓力值動態計算
        let stressDelta = 0;

        // 溫度不適 (最適 26°C ~ 32°C)
        if (terrarium.temperature < 24 || terrarium.temperature > 32) {
            stressDelta += 0.8 * elapsedHours;
        }
        // 髒汙過高引發氨氣與環境壓力
        if (terrarium.wasteLevel > 70) {
            stressDelta += 1.0 * elapsedHours;
        } else if (terrarium.wasteLevel > 40) {
            stressDelta += 0.4 * elapsedHours;
        }
        // 水分過低壓力
        if (hognose.hydration < 30) {
            stressDelta += 0.6 * elapsedHours;
        }

        // 壓力結算
        if (stressDelta === 0) {
            hognose.stress = Math.max(0, hognose.stress - (this.DECAY_RATES.baseStressRecovery * elapsedHours));
        } else {
            hognose.stress = Math.min(100, hognose.stress + stressDelta);
        }

        // 5. 綜合狀態與連鎖異常判定
        hognose.statusEffects = this.evaluateStatusEffects(hognose, terrarium);

        return {
            hognose,
            terrarium,
            summary: {
                elapsedHours: elapsedHours.toFixed(1),
                satietyLeft: hognose.satiety.toFixed(1),
                hydrationLeft: hognose.hydration.toFixed(1),
                wasteLevel: terrarium.wasteLevel.toFixed(1),
                stressLevel: hognose.stress.toFixed(1),
                activeStatus: hognose.statusEffects
            }
        };
    }

    /**
     * 判定是否觸發異常狀態與髒汙連鎖反應
     */
    evaluateStatusEffects(hognose, terrarium) {
        const effects = [];

        // 1. 拒食狀態
        if (hognose.satiety < 20 || hognose.stress > 60) {
            effects.push({
                id: "refusing_food",
                name_zh: "拒食狀態",
                description: "小傢伙因為飢餓或環境壓力大而情緒緊繃，暫時不願意進食。"
            });
        }

        // 2. 戲劇性裝死
        if (hognose.stress >= 80) {
            effects.push({
                id: "playing_dead",
                name_zh: "戲劇性裝死",
                description: "受驚過度！翻過身來肚子朝上吐舌頭裝死，需要保持安靜讓牠休息。"
            });
        }

        // 3. 脫皮卡皮
        if (hognose.isShedding && terrarium.humidity < 40) {
            effects.push({
                id: "stuck_shed",
                name_zh: "脫皮卡皮",
                description: "環境太乾燥導致舊皮無法順利撕落，需要保養劑協助。"
            });
        }

        // --- 4. 髒汙連鎖異常狀態 ---

        // 拒絕鑽地：髒汙累積達到 100% 滿載
        if (terrarium.wasteLevel >= 100) {
            effects.push({
                id: "burrow_refusal",
                name_zh: "拒絕鑽地",
                description: "底材髒汙已達極限，豬鼻蛇嫌棄環境而完全拒絕鑽入地下，心情極度鬱悶。"
            });
        }

        // 鱗腐病風險：髒汙 > 70% 且箱內濕度偏高 (> 65%)
        if (terrarium.wasteLevel > 70 && terrarium.humidity > 65) {
            effects.push({
                id: "scale_rot_risk",
                name_zh: "鱗腐病初期風險",
                description: "高濕度伴隨高髒汙，腹部鱗片開始受到細菌侵擾，急需全面更換底材與清理！"
            });
        }

        // 寄生蟎蟲危機：髒汙 > 80% 且玩家尚未安裝老莫的客製通風風扇
        if (terrarium.wasteLevel > 80 && !terrarium.hasCustomVentilation) {
            effects.push({
                id: "mites_infestation",
                name_zh: "寄生蟎蟲危機",
                description: "通風不良加上積污，滋生了討厭的微小寄生蟎，正不斷消耗小傢伙的體力！"
            });
        }

        return effects;
    }
}

window.BiologicalDecaySystem = BiologicalDecaySystem;