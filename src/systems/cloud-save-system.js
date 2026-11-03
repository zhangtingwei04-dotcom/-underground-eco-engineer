// 鱗片與種子：地下生態物語 | 雲端與本地存檔系統
// Scales & Seeds: Underground Ecosystem Tales - Cloud & Local Save Engine

export class CloudSaveSystem {

    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.client = null;

        // 訪客沿用舊版本地存檔 Key
        this.localStorageKey = 'scales_seeds_save_v2';

        this.initClient();
    }

    /**
     * 初始化 Supabase 客戶端
     */
    initClient() {
        if (
            !window.supabase ||
            !this.supabaseUrl ||
            !this.supabaseKey
        ) {
            console.warn('[SaveEngine] Supabase 設定不完整，雲端功能不可用');
            return;
        }

        try {
            this.client = window.supabase.createClient(
                this.supabaseUrl,
                this.supabaseKey
            );

            console.log('[SaveEngine] Supabase 客戶端已準備就緒');

        } catch (err) {
            this.client = null;
            console.error('[SaveEngine] Supabase 初始化失敗:', err);
        }
    }

    /**
     * 取得玩家專屬的本地存檔 Key
     *
     * 訪客沿用舊版 Key。
     * 雲端玩家依照 userId 分開儲存。
     */
    getLocalStorageKey(userId, isGuest = false) {
        if (isGuest || userId === 'guest') {
            return this.localStorageKey;
        }

        return `${this.localStorageKey}_user_${encodeURIComponent(userId)}`;
    }

    /**
     * 取得存檔時間戳記
     */
    getSaveTimestamp(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return 0;
        }

        const value = saveData.updatedAt;

        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : 0;
        }

        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isNaN(parsed) ? 0 : parsed;
        }

        return 0;
    }

    /**
     * 讀取本地存檔
     */
    readLocalSave(userId, isGuest = false) {
        const key = this.getLocalStorageKey(userId, isGuest);

        try {
            const localData = localStorage.getItem(key);

            if (!localData) {
                return {
                    success: true,
                    save: null
                };
            }

            const saveData = JSON.parse(localData);

            if (
                !saveData ||
                typeof saveData !== 'object' ||
                Array.isArray(saveData)
            ) {
                throw new Error('本地存檔格式不正確');
            }

            return {
                success: true,
                save: saveData
            };

        } catch (err) {
            console.error('[SaveEngine] 本地存檔讀取失敗:', err);

            return {
                success: false,
                save: null,
                error: err.message
            };
        }
    }

    /**
     * 寫入本地存檔
     */
    writeLocalSave(userId, gameState, isGuest = false) {
        const key = this.getLocalStorageKey(userId, isGuest);

        try {
            localStorage.setItem(
                key,
                JSON.stringify(gameState)
            );

            return {
                success: true
            };

        } catch (err) {
            console.error('[SaveEngine] 本地存檔寫入失敗:', err);

            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * 儲存遊戲
     *
     * 訪客：只儲存本地。
     * 雲端玩家：先寫入本地備份，再同步 Supabase。
     */
    async saveGame(userId, gameState, isGuest = false) {

        if (
            !gameState ||
            typeof gameState !== 'object' ||
            Array.isArray(gameState)
        ) {
            return {
                success: false,
                mode: 'invalid_save_data',
                error: '無效的遊戲存檔資料'
            };
        }

        if (!isGuest && (!userId || userId === 'guest')) {
            return {
                success: false,
                mode: 'invalid_user_id',
                error: '雲端帳號 ID 無效'
            };
        }

        gameState.updatedAt = Date.now();

        // 1. 先寫入玩家自己的本地存檔
        const localResult = this.writeLocalSave(
            userId,
            gameState,
            isGuest
        );

        // 2. 訪客模式：只使用本地存檔
        if (isGuest || userId === 'guest') {

            if (!localResult.success) {
                return {
                    success: false,
                    mode: 'guest_local_failed',
                    error: localResult.error
                };
            }

            console.log('[SaveEngine] 訪客存檔已儲存於本地');

            return {
                success: true,
                mode: 'guest_local_only',
                data: gameState
            };
        }

        // 3. 雲端帳號模式：確認雲端客戶端可用
        if (!this.client) {
            return {
                success: false,
                mode: 'cloud_unavailable',
                localSaved: localResult.success,
                error: 'Supabase 客戶端不可用，雲端存檔未同步'
            };
        }

        // 4. 上傳至 Supabase
        try {
            const { data, error } = await this.client
                .from('player_saves')
                .upsert({
                    user_id: userId,
                    save_json: gameState,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                throw error;
            }

            console.log('[SaveEngine] 雲端存檔同步成功');

            return {
                success: true,
                mode: localResult.success
                    ? 'cloud_synced'
                    : 'cloud_synced_local_backup_failed',
                localSaved: localResult.success,
                data
            };

        } catch (err) {
            console.error('[SaveEngine] 雲端同步失敗:', err);

            return {
                success: false,
                mode: 'fallback_local',
                localSaved: localResult.success,
                error: err.message
            };
        }
    }

    /**
     * 載入遊戲
     *
     * 訪客：讀取訪客本地存檔。
     * 雲端玩家：比較專屬本地存檔與雲端存檔時間。
     */
    async loadGame(userId, isGuest = false) {

        // 1. 讀取玩家專屬本地存檔
        const localResult = this.readLocalSave(
            userId,
            isGuest
        );

        const localSave = localResult.save;

        // 2. 訪客模式
        if (isGuest || userId === 'guest') {

            if (!localResult.success) {
                return {
                    success: false,
                    save: null,
                    mode: 'guest_local_read_failed',
                    error: localResult.error
                };
            }

            console.log('[SaveEngine] 訪客模式：讀取本地存檔');

            return {
                success: true,
                save: localSave,
                mode: 'guest_local_only'
            };
        }

        // 3. 雲端帳號必須有有效 ID
        if (!userId || userId === 'guest') {
            return {
                success: false,
                save: null,
                mode: 'invalid_user_id',
                error: '雲端帳號 ID 無效'
            };
        }

        // 4. 雲端客戶端不可用
        if (!this.client) {
            return {
                success: false,
                save: localSave,
                mode: 'cloud_unavailable',
                localSaved: localResult.success,
                error: 'Supabase 客戶端不可用'
            };
        }

        // 5. 雲端帳號模式：讀取 Supabase
        try {
            const { data, error } = await this.client
                .from('player_saves')
                .select('save_json, updated_at')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            // 6. 找到雲端存檔
            if (data !== null) {

                const cloudSave = data.save_json;

                if (
                    !cloudSave ||
                    typeof cloudSave !== 'object' ||
                    Array.isArray(cloudSave)
                ) {
                    throw new Error('雲端存檔格式不正確');
                }

                const cloudTime = this.getSaveTimestamp(cloudSave);
                const localTime = this.getSaveTimestamp(localSave);

                // 本地存檔較新：嘗試同步至雲端
                if (
                    localSave &&
                    localResult.success &&
                    localTime > cloudTime
                ) {
                    const syncResult = await this.saveGame(
                        userId,
                        localSave,
                        false
                    );

                    if (!syncResult.success) {
                        console.warn(
                            '[SaveEngine] 本地存檔較新，但雲端同步尚未完成'
                        );

                        return {
                            success: true,
                            save: localSave,
                            mode: 'local_newer_sync_failed',
                            warning: syncResult.error
                        };
                    }

                    return {
                        success: true,
                        save: localSave,
                        mode: 'resolved_local_newer'
                    };
                }

                // 雲端存檔較新或時間相同：以雲端為準
                const writeResult = this.writeLocalSave(
                    userId,
                    cloudSave,
                    false
                );

                return {
                    success: true,
                    save: cloudSave,
                    mode: writeResult.success
                        ? 'cloud_loaded'
                        : 'cloud_loaded_local_backup_failed',
                    localSaved: writeResult.success
                };
            }

            // 7. 雲端沒有存檔，但本地有該帳號的存檔
            if (localSave && localResult.success) {

                const syncResult = await this.saveGame(
                    userId,
                    localSave,
                    false
                );

                if (!syncResult.success) {
                    return {
                        success: true,
                        save: localSave,
                        mode: 'local_loaded_cloud_sync_failed',
                        warning: syncResult.error
                    };
                }

                return {
                    success: true,
                    save: localSave,
                    mode: 'initialized_cloud'
                };
            }

            // 8. 雲端與該帳號本地都沒有存檔
            if (!localResult.success) {
                return {
                    success: false,
                    save: null,
                    mode: 'local_read_failed',
                    error: localResult.error
                };
            }

            return {
                success: true,
                save: null,
                mode: 'new_game'
            };

        } catch (err) {

            console.error('[SaveEngine] 雲端讀取失敗:', err);

            // 雲端讀取失敗，但該帳號有可用本地存檔
            if (localSave && localResult.success) {
                return {
                    success: true,
                    save: localSave,
                    mode: 'fallback_local',
                    warning: err.message
                };
            }

            // 沒有本地備份，不能假裝已成功載入
            return {
                success: false,
                save: null,
                mode: 'cloud_load_failed',
                error: err.message
            };
        }
    }
}