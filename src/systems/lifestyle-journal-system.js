/**
 * 《鱗片與種子：地下生態物語》 - 生活觀察與 NPC 紀念櫃系統 (lifestyle-journal-system.js)
 * 記錄生活派玩家的日常點滴、NPC 根據行為贈送的生活記憶小物與紀念櫃收藏
 */

export class LifestyleJournalSystem {
    // 定義各 NPC 根據玩家行為贈送的生活記憶小物
    static BEHAVIORAL_GIFTS = {
        old_mo: {
            id: 'cozy_rock',
            name: '老莫的溫暖小岩石',
            trigger: 'frequent_observing', // 當玩家經常靜靜觀察蛇類休息
            note: '「看你整天盯著牠發呆，這塊地熱岩石給你。蛇類喜歡微溫，牠會懂得欣賞的。」 —— 老莫',
            description: '帶有微微餘溫的小石塊，小蛇很喜歡蜷在上面打盹。'
        },
        amy: {
            id: 'glowing_moss',
            name: '艾咪帶來的發光苔蘚',
            trigger: 'frequent_planting', // 當玩家經常種植與照顧植物
            note: '「研究所角落長出來的奇妙小苔蘚，送你裝飾箱子！晚上看會發出淡淡的光喔。」 —— 艾咪',
            description: '微型種子培育出的苔蘚，到了夜間會散發柔和的淡藍光芒。'
        },
        rosa: {
            id: 'ambient_chime',
            name: '蘿莎的小風鈴',
            trigger: 'frequent_decorating', // 當玩家經常調整環境擺設
            note: '「這是我跟地表商人換來的小玩意，掛在地下室通風口剛剛好，聽聽聲音挺放鬆的。」 —— 蘿莎',
            description: '地底金屬風鈴，有微風吹過時會發出清脆的聲響。'
        }
    };

    /**
     * 初始化生活日誌與地下生活紀念櫃
     */
    static initJournal(saveJson) {
        saveJson.lifestyle_cabinet = saveJson.cabinet_items || []; // 永久紀念櫃
        saveJson.observed_behaviors = saveJson.observed_behaviors || { observing: 0, planting: 0, decorating: 0 };
        return saveJson;
    }

    /**
     * 根據玩家的生活行為與 NPC 互動，隨機贈送對應記憶禮物
     * @param {Object} saveJson 遊戲存檔
     * @param {string} npcId NPC 代號 ('old_mo', 'amy', 'rosa')
     */
    static checkAndTriggerGift(saveJson, npcId) {
        this.initJournal(saveJson);

        const giftTemplate = this.BEHAVIORAL_GIFTS[npcId];
        if (!giftTemplate) return null;

        // 檢查是否已經收過這件禮物
        const alreadyOwned = saveJson.lifestyle_cabinet.some(item => item.id === giftTemplate.id);
        if (alreadyOwned) return null;

        // 建立帶有時間戳與紙條的永久紀念品
        const memoryItem = {
            id: giftTemplate.id,
            name: giftTemplate.name,
            from: npcId,
            receivedDate: new Date().toISOString().split('T')[0], // 記錄獲得日期
            note: giftTemplate.note,
            description: giftTemplate.description,
            isPlaced: false // 是否已擺放至生態箱或小屋
        };

        // 放入地下生活紀念櫃
        saveJson.lifestyle_cabinet.push(memoryItem);

        console.log(`【生活日誌】收到了來自 ${npcId} 的紀念小物：${giftTemplate.name}`);
        return memoryItem;
    }

    /**
     * 隨機抽取可用禮物（修正後的真隨機邏輯）
     */
    static getRandomAvailableGift(saveJson, npcId) {
        this.initJournal(saveJson);
        
        // 篩選該 NPC 尚未獲得的禮物
        const availableGifts = Object.values(this.BEHAVIORAL_GIFTS).filter(
            g => g.from === npcId && !saveJson.lifestyle_cabinet.some(item => item.id === g.id)
        );

        if (availableGifts.length === 0) return null;

        // 真隨機挑選
        const randomIndex = Math.floor(Math.random() * availableGifts.length);
        return availableGifts[randomIndex];
    }
}

window.LifestyleJournalSystem = LifestyleJournalSystem;