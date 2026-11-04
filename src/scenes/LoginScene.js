// 鱗片與種子：地下生態物語
// Login Scene - Complete Settings Center

import { LanguageSystem } from '../systems/language-system.js';
import { SettingsSystem } from '../systems/settings-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.languageMenuExpanded = false;
        this.settingsCategory = 'language';
    }

    create() {

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.languageMenuExpanded = false;
        this.settingsCategory = 'language';

        SettingsSystem.load();

        this.backgroundContainer = this.add.container(0, 0);
        this.layoutContainer = this.add.container(0, 0);
        this.particles = [];

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {

            this.drawLayout();

            if (this.settingsContainer) {
                this.buildSettingsPage();
            }
        };

        window.addEventListener(
            'languageChanged',
            this.languageListener
        );

        this.events.once('shutdown', () => {

            window.removeEventListener(
                'languageChanged',
                this.languageListener
            );

            this.scale.off('resize', this.handleResize, this);
        });

        this.scale.on('resize', this.handleResize, this);
    }

    // ==============================
    // 基礎設定
    // ==============================

    getSetting(key) {
        return SettingsSystem.get(key);
    }

    setSetting(key, value) {

        SettingsSystem.set(key, value);

        if (key === 'screenScale' || key === 'textSize') {
            this.drawLayout();
        }

        if (this.settingsContainer) {
            this.buildSettingsPage();
        }
    }

    getScreenScale() {
        return Number(this.getSetting('screenScale')) || 1;
    }

    getTextScale() {
        return Number(this.getSetting('textSize')) || 1;
    }

    isPortrait() {
        return this.scale.height > this.scale.width;
    }

    // ==============================
    // 背景
    // ==============================

    clearBackground() {

        this.particles.forEach(particle => {
            particle.destroy();
        });

        this.particles = [];
        this.backgroundContainer.removeAll(true);
    }

    drawBackground() {

        this.clearBackground();

        const width = this.scale.width;
        const height = this.scale.height;

        const graphics = this.add.graphics();

        graphics.fillGradientStyle(
            0x263b32,
            0x263b32,
            0x14241e,
            0x14241e,
            1
        );

        graphics.fillRect(0, 0, width, height);

        graphics.fillStyle(0xe6c58b, 0.12);
        graphics.fillCircle(
            width * 0.5,
            height * 0.37,
            Math.min(width, height) * 0.36
        );

        graphics.fillStyle(0xd8b878, 0.08);
        graphics.fillCircle(
            width * 0.5,
            height * 0.37,
            Math.min(width, height) * 0.25
        );

        graphics.fillStyle(0x17251d, 1);
        graphics.fillEllipse(
            width * 0.5,
            height * 1.01,
            width * 1.35,
            height * 0.30
        );

        graphics.fillStyle(0x526354, 0.9);
        graphics.fillEllipse(
            width * 0.04,
            height * 0.87,
            width * 0.27,
            height * 0.24
        );

        graphics.fillStyle(0x394b3d, 1);
        graphics.fillEllipse(
            width * 0.96,
            height * 0.88,
            width * 0.30,
            height * 0.25
        );

        this.backgroundContainer.add(graphics);

        this.drawPlant(width * 0.11, height * 0.86, 0x8fc99b);
        this.drawPlant(width * 0.89, height * 0.87, 0x9bcf9a);
        this.drawPlant(width * 0.19, height * 0.96, 0xb5d8a2);
        this.drawPlant(width * 0.81, height * 0.96, 0xb5d8a2);

        const particleCount = Math.min(
            55,
            Math.max(20, Math.floor(width * height / 18000))
        );

        for (let i = 0; i < particleCount; i++) {

            const x = Phaser.Math.Between(
                10,
                Math.max(11, width - 10)
            );

            const y = Phaser.Math.Between(
                20,
                Math.max(21, height - 20)
            );

            const particle = this.add.circle(
                x,
                y,
                Phaser.Math.FloatBetween(1, 3),
                0xe8d9a5,
                0.55
            );

            this.backgroundContainer.add(particle);
            this.particles.push(particle);

            this.tweens.add({
                targets: particle,
                alpha: 0.12,
                y: y - Phaser.Math.Between(12, 35),
                duration: Phaser.Math.Between(1800, 3500),
                yoyo: true,
                repeat: -1
            });
        }
    }

    drawPlant(x, y, color) {

        const graphics = this.add.graphics();

        const plantScale = Math.min(
            this.scale.width / 1024,
            this.scale.height / 768
        );

        const size = Math.max(0.65, plantScale);

        graphics.lineStyle(4 * size, 0x789b72, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y - 55 * size);
        graphics.strokePath();

        graphics.fillStyle(color, 0.9);

        graphics.fillEllipse(
            x - 13 * size,
            y - 35 * size,
            25 * size,
            12 * size
        );

        graphics.fillEllipse(
            x + 13 * size,
            y - 48 * size,
            25 * size,
            12 * size
        );

        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(x, y - 45 * size, 30 * size);

        this.backgroundContainer.add(graphics);
    }

    // ==============================
    // 螢幕尺寸變更
    // ==============================

    handleResize() {

        if (!this.scene.isActive()) return;

        this.drawBackground();
        this.drawLayout();

        if (this.settingsContainer) {
            this.closeSettings();
        }
    }

    // ==============================
    // 登入畫面
    // ==============================

    clearLayout() {
        this.layoutContainer.removeAll(true);
    }

    drawLayout() {

        this.clearLayout();

        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;

        if (this.isPortrait()) {
            this.drawPortraitLayout(centerX, width, height);
        } else {
            this.drawLandscapeLayout(centerX, width, height);
        }

        this.drawSettingsButton(width, height);

        this.layoutContainer.setScale(this.getScreenScale());
    }

    drawPortraitLayout(centerX, width, height) {

        const shortScreen = height < 650;
        const textScale = this.getTextScale();

        this.addLayoutText(
            centerX,
            height * 0.12,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${(width < 360 ? 22 : 28) * textScale}px`,
                color: '#f3e8cb',
                fontStyle: 'bold',
                stroke: '#243b2e',
                strokeThickness: 4,
                align: 'center',
                wordWrap: { width: width - 32 }
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.23,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${18 * textScale}px`,
                color: '#f0e6ce',
                align: 'center',
                wordWrap: { width: width - 32 }
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.30,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: `${13 * textScale}px`,
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: width - 40 }
            }
        );

        const buttonWidth = Math.min(width - 48, 330);
        const buttonHeight = shortScreen ? 46 : 52;
        const buttonGap = shortScreen ? 58 : 66;
        const buttonStartY = height * 0.43;

        this.createResponsiveButton(
            centerX, buttonStartY,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected'
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected'
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap * 2,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected'
        );
    }

    drawLandscapeLayout(centerX, width, height) {

        const margin = Math.max(18, width * 0.04);
        const contentWidth = Math.min(width - margin * 2, 650);
        const textScale = this.getTextScale();

        const scale = Math.min(
            1,
            height / 390,
            width / 650
        );

        const titleSize = Math.max(18, 30 * scale);
        const welcomeSize = Math.max(13, 17 * scale);
        const messageSize = Math.max(10, 11 * scale);
        const top = Math.max(22, height * 0.09);

        this.addLayoutText(
            centerX,
            top,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${titleSize * textScale}px`,
                color: '#f3e8cb',
                fontStyle: 'bold',
                stroke: '#243b2e',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: contentWidth }
            }
        );

        this.addLayoutText(
            centerX,
            top + height * 0.16,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${welcomeSize * textScale}px`,
                color: '#f0e6ce',
                align: 'center',
                wordWrap: { width: contentWidth }
            }
        );

        this.addLayoutText(
            centerX,
            top + height * 0.24,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: `${messageSize * textScale}px`,
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: contentWidth }
            }
        );

        const buttonWidth = Math.min(260, width * 0.42);
        const buttonHeight = Math.max(34, Math.min(42, height * 0.12));
        const buttonGap = buttonHeight + Math.max(8, height * 0.025);
        const buttonStartY = height * 0.48;

        this.createResponsiveButton(
            centerX, buttonStartY,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap * 2,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            Math.max(12, 15 * scale * textScale)
        );
    }

    addLayoutText(x, y, content, style) {

        const text = this.add.text(x, y, content, style)
            .setOrigin(0.5);

        this.layoutContainer.add(text);

        return text;
    }

    createResponsiveButton(
        x, y, width, height,
        label, eventName, fontSize = 18
    ) {

        const container = this.add.container(x, y);

        const background = this.add.rectangle(
            0, 0, width, height,
            0x344e3d, 0.96
        );

        background.setStrokeStyle(2, 0xc5b78e, 0.9);

        const text = this.add.text(0, 0, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${fontSize}px`,
            color: '#f5ecd9',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 20 }
        }).setOrigin(0.5);

        container.add([background, text]);

        background.setInteractive({ useHandCursor: true });

        background.on('pointerover', () => {
            background.setFillStyle(0x58745a);

            this.tweens.add({
                targets: container,
                scale: 1.02,
                duration: 150
            });
        });

        background.on('pointerout', () => {
            background.setFillStyle(0x344e3d);

            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 150
            });
        });

        background.on('pointerdown', () => {
            this.events.emit(eventName);
        });

        this.layoutContainer.add(container);

        return container;
    }

    drawSettingsButton(width, height) {

        const button = this.add.text(
            width - 18,
            18,
            '⚙️',
            {
                fontSize: '27px',
                backgroundColor: '#344e3d',
                padding: { x: 9, y: 7 }
            }
        ).setOrigin(1, 0);

        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.openSettings();
        });

        this.layoutContainer.add(button);
    }

    // ==============================
    // 設定視窗
    // ==============================

    openSettings() {

        if (this.settingsContainer) return;

        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.settingsCategory = 'language';
        this.languageMenuExpanded = false;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        const panelWidth = Math.min(width - 28, 460);
        const panelHeight = Math.min(height - 28, 500);

        const overlay = this.add.rectangle(
            centerX, centerY,
            width, height,
            0x000000, 0.78
        );

        overlay.setInteractive();

        const panel = this.add.rectangle(
            centerX, centerY,
            panelWidth, panelHeight,
            0x263b32, 1
        );

        panel.setStrokeStyle(3, 0xc5b78e, 1);

        this.settingsContainer.add([overlay, panel]);

        const title = this.add.text(
            centerX,
            centerY - panelHeight / 2 + 32,
            '⚙️ 設定中心 / Settings',
            {
                fontSize: '21px',
                color: '#f3e8cb',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        this.settingsContainer.add(title);

        this.createSettingsTabs(
            centerX,
            centerY,
            panelWidth,
            panelHeight
        );

        const closeButton = this.add.text(
            centerX,
            centerY + panelHeight / 2 - 28,
            '關閉 / Close',
            {
                fontSize: '15px',
                color: '#ffffff',
                backgroundColor: '#72513b',
                padding: { x: 22, y: 8 }
            }
        ).setOrigin(0.5);

        closeButton.setInteractive({ useHandCursor: true });

        closeButton.on('pointerdown', () => {
            this.closeSettings();
        });

        this.settingsContainer.add(closeButton);

        this.buildSettingsPage();
    }

    // ==============================
    // 設定分類按鈕
    // ==============================

    createSettingsTabs(centerX, centerY, panelWidth, panelHeight) {

        const tabs = [
            { id: 'language', label: '語言' },
            { id: 'screen', label: '畫面' },
            { id: 'sound', label: '音效' },
            { id: 'operation', label: '操作' },
            { id: 'system', label: '系統' }
        ];

        const tabWidth = (panelWidth - 24) / 5;
        const startX = centerX - panelWidth / 2 + 12;
        const y = centerY - panelHeight / 2 + 76;

        tabs.forEach((tab, index) => {

            const x = startX + tabWidth * index + tabWidth / 2;

            const button = this.add.text(
                x,
                y,
                tab.label,
                {
                    fontSize: '13px',
                    color: '#ffffff',
                    backgroundColor:
                        this.settingsCategory === tab.id
                            ? '#647c55'
                            : '#344e3d',
                    padding: { x: 5, y: 9 },
                    fixedWidth: tabWidth - 3,
                    align: 'center'
                }
            ).setOrigin(0.5);

            button.setInteractive({ useHandCursor: true });

            button.on('pointerdown', () => {
                this.settingsCategory = tab.id;
                this.languageMenuExpanded = false;
                this.buildSettingsPage();
            });

            this.settingsContainer.add(button);
        });
    }

    // ==============================
    // 建立設定頁面
    // ==============================

    buildSettingsPage() {

        if (!this.settingsContainer) return;

        if (this.settingsPageContainer) {
            this.settingsPageContainer.destroy();
        }

        this.settingsPageContainer = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsPageContainer);

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const panelHeight = Math.min(this.scale.height - 28, 500);
        const panelWidth = Math.min(this.scale.width - 28, 460);

        const startY = centerY - panelHeight / 2 + 122;

        if (this.settingsCategory === 'language') {
            this.buildLanguagePage(centerX, centerY, panelWidth, panelHeight);
        }

        if (this.settingsCategory === 'screen') {
            this.buildScreenPage(centerX, startY);
        }

        if (this.settingsCategory === 'sound') {
            this.buildSoundPage(centerX, startY);
        }

        if (this.settingsCategory === 'operation') {
            this.buildOperationPage(centerX, startY);
        }

        if (this.settingsCategory === 'system') {
            this.buildSystemPage(centerX, startY);
        }
    }

    // ==============================
    // 通用文字
    // ==============================

    addPageText(x, y, value, size = 15, color = '#ffffff') {

        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            align: 'center',
            wordWrap: { width: Math.min(this.scale.width - 70, 380) }
        }).setOrigin(0.5);

        this.settingsPageContainer.add(text);

        return text;
    }

    addPageButton(x, y, label, callback, width = 100) {

        const button = this.add.text(x, y, label, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#526b4e',
            padding: { x: 10, y: 8 },
            fixedWidth: width,
            align: 'center'
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', callback);

        this.settingsPageContainer.add(button);

        return button;
    }

    addSettingRow(centerX, y, label, key, options = {}) {

        const currentValue = this.getSetting(key);

        this.addPageText(
            centerX,
            y,
            `${label}：${options.format ? options.format(currentValue) : currentValue}`,
            14,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX - 80,
            y + 29,
            '－',
            () => {
                const next = Math.max(
                    options.min,
                    Number(this.getSetting(key)) - options.step
                );

                this.setSetting(key, Number(next.toFixed(2)));
            },
            48
        );

        this.addPageButton(
            centerX + 80,
            y + 29,
            '＋',
            () => {
                const next = Math.min(
                    options.max,
                    Number(this.getSetting(key)) + options.step
                );

                this.setSetting(key, Number(next.toFixed(2)));
            },
            48
        );
    }

    addToggleRow(centerX, y, label, key) {

        const enabled = !!this.getSetting(key);

        this.addPageText(
            centerX - 35,
            y,
            `${label}：${enabled ? '開啟' : '關閉'}`,
            14,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX + 105,
            y,
            enabled ? '關閉' : '開啟',
            () => {
                this.setSetting(key, !enabled);
            },
            75
        );
    }

    // ==============================
    // 語言頁面
    // ==============================

    buildLanguagePage(centerX, centerY, panelWidth, panelHeight) {

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

        const currentCode = LanguageSystem.getLanguage();

        const current = languages.find(
            item => item.code === currentCode
        ) || languages[2];

        this.addPageText(
            centerX,
            centerY - panelHeight / 2 + 112,
            '選擇遊戲語言 / Select Language',
            14,
            '#d5c9a5'
        );

        const currentButton = this.addPageButton(
            centerX,
            centerY - panelHeight / 2 + 153,
            `${current.name}  ${this.languageMenuExpanded ? '▲' : '▼'}`,
            () => {
                this.languageMenuExpanded = !this.languageMenuExpanded;
                this.buildSettingsPage();
            },
            Math.min(250, panelWidth - 50)
        );

        if (!this.languageMenuExpanded) return;

        const gapX = Math.min(85, panelWidth * 0.23);
        const startY = centerY - panelHeight / 2 + 210;
        const rowGap = 38;

        languages.forEach((language, index) => {

            const column = index % 2;
            const row = Math.floor(index / 2);

            const x = centerX + (column === 0 ? -gapX : gapX);
            const y = startY + row * rowGap;

            const selected = currentCode === language.code;

            this.addPageButton(
                x,
                y,
                `${selected ? '✓ ' : ''}${language.name}`,
                () => {
                    LanguageSystem.setLanguage(language.code);
                },
                Math.min(145, panelWidth * 0.42)
            );
        });
    }

    // ==============================
    // 畫面設定
    // ==============================

    buildScreenPage(centerX, startY) {

        this.addPageText(centerX, startY, '畫面大小', 16, '#f3e8cb');

        this.addSettingRow(
            centerX,
            startY + 55,
            '介面比例',
            'screenScale',
            {
                min: 0.8,
                max: 1.2,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addSettingRow(
            centerX,
            startY + 145,
            '文字大小',
            'textSize',
            {
                min: 0.8,
                max: 1.4,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX,
            startY + 235,
            '調整後會立即套用於登入畫面',
            12,
            '#c8c8b5'
        );
    }

    // ==============================
    // 音效設定
    // ==============================

    buildSoundPage(centerX, startY) {

        this.addPageText(centerX, startY, '音效設定', 16, '#f3e8cb');

        this.addToggleRow(
            centerX,
            startY + 55,
            '背景音樂',
            'backgroundMusicEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 105,
            '背景音樂音量',
            'backgroundMusicVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addToggleRow(
            centerX,
            startY + 195,
            '遊戲音效',
            'soundEffectsEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 245,
            '遊戲音效音量',
            'soundEffectsVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX,
            startY + 330,
            '音效控制需等待遊戲音效系統接入',
            11,
            '#d5c9a5'
        );
    }

    // ==============================
    // 操作設定
    // ==============================

    buildOperationPage(centerX, startY) {

        this.addPageText(centerX, startY, '操作與體驗', 16, '#f3e8cb');

        this.addToggleRow(
            centerX,
            startY + 55,
            '操作提示',
            'operationTipsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 105,
            '場景動畫',
            'animationsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 155,
            '夜間模式',
            'nightModeEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 205,
            '省電模式',
            'powerSavingEnabled'
        );

        this.addPageText(
            centerX,
            startY + 275,
            '這些選項目前先保存設定值，其他場景將逐步接入。',
            11,
            '#d5c9a5'
        );
    }

    // ==============================
    // 系統設定
    // ==============================

    buildSystemPage(centerX, startY) {

        this.addPageText(centerX, startY, '系統設定', 16, '#f3e8cb');

        this.addPageText(
            centerX,
            startY + 65,
            '遊戲版本：Alpha 2.0',
            14,
            '#ffffff'
        );

        this.addPageText(
            centerX,
            startY + 110,
            '《鱗片與種子：地下生態物語》',
            12,
            '#d5c9a5'
        );

        this.addPageButton(
            centerX,
            startY + 190,
            '恢復預設設定',
            () => {
                SettingsSystem.reset();
                this.languageMenuExpanded = false;
                this.buildSettingsPage();
            },
            190
        );

        this.addPageText(
            centerX,
            startY + 250,
            '恢復預設只重設遊戲設定，不會刪除遊戲存檔。',
            11,
            '#d5c9a5'
        );
    }

    // ==============================
    // 關閉設定
    // ==============================

    closeSettings() {

        if (this.settingsContainer) {
            this.settingsContainer.destroy();
        }

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.languageMenuExpanded = false;
    }
}