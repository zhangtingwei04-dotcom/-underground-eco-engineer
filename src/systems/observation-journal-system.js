/**
 * 《鱗片與種子：地下生態物語》
 * 生態觀察日誌系統 (observation-journal-system.js)
 *
 * 負責記錄與生成生活化、故事化的觀察日誌，
 * 支援不同物種，避免依賴特定爬蟲。
 */

export class ObservationJournalSystem {

    // 日誌最多保留數量
    static MAX_LOGS = 100;

    // 支援的日誌分類
    static VALID_LOG_TYPES = [
        'daily',
        'fun',
        'growth',
        'environment',
        'warning',
        'important'
    ];

    /**
     * 初始化觀察日誌資料結構
     */
    static initJournal(saveJson) {

        if (!saveJson || typeof saveJson !== 'object') {
            throw new Error(
                '[ObservationJournalSystem] 缺少有效的存檔資料。'
            );
        }

        if (!Array.isArray(saveJson.observation_logs)) {
            saveJson.observation_logs = [];
        }

        return saveJson;
    }

    /**
     * 新增一條觀察紀錄
     *
     * @param {Object} saveJson 遊戲存檔
     * @param {string} type 日誌分類
     * @param {string} content 紀錄文字
     */
    static addLog(saveJson, type, content) {

        this.initJournal(saveJson);

        if (!this.VALID_LOG_TYPES.includes(type)) {
            throw new Error(
                `[ObservationJournalSystem] 不支援的日誌分類：${type}`
            );
        }

        if (typeof content !== 'string' || !content.trim()) {
            throw new Error(
                '[ObservationJournalSystem] 日誌內容不可為空。'
            );
        }

        const now = new Date();

        const newLog = {
            id: 'log_' + now.getTime() + '_' +
                Math.random().toString(36).slice(2, 9),

            timestamp: now.toISOString(),

            dateString: now.toLocaleDateString(),

            type,

            content: content.trim(),

            read: false
        };

        // 將最新日誌放在陣列最前端
        saveJson.observation_logs.unshift(newLog);

        // 限制日誌數量
        if (saveJson.observation_logs.length > this.MAX_LOGS) {
            saveJson.observation_logs.length = this.MAX_LOGS;
        }

        console.log(
            `【觀察日誌】[${type.toUpperCase()}] ${content}`
        );

        return newLog;
    }

    /**
     * 根據不同生物與環境狀態，
     * 生成生活化的觀察紀錄。
     *
     * @param {Object} saveJson 遊戲存檔
     * @param {Object} creature 生物資料
     * @param {Object} terrarium 生態箱資料
     */
    static generateContextualObservation(
        saveJson,
        creature,
        terrarium
    ) {

        this.initJournal(saveJson);

        if (!creature || typeof creature !== 'object') {
            throw new Error(
                '[ObservationJournalSystem] 缺少有效的生物資料。'
            );
        }

        if (!terrarium || typeof terrarium !== 'object') {
            throw new Error(
                '[ObservationJournalSystem] 缺少有效的生態箱資料。'
            );
        }

        const possibleLogs = [];

        const nickname = creature.nickname || '小傢伙';

        // 狀態良好的日常觀察
        if (
            typeof creature.stress === 'number' &&
            creature.stress < 30
        ) {
            possibleLogs.push({
                type: 'daily',
                content: `${nickname}今天在熟悉的躲藏空間裡安靜休息，偶爾吐舌探索周遭環境。`
            });

            possibleLogs.push({
                type: 'fun',
                content: `${nickname}今天似乎對周遭環境充滿好奇，慢慢探索生態箱中的不同角落。`
            });
        }

        // 濕度觀察
        if (
            typeof terrarium.humidity === 'number' &&
            terrarium.humidity > 60
        ) {
            possibleLogs.push({
                type: 'environment',
                content: `今日生態箱內的濕度為 ${terrarium.humidity}%，建議確認是否符合該物種的適宜濕度需求。`
            });
        }

        // 脫皮觀察
        if (creature.isShedding) {
            possibleLogs.push({
                type: 'important',
                content: `${nickname}的眼睛逐漸呈現霧藍色，體色也可能變得黯淡，請留意脫皮期間的環境狀況。`
            });
        }

        // 壓力觀察
        if (
            typeof creature.stress === 'number' &&
            creature.stress > 60
        ) {
            possibleLogs.push({
                type: 'warning',
                content: `${nickname}近期壓力指數偏高，建議檢查躲藏空間、環境溫濕度及周遭干擾。`
            });
        }

        // 沒有符合條件的觀察事件
        if (possibleLogs.length === 0) {
            return null;
        }

        // 隨機挑選一筆觀察紀錄
        const randomIndex = Math.floor(
            Math.random() * possibleLogs.length
        );

        const chosenLog = possibleLogs[randomIndex];

        return this.addLog(
            saveJson,
            chosenLog.type,
            chosenLog.content
        );
    }
}

window.ObservationJournalSystem = ObservationJournalSystem;