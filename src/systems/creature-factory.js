/**
 * 《鱗片與種子：地下生態物語》
 * 寵物個體建立工廠 (creature-factory.js)
 *
 * 負責依照物種設定建立寵物個體。
 * 不負責決定玩家的初始物種，也不負責存檔。
 */

import { SpeciesConfigSystem } from './species-config-system.js';

export class CreatureFactory {

    /**
     * 建立寵物個體
     * @param {Object} options 寵物建立設定
     * @returns {Object} 寵物個體資料
     */
    static create(options = {}) {

        const {
            speciesId,
            nickname = '未命名',
            age = 0,
            growthStage = 'juvenile',
            initialStatus = {},
            genetics = {},
            stats = {}
        } = options;

        // 1. 檢查物種是否存在
        if (!speciesId) {
            throw new Error('建立寵物失敗：缺少物種 ID。');
        }

        const speciesConfig =
            SpeciesConfigSystem.getSpeciesConfig(speciesId);

        if (!speciesConfig) {
            throw new Error(
                `建立寵物失敗：找不到物種 [${speciesId}]。`
            );
        }

        // 2. 產生唯一個體 ID
        const creatureId = globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : `creature_${Date.now()}_${Math.random()
                .toString(36).slice(2, 10)}`;

        // 3. 建立寵物資料
        const creature = {
            id: creatureId,

            // speciesId 為標準物種識別欄位
            speciesId,

            // 暫時保留 species，兼容舊系統
            species: speciesId,

            nickname,
            age,
            growthStage,

            health: 100,
            hunger: 100,
            hydration: 100,
            stress: 0,

            isShedding: false,

            genetics: { ...genetics },
            stats: { ...stats },

            ...initialStatus
        };

        // 4. 回傳建立完成的個體
        return creature;
    }

}

window.CreatureFactory = CreatureFactory;