// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生態探索式科研系統 (Ecological Research System)

window.ResearchSystem = {
    // 玩家當前科研進度與日誌紀錄
    state: {
        unlocked_techs: [],
        discovered_hidden_techs: [],
        research_samples: {}, // 格式如: { "clay_soil": 5, "sand_soil": 3 }
        research_log: []       // 科研發現日誌
    },

    /**
     * 初始化科研系統並載入設定
     */
    init: function(savedState) {
        if (savedState) {
            this.state = Object.assign(this.state, savedState);
        }
    },

    /**
     * 採集或獲得研究樣本
     */
    addSample: function(sampleId, count = 1) {
        if (!this.state.research_samples[sampleId]) {
            this.state.research_samples[sampleId] = 0;
        }
        this.state.research_samples[sampleId] += count;
        this.logEvent("獲得研究樣本", `取得 ${sampleId} x${count}`);
    },

    /**
     * 檢查特定科技是否符合解鎖條件
     */
    canUnlock: function(techData, playerProgress, difficultyMultiplier = 1.0) {
        if (this.state.unlocked_techs.includes(techData.id)) return false;

        const cond = techData.unlock_conditions;
        if (!cond) return true;

        // 1. 探索條件檢查
        if (cond.exploration) {
            if ((playerProgress.max_depth || 0) < cond.exploration.target_depth) {
                return false;
            }
        }

        // 2. 收集條件檢查 (根據難度調整所需的樣本數量)
        if (cond.collection) {
            for (let req of cond.collection) {
                const requiredCount = Math.ceil(req.count * difficultyMultiplier);
                const currentCount = this.state.research_samples[req.sample_id] || 0;
                if (currentCount < requiredCount) return false;
            }
        }

        // 3. 觀察紀錄檢查
        if (cond.observation) {
            if ((playerProgress.observed_morphs || 0) < cond.observation.recorded_morphs_count) {
                return false;
            }
        }

        return true;
    },

    /**
     * 執行解鎖科技並扣除相應資源
     */
    unlockTechnology: function(techData, difficultyMultiplier = 1.0) {
        if (this.state.unlocked_techs.includes(techData.id)) return false;

        // 扣除收集樣本
        if (techData.unlock_conditions && techData.unlock_conditions.collection) {
            for (let req of techData.unlock_conditions.collection) {
                const requiredCount = Math.ceil(req.count * difficultyMultiplier);
                this.state.research_samples[req.sample_id] -= requiredCount;
            }
        }

        this.state.unlocked_techs.push(techData.id);
        this.logEvent("解鎖新科技", `成功完成「${techData.name_zh}」研究！`);
        return true;
    },

    /**
     * 寫入科研日誌紀錄
     */
    logEvent: function(category, title) {
        const timestamp = new Date().toLocaleDateString();
        this.state.research_log.unshift({
            date: timestamp,
            category: category,
            title: title
        });
    }
};