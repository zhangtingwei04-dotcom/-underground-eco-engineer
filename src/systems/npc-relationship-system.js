/**
 * 《鱗片與種子：地下生態物語》 - NPC 感情與稱謂動態演化系統
 * 負責管理玩家與各 NPC 的好感度階層、稱謂解鎖、以及離線冷卻回退機制
 */

export class NPCRelationshipSystem {
    // 定義各 NPC 在不同好感度區間的稱謂與對話風格階層（已全面調整為性別中立稱呼）
    static NPC_TIERS = {
        amy: [
            { min: 0, max: 20, title: '新進研究員', greeting: '早...早安，研究員，今天生態箱的數據還正常嗎？' },
            { min: 21, max: 50, title: '助手夥伴', greeting: '嘿！我剛整理好一批底棲植物的樣本，你要來看看嗎？' },
            { min: 51, max: 80, title: '莫逆之交', greeting: '太好了你來了！今天地下室的氣氛感覺特別溫馨呢。' },
            { min: 81, max: 100, title: '無話不談的摯友', greeting: '只要跟你在一起，研究地下生態就永遠不會覺得孤單！' }
        ],
        old_mo: [
            { min: 0, max: 20, title: '生疏的後輩', greeting: '年輕人，地下室的規矩多著點，把防潮工作做好再說。' },
            { min: 21, max: 50, title: '合格的後生', greeting: '嗯，看你這陣子的表現，對爬蟲還算有耐心。來喝杯熱茶吧。' },
            { min: 51, max: 80, title: '老練的同行', greeting: '哈哈，你對基因突變的嗅覺越來越像老頭子我當年了！' },
            { min: 81, max: 100, title: '忘年之交', greeting: '把這座地下生態站交給你，我這老骨頭總算可以放心了。' }
        ],
        rosa: [
            { min: 0, max: 20, title: '交易客', greeting: '貨物在那邊，一手交錢一手交貨，別問多餘的事。' },
            { min: 21, max: 50, title: '老主顧', greeting: '喲，是你啊。今天有進幾顆稀有種子，留著給你優先挑選。' },
            { min: 51, max: 80, title: '值得信賴的朋友', greeting: '跟你做生意最爽快。這瓶特製營養劑算你打折啦！' },
            { min: 81, max: 100, title: '生死之交', greeting: '只要你需要，不管地底深處有什麼，我都幫你弄到手。' }
        ]
    };

    /**
     * 初始化存檔中的 NPC 關係資料結構
     * @param {Object} saveJson 遊戲存檔物件
     */
    static initRelations(saveJson) {
        saveJson.npc_relations = saveJson.npc_relations || {
            amy: { affection: 10, last_interaction: new Date().toISOString() },
            old_mo: { affection: 10, last_interaction: new Date().toISOString() },
            rosa: { affection: 10, last_interaction: new Date().toISOString() }
        };
        return saveJson;
    }

    /**
     * 取得特定 NPC 當前的稱謂與對話
     * @param {Object} saveJson 遊戲存檔物件
     * @param {string} npcId NPC 代號 ('amy', 'old_mo', 'rosa')
     */
    static getNPCStatus(saveJson, npcId) {
        this.initRelations(saveJson);
        const relation = saveJson.npc_relations[npcId] || { affection: 10 };
        const tiers = this.NPC_TIERS[npcId] || this.NPC_TIERS.amy;

        // 尋找當前好感度對應的階層
        const currentTier = tiers.find(t => relation.affection >= t.min && relation.affection <= t.max) || tiers[0];

        return {
            affection: relation.affection,
            title: currentTier.title,
            greeting: currentTier.greeting
        };
    }

    /**
     * 增加好感度
     * @param {Object} saveJson 遊戲存檔物件
     * @param {string} npcId 
     * @param {number} amount 增加數值
     */
    static addAffection(saveJson, npcId, amount) {
        this.initRelations(saveJson);
        if (!saveJson.npc_relations[npcId]) {
            saveJson.npc_relations[npcId] = { affection: 10 };
        }

        const current = saveJson.npc_relations[npcId].affection;
        saveJson.npc_relations[npcId].affection = Math.min(100, Math.max(0, current + amount));
        saveJson.npc_relations[npcId].last_interaction = new Date().toISOString();

        console.log(`【NPC 系統】${npcId} 的好感度變動: ${current} -> ${saveJson.npc_relations[npcId].affection}`);
        return saveJson;
    }

    /**
     * 結合離線模擬：若玩家太久沒與 NPC 互動，好感度微幅回退
     * @param {Object} saveJson 遊戲存檔物件
     * @param {number} offlineHours 離線時數
     */
    static processOfflineDecay(saveJson, offlineHours) {
        if (!saveJson.npc_relations) return saveJson;

        if (offlineHours > 48) {
            const extraDays = Math.floor((offlineHours - 48) / 24);
            
            Object.keys(saveJson.npc_relations).forEach(npcId => {
                const rel = saveJson.npc_relations[npcId];
                const decay = extraDays * 1; 
                rel.affection = Math.max(10, rel.affection - decay);
            });
            console.log(`【NPC 系統】因長時間未造訪，各 NPC 關係產生了微幅冷卻。`);
        }

        return saveJson;
    }
}