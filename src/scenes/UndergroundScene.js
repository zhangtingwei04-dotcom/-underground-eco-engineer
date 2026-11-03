// 鱗片與種子：地下生態物語 | 主地下場景 (Phaser 3)
// Scales & Seeds: Underground Ecosystem Tales - Underground Scene

export class UndergroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UndergroundScene' });
        this.gameState = null;
    }

    preload() {
        console.log('[UndergroundScene] Preloading assets...');
        // 此處可預載地下場景地圖 tiles、豬鼻蛇與生態箱素材
    }

    async create() {
        console.log('[UndergroundScene] Initializing scene...');

        // 1. 從全域 GameSaveManager 讀取最新進度 (支援雲端與離線比對)
        if (window.gameSaveManager) {
            this.gameState = await window.gameSaveManager.loadGame();
            console.log('[UndergroundScene] Game state loaded successfully:', this.gameState);
        } else {
            console.warn('[UndergroundScene] gameSaveManager not found, initializing fallback default data.');
        }

        // 2. 顯示當前地下生態學家資訊與第一座生態箱
        this.renderUI();
        
        // 3. 監聽自動存檔事件或定時存檔機制
        this.setupAutoSave();
    }

    renderUI() {
        const { width, height } = this.scale;
        
        // 背景色彩
        this.cameras.main.setBackgroundColor('#2b241f');

        // 主標題
        this.add.text(width / 2, 60, '鱗片與種子：地下生態物語', {
            fontSize: '32px',
            color: '#e6c894',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 玩家資訊 HUD
        const player = this.gameState?.player || { actionPoints: 100, money: 1500 };
        this.apText = this.add.text(40, 40, `行動值 (AP): ${player.actionPoints}/100`, {
            fontSize: '18px',
            color: '#a3d9c9'
        });

        this.moneyText = this.add.text(40, 70, `生態基金: $${player.money}`, {
            fontSize: '18px',
            color: '#f0c05a'
        });

        // 獲取目前啟用的生態箱
        const activeTerrarium = this.gameState?.terrariums?.[0];
        if (activeTerrarium) {
            const env = activeTerrarium.environment;
            this.add.text(width / 2, 140, `當前生態箱：${activeTerrarium.name}`, {
                fontSize: '22px',
                color: '#ffffff'
            }).setOrigin(0.5);

            this.add.text(width / 2, 180, `溫度: ${env.temperature}°C | 濕度: ${env.humidity}% | 潔淨度: ${env.cleanliness}%`, {
                fontSize: '16px',
                color: '#b0d0a0'
            }).setOrigin(0.5);
        }

        // 按鈕：切換至生態圖鑑
        const journalBtn = this.add.text(width - 150, 40, '📖 生態學家筆記', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#4a3b32',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });

        journalBtn.on('pointerdown', () => {
            this.scene.start('EncyclopediaScene');
        });

        // 按鈕：選擇生態箱
        const selectBtn = this.add.text(width - 150, 85, '🦎 生態箱管理', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#324a42',
            padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });

        selectBtn.on('pointerdown', () => {
            this.scene.start('TerrariumSelectScene');
        });
    }

    setupAutoSave() {
        // 設定每 60 秒進行一次自動背景存檔
        this.time.addEvent({
            delay: 60000,
            callback: async () => {
                if (this.gameState && window.gameSaveManager) {
                    console.log('[UndergroundScene] Performing periodic auto-save...');
                    await window.gameSaveManager.saveGame(this.gameState);
                }
            },
            loop: true
        });
    }
}

// 掛載至全域 window，確保 Phaser config 能順利存取
window.UndergroundScene = UndergroundScene;