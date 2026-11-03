// 鱗片與種子：地下生態物語 | 統一存檔管理器 (含訪客模式與雲端遷移)
// Scales & Seeds: Underground Ecosystem Tales - Unified Save System

import { CloudSaveSystem } from './cloud-save-system.js';
import { NewGameInitializer } from './new-game-initializer.js';

export class SaveSystem {
    constructor() {
        const supabaseUrl = window.ENV_SUPABASE_URL || '';
        const supabaseKey = window.ENV_SUPABASE_KEY || '';
        
        this.cloudSave = new CloudSaveSystem(supabaseUrl, supabaseKey);
        
        const savedMode = localStorage.getItem('scales_seeds_login_mode');
        this.isGuest = savedMode === 'guest' || !window.ENV_USER_ID;
        this.currentUserId = this.isGuest ? 'guest' : (window.ENV_USER_ID || 'guest');
    }

    enableGuestMode() {
        this.isGuest = true;
        this.currentUserId = 'guest';
        localStorage.setItem('scales_seeds_login_mode', 'guest');
        console.log('[SaveSystem] 已切換為：訪客模式 (無跨網同步功能)');
    }

    enableCloudMode(userId) {
        this.isGuest = false;
        this.currentUserId = userId;
        localStorage.setItem('scales_seeds_login_mode', 'cloud');
        console.log(`[SaveSystem] 已切換為：雲端同步模式 (${userId})`);
    }

    /**
     * 【帳號升級/遷移】將當前訪客模式的本地存檔遷移至新註冊的雲端帳號
     * @param {string} newUserId 新註冊/登入的雲端使用者 ID
     */
    async migrateGuestToCloud(newUserId) {
        if (!newUserId || newUserId === 'guest') {
            console.warn('[SaveSystem] 遷移失敗：無效的新帳號 ID');
            return { success: false, reason: 'invalid_user_id' };
        }

        try {
            const localDataStr = localStorage.getItem(this.cloudSave.localStorageKey);
            if (!localDataStr) {
                console.log('[SaveSystem] 找不到本地訪客存檔，無法進行遷移');
                return { success: false, reason: 'no_local_save' };
            }

            const gameState = JSON.parse(localDataStr);

            this.isGuest = false;
            this.currentUserId = newUserId;
            localStorage.setItem('scales_seeds_login_mode', 'cloud');

            gameState.updatedAt = Date.now();
            gameState.isGuestData = false;

            const result = await this.cloudSave.saveGame(newUserId, gameState, false);

            if (result.success) {
                console.log(`[SaveSystem] 🎉 成功！訪客資料已順利遷移並綁定至雲端帳號：${newUserId}`);
                return { success: true, mode: 'migrated_to_cloud' };
            } else {
                throw new Error(result.error || '雲端同步寫入失敗');
            }
        } catch (err) {
            console.error('[SaveSystem] 訪客資料遷移過程發生異常:', err);
            this.isGuest = true;
            this.currentUserId = 'guest';
            return { success: false, reason: err.message };
        }
    }

    getDefaultSaveData() {

        // 由新遊戲初始化系統建立初始寵物
        const startingCreatures =
            NewGameInitializer.createStartingCreatures();

        return {
            version: "2.0.0",
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
                    id: "terrarium_01",
                    name: "一號生態培育箱",
                    type: "standard_desert",
                    environment: {
                        temperature: 29.5,
                        humidity: 55.0,
                        ventilation: 3,
                        cleanliness: 95
                    },
                    creatures: startingCreatures,
                    plants: [
                        {
                            id: "succulent_01",
                            growth: 80,
                            health: 100
                        }
                    ],
                    decorations: [
                        "hide_box_wood",
                        "water_dish_small"
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
                unlockedMorphs: ["normal", "anaconda"],
                unlockedPureColors: [],
                observedBehaviors: ["burrowing", "shedding"]
            },
            settings: {
                language: "zh-TW",
                soundVolume: 0.8,
                difficulty: "normal"
            }
        };
    }

    async loadGame() {
        try {
            const result = await this.cloudSave.loadGame(this.currentUserId, this.isGuest);
            if (result.success && result.save) {
                console.log(`[SaveSystem] 成功載入存檔 (${result.mode})`);
                return result.save;
            }
        } catch (err) {
            console.warn('[SaveSystem] 讀取異常，創建新遊戲存檔:', err);
        }
        return this.getDefaultSaveData();
    }

    async saveGame(gameState) {
        if (!gameState) return false;
        
        gameState.updatedAt = Date.now();
        gameState.isGuestData = this.isGuest;

        const result = await this.cloudSave.saveGame(this.currentUserId, gameState, this.isGuest);
        return result.success;
    }
}

window.GameSaveSystem = SaveSystem;