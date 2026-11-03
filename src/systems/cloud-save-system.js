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
    writeLocalSave(user