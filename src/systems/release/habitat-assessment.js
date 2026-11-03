export class HabitatAssessment {
    static assessHabitat(profile, regionEnvironment) {
        const habitat = profile.habitat_profile;

        if (habitat.needs_vertical_space && !regionEnvironment.has_vertical_structures) {
            return { passed: false, feedback: '該區域缺乏足夠的攀爬結構與高處遮蔽，不符合其立體生活習性。' };
        }

        if (habitat.needs_deep_substrate && !regionEnvironment.has_deep_sand) {
            return { passed: false, feedback: '地面過於堅硬，缺乏適合該物種鑽地與築巢的深層底材。' };
        }

        if (regionEnvironment.humidity < habitat.min_humidity || regionEnvironment.humidity > habitat.max_humidity) {
            return { passed: false, feedback: '此處的環境溫濕度超出該生物健康的生存容許範圍。' };
        }

        return { passed: true, feedback: '棲地環境條件符合物種適應需求。' };
    }
}