// 鱗片與種子：地下生態物語 | 遊戲啟動與存檔初始化
// Scales & Seeds: Game Bootstrap

import { SaveSystem } from './systems/save-system.js';

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
            window.playerSaveData = result.save;

            console.log(
                `[Bootstrap] 已載入既有存檔 (${result.mode})`
            );

            return {
                status: 'existing_save',
                save: result.save
            };
        }

        // 3. 只有明確確認沒有存檔，才能建立新遊戲
        if (!result.success || result.save !== null) {
            throw new Error(
                result.error ||
                `存檔讀取失敗：${result.mode || 'unknown'}`
            );
        }

        // 4. 建立新玩家初始資料
        const newGameData = saveSystem.getDefaultSaveData();

        // 5. 立即儲存新遊戲
        const saveSuccess = await saveSystem.saveGame(newGameData);

        if (!saveSuccess) {
            throw new Error(
                '新遊戲存檔失敗，為保護玩家資料，暫停進入遊戲'
            );
        }

        // 6. 將新遊戲資料交給遊戲場景
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