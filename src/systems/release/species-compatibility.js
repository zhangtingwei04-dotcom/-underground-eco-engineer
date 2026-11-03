import releaseProfiles from '../../data/release-profiles.json' assert { type: 'json' };

export class SpeciesCompatibility {
    static checkCompatibility(creature, targetRegion) {
        const profile = releaseProfiles[creature.speciesId];
        if (!profile) return { compatible: false, reason: '未知物種，無法進行野生評估。' };

        // 檢查原生分布區域是否吻合
        if (profile.native_region !== targetRegion.region_type) {
            return {
                compatible: false,
                reason: `這裡並非該物種的原生分布範圍（${profile.name}不應在此生態圈野外出現），貿然放歸會破壞當地生態平衡。`
            };
        }

        return { compatible: true, profile };
    }
}