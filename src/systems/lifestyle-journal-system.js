/**
 * 《鱗片與種子：地下生態物語》
 * 生活觀察與地下生活紀念櫃系統
 */

export class LifestyleJournalSystem {

    /**
     * 合法的藏品擺放位置
     */
    static VALID_PLACEMENTS = [
        'cabinet',
        'terrarium',
        'cabin'
    ];

    /**
     * NPC 行為贈禮資料
     */
    static BEHAVIORAL_GIFTS = {

        old_mo: {
            id: 'cozy_rock',
            name: '老莫的溫暖小岩石',
            from: 'old_mo',
            note: '「看你整