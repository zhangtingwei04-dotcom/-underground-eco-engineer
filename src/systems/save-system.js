```javascript
// 鱗片與種子：地下生態物語 | 統一存檔管理器
// Scales & Seeds: Underground Ecosystem Tales - Unified Save System

import { CloudSaveSystem } from './cloud-save-system.js';
import { NewGameInitializer } from './new-game-initializer.js';

export class SaveSystem {

    constructor() {
        const supabaseUrl = window.ENV_SUPABASE_URL || '';
        const supabaseKey = window.ENV_SUPABASE_KEY || '';

        this.cloudSave = new CloudSaveSystem(
            supabaseUrl,
            supabaseKey
        );

        const savedMode = localStorage.getItem(
            'scales_seeds_login_mode'
        );

        this.isGuest = savedMode === 'guest' || !window.ENV_USER_ID;

        this.currentUserId = this.isGuest
            ? 'guest'
            : window.ENV_USER_ID;
    }

    /**
     * 切換訪客模式
     */
    enableGuestMode() {
        this.isGuest = true;
        this.currentUserId = 'guest';

        localStorage.setItem(
            'scales_seeds_login_mode',
            'guest'
        );

        console.log('[SaveSystem] 已切換為訪客模式');
    }

    /**
     * 切換雲端帳號模式
     */
    enableCloudMode(userId) {
        if (!userId || userId === 'guest') {
            throw new Error('無效的雲端帳號 ID');
        }

        this.isGuest = false;
        this.currentUserId = userId;

        localStorage.setItem(
            'scales_seeds_login_mode',
            'cloud'
        );

        console.log(
            `[SaveSystem] 已切換為雲端同步模式 (${userId})`
        );
    }

    /**
     * 訪客資料遷移至雲端帳號
     *
     * 遷移前先確認雲端帳號是否已有存檔。
     * 如果已有存檔，拒絕直接覆蓋。
     */
    async migrateGuestToCloud(newUserId) {

        if (!newUserId || newUserId === 'guest') {
            return {
                success: false,
                reason: 'invalid_user_id'
            };
        }

        if (!this.isGuest) {
            return {
                success: false,
                reason: 'not_guest_mode'
            };
        }

        try {
            // 1. 讀取原本的訪客存檔
            const localDataStr = localStorage.getItem(
                this.cloudSave.localStorageKey
            );

            if (!localDataStr) {
                return {
                    success: false,
                    reason: 'no_local_save'
                };
            }

            const gameState = JSON.parse(localDataStr);

            if (
                !gameState ||
                typeof gameState !== 'object' ||
                Array.isArray(gameState)
            ) {
                throw new Error('訪客存檔格式不正確');
            }

            // 2. 先檢查目標雲端帳號
            const accountResult = await this.cloudSave.loadGame(
                newUserId,
                false
            );

            // 目標帳號已存在存檔，不允許直接覆蓋
            if (accountResult.save) {
                return {
                    success: false,
                    reason: 'account_has_existing_save',
                    message: '此雲端帳號已有存檔，為避免覆蓋進度，已取消遷移。'
                };
            }

            // 雲端讀取失敗，無法確認帳號是否已有資料
            if (!accountResult.success) {
                return {
                    success: false,
                    reason: 'account_check_failed',
                    error: accountResult.error || '無法確認雲端帳號存檔狀態'
                };
            }

            // 3. 確認帳號沒有既有存檔後，才開始遷移
            gameState.updatedAt = Date.now();
            gameState.isGuestData = false;

            const result = await this.cloudSave.saveGame(
                newUserId,
                gameState,
                false
            );

            if (!result.success) {
                throw new Error(
                    result.error || '雲端同步寫入失敗'
                );
            }

            // 4. 遷移成功後才切換登入模式
            this.isGuest = false;
            this.currentUserId = newUserId;

            localStorage.setItem(
                'scales_seeds_login_mode',
                'cloud'
            );

            console.log(
                `[SaveSystem] 訪客資料成功遷移至雲端帳號：${newUserId}`
            );

            return {
                success: true,
                mode: 'migrated_to_cloud'
            };

        } catch (err) {

            console.error(
                '[SaveSystem] 訪客資料遷移失敗:',
                err
            );

            // 失敗時恢復訪客模式
            this.isGuest = true;
            this.currentUserId = 'guest';

            localStorage.setItem(
                'scales_seeds_login_mode',
                'guest'
            );

            return {
                success: false,
                reason: 'migration_failed',
                error: err.message
            };
        }
    }

    /**
     * 建立新玩家預設存檔
     *
     * 只有確認帳號真的沒有存檔時才應呼叫。
     */
    getDefaultSaveData() {

        const startingCreatures =
            NewGameInitializer.createStartingCreatures();

        return {
            version: '2.0.0',
            saveVersion: 2,
            updatedAt: Date.now(),
            isGuestData: this.isGuest,

            player: {
                actionPoints: 100,
                maxActionPoints: 100,
                lastApRegenTime: Date.now(),
                money: 1500,
                reputation: 10
            },

            terrariums: [
                {
                    id: 'terrarium_01',
                    name: '一號生態培育箱',
                    type: 'standard_desert',

                    environment: {
                        temperature: 29.5,
                        humidity: 55.0,
                        ventilation: 3,
                        cleanliness: 95
                    },

                    creatures: startingCreatures,

                    plants: [
                        {
                            id: 'succulent_01',
                            growth: 80,
                            health: 100
                        }
                    ],

                    decorations: [
                        'hide_box_wood',
                        'water_dish_small'
                    ]
                }
            ],

            inventory: {
                items: {
                    frozen_mouse: 6,
                    substrate_sand: 12,
                    shedding_supplement: 2
                }
            },

            journal: {
                unlockedMorphs: [
                    'normal',
                    'anaconda'
                ],

                unlockedPureColors: [],

                observedBehaviors: [
                    'burrowing',
                    'shedding'
                ]
            },

            settings: {
                language: 'zh-TW',
                soundVolume: 0.8
            }
        };
    }

    /**
     * 載入遊戲
     *
     * 只有在系統明確確認沒有存檔時，
     * 才建立新遊戲。
     *
     * 讀取失敗時不會擅自建立新存檔。
     */
    async loadGame() {

        try {
            const result = await this.cloudSave.loadGame(
                this.currentUserId,
                this.isGuest
            );

            // 1. 已成功取得存檔
            if (
                result.save &&
                typeof result.save === 'object' &&
                !Array.isArray(result.save)
            ) {
                if (!result.success) {
                    console.warn(
                        '[SaveSystem] 雲端讀取異常，改用可用的本地存檔:',
                        result.error || result.mode
                    );
                } else {
                    console.log(
                        `[SaveSystem] 成功載入存檔 (${result.mode})`
                    );
                }

                return result.save;
            }

            // 2. 確認沒有存檔，才建立新遊戲
            if (result.success && result.save === null) {

                console.log(
                    '[SaveSystem] 確認沒有既有存檔，建立新遊戲'
                );

                return this.getDefaultSaveData();
            }

            // 3. 讀取失敗，不建立新遊戲
            throw new Error(
                result.error ||
                `存檔讀取失敗 (${result.mode || 'unknown'})`
            );

        } catch (err) {

            console.error(
                '[SaveSystem] 存檔讀取失敗，為保護玩家進度，停止建立新存檔:',
                err
            );

            throw err;
        }
    }

    /**
     * 儲存遊戲
     *
     * 本地存檔成功即可視為資料已安全保存。
     * 雲端同步失敗時保留本地資料，等待後續同步。
     */
    async saveGame(gameState) {

        if (
            !gameState ||
            typeof gameState !== 'object' ||
            Array.isArray(gameState)
        ) {
            console.error('[SaveSystem] 無效的遊戲資料');
            return false;
        }

        try {
            gameState.updatedAt = Date.now();
            gameState.isGuestData = this.isGuest;

            const result = await this.cloudSave.saveGame(
                this.currentUserId,
                gameState,
                this.isGuest
            );

            // 本地與雲端都沒有成功保存
            if (
                !result.success &&
                !result.localSaved
            ) {
                console.error(
                    '[SaveSystem] 本地與雲端存檔皆失敗:',
                    result.error
                );

                return false;
            }

            // 本地成功，但雲端同步失敗
            if (
                !result.success &&
                result.localSaved
            ) {
                console.warn(
                    '[SaveSystem] 本地存檔成功，雲端同步暫時失敗，等待後續同步:',
                    result.error
                );

                return true;
            }

            console.log(
                `[SaveSystem] 存檔成功 (${result.mode})`
            );

            return true;

        } catch (err) {

            console.error(
                '[SaveSystem] 儲存遊戲發生錯誤:',
                err
            );

            return false;
        }
    }
}

window.GameSaveSystem = SaveSystem;
```