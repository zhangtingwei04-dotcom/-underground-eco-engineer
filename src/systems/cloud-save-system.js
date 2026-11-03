// 鱗片與種子：地下生態物語 | 雲端跨裝置存檔系統 (Supabase 整合)
// Scales & Seeds: Underground Ecosystem Tales - Cloud Save System

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
                console.log('[CloudSave] Supabase 雲端存檔系統初始化成功');
            } catch (err) {
                console.error('[CloudSave] Supabase 初始化失敗:', err);
            }
        } else {
            console.warn('[CloudSave] 未偵測到 Supabase SDK 或金鑰，已自動退回純本地端模式 (LocalStorage)。');
        }
    }

    async saveGame(userId, gameState) {
        gameState.updatedAt = Date.now();
        const jsonString = JSON.stringify(gameState);

        // 1. 永遠第一時間寫入本地端作為安全備份
        try {
            localStorage.setItem(this.localStorageKey, jsonString);
        } catch (e) {
            console.error('[CloudSave] 本地寫入失敗:', e);
        }

        // 2. 若無連線，僅使用本地
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
            return { success: true, mode: 'cloud_synced', data };
        } catch (err) {
            console.warn('[CloudSave] 雲端同步失敗，已保留本地存檔:', err.message);
            return { success: false, mode: 'fallback_local', error: err.message };
        }
    }

    async loadGame(userId) {
        let localSave = null;
        try {
            const localData = localStorage.getItem(this.localStorageKey);
            if (localData) {
                localSave = JSON.parse(localData);
            }
        } catch (e) {
            console.error('[CloudSave] 本地讀取失敗:', e);
        }

        if (!this.client || !userId) {
            return { success: true, save: localSave, mode: 'local_only' };
        }

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
                    await this.saveGame(userId, localSave);
                    return { success: true, save: localSave, mode: 'resolved_local_newer' };
                }

                localStorage.setItem(this.localStorageKey, JSON.stringify(cloudSave));
                return { success: true, save: cloudSave, mode: 'cloud_loaded' };
            } else if (localSave) {
                await this.saveGame(userId, localSave);
                return { success: true, save: localSave, mode: 'initialized_cloud' };
            }

            return { success: true, save: null, mode: 'new_game' };
        } catch (err) {
            return { success: true, save: localSave, mode: 'fallback_local' };
        }
    }
}