// 鱗片與種子：地下生態物語 | 雲端與本地存檔系統 (支援訪客模式)
// Scales & Seeds: Underground Ecosystem Tales - Save System Engine

export class CloudSaveSystem {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.client = null;
        this.localStorageKey = 'scales_seeds_save_v2';
        this.initClient();
    }

    initClient() {
        if (window.supabase && this.supabaseUrl && this.supabaseKey) {
            try {
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('[SaveEngine] Supabase 客戶端已準備就緒');
            } catch (err) {
                console.error('[SaveEngine] Supabase 初始化失敗:', err);
            }
        }
    }

    /**
     * 儲存遊戲進度
     * @param {string} userId 玩家 ID (若為 'guest' 則開啟訪客模式)
     * @param {Object} gameState Alpha 2.0 存檔 JSON
     * @param {boolean} isGuest 是否強制開啟訪客模式
     */
    async saveGame(userId, gameState, isGuest = false) {
        gameState.updatedAt = Date.now();
        const jsonString = JSON.stringify(gameState);

        // 1. 永遠寫入瀏覽器 LocalStorage（訪客與雲端玩家都有本地備份）
        try {
            localStorage.setItem(this.localStorageKey, jsonString);
        } catch (e) {
            console.error('[SaveEngine] 本地寫入失敗:', e);
        }

        // 2. 訪客模式防呆：完全阻斷網路請求，不進行跨網同步
        if (isGuest || userId === 'guest' || !this.client) {
            console.log('[SaveEngine] 🎮 訪客模式：資料已安全儲存於本地瀏覽器 (不進行跨網同步)');
            return { success: true, mode: 'guest_local_only', data: gameState };
        }

        // 3. 雲端帳號模式：上傳至 Supabase
        try {
            const { data, error } = await this.client
                .from('player_saves')
                .upsert({
                    user_id: userId,
                    save_json: gameState,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            console.log('[SaveEngine] ☁️ 雲端帳號模式：存檔已成功同步至雲端');
            return { success: true, mode: 'cloud_synced', data };
        } catch (err) {
            console.warn('[SaveEngine] 雲端同步失敗，已維持本地端儲存:', err.message);
            return { success: false, mode: 'fallback_local', error: err.message };
        }
    }

    /**
     * 載入遊戲進度
     * @param {string} userId 玩家 ID
     * @param {boolean} isGuest 是否為訪客模式
     */
    async loadGame(userId, isGuest = false) {
        let localSave = null;
        try {
            const localData = localStorage.getItem(this.localStorageKey);
            if (localData) {
                localSave = JSON.parse(localData);
            }
        } catch (e) {
            console.error('[SaveEngine] 本地讀取失敗:', e);
        }

        // 訪客模式：直接讀取並回傳本地瀏覽器紀錄
        if (isGuest || userId === 'guest' || !this.client) {
            console.log('[SaveEngine] 🎮 訪客模式：讀取本地瀏覽器紀錄');
            return { success: true, save: localSave, mode: 'guest_local_only' };
        }

        // 雲端帳號模式：進行時間戳記比對
        try {
            const { data, error } = await this.client
                .from('player_saves')
                .select('save_json, updated_at')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data && data.save_json) {
                const cloudSave = data.save_json;
                const cloudTime = cloudSave.updatedAt || 0;
                const localTime = localSave ? (localSave.updatedAt || 0) : 0;

                if (localTime > cloudTime) {
                    await this.saveGame(userId, localSave, false);
                    return { success: true, save: localSave, mode: 'resolved_local_newer' };
                }

                localStorage.setItem(this.localStorageKey, JSON.stringify(cloudSave));
                return { success: true, save: cloudSave, mode: 'cloud_loaded' };
            } else if (localSave) {
                await this.saveGame(userId, localSave, false);
                return { success: true, save: localSave, mode: 'initialized_cloud' };
            }

            return { success: true, save: null, mode: 'new_game' };
        } catch (err) {
            return { success: true, save: localSave, mode: 'fallback_local' };
        }
    }
}