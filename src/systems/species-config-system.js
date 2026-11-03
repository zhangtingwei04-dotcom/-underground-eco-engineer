/**
 * 《鱗片與種子：地下生態物語》
 * 物種配置讀取與解析系統 (species-config-system.js)
 *
 * 負責管理爬蟲物種的設定、行為傾向、
 * 棲息需求、代謝參數與觀察日誌。
 */

export class SpeciesConfigSystem {

    // 內建物種配置資料庫
    static SPECIES_DATABASE = {

        // 西部豬鼻蛇
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

        // 玉米蛇
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
        },

        // 球蟒
        'ball_python': {
            id: 'ball_python',
            name: {
                'zh-TW': '球蟒',
                'en': 'Ball Python'
            },
            behavior_traits: [
                'coiling_ball',
                'deep_hiding',
                'night_patrol'
            ],
            habitat_preferences: {
                vertical_space: false,
                tight_hiding_places: true,
                higher_humidity: true
            },
            metabolism: {
                satiety_decay_rate: 0.35,
                hydration_decay_rate: 0.5
            }
        },

        // 加州王蛇
        'king_snake': {
            id: 'king_snake',
            name: {
                'zh-TW': '加州王蛇',
                'en': 'California King Snake'
            },
            behavior_traits: [
                'active_exploration',
                'boundary_patrol',
                'burrowing'
            ],
            habitat_preferences: {
                vertical_space: false,
                spacious_ground: true,
                sturdy_decor: true
            },
            metabolism: {
                satiety_decay_rate: 0.75,
                hydration_decay_rate: 0.6
            }
        },

        // 納爾遜奶蛇
        'milk_snake': {
            id: 'milk_snake',
            name: {
                'zh-TW': '納爾遜奶蛇',
                'en': "Nelson's Milk Snake"
            },
            behavior_traits: [
                'crevice_hiding',
                'leaf_litter_burrowing',
                'crepuscular_activity'
            ],
            habitat_preferences: {
                vertical_space: false,
                leaf_litter_coverage: true,
                multiple_hiding_places: true
            },
            metabolism: {
                satiety_decay_rate: 0.65,
                hydration_decay_rate: 0.55
            }
        }

    };

    /**
     * 取得指定物種的完整配置資料
     */
    static getSpeciesConfig(speciesId) {
        const config = this.SPECIES_DATABASE[speciesId];

        if (!config) {
            console.warn(
                `【物種系統】找不到代號為 [${speciesId}] 的物種配置！`
            );
            return null;
        }

        return config;
    }

    /**
     * 檢查物種是否具備特定行為傾向
     */
    static hasBehaviorTrait(speciesId, trait) {
        const config = this.getSpeciesConfig(speciesId);

        return config
            ? config.behavior_traits.includes(trait)
            : false;
    }

    /**
     * 取得物種的棲息環境需求
     */
    static getHabitatPreferences(speciesId) {
        const config = this.getSpeciesConfig(speciesId);

        return config
            ? config.habitat_preferences
            : {};
    }

    /**
     * 取得所有已註冊的物種清單
     */
    static getAllSpeciesList() {
        return Object.values(this.SPECIES_DATABASE);
    }

}

window.SpeciesConfigSystem = SpeciesConfigSystem;