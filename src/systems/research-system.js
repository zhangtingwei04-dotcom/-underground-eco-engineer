/**
 * 《鱗片與種子：地下生態物語》 - NPC 技術指導與引進系統 (tech-acquisition-system.js)
 * 飼養員專注於第一線照顧，所有自動化設備與進階技術均透過 NPC 導師傳授或引進
 */

export class TechAcquisitionSystem {
    // 科技清單與其對應的解鎖導師（老莫或蘿莎）
    static AVAILABLE_TECHS = {
        'auto_mister': {
            id: 'auto_mister',
            name: '自動微氣候噴霧器',
            mentor: 'old_mo',         // 由老莫傳授
            requiredAffection: 30,    // 需老莫好感度達 30
            description: '老莫傳授的自動噴霧管線技術，可降低離線時的濕度流失風險。'
        },
        'thermal_pad_v2': {
            id: 'thermal_pad_v2',
            name: '精準溫控墊片',
            mentor: 'old_mo',
            requiredAffection: 50,
            description: '老莫根據多年經驗改良的溫控墊片，確保夜間底材溫度穩定。'
        },
        'imported_substrate': {
            id: 'imported_substrate',
            name: '特級進口有機土壤',
            mentor: 'rosa',           // 由蘿莎引進
            requiredAffection: 25,    // 需蘿莎好感度達 25 或透過貿易解鎖
            description: '蘿莎從地面引進的特殊活性基質，大幅提升植物根系生長效率。'
        }
    };

    /**
     * 初始化存檔中的技術解鎖資料結構
     */
    static initTechData(saveJson) {
        saveJson.unlocked_techs = saveJson.unlocked_techs || [];
        return saveJson;
    }

    /**
     * 檢查是否能向 NPC 學習或引進該技術
     * @param {Object} saveJson 遊戲存檔物件
     * @param {string} techId 技術 ID
     * @param {Object} npcRelations 玩家目前的 NPC 好感度資料物件 (從 NPCRelationshipSystem 取得)
     */
    static canUnlockTech(saveJson, techId, npcRelations) {
        this.initTechData(saveJson);
        const tech = this.AVAILABLE_TECHS[techId];
        if (!tech) return { possible: false, reason: '未知技術項目' };

        if (saveJson.unlocked_techs.includes(techId)) {
            return { possible: false, reason: '已經掌握此項技術' };
        }

        // 檢查對應導師的好感度是否足夠
        const mentorData = npcRelations[tech.mentor] || { affection: 10 };
        if (mentorData.affection < tech.requiredAffection) {
            const mentorName = tech.mentor === 'old_mo' ? '老莫' : '蘿莎';
            return { possible: false, reason: `與${mentorName}的好感度不足（需達到 ${tech.requiredAffection}）` };
        }

        return { possible: true };
    }

    /**
     * 向 NPC 請教並成功解鎖技術
     */
    static unlockTech(saveJson, techId, npcRelations) {
        const check = this.canUnlockTech(saveJson, techId, npcRelations);
        if (!check.possible) {
            console.warn(`【技術引進】無法解鎖: ${check.reason}`);
            return { success: false, reason: check.reason };
        }

        saveJson.unlocked_techs.push(techId);
        const tech = this.AVAILABLE_TECHS[techId];
        console.log(`【技術引進】成功掌握新技術：${tech.name}（由 ${tech.mentor} 指導）`);
        return { success: true, tech };
    }
}