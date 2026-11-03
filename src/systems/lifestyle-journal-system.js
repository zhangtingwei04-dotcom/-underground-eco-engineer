/**
 * 《鱗片與種子：地下生態物語》 - 生活觀察與 NPC 餽贈系統 (lifestyle-journal-system.js)
 * 玩家作為生活派觀察員，在與生態箱及 NPC 互動中隨性解鎖日常小物與驚喜
 */

export class LifestyleJournalSystem {
    // 各 NPC 在日常交流中會陸續送給玩家的生活與觀測小物
    static GIFTS = {
        'cozy_rock': {
            id: 'cozy_rock',
            name: '老莫的溫暖小岩石',
            from: 'old_mo',
            description: '老莫送的小石塊，稍微帶點微溫，小蛇似乎很喜歡蜷在上面打盹。'
        },
        'glowing_moss': {
            id: 'glowing_moss',
            name: '艾咪帶來的發光苔蘚',
            from: 'amy',
            description: '艾咪在研究站角落發現的微型種子，到了晚上會散發柔和的淡藍光芒。'
        },
        'ambient_chime': {
            id: 'ambient_chime',
            name: '蘿莎的小風鈴',
            from: 'rosa',
            description: '蘿莎交易來的地底金屬風鈴，掛在生態箱旁，有風吹過時會發出清脆的微響。'
        }
    };

    /**
     * 初始化觀察日誌與收藏箱
     */
    static initJournal(saveJson) {
        saveJson.lifestyle_gifts = saveJson.lifestyle_gifts || [];
        saveJson.observed_behaviors = saveJson.observed_behaviors || [];
        return saveJson;
    }

    /**
     * 當玩家靜靜觀察寵物或與 NPC 閒聊時，隨機收穫日常驚喜
     */
    static triggerCasualGift(saveJson, npcId) {
        this.initJournal(saveJson);
        
        // 尋找尚未收到的禮物
        const availableGifts = Object.values(this.GIFTS).filter(
            g => g.from === npcId && !saveJson.lifestyle_gifts.includes(g.id)
        );

        if (availableGifts.length === 0) return null;

        // 隨機獲得一個小禮物
        const chosenGift = availableGifts[0];
        saveJson.lifestyle_gifts.push(chosenGift.id);

        console.log(`【生活日誌】收到了來自 ${npcId} 的禮物：${chosenGift.name}！`);
        return chosenGift;
    }
}