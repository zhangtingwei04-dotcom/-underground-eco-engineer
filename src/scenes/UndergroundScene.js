
// 鱗片與種子：地下生態物語
// Underground Scene - Settings & Language Selection

import { LanguageSystem } from '../systems/language-system.js';

export class UndergroundScene extends Phaser.Scene {

    constructor() {
        super({ key: 'UndergroundScene' });

        this.gameState = null;
        this.settingsContainer = null;
        this.settingsOpen = false;
    }

    preload() {
        console.log('[UndergroundScene] Preloading assets...');
    }

    async create() {

        console.log('[UndergroundScene] Initializing scene...');

        if (window.gameSaveManager) {

            this.gameState = await window.gameSaveManager.loadGame();

            console.log(
                '[UndergroundScene] Game state loaded:',
                this.gameState
            );

        } else {

            console.warn(
                '[UndergroundScene] gameSaveManager not found.'
            );
        }

        this.renderUI();
        this.setupAutoSave();
    }

    renderUI() {

        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#2b241f');

        // 主標題
        this.add.text(
            width / 2,
            60,
            '鱗片與種子：地下生態物語',
            {
                fontSize: '32px',
                color: '#e6c894',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: {
                    width: width - 40
                }
            }
        ).setOrigin(0.5);

        // 玩家資訊
        const player = this.gameState?.player || {
            actionPoints: 100,
            money: 1500
        };

        this.apText = this.add.text(
            40,
            40,
            `行動值 (AP): ${player.actionPoints}/100`,
            {
                fontSize: '18px',
                color: '#a3d9c9'
            }
        );

        this.moneyText = this.add.text(
            40,
            70,
            `生態基金: $${player.money}`,
            {
                fontSize: '18px',
                color: '#f0c05a'
            }
        );

        // 目前啟用的生態箱
        const activeTerrarium = this.gameState?.terrariums?.[0];

        if (activeTerrarium) {

            const env = activeTerrarium.environment;

            this.add.text(
                width / 2,
                140,
                `當前生態箱：${activeTerrarium.name}`,
                {
                    fontSize: '22px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: {
                        width: width - 40
                    }
                }
            ).setOrigin(0.5);

            this.add.text(
                width / 2,
                180,
                `溫度: ${env.temperature}°C | 濕度: ${env.humidity}% | 潔淨度: ${env.cleanliness}%`,
                {
                    fontSize: '16px',
                    color: '#b0d0a0',
                    align: 'center',
                    wordWrap: {
                        width: width - 40
                    }
                }
            ).setOrigin(0.5);
        }

        // 生態圖鑑
        this.createButton(
            width - 170,
            40,
            '📖 生態學家筆記',
            '#4a3b32',
            () => {
                this.scene.start('EncyclopediaScene');
            }
        );

        // 生態箱管理
        this.createButton(
            width - 170,
            85,
            '🦎 生態箱管理',
            '#324a42',
            () => {
                this.scene.start('TerrariumSelectScene');
            }
        );

        // 新增設定按鈕
        this.createButton(
            width - 170,
            130,
            '⚙️ 設定',
            '#66513b',
            () => {
                this.openSettings();
            }
        );
    }

    // 建立一般按鈕
    createButton(x, y, label, color, callback) {

        const button = this.add.text(
            x,
            y,
            label,
            {
                fontSize: '17px',
                color: '#ffffff',
                backgroundColor: color,
                padding: {
                    x: 10,
                    y: 7
                }
            }
        ).setInteractive({
            useHandCursor: true
        });

        button.on('pointerdown', callback);

        return button;
    }

    // 開啟設定
    openSettings() {

        if (this.settingsOpen) return;

        this.settingsOpen = true;

        const { width, height } = this.scale;

        this.settingsContainer = this.add.container(0, 0);

        this.settingsContainer.setDepth(1000);

        // 半透明背景
        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.75
        );

        // 設定面板
        const panelWidth = Math.min(width - 30, 520);
        const panelHeight = Math.min(height - 30, 430);

        const panel = this.add.rectangle(
            width / 2,
            height / 2,
            panelWidth,
            panelHeight,
            0x263b32,
            1
        );

        panel.setStrokeStyle(
            3,
            0xc5b78e,
            1
        );

        this.settingsContainer.add([
            overlay,
            panel
        ]);

        // 標題
        const title = this.add.text(
            width / 2,
            height / 2 - panelHeight / 2 + 35,
            '⚙️ 遊戲設定',
            {
                fontSize: '25px',
                color: '#f3e8cb',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        this.settingsContainer.add(title);

        // 語言標題
        const languageTitle = this.add.text(
            width / 2,
            height / 2 - panelHeight / 2 + 85,
            '選擇遊戲語言 / Select Language',
            {
                fontSize: '16px',
                color: '#e5dcc5'
            }
        ).setOrigin(0.5);

        this.settingsContainer.add(languageTitle);

        // 語言選項
        this.createLanguageOptions(
            width / 2,
            height / 2 - 35,
            panelWidth
        );

        // 關閉按鈕
        const closeButton = this.add.text(
            width / 2,
            height / 2 + panelHeight / 2 - 35,
            '關閉設定',
            {
                fontSize: '17px',
                color: '#ffffff',
                backgroundColor: '#72513b',
                padding: {
                    x: 24,
                    y: 10
                }
            }
        ).setOrigin(0.5);

        closeButton.setInteractive({
            useHandCursor: true
        });

        closeButton.on('pointerdown', () => {
            this.closeSettings();
        });

        this.settingsContainer.add(closeButton);
    }

    // 建立語言選項
    createLanguageOptions(centerX, centerY, panelWidth) {

        const languages = [
            { code: 'zh-TW', name: '繁體中文' },
            { code: 'zh-CN', name: '简体中文' },
            { code: 'en', name: 'English' },
            { code: 'ja', name: '日本語' },
            { code: 'ko', name: '한국어' },
            { code: 'th', name: 'ไทย' },
            { code: 'fr', name: 'Français' },
            { code: 'de', name: 'Deutsch' },
            { code: 'es', name: 'Español' },
            { code: 'pt-BR', name: 'Português' }
        ];

        const currentLanguage = LanguageSystem.getLanguage();

        const columns = 2;
        const gapX = Math.min(180, panelWidth * 0.40);
        const gapY = 43;

        languages.forEach((language, index) => {

            const column = index % columns;
            const row = Math.floor(index / columns);

            const x = centerX +
                (column === 0 ? -gapX / 2 : gapX / 2);

            const y = centerY - 85 + row * gapY;

            const selected =
                currentLanguage === language.code;

            const button = this.add.text(
                x,
                y,
                (selected ? '✓ ' : '') + language.name,
                {
                    fontSize: '16px',
                    color: selected ? '#f5d68d' : '#ffffff',
                    backgroundColor: selected
                        ? '#526b4e'
                        : '#344e3d',
                    padding: {
                        x: 12,
                        y: 8
                    },
                    fixedWidth: Math.min(155, panelWidth * 0.42),
                    align: 'center'
                }
            ).setOrigin(0.5);

            button.setInteractive({
                useHandCursor: true
            });

            button.on('pointerdown', () => {

                if (LanguageSystem.getLanguage() === language.code) {
                    return;
                }

                LanguageSystem.setLanguage(language.code);

                console.log(
                    '[LanguageSystem] Language changed:',
                    language.code
                );

                // 重新載入目前場景
                this.scene.restart();
            });

            this.settingsContainer.add(button);
        });
    }

    // 關閉設定
    closeSettings() {

        if (this.settingsContainer) {

            this.settingsContainer.destroy();

            this.settingsContainer = null;
        }

        this.settingsOpen = false;
    }

    // 自動存檔
    setupAutoSave() {

        this.time.addEvent({

            delay: 60000,

            callback: async () => {

                if (
                    this.gameState &&
                    window.gameSaveManager
                ) {

                    console.log(
                        '[UndergroundScene] Performing periodic auto-save...'
                    );

                    await window.gameSaveManager.saveGame(
                        this.gameState
                    );
                }
            },

            loop: true
        });
    }
}

// 掛載至全域 window
window.UndergroundScene = UndergroundScene;
