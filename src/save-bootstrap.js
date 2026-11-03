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
 * 避免離線時間基準只存在記