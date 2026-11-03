/**
 * 《鱗片與種子：地下生態物語》
 * 新遊戲初始寵物設定
 *
 * 只負責決定玩家開局獲得什麼，
 * 不負責建立寵物或保存資料。
 */

export const STARTING_CREATURE_CONFIG = {
    speciesId: 'hognose_snake',

    nickname: '布丁',

    age: 864000,

    growthStage: 'juvenile',

    initialStatus: {
        health: 100,
        hunger: 85,
        hydration: 90,
        stress: 5
    },

    genetics: {
        morph: 'anaconda',
        pattern: 'patterned',
        colorGene: 'normal'
    },

    stats: {
        energy: 90,
        diggingPower: 15
    }
};