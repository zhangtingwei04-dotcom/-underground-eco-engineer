// 鱗片與種子：地下生態物語 | 統一存檔管理器 (含訪客模式支援)
// Scales & Seeds: Underground Ecosystem Tales - Unified Save System

import { CloudSaveSystem } from './cloud-save-system.js';

export class SaveSystem {
    constructor() {
        const supabaseUrl = window.ENV_SUPABASE_URL || '';
        const supabaseKey = window.ENV_SUPABASE_KEY || '';
        
        this.cloudSave = new CloudSaveSystem(supabaseUrl, supabaseKey);
        
        // 讀取瀏覽器紀錄中玩家是否選擇了「訪客模式」
        const savedMode = localStorage.getItem('scales_seeds_login_mode');
        this.isGuest = savedMode === 'guest' || !window.ENV_USER_ID;
        this.currentUserId = this.isGuest ? 'guest' : (window.ENV_USER_ID || 'guest');
    }

    /**
     * 切換為訪客模式（只留存於瀏覽器）
     */
    enableGuestMode() {
        this.isGuest = true;
        this.currentUserId = 'guest';
        localStorage.setItem('scales_seeds_login_mode', 'guest');
        console.log('[SaveSystem] 已切換為：訪客模式 (無跨網同步功能)');
    }

    /**
     * 切換為雲端帳號模式
     * @param {string} userId 登入後的用戶 ID
     */
    enableCloudMode(userId) {
        this.isGuest = false;
        this.currentUserId = userId;
        localStorage.setItem('scales_seeds_login_mode', 'cloud');
        console.log(`[SaveSystem] 已切換為：雲端同步模式 (${userId})`);
    }

    /**
     * Alpha 2.0 預設初始存檔結構
     */
    getDefaultSaveData() {
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
                    creatures: [
                        {
                            id: "hognose_2026_001",
                            species: "western_hognose",
                            nickname: "布丁",
                            age: 864000,
                            growthStage: "juvenile",
                            health: 100,
                            hunger: 85,
                            hydration: 90,
                            stress: 5,
                            genetics: {
                                morph: "anaconda",
                                pattern: "patterned",
                                colorGene: "normal"
                            },
                            stats: {
                                energy: 90,
                                diggingPower: 15
                            }
                        }
                    ],
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

    /**
     * 載入遊戲進度
     */
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

    /**
     * 儲存遊戲進度
     */
    async saveGame(gameState) {
        if (!gameState) return false;
        
        gameState.updatedAt = Date.now();
        gameState.isGuestData = this.isGuest;

        const result = await this.cloudSave.saveGame(this.currentUserId, gameState, this.isGuest);
        return result.success;
    }
}

window.GameSaveSystem = SaveSystem;