/**
 * 《鱗片與種子：地下生態物語》 - 基因與花紋系統 (morph-system.js)
 * 負責管理不同物種的 Morph（品系基因），提供視覺標籤、圖鑑介紹與專屬觀察描述
 */

export class MorphSystem {
    // 完整品系基因與花紋資料庫
    static MORPH_DATABASE = {
        // ----------------------------------------------------
        // 1. 西部豬鼻蛇 (Hognose Snake)
        // ----------------------------------------------------
        'hognose_snake': {
            'normal': {
                id: 'normal',
                name_zh: '西部原色',
                rarity: 'common',
                description: '帶有經典的斑塊與微微上翹的可愛豬鼻，偽裝成小沙鏟的模樣。',
                visual_tags: ['hognose_pattern', 'earthy_tones'],
                journal_flavor: '那顆標誌性的小豬鼻輕輕拱起底材，將微小的泥土撥向兩側。'
            },
            'conda': {
                id: 'conda',
                name_zh: '金剛品系 (Conda)',
                rarity: 'rare',
                description: '背部花紋側邊呈現獨特的條紋狀延伸，腹部乾淨清爽。',
                visual_tags: ['reduced_pattern', 'clean_belly'],
                journal_flavor: '背側優雅的條紋花紋在牠緩慢爬動時流轉著自然的線條。'
            },
            'arctic_snow': {
                id: 'arctic_snow',
                name_zh: '極地冰雪品系 (Arctic Snow)',
                rarity: 'epic',
                description: '色素極度減退，呈現出像冰霜覆蓋般的淡白與柔灰色調，鼻頭的小鏟子顯得格外俏皮。',
                visual_tags: ['frost_white', 'cool_gray'],
                journal_flavor: '雪白透亮的鱗片在微光中散發著冷冽而柔和的質感，像一塊精緻的白瓷。'
            },
            'toffee_belly': {
                id: 'toffee_belly',
                name_zh: '太妃糖品系 (Toffee-belly)',
                rarity: 'rare',
                description: '腹部與體側呈現溫暖的焦糖色，背部的斑塊轉化為柔和的蜜黃與棕色交織。',
                visual_tags: ['caramel_hues', 'honey_pattern'],
                journal_flavor: '暖調的焦糖色斑紋在燈光下顯得格外溫潤，帶著一種讓人放鬆的甜美氣息。'
            }
        },

        // ----------------------------------------------------
        // 2. 玉米蛇 (Corn Snake)
        // ----------------------------------------------------
        'corn_snake': {
            'nominal': {
                id: 'nominal',
                name_zh: '原色（野外型）',
                rarity: 'common',
                description: '經典的紅橙色背斑，腹部有著像玉米粒般錯落的黑白方格紋，是大自然最完美的保護色。',
                visual_tags: ['classic_saddle', 'checkerboard_belly'],
                journal_flavor: '今天午後光線正好，牠腹部的黑白方格紋在溫控區的石塊上顯得格外清晰。'
            },
            'ghost': {
                id: 'ghost',
                name_zh: '幽靈品系 (Ghost)',
                rarity: 'rare',
                description: '帶有減黑色素基因，呈現出神祕而柔和的銀灰色與淡米黃調。',
                visual_tags: ['silver_gray', 'soft_pattern'],
                journal_flavor: '銀灰色的身軀在微光中輕輕起伏，帶有一種安靜而神祕的美感。'
            },
            'bloodred': {
                id: 'bloodred',
                name_zh: '血紅品系 (Bloodred)',
                rarity: 'epic',
                description: '背部的鞍狀花紋暈開，全身渲染著濃郁而深邃的深紅與赤褐色。',
                visual_tags: ['deep_red', 'diffused_pattern'],
                journal_flavor: '深紅色的鱗片在爬過沉木時，反射出絲綢般溫潤的光澤。'
            },
            'snow': {
                id: 'snow',
                name_zh: '雪白玉米 (Snow)',
                rarity: 'epic',
                description: '結合白化與減黑基因，全身雪白透亮，沒有一絲黑色素，雙眼呈現寶石般的紅色。',
                visual_tags: ['pure_white', 'ruby_eyes'],
                journal_flavor: '純白如雪的身軀靜靜盤踞在綠色植株旁，對比強烈而優雅。'
            },
            'sunglow': {
                id: 'sunglow',
                name_zh: '霓虹日落 (Sunglow)',
                rarity: 'rare',
                description: '帶有強烈的高彩度橘紅基因，像是一抹永遠不會消散的夕陽餘暉。',
                visual_tags: ['vibrant_orange', 'sunset_red'],
                journal_flavor: '濃郁而鮮豔的橙紅色澤在箱內流轉，彷彿將夏日的夕陽凝固在鱗片上。'
            }
        },

        // ----------------------------------------------------
        // 3. 球蟒 (Ball Python)
        // ----------------------------------------------------
        'ball_python': {
            'banana': {
                id: 'banana',
                name_zh: '香蕉品系 (Banana)',
                rarity: 'rare',
                description: '柔和的柔黃色底色上綴有深色雀斑，像極了熟透的香蕉皮。',
                visual_tags: ['pastel_yellow', 'dark_freckles'],
                journal_flavor: '小傢伙把身體緊緊蜷縮成一個圓潤的球體，頭部害羞地藏在身體最核心處。'
            },
            'albino': {
                id: 'albino',
                name_zh: '白化黃金 (Albino)',
                rarity: 'epic',
                description: '鮮明的檸檬黃與純白斑塊交織，眼睛呈現亮麗的粉紅色。',
                visual_tags: ['lemon_yellow', 'pink_eyes'],
                journal_flavor: '亮黃色的身軀在暗處的躲藏穴門口微微探出，優雅地享受著地熱。'
            },
            'clown': {
                id: 'clown',
                name_zh: '小丑品系 (Clown)',
                rarity: 'epic',
                description: '擁有極具辨識度的頭部特殊標記與側邊複雜的拼圖狀幾何花紋。',
                visual_tags: ['clown_head_mask', 'puzzle_side_pattern'],
                journal_flavor: '頭頂與體側那獨一無二的幾何拼圖紋路，在安靜蜷縮時像一件精雕細琢的藝術品。'
            },
            'piebald': {
                id: 'piebald',
                name_zh: '斑點派 / 派翠 (Piebald)',
                rarity: 'legendary',
                description: '身體帶有大面積不規則的純白區塊，與原本的斑塊形成強烈的藝術感拼接。',
                visual_tags: ['high_white_patches', 'splotched_pattern'],
                journal_flavor: '潔白的純白鱗片與深棕色塊完美拼接，像是在身上不經意留下了大自然的潑墨畫。'
            }
        },

        // ----------------------------------------------------
        // 4. 加州王蛇 (California King Snake)
        // ----------------------------------------------------
        'king_snake': {
            'banded_black_white': {
                id: 'banded_black_white',
                name_zh: '經典黑白高環',
                rarity: 'common',
                description: '對比極強的漆黑與雪白交替環紋，充滿簡潔的線條美感。',
                visual_tags: ['stark_contrast', 'black_white_stripes'],
                journal_flavor: '黑白相間的身影精力充沛地沿著生態箱邊界來回巡視，對所有新擺設都充滿好奇。'
            },
            'mexican_black': {
                id: 'mexican_black',
                name_zh: '墨王 (純黑品系)',
                rarity: 'rare',
                description: '全身上下包括腹部與眼睛皆為如墨汁般深邃的漆黑色，光澤感極強。',
                visual_tags: ['jet_black', 'glossy_sheen'],
                journal_flavor: '如黑曜石般光滑的鱗片在燈光下折射出微微的彩虹光澤。'
            },
            'banana_king': {
                id: 'banana_king',
                name_zh: '香蕉王 / 黃化品系 (Banana King)',
                rarity: 'rare',
                description: '打破傳統黑白印象，轉為溫柔的奶油黃與巧克力色環紋交替。',
                visual_tags: ['cream_yellow', 'chocolate_bands'],
                journal_flavor: '溫潤的奶油黃與棕色環紋相間，在巡視國界時步伐顯得輕鬆而輕快。'
            },
            'lavender': {
                id: 'lavender',
                name_zh: '薰衣草紋脈 (Lavender)',
                rarity: 'epic',
                description: '體側隱約透出淡淡的紫羅蘭與粉灰色澤，在不同光影下流轉奇妙色彩。',
                visual_tags: ['lavender_hues', 'soft_purple_tint'],
                journal_flavor: '鱗片間透出若有似無的淡紫暈光，為原本簡潔的王蛇增添了一抹神祕浪漫的氣息。'
            }
        },

        // ----------------------------------------------------
        // 5. 納爾遜奶蛇 (Nelson's Milk Snake)
        // ----------------------------------------------------
        'milk_snake': {
            'tri_color': {
                id: 'tri_color',
                name_zh: '經典三色環紋',
                rarity: 'common',
                description: '鮮豔的紅、黑、黃三色環紋相間，是大自然中最著名的擬態警示色。',
                visual_tags: ['red_black_yellow', 'mimicry_bands'],
                journal_flavor: '鮮豔的三色身軀輕巧地穿梭在枯葉層與樹皮縫隙之間，動作極其敏捷。'
            },
            'hypo_albino': {
                id: 'hypo_albino',
                name_zh: '無黑純紅變異 (Hypo Milk)',
                rarity: 'epic',
                description: '黑色素退化後，環紋轉化為亮麗的珊瑚紅與耀眼的乳白色相間，色彩極具衝擊力。',
                visual_tags: ['coral_red', 'milky_white'],
                journal_flavor: '亮紅與純白交織的鮮明環紋，在底材的樹皮縫隙間穿梭時顯得格外奪目。'
            }
        }
    };

    /**
     * 取得指定物種與品系的詳細設定
     */
    static getMorphConfig(speciesId, morphId) {
        const speciesMorphs = this.MORPH_DATABASE[speciesId];
        if (!speciesMorphs) return null;
        return speciesMorphs[morphId] || Object.values(speciesMorphs)[0];
    }

    /**
     * 取得該品系對應的專屬觀察日誌文字
     */
    static getMorphFlavorText(speciesId, morphId) {
        const config = this.getMorphConfig(speciesId, morphId);
        return config ? config.journal_flavor : '小生命安靜地在箱中休憩。';
    }

    /**
     * 取得特定物種的所有 Morph 清單（便利圖鑑介面渲染）
     */
    static getSpeciesMorphs(speciesId) {
        return Object.values(this.MORPH_DATABASE[speciesId] || {});
    }
}

window.MorphSystem = MorphSystem;