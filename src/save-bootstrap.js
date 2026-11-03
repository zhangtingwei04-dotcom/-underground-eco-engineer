/**
 * 《鱗片與種子：地下生態物語》
 * 遊戲啟動與存檔初始化
 *
 * Scales & Seeds: Game Bootstrap
 */

import { SaveSystem } from './systems/save-system.js';
import { OfflineSimulationSystem } from './systems/offline-simulation-system.js';

// 使用單一 SaveSystem 實體，避免重複建立存檔管理器
let saveSystemInstance = null;

/**
 * 取得統一存檔管理器
 */
function getSaveSystem() {

    if (!saveSystemInstance) {

        saveSystemInstance = new SaveSystem();

        // 提供遊戲其他模組共用
        window.gameSaveSystem = saveSystemInstance;
    }

    return saveSystemInstance;
}

/**
 * 檢查存檔資料格式
 */
function isValidSaveData(saveData) {

    return (
        saveData &&
        typeof saveData === 'object' &&
        !Array.isArray(saveData)
    );
}

/**
 * 檢查時間格式是否有效
 */
function isValidTimestamp(timestamp) {

    if (
        timestamp === undefined ||
        timestamp === null ||
        timestamp === ''
    ) {
        return false;
    }

    return Number.isFinite(
        new Date(timestamp).getTime()
    );
}

/**
 * 執行既有玩家的離線結算
 *
 * 以下兩種情況都會保存：
 *
 * 1. 確實產生離線結算結果。
 * 2. 首次建立或修復 last_simulated_at。
 *
 * 避免離線時間基準只存在記憶體，
 * 而沒有真正寫入本機或雲端存檔。
 */
async function processOfflineProgress(saveSystem, saveData) {

    console.log('[Bootstrap] 開始執行離線生態結算');

    // 1. 記錄結算前的時間基準狀態
    const hadValidTimestampBefore =
        isValidTimestamp(saveData.last_simulated_at);

    // 2. 執行離線模擬
    const simulationResult =
        OfflineSimulationSystem.simulateOfflineProgress(
            saveData
        );

    if (
        !simulationResult ||
        !isValidSaveData(simulationResult.updatedSaveJson)
    ) {

        throw new Error(
            '離線模擬失敗：回傳資料格式不正確'
        );
    }

    const updatedSaveData =
        simulationResult.updatedSaveJson;

    const offlineReport =
        simulationResult.offlineReport;

    // 3. 檢查是否成功建立新的時間基準
    const hasValidTimestampAfter =
        isValidTimestamp(
            updatedSaveData.last_simulated_at
        );

    const timestampWasInitialized =
        !hadValidTimestampBefore &&
        hasValidTimestampAfter;

    // 4. 判斷是否需要保存
    const needsSave =
        Boolean(offlineReport) ||
        timestampWasInitialized;

    // 5. 沒有離線結算，也沒有新增時間基準
    if (!needsSave) {

        console.log(
            '[Bootstrap] 本次沒有需要保存的離線資料'
        );

        return updatedSaveData;
    }

    // 6. 顯示離線結算資訊
    if (offlineReport) {

        console.log(
            `[Bootstrap] 離線時間：${offlineReport.offlineHours} 小時`
        );
    }

    if (timestampWasInitialized) {

        console.log(
            '[Bootstrap] 已建立離線時間基準：',
            updatedSaveData.last_simulated_at
        );
    }

    // 7. 儲存更新後的資料
    const saveSuccess =