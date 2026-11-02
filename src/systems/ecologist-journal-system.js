// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：生態學家研究筆記與動態觀察 (Ecologist's Journal & Dialogue Triggers)

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
            category: category, // "arrival", "ecdysis", "mutation", "pure_color", "environment"
            title_zh: title,
            content_zh: content
        };

        userSaveData.journal_logs.unshift(newEntry);
        return newEntry;
    },

    /**
     * 依據個體基因外觀（隨機斑紋 vs 純色系）自動生成對應的觀察紀錄與 NPC 反應
     */
    recordCreaturePhenotype: function(creature, userSaveData) {
        if (!creature || !creature.phenotype) return;

        // 檢查是否為純色系
        if (creature.phenotype.is_pure_color) {
            const title = `獨特美感：${creature.species_name_zh} 展現出純色系特質`;
            const content = `這隻個體身上沒有繁複的斑紋，呈現乾淨俐落的純色。在微弱的地下燈光下，那單一而深邃的色澤反而散發出一種令人安心的純粹感，與造景的綠意搭配起來意外地協調。`;
            this.addLogEntry(title, content, "pure_color", userSaveData);
            
            return {
                npc: "老馬克",
                comment_zh: "喔？這隻小傢伙身上沒有多餘的雜色，是相當純粹乾淨的純色系啊！這種簡約的高級感，在地下生態箱裡看起來特別有質感。"
            };
        } 
        
        // 檢查是否為斑紋/白點突變
        else if (creature.phenotype.has_speckles) {
            const title = `重要發現：${creature.species_name_zh} 顯現特殊斑紋與白點！`;
            const content = `在今天的仔細觀察中，我發現牠的體表長出了高對比的斑點與獨特花紋！這究竟是顯性基因的隨機展現，還是微氣候適應的結果？我必須在筆記中好好追蹤。`;
            this.addLogEntry(title, content, "mutation", userSaveData);

            return {
                npc: "老馬克",
                comment_zh: "快瞧瞧這背部的斑紋變化！每一塊斑點的分布都是獨一無二的，這孩子長大後肯定會成為圖鑑裡的焦點！"
            };
        }
    }
};