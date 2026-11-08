// 鱗片與種子：地下生態物語
// Underground Scene - Settings & Language Selection
// AudioSystem V2.1 Integration

import { LanguageSystem } from '../systems/language-system.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ObservationJournalSystem } from '../systems/observation-journal-system.js';
import { getObservationSummary } from '../systems/terrarium-observation-interaction.js';

export class UndergroundScene extends Phaser.Scene {

    constructor() {

        super({ key: 'UndergroundScene' });

        this.gameState = null;

        this.settingsContainer = null;
        this.settingsOpen = false;

        this.autoSaveEvent = null;
    }

    // =====================================
    // 背景音樂預載
    // =====================================

    preload() {

        console.log(
            '[UndergroundScene] Preloading assets...'
        );

        AudioSystem.preloadSceneBGM(this);
    }

    // =====================================
    // 場景初始化
    // =====================================

    async create(data = {}) {

        console.log(
            '[UndergroundScene] Initializing scene...'
        );

        // 啟動地下研究所背景音樂
        AudioSystem.playSceneBGM(this);

        // 載入遊戲資料
        if (window.gameSaveManager) {

            this.gameState =
                await window.gameSaveManager.loadGame();

            console.log(
                '[UndergroundScene] Game state loaded:',
                this.gameState
            );

        } else {

            console.warn(
                '[UndergroundScene] gameSaveManager not found.'
            );
        }

        // 防止場景載入期間已經離開
        if (!this.scene.isActive()) {
            return;
        }

        this.renderUI();

        this.setupAutoSave();

        // 場景結束時清理自動存檔事件
        this.events.once('shutdown', () => {

            if (this.autoSaveEvent) {

                this.autoSaveEvent.remove();

                this.autoSaveEvent = null;
            }

            if (this.settingsContainer) {

                this.settingsContainer.destroy();

                this.settingsContainer = null;
            }

            this.settingsOpen = false;
        });
    }

    // =====================================
    // 主畫面
    // =====================================

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

        // 當前生態箱
        const activeTerrarium =
            this.gameState?.terrariums?.find(
                terrarium =>
                    terrarium.id ===
                    window.globalTerrariumSystem?.activeTerrariumId
            ) ||
            this.gameState?.terrariums?.[0];

        if (activeTerrarium) {

            const env = activeTerrarium.environment || {

                temperature: 24,
                humidity: 50,
                cleanliness: 100

            };

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
                `溫度: ${env.temperature}°C | 濕度: ${env.humidity}% | 潔淨度: ${env.cleanliness ?? 100}%`,
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

                this.scene.start(
                    'TerrariumSelectScene',
                    {
                        terrariumSystem: window.globalTerrariumSystem,
                        saveSystem: window.globalTerrariumSaveSystem
                    }
                );

            }
        );

        // 玩家可以隨時觀察真實的生態箱數據，並存入觀察日誌。
        // 観察操作不消耗 AP，也不設每日強制任務。
        const observeY = Math.max(235, height - 95);
        const observeButton = this.createButton(
            Math.max(16, width / 2 - 86),
            observeY,
            '🔎 觀察生態箱',
            '#66513b',
            () => this.observeCurrentTerrarium()
        );
        observeButton.setDepth(10);

        this.observationFeedback = this.add.text(
            width / 2, Math.min(height - 15, observeY + 43), '',
            {
                fontSize: '13px',
                color: '#efdfc4',
                backgroundColor: '#241a13',
                align: 'center',
                wordWrap: { width: Math.max(150, width - 32) }
            }
        ).setOrigin(0.5, 0).setDepth(10);

        // 設定
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

    // =====================================
    // 生態箱觀察（依存檔實際狀態記錄）
    // =====================================

    async observeCurrentTerrarium() {
        if (this.observationBusy) return;
        this.observationBusy = true;
        try {
            if (!this.gameState) {
                if (this.observationFeedback) this.observationFeedback.setText('無法取得存檔，請稍後再試。');
                return;
            }
            const summary = getObservationSummary(
                this.gameState,
                window.globalTerrariumSystem?.activeTerrariumId
            );
            if (!summary.ok) {
                if (this.observationFeedback) this.observationFeedback.setText(summary.message);
                return;
            }
            // Observational text does not imply undocumented behaviours or animal health.
            ObservationJournalSystem.addLog(this.gameState, 'environment', summary.message);
            if (!window.gameSaveManager?.saveGame) {
                if (this.observationFeedback) this.observationFeedback.setText('觀察已記錄於目前遊戲，但存檔服務尚不可用。');
                return;
            }
            const saved = await window.gameSaveManager.saveGame(this.gameState);
            if (!this.scene.isActive()) return;
            if (this.observationFeedback) {
                this.observationFeedback.setText(
                    saved === false
                        ? '觀察已記錄，但保存失敗；請確認存檔狀態。'
                        : '觀察完成，已寫入日誌：' + summary.message
                );
            }
        } catch (error) {
            console.error('[UndergroundScene] Observation failed:', error);
            if (this.observationFeedback && this.scene.isActive())
                this.observationFeedback.setText('觀察記錄未能完成，請稍後再試。');
        } finally {
            this.observationBusy = false;
        }
    }

    // =====================================
    // 一般按鈕
    // =====================================

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

    // =====================================
    // 開啟設定
    // =====================================

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

        overlay.setInteractive();

        // 設定面板
        const panelWidth = Math.min(
            width - 30,
            520
        );

        const panelHeight = Math.min(
            height - 30,
            430
        );

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

    // =====================================
    // 語言選項
    // =====================================

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

        const currentLanguage =
            LanguageSystem.getLanguage();

        const columns = 2;

        const gapX = Math.min(
            180,
            panelWidth * 0.40
        );

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
                    fixedWidth: Math.min(
                        155,
                        panelWidth * 0.42
                    ),
                    align: 'center'
                }
            ).setOrigin(0.5);

            button.setInteractive({
                useHandCursor: true
            });

            button.on('pointerdown', () => {

                if (
                    LanguageSystem.getLanguage() ===
                    language.code
                ) {
                    return;
                }

                LanguageSystem.setLanguage(
                    language.code
                );

                console.log(
                    '[LanguageSystem] Language changed:',
                    language.code
                );

                this.scene.restart();
            });

            this.settingsContainer.add(button);
        });
    }

    // =====================================
    // 關閉設定
    // =====================================

    closeSettings() {

        if (this.settingsContainer) {

            this.settingsContainer.destroy();

            this.settingsContainer = null;
        }

        this.settingsOpen = false;
    }

    // =====================================
    // 自動存檔
    // =====================================

    setupAutoSave() {

        // 避免重複建立自動存檔計時器
        if (this.autoSaveEvent) {

            this.autoSaveEvent.remove();

            this.autoSaveEvent = null;
        }

        this.autoSaveEvent = this.time.addEvent({

            delay: 60000,

            callback: async () => {

                if (
                    this.gameState &&
                    window.gameSaveManager
                ) {

                    console.log(
                        '[UndergroundScene] Performing periodic auto-save...'
                    );

                    try {

                        await window.gameSaveManager.saveGame(
                            this.gameState
                        );

                    } catch (error) {

                        console.error(
                            '[UndergroundScene] Auto-save failed:',
                            error
                        );
                    }
                }
            },

            loop: true
        });
    }
}

// =====================================
// 全域掛載
// =====================================

window.UndergroundScene = UndergroundScene;