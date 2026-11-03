import { authSync } from './auth-sync-system.js';

const DB_NAME = 'ScalesAndSeedsDB';
const STORE_NAME = 'saveData';

export function getLocalIndexedDBSave() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => resolve(null);
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve(null);
                return;
            }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get('guest_save');
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => resolve(null);
        };
    });
}

/**
 * 啟動與同步遊戲存檔
 * @returns {boolean} true 代表已有存檔（不需要讓玩家選模式），false 代表是新玩家（需要跳出開局模式選擇）
 */
export async function handleGameStart(chosenSurvivalMode = 'cozy') {
    try {
        const user = await authSync.init();

        if (user) {
            const localData = await getLocalIndexedDBSave();
            const cloudSave = await authSync.loadCloudSave();

            if (cloudSave) {
                console.log('【系統】已偵測到雲端存檔，模式鎖定為:', cloudSave.survival_mode);
                return true; // 已有存檔
            }

            if (localData) {
                const savePayload = localData.save_json || localData;
                await authSync.migrateIndexedDBToCloud(savePayload, chosenSurvivalMode);
                console.log('【系統】本機訪客存檔已成功遷移至雲端。');
                return true; // 已有存檔
            }
        } else {
            // 未登入訪客模式下，檢查本機 IndexedDB
            const localData = await getLocalIndexedDBSave();
            if (localData) {
                return true; // 已有本機存檔
            }
        }

        return false; // 無任何存檔，判定為全新開局，需要顯示模式選擇介面！
    } catch (error) {
        console.error('【系統錯誤】存檔初始化失敗:', error);
        return false;
    }
}