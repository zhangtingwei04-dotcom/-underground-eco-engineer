/**
 * 《鱗片與種子：地下生態物語》 - 生態觀察日誌系統 (observation-journal-system.js)
 * 負責記錄與生成生活化、故事化的觀察日誌，避免冰冷的醫療報告感
 */

export class ObservationJournalSystem {
    /**
     * 初始化觀察日誌資料結構
     */
    static initJournal(saveJson) {
        saveJson.observation_logs = saveJson.observation_logs || [];
        return saveJson;
    }

    /**
     * 新增一條觀察紀錄
     * @param {Object} saveJson 遊戲存檔
     * @param {string} type 類型 ('daily', 'fun', 'growth', 'environment', 'warning', 'important')
     * @param {string} content 紀錄文字內容
     */
    static addLog(saveJson, type, content) {
        this.initJournal(saveJson);

        const newLog = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36.substr(2, 5)),
            timestamp: new Date().toISOString(),
            dateString: new Date().toLocaleDateString(),
            type: type, // 'daily', 'fun', 'growth', 'environment', 'warning', 'important'
            content: content,
            read: false
        };

        // 將最新日誌推入陣列前端
        saveJson.observation_logs.unshift(newLog);

        // 保持日誌數量合理（例如最多保留最近 100 條）
        if (saveJson.observation_logs.length > 100) {
            saveJson.observation_logs.pop();
        }

        console.log(`【觀察日誌】[${type.toUpperCase()}] ${content}`);
        return newLog;
    }

    /**
     * 根據當前生物與環境狀態，隨機或條件式生成一條符合生活派氛圍的日常/趣事紀錄
     */
    static generateContextualObservation(saveJson, hognose, terrarium) {
        this.initJournal(saveJson);

        // 範例：根據不同狀態生成對應的故事性日誌
        const possibleLogs = [];

        if (hognose.stress < 30) {
            possibleLogs.push({
                type: 'daily',
                content: `小傢伙今天在溫暖的底材洞穴裡安靜地睡了很久，呼吸起伏非常平穩。`
            });
            possibleLogs.push({
                type: 'fun',
                content: `今天看見牠用鼻子頂了頂角落的小石塊，似乎對新環境充滿了好奇。`
            });
        }

        if (terrarium.humidity > 60) {
            possibleLogs.push({
                type: 'environment',
                content: `今日生態箱內的濕度稍微偏高，植物葉片上掛著幾顆細緻的水珠。`
            });
        }

        if (hognose.isShedding) {
            possibleLogs.push({
                type: 'important',
                content: `眼睛蒙上了一層淡淡的藍霧，看來這幾天就要準備脫皮了，得保持環境舒適。`
            });
        }

        if (possibleLogs.length > 0) {
            const randomIndex = Math.floor(Math.random() * possibleLogs.length);
            const chosen = possibleLogs[randomIndex];
            return this.addLog(saveJson, chosen.type, chosen.content);
        }

        return null;
    }
}

window.ObservationJournalSystem = ObservationJournalSystem;