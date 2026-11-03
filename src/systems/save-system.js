// 鱗片與種子：地下生態物語 | 統一存檔管理器 (Alpha 2.0)
// Scales & Seeds: Underground Ecosystem Tales - Unified Save System

import { CloudSaveSystem } from './cloud-save-system.js';

export class SaveSystem {
    constructor() {
        // 可於此處填入您的 Supabase 專案設定，若留空則自動退回本地 LocalStorage 模式
        const supabaseUrl = window.ENV_SUPABASE_URL || '';
        const supabaseKey = window.ENV_SUPABASE_KEY || '';
        
        this.cloudSave = new CloudSaveSystem(supabaseUrl, supabaseKey);
        this.currentUserId = window.ENV_USER_ID || 'ecologist_player_01';
    }

    /**
     * 取得 Alpha 2.0 統一存檔結構的預設初始資料
     */
    getDefaultSaveData() {
        return {
            version: "2.0.0",
            saveVersion: 2,
            updatedAt: Date.now(),
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
     * 載入遊戲進度（支援雲端同步與時間戳記衝突解決）
     */
    async loadGame() {
        try {
            const result = await this.cloudSave.loadGame(this.currentUserId);
            if (result.success && result.save) {
                console.log(`[SaveSystem] 成功載入存檔 (模式: ${result.mode})`);
                return result.save;
            }
        } catch (err) {
            console.warn('[SaveSystem] 雲端/本地載入發生異常，使用預設新遊戲存檔:', err);
        }
        return this.getDefaultSaveData();
    }

    /**
     * 儲存遊戲進度
     * @param {Object} gameState 當前遊戲狀態物件
     */
    async saveGame(gameState) {
        if (!gameState) return false;
        
        gameState.updatedAt = Date.now();
        const result = await this.cloudSave.saveGame(this.currentUserId, gameState);
        
        if (result.success) {
            console.log(`[SaveSystem] 遊戲存檔成功 (模式: ${result.mode})`);
            return true;
        } else {
            console.error('[SaveSystem] 遊戲存檔失敗:', result.error);
            return false;
        }
    }
}

// 掛載至全域以供 Phaser 場景直接呼叫
window.GameSaveSystem = SaveSystem;