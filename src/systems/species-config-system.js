/**
 * 物種行為設定登錄表。
 * 同步 API 供 CreatureBehaviorSystem 使用；資料結構對應 src/data/species/*.json。
 * 新增物種時請同步更新該 JSON 並以 registerSpeciesConfig 登錄，
 * 或後續在正式初始化流程完成時由 JSON 載入器集中登錄。
 */
export class SpeciesConfigSystem {
    static configs = new Map([
        ['corn_snake', {
            id: 'corn_snake',
            name: { 'zh-TW': '玉米蛇', en: 'Corn Snake' },
            behavior_traits: ['climbing', 'exploration', 'hiding', 'crepuscular_activity'],
            habitat_preferences: {
                vertical_space: true, climbing_structures: true, multiple_hiding_places: true
            },
            metabolism: { satiety_decay_rate: 0.7, hydration_decay_rate: 0.5 },
            journal_events: ['climbing_branch', 'resting_on_high_perch', 'evening_exploration']
        }],
        ['hognose_snake', {
            id: 'hognose_snake',
            name: { 'zh-TW': '西部豬鼻蛇', en: 'Western Hognose Snake' },
            behavior_traits: ['burrowing', 'hiding', 'defensive_playing_dead'],
            habitat_preferences: {
                vertical_space: false, deep_substrate: true, hiding_places: true
            },
            metabolism: { satiety_decay_rate: 0.8, hydration_decay_rate: 0.6 }
        }]
    ]);

    static getSpeciesConfig(speciesId) {
        if (typeof speciesId !== 'string' || !speciesId.trim()) return null;
        const config = this.configs.get(speciesId.trim());
        if (!config) return null;
        return {
            ...config,
            name: { ...config.name },
            behavior_traits: [...config.behavior_traits],
            habitat_preferences: { ...config.habitat_preferences },
            metabolism: { ...config.metabolism },
            journal_events: [...(config.journal_events || [])]
        };
    }

    static registerSpeciesConfig(config) {
        if (!config || typeof config.id !== 'string' || !config.id.trim() ||
            !Array.isArray(config.behavior_traits) || !config.behavior_traits.every(x => typeof x === 'string')) {
            throw new TypeError('[SpeciesConfigSystem] 物種需要有效 id 與行為陣列。');
        }
        this.configs.set(config.id.trim(), {
            ...config,
            behavior_traits: [...config.behavior_traits],
            name: { ...(config.name || {}) },
            habitat_preferences: { ...(config.habitat_preferences || {}) },
            metabolism: { ...(config.metabolism || {}) },
            journal_events: [...(config.journal_events || [])]
        });
        return this.getSpeciesConfig(config.id);
    }
}
