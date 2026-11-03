/**
 * 《鱗片與種子：地下生態物語》 - 存檔引導與開局同步模組 (save-bootstrap.js)
 * 負責處理：本機 IndexedDB 訪客存檔讀取、雲端同步與開局生存模式鎖定
 */

import { authSync } from './auth-sync-system.js';

// 本地 IndexedDB 的名稱與 Store 設定
const DB_NAME = 'ScalesAndSeedsDB';
const STORE_NAME = 'saveData';

/**
 * 讀取本機 IndexedDB 的訪客存檔
 */
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
 * 遊戲開局與登入流程整合樞紐
 * @param {string} chosenSurvivalMode 'cozy' 或 'challenge' (僅在開局建立存檔時生效)
 */
export async function handleGameStart(chosenSurvivalMode = 'cozy') {
    try {
        // 1. 初始化 Auth 狀態監聽
        const user = await authSync.init();

        // 2. 如果用戶已登入，檢查雲端與本機存檔
        if (user) {
            const localData = await getLocalIndexedDBSave();
            
            if (localData) {
                // 若本機有訪客存檔，執行遷移並鎖定生存模式
                const savePayload = localData.save_json || localData;
                await authSync.migrateIndexedDBToCloud(savePayload, chosenSurvivalMode);
                console.log('【系統】訪客 IndexedDB 資料已成功安全遷移至 Supabase 雲端。');
            } else {
                // 本機無訪客存檔，直接拉取雲端存檔
                const cloudSave = await authSync.loadCloudSave();
                if (cloudSave) {
                    console.log('【系統】成功載入雲端存檔 (存檔版本 Revision:', cloudSave.save_revision, ')');
                } else {
                    console.log('【系統】雲端尚無存檔，準備建立新存檔。');
                }
            }
        } else {
            console.log('【系統】目前處於未登入訪客模式（僅使用本機 IndexedDB）。');
        }
    } catch (error) {
        console.error('【系統錯誤】遊戲開局存檔同步失敗:', error);
    }
}