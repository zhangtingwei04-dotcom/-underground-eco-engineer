/**
 * 原生棲地相容性檢查。
 * 保留同步 checkCompatibility API，避免舊式 JSON import assertion
 * 在各瀏覽器版本上無法解析。預載資料對應 src/data/release-profiles.json。
 * 後續正式資料初始化可用 setReleaseProfiles 註冊 JSON 資料。
 */
export class SpeciesCompatibility {
    static releaseProfiles = {
        corn_snake: {
            species_id: 'corn_snake',
            name: '玉米蛇',
            native_region: 'temperate_woodland',
            requires_strict_health: true,
            habitat_profile: {
                needs_vertical_space: true,
                needs_climbing_structures: true,
                min_humidity: 40,
                max_humidity: 70
            }
        },
        hognose_snake: {
            species_id: 'hognose_snake',
            name: '西部豬鼻蛇',
            native_region: 'arid_prairie',
            requires_strict_health: true,
            habitat_profile: {
                needs_deep_substrate: true,
                needs_arid_environment: true,
                min_humidity: 30,
                max_humidity: 50
            }
        }
    };

    static setReleaseProfiles(profiles) {
        if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) {
            throw new TypeError('[SpeciesCompatibility] 物種放歸資料格式錯誤。');
        }
        this.releaseProfiles = { ...profiles };
    }

    static checkCompatibility(creature, targetRegion) {
        if (!creature || !targetRegion || typeof targetRegion !== 'object') {
            return { compatible: false, reason: '缺少生物或目標區域資料。' };
        }
        const profile = this.releaseProfiles[creature.speciesId];
        if (!profile) {
            return { compatible: false, reason: '未知物種，無法進行野生評估。' };
        }
        if (profile.native_region !== targetRegion.region_type) {
            return {
                compatible: false,
                reason: `這裡並非該物種的原生分布範圍（${profile.name}不應在此生態圈野外出現），貿然放歸會破壞當地生態平衡。`
            };
        }
        return { compatible: true, profile: { ...profile, habitat_profile: { ...profile.habitat_profile } } };
    }
}
