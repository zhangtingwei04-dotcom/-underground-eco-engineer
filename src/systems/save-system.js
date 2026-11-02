// 地下生態工程師 - 本機存檔與讀檔系統 (Save/Load System)

window.GameSaveSystem = {
    // 儲存於瀏覽器 localStorage 的 Key 值
    STORAGE_KEY: "underground_eco_engineer_save",

    /**
     * 執行遊戲存檔
     * @returns {Object} 存檔結果回報
     */
    saveGame: function() {
        try {
            // 1. 安全檢查：確認全域遊戲狀態是否存在
            if (!window.gameEngineState) {
                return { success: false, message: "存檔失敗：找不到運行中的遊戲數據。" };
            }

            // 2. 打包需要永久保存的動態資料（排除 Phaser 的渲染物件，只留純數據）
            const saveData = {
                timestamp: Date.now(),
                creature: window.gameEngineState.creature,
                // 只保存地圖的 2D 方塊狀態（耐久度、是否被挖除等）
                mapData: window.gameEngineState.mapData
            };

            // 3. 轉化為 JSON 字串並寫入瀏覽器快取
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            console.log("【存檔系統】遊戲數據已成功保存至本地快取。");
            
            return { success: true, message: "ui_save_success" }; // 連結雙語字典 Key
        } catch (error) {
            console.error("【存檔系統】本地寫入發生異常:", error);
            return { success: false, message: "存檔失敗：瀏覽器快取空間異常。" };
        }
    },

    /**
     * 執行遊戲讀檔
     * @returns {Object} 讀檔結果回報
     */
    loadGame: function() {
        try {
            // 1. 從瀏覽器中抓取儲存的字串
            const rawData = localStorage.getItem(this.STORAGE_KEY);
            if (!rawData) {
                return { success: false, message: "未找到任何本地存檔紀錄。" };
            }

            // 2. 解析 JSON 資料
            const saveData = JSON.parse(rawData);

            // 3. 安全覆蓋回全域遊戲狀態中
            if (saveData.creature) window.gameEngineState.creature = saveData.creature;
            if (saveData.mapData) window.gameEngineState.mapData = saveData.mapData;

            console.log("【存檔系統】成功讀取本地存檔，時間戳記:", new Date(saveData.timestamp).toLocaleString());
            return { success: true, message: "ui_load_success" };
        } catch (error) {
            console.error("【存檔系統】讀取解包發生異常:", error);
            return { success: false, message: "讀檔失敗：存檔檔案毀損或格式不符。" };
        }
    },

    /**
     * 清除存檔（重設遊戲使用）
     */
    clearSave: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log("【存檔系統】本地存檔已清除。");
        return true;
    }
};
