/**
 * 《鱗片與種子：地下生態物語》
 * 生活紀念櫃資料的基本管理模組。
 *
 * 原始檔案在 NPC 贈禮描述中途截斷。本版先提供非破壞性的
 * 紀念品紀錄與擺放功能；未確認的完整劇情對白不擅自還原。
 */
export class LifestyleJournalSystem {
    static VALID_PLACEMENTS = ['cabinet', 'terrarium', 'cabin'];

    static BEHAVIORAL_GIFTS = {
        old_mo: {
            id: 'cozy_rock',
            name: '老莫的溫暖小岩石',
            from: 'old_mo',
            // 原始文本已截斷；待劇情驗收後補入完整文字。
            note: null
        }
    };

    static initCollection(saveJson) {
        if (!saveJson || typeof saveJson !== 'object' || Array.isArray(saveJson)) {
            throw new TypeError('[LifestyleJournalSystem] 存檔資料必須是物件。');
        }
        if (!Array.isArray(saveJson.lifestyle_collection)) {
            saveJson.lifestyle_collection = [];
        }
        return saveJson.lifestyle_collection;
    }

    static addKeepsake(saveJson, item) {
        const collection = this.initCollection(saveJson);
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim()) {
            throw new TypeError('[LifestyleJournalSystem] 紀念品必須具有有效 id。');
        }
        if (collection.some(existing => existing.id === item.id)) {
            return collection.find(existing => existing.id === item.id);
        }
        const placement = this.VALID_PLACEMENTS.includes(item.placement)
            ? item.placement : 'cabinet';
        const record = {
            ...item,
            id: item.id.trim(),
            placement,
            obtainedAt: item.obtainedAt || new Date().toISOString()
        };
        collection.push(record);
        return record;
    }

    static moveKeepsake(saveJson, itemId, placement) {
        const collection = this.initCollection(saveJson);
        if (!this.VALID_PLACEMENTS.includes(placement)) {
            throw new RangeError('[LifestyleJournalSystem] 不支援的擺放位置。');
        }
        const item = collection.find(entry => entry.id === itemId);
        if (!item) return null;
        item.placement = placement;
        return item;
    }

    static getKeepsakes(saveJson, placement = null) {
        const collection = this.initCollection(saveJson);
        if (placement === null) return collection.map(item => ({ ...item }));
        if (!this.VALID_PLACEMENTS.includes(placement)) {
            throw new RangeError('[LifestyleJournalSystem] 不支援的擺放位置。');
        }
        return collection.filter(item => item.placement === placement)
            .map(item => ({ ...item }));
    }

    static getBehavioralGift(npcId) {
        const gift = this.BEHAVIORAL_GIFTS[npcId];
        return gift ? { ...gift } : null;
    }
}
