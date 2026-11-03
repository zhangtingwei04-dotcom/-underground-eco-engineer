/**
 * 《鱗片與種子：地下生態物語》 - 野外生態放歸系統 (habitat-release-system.js)
 * 負責判定區域是否符合生物習性，不給提示，以自然台詞反饋生態邏輯
 */

export class HabitatReleaseSystem {
    // 地下野外區域生態屬性定義
    static WILD_REGIONS = {
        'dry_gravel_tunnel': {
            name: '乾爽沙礫隧道',
            has_deep_sand: true,
            has_vertical_branches: false,
            has_tight_crevices: false,
            humidity: 'low'
        },
        'mossy_canopy_oasis': {
            name: '蕨類樹冠綠洲',
            has_deep_sand: false,
            has_vertical_branches: true,
            has_tight_crevices: false,
            humidity: 'medium_high'
        },
        'damp_crystal_cave': {
            name: '潮濕水晶溶洞',
            has_deep_sand: false,
            has_vertical_branches: false,
            has_tight_crevices: true,
            humidity: 'high'
        }
    };

    /**
     * 嘗試在指定野外區域放生生物
     * @param {Object} creature 生物實體 (需包含 speciesId)
     * @param {string} regionId 野外區域 ID
     * @returns {Object} 判定結果與角色生態台詞
     */
    static attemptRelease(creature, regionId) {
        const region = this.WILD_REGIONS[regionId];
        if (!region) {
            return { success: false, dialogue: '這裡看起來不是個適合探索的區域……' };
        }

        const speciesId = creature.speciesId;

        // 1. 玉米蛇：需要攀爬枝條
        if (speciesId === 'corn_snake' && !region.has_vertical_branches) {
            return {
                success: false,
                dialogue: '這附近的岩壁光禿禿的，完全沒有可以攀爬的樹枝與樹皮結構……小傢伙留在這裡會過得很辛苦的。'
            };
        }

        // 2. 豬鼻蛇：需要深層底材與挖掘環境
        if (speciesId === 'hognose_snake' && !region.has_deep_sand) {
            return {
                success: false,
                dialogue: '這裏的地面都是硬邦邦的岩石與濕黏泥土，牠的鼻子沒辦法在這種地方順利挖洞棲息……我們再找找看別的地方吧。'
            };
        }

        // 3. 球蟒：偏好高濕度與緊密遮蔽的溶洞隙縫
        if (speciesId === 'ball_python' && (!region.has_tight_crevices || region.humidity !== 'high')) {
            return {
                success: false,
                dialogue: '這裡太寬敞開闊了，而且空氣有些乾燥……球蟒需要更有安全感的包覆洞穴與足夠的濕度才能安心定居。'
            };
        }

        // 4. 加州王蛇：需要寬敞且地面活動空間充足的區域
        if (speciesId === 'king_snake' && region.humidity === 'high') {
            return {
                success: false,
                dialogue: '這裏過於積水潮濕了，王蛇更喜歡乾爽且活動空間充裕的地面與隧道……我們換個地方看看。'
            };
        }

        // 5. 納爾遜奶蛇：偏好帶有縫隙與覆蓋物的濕潤環境
        if (speciesId === 'milk_snake' && !region.has_tight_crevices) {
            return {
                success: false,
                dialogue: '周圍缺乏樹皮與岩石縫隙可以躲藏，鮮豔的色彩在空曠處太過顯眼了……牠需要更多能匿蹤的地方。'
            };
        }

        // 驗證成功：適合放生
        return {
            success: true,
            dialogue: `這裡的環境太適合牠了！看著牠順利爬入${region.name}的深處，希望牠在新的天地裡自由生活。`
        };
    }
}

window.HabitatReleaseSystem = HabitatReleaseSystem;