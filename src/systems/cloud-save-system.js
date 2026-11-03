// 鱗片與種子：地下生態物語 | 雲端跨裝置存檔系統 (Supabase 整合)
// Scales & Seeds: Underground Ecosystem Tales - Cloud Save System

export class CloudSaveSystem {
    /**
     * @param {string} supabaseUrl Supabase 專案網址
     * @param {string} supabaseKey Supabase Anon Key
     */
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.client = null;
        this.localStorageKey = 'scales_seeds_save_v2';
        this.initClient();
    }

    /**
     * 初始化 Supabase 用戶端
     */
    initClient() {
        if (window.supabase && this.supabaseUrl && this.supabaseKey) {
            try {
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('[CloudSave] Supabase 雲端存檔系統初始化成功');
            } catch (err) {
                console.error('[CloudSave] Supabase 初始化失敗:', err);
            }
        } else {
            console.warn('[CloudSave] 未偵測到 Supabase SDK 或金鑰，已自動退回純本地端模式 (LocalStorage)。');
        }
    }

    /**
     * 儲存遊戲進度（同步至雲端與本地）
     * @param {string} userId 玩家唯一識別碼 (例如登入帳號或裝置 UUID)
     * @param {Object} gameState Alpha 2.0 統一存檔 JSON 物件
     */
    async saveGame(userId, gameState) {
        // 更新時間戳記
        gameState.updatedAt = Date.now();
        const jsonString = JSON.stringify(gameState);

        // 1. 永遠先寫入本地端作為安全備份
        try {
            localStorage.setItem(this.localStorageKey, jsonString);
        } catch (e) {
            console.error('[CloudSave] 本地寫入失敗:', e);
        }

        // 2. 若未連線或無客戶端，僅使用本地
        if (!this.client || !userId) {
            return { success: true, mode: 'local_only', data: gameState };
        }

        try {
            const { data, error } = await this.client
                .from('player_saves')
                .upsert({
                    user_id: userId,
                    save_json: gameState,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            console.log('[CloudSave] 雲端存檔同步成功');
            return { success: true, mode: 'cloud_synced', data };
        } catch (err) {
            console.warn('[CloudSave] 雲端同步失敗，已保留本地存檔:', err.message);
            return { success: false, mode: 'fallback_local', error: err.message };
        }
    }

    /**
     * 載入遊戲進度（結合衝突檢測：比較雲端與本地時間戳記）
     * @param {string} userId 玩家唯一識別碼
     */
    async loadGame(userId) {
        // 讀取本地暫存
        let localSave = null;
        try {
            const localData = localStorage.getItem(this.localStorageKey);
            if (localData) {
                localSave = JSON.parse(localData);
            }
        } catch (e) {
            console.error('[CloudSave] 本地讀取失敗:', e);
        }

        // 若無雲端客戶端，直接回傳本地存檔
        if (!this.client || !userId) {
            console.log('[CloudSave] 使用本地端存檔');
            return { success: true, save: localSave, mode: 'local_only' };
        }

        try {
            const { data, error } = await this.client
                .from('player_saves')
                .select('save_json, updated_at')
                .eq('user_id', userId)
                .single();

            // PGRST116 代表查無此帳號的雲端存檔
            if (error && error.code !== 'PGRST116') throw error;

            if (data && data.save_json) {
                const cloudSave = data.save_json;
                const cloudTime = cloudSave.updatedAt || 0;
                const localTime = localSave ? (localSave.updatedAt || 0) : 0;

                // 衝突解決：若本地存檔比雲端更新（例如離線玩了一段時間），則以本地覆蓋雲端
                if (localTime > cloudTime) {
                    console.log('[CloudSave] 本地存檔較新，將自動上傳同步至雲端');
                    await this.saveGame(userId, localSave);
                    return { success: true, save: localSave, mode: 'resolved_local_newer' };
                }

                // 否則採用雲端最新存檔，並更新本地
                console.log('[CloudSave] 成功從雲端載入最新存檔');
                localStorage.setItem(this.localStorageKey, JSON.stringify(cloudSave));
                return { success: true, save: cloudSave, mode: 'cloud_loaded' };
            } else if (localSave) {
                // 雲端無資料但本地有，將本地資料初始化上傳到雲端
                console.log('[CloudSave] 雲端無紀錄，正在將現有本地存檔上傳至雲端...');
                await this.saveGame(userId, localSave);
                return { success: true, save: localSave, mode: 'initialized_cloud' };
            }

            // 雙邊皆無存檔（新玩家）
            console.log('[CloudSave] 查無任何存檔，將建立新遊戲');
            return { success: true, save: null, mode: 'new_game' };

        } catch (err) {
            console.warn('[CloudSave] 雲端讀取異常，改用本地存檔:', err.message);
            return { success: true, save: localSave, mode: 'fallback_local' };
        }
    }
}