/**
 * 《鱗片與種子：地下生態物語》 - 基因與花紋系統 (morph-system.js)
 * 負責管理不同物種的 Morph（品系基因），提供視覺標籤、圖鑑介紹與專屬觀察描述
 */

export class MorphSystem {
    // 品系基因資料庫
    static MORPH_DATABASE = {
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
                name_zh: '幽靈品系',
                rarity: 'rare',
                description: '帶有減黑色素基因，呈現出神祕而柔和的銀灰色與淡米黃調。',
                visual_tags: ['silver_gray', 'soft_pattern'],
                journal_flavor: '銀灰色的身軀在微光中輕輕起伏，帶有一種安靜而神祕的美感。'
            },
            'bloodred': {
                id: 'bloodred',
                name_zh: '血紅品系',
                rarity: 'epic',
                description: '背部的鞍狀花紋暈開，全身渲染著濃郁而深邃的深紅與赤褐色。',
                visual_tags: ['deep_red', 'diffused_pattern'],
                journal_flavor: '深紅色的鱗片在爬過沉木時，反射出絲綢般溫潤的光澤。'
            }
        },
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
}

window.MorphSystem = MorphSystem;