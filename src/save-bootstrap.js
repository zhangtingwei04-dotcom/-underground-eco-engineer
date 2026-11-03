```javascript
// 鱗片與種子：地下生態物語 | 遊戲啟動與存檔初始化
// Scales & Seeds: Game Bootstrap

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
 * 執行既有玩家的離線結算
 *
 * 只有在確實產生離線結算結果時，
 * 才需要重新儲存資料。
 */
async function processOfflineProgress(saveSystem, saveData) {

    console.log('[Bootstrap] 開始執行離線生態結算');

    // 1. 執行離線模擬
    const simulationResult =
        OfflineSimulationSystem.simulateOfflineProgress(
            saveData
        );

    if (
        !simulationResult ||
        !isValidSaveData(simulationResult.updatedSaveJson)
    ) {
        throw new Error('離線模擬失敗：回傳資料格式不正確');
    }

    const updatedSaveData =
        simulationResult.updatedSaveJson;

    const offlineReport =
        simulationResult.offlineReport;

    // 2. 沒有產生結算結果，不需要額外儲存
    if (!offlineReport) {

        console.log(
            '[Bootstrap] 本次沒有需要處理的離線進度'
        );

        return updatedSaveData;
    }

    console.log(
        `[Bootstrap] 離線時間：${offlineReport.offlineHours} 小時`
    );

    // 3. 儲存離線結算後的資料
    const saveSuccess = await saveSystem.saveGame(
        updatedSaveData
    );

    if (!saveSuccess) {

        throw new Error(
            '離線結算後存檔失敗，為避免進度遺失，暫停進入遊戲'
        );
    }

    console.log(
        '[Bootstrap] 離線結算資料已成功保存'
    );

    // 4. 顯示離線事件
    if (
        Array.isArray(offlineReport.events) &&
        offlineReport.events.length > 0
    ) {
        console.log(
            '[Bootstrap] 離線期間發生的事件:',
            offlineReport.events
        );
    }

    return updatedSaveData;
}

/**
 * 啟動與初始化遊戲
 *
 * @returns {Promise<object>}
 *
 * status:
 * existing_save：已有存檔
 * created：新遊戲已建立並成功儲存
 * load_failed：存檔讀取或初始化失敗
 */
export async function handleGameStart() {

    try {
        const saveSystem = getSaveSystem();

        console.log('[Bootstrap] 開始檢查遊戲存檔');

        // 1. 透過正式存檔系統讀取資料
        const result = await saveSystem.cloudSave.loadGame(
            saveSystem.currentUserId,
            saveSystem.isGuest
        );

        // 2. 已經存在有效存檔
        if (isValidSaveData(result.save)) {

            console.log(
                `[Bootstrap] 已載入既有存檔 (${result.mode})`
            );

            // 3. 執行既有玩家的離線結算
            const updatedSaveData =
                await processOfflineProgress(
                    saveSystem,
                    result.save
                );

            // 4. 確認結算及儲存完成後，才交給遊戲場景
            window.playerSaveData = updatedSaveData;

            console.log(
                '[Bootstrap] 既有玩家初始化完成'
            );

            return {
                status: 'existing_save',
                save: updatedSaveData
            };
        }

        // 5. 只有明確確認沒有存檔，才能建立新遊戲
        if (!result.success || result.save !== null) {

            throw new Error(
                result.error ||
                `存檔讀取失敗：${result.mode || 'unknown'}`
            );
        }

        // 6. 建立新玩家初始資料
        const newGameData = saveSystem.getDefaultSaveData();

        // 7. 立即儲存新遊戲
        const saveSuccess = await saveSystem.saveGame(
            newGameData
        );

        if (!saveSuccess) {

            throw new Error(
                '新遊戲存檔失敗，為保護玩家資料，暫停進入遊戲'
            );
        }

        // 8. 將新遊戲資料交給遊戲場景
        window.playerSaveData = newGameData;

        console.log('[Bootstrap] 新遊戲建立成功');

        return {
            status: 'created',
            save: newGameData
        };

    } catch (error) {

        console.error(
            '[Bootstrap] 遊戲初始化失敗:',
            error
        );

        return {
            status: 'load_failed',
            error: error.message
        };
    }
}

/**
 * 取得目前共用的 SaveSystem 實體
 */
export function getGameSaveSystem() {
    return getSaveSystem();
}
```