/**
 * 《鱗片與種子：地下生態物語》 - 物種配置讀取與解析系統 (species-config-system.js)
 * 負責動態載入與解析不同爬蟲物種的設定、行為傾向、棲息需求與代謝參數
 */

export class SpeciesConfigSystem {
    // 內建物種配置資料庫（可與 JSON 檔案相互對應）
    static SPECIES_DATABASE = {
        'hognose_snake': {
            id: 'hognose_snake',
            name: {
                'zh-TW': '西部豬鼻蛇',
                'en': 'Western Hognose Snake'
            },
            behavior_traits: [
                'burrowing',
                'hiding',
                'defensive_playing_dead'
            ],
            habitat_preferences: {
                vertical_space: false,
                deep_substrate: true,
                hiding_places: true
            },
            metabolism: {
                satiety_decay_rate: 0.8,
                hydration_decay_rate: 0.6
            }
        },
        'corn_snake': {
            id: 'corn_snake',
            name: {
                'zh-TW': '玉米蛇',
                'en': 'Corn Snake'
            },
            behavior_traits: [
                'climbing',
                'exploration',
                'hiding',
                'crepuscular_activity'
            ],
            habitat_preferences: {
                vertical_space: true,
                climbing_structures: true,
                multiple_hiding_places: true
            },
            metabolism: {
                satiety_decay_rate: 0.7,
                hydration_decay_rate: 0.5
            },
            journal_events: [
                'climbing_branch',
                'resting_on_high_perch',
                'evening_exploration'
            ]
        }
    };

    /**
     * 取得指定物種的完整配置資料
     * @param {string} speciesId 物種代號 (例如 'hognose_snake', 'corn_snake')
     * @returns {Object|null} 物種配置物件
     */
    static getSpeciesConfig(speciesId) {
        const config = this.SPECIES_DATABASE[speciesId];
        if (!config) {
            console.warn(`【物種系統】找不到代號為 [${speciesId}] 的物種配置！`);
            return null;
        }
        return config;
    }

    /**
     * 檢查該物種是否具備特定行為傾向（例如是否會攀爬、是否喜歡挖地）
     * @param {string} speciesId 物種代號
     * @param {string} trait 行為特徵名稱
     * @returns {boolean}
     */
    static hasBehaviorTrait(speciesId, trait) {
        const config = this.getSpeciesConfig(speciesId);
        return config ? config.behavior_traits.includes(trait) : false;
    }

    /**
     * 取得物種的棲息環境需求（例如是否需要垂直空間、攀爬結構等）
     * @param {string} speciesId 物種代號
     * @returns {Object} 棲息環境偏好設定
     */
    static getHabitatPreferences(speciesId) {
        const config = this.getSpeciesConfig(speciesId);
        return config ? config.habitat_preferences : {};
    }

    /**
     * 取得所有已註冊的物種清單（便於未來 NPC 貿易或圖鑑解鎖使用）
     * @returns {Array} 物種設定陣列
     */
    static getAllSpeciesList() {
        return Object.values(this.SPECIES_DATABASE);
    }
}

window.SpeciesConfigSystem = SpeciesConfigSystem;