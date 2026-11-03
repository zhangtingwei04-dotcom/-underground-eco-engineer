/**
 * 《鱗片與種子：地下生態物語》 - 生活觀察與地下生活紀念櫃系統
 */

export class LifestyleJournalSystem {
    static BEHAVIORAL_GIFTS = {
        old_mo: {
            id: 'cozy_rock',
            name: '老莫的溫暖小岩石',
            from: 'old_mo',
            note: '「看你整天盯著牠發呆，這塊地熱岩石給你。蛇類喜歡微溫，牠會懂得欣賞的。」 —— 老莫',
            description: '帶有微微餘溫的小石塊，小蛇很喜歡蜷在上面打盹。'
        },
        amy: {
            id: 'glowing_moss',
            name: '艾咪帶來的發光苔蘚',
            from: 'amy',
            note: '「研究所角落長出來的奇妙小苔蘚，送你裝飾箱子！晚上看會發出淡淡的光喔。」 —— 艾咪',
            description: '微型種子培育出的苔蘚，到了夜間會散發柔和的淡藍光芒。'
        },
        rosa: {
            id: 'ambient_chime',
            name: '蘿莎的小風鈴',
            from: 'rosa',
            note: '「這是我跟地表商人換來的小玩意，掛在地下室通風口剛剛好，聽聽聲音挺放鬆的。」 —— 蘿莎',
            description: '地底金屬風鈴，有微風吹過時會發出清脆的聲響。'
        }
    };

    /**
     * 初始化紀念櫃
     */
    static initCabinet(saveJson) {
        saveJson.lifestyle_cabinet = saveJson.lifestyle_cabinet || [];
        return saveJson;
    }

    /**
     * 領取並收納新禮物到紀念櫃中
     */
    static receiveGift(saveJson, npcId) {
        this.initCabinet(saveJson);
        const template = this.BEHAVIORAL_GIFTS[npcId];
        if (!template) return null;

        // 檢查是否已擁有
        if (saveJson.lifestyle_cabinet.some(item => item.id === template.id)) {
            return null;
        }

        const newItem = {
            id: template.id,
            name: template.name,
            from: template.from,
            receivedDate: new Date().toISOString().split('T')[0], // 記錄獲得日期
            note: template.note,
            description: template.description,
            placement: 'cabinet' // 可選值: 'cabinet' (紀念櫃中), 'terrarium' (生態箱裝飾), 'cabin' (小屋擺設)
        };

        saveJson.lifestyle_cabinet.push(newItem);
        console.log(`【紀念櫃】新收錄藏品：${newItem.name}`);
        return newItem;
    }

    /**
     * 切換藏品的擺放位置（收入櫃子、放進生態箱、或擺在小屋）
     */
    static setItemPlacement(saveJson, itemId, targetLocation) {
        this.initCabinet(saveJson);
        const item = saveJson.lifestyle_cabinet.find(i => i.id === itemId);
        if (item) {
            item.placement = targetLocation; // 'cabinet', 'terrarium', 'cabin'
            console.log(`【紀念櫃】藏品 ${item.name} 已移動至：${targetLocation}`);
            return true;
        }
        return false;
    }
}

window.LifestyleJournalSystem = LifestyleJournalSystem;