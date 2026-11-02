// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：生態學家研究筆記 (Ecologist's Journal System)

window.EcologistJournalSystem = {
    /**
     * 新增一條研究觀察日誌
     */
    addLogEntry: function(title, content, category = "observation", userSaveData) {
        if (!userSaveData.journal_logs) {
            userSaveData.journal_logs = [];
        }

        const dateStr = window.ShopDailyStockSystem ? 
            window.ShopDailyStockSystem.getTodayDateString() : new Date().toISOString().split('T')[0];

        const newEntry = {
            id: "log_" + Date.now(),
            date: dateStr,
            category: category, // "arrival", "ecdysis", "mutation", "environment"
            title_zh: title,
            content_zh: content
        };

        userSaveData.journal_logs.unshift(newEntry); // 最新日誌排在最前面
        return newEntry;
    },

    /**
     * 自動觸發：首次蛻皮觀察日誌
     */
    logFirstShed: function(creature, userSaveData) {
        const title = `觀察紀錄：${creature.species_name_zh} 完成第一次蛻皮`;
        const content = `今天，牠順利完成了在我照顧下的第一次脫皮。原本有些暗淡的鱗片恢復了光澤，身體側邊似乎隱約能看到更清晰的花紋。希望牠能繼續健康成長。`;
        return this.addLogEntry(title, content, "ecdysis", userSaveData);
    },

    /**
     * 自動觸發：發現突變白點日誌
     */
    logSpeckleDiscovery: function(creature, userSaveData) {
        const title = `重要發現：${creature.species_name_zh} 顯現特殊白點特徵！`;
        const content = `在今天的仔細觀察中，我發現牠的體表長出了極其罕見的白點與高對比斑紋！這究竟是顯性基因的逐步表達，還是後天微氣候適應的結果？我必須繼續觀察下去。`;
        return this.addLogEntry(title, content, "mutation", userSaveData);
    }
};