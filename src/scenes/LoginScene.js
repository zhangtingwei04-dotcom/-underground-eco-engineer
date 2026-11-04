
import { LanguageSystem } from '../systems/language-system.js';
import { SettingsSystem } from '../systems/settings-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.settingsRail = null;
        this.settingsPanel = null;

        this.settingsCategory = 'language';
        this.languageMenuExpanded = false;
        this.particles = [];
    }

    create() {
        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.settingsRail = null;
        this.settingsPanel = null;

        this.settingsCategory = 'language';
        this.languageMenuExpanded = false;

        SettingsSystem.load();

        this.backgroundContainer = this.add.container(0, 0);
        this.layoutContainer = this.add.container(0, 0);

        this.settingsButtonContainer = this.add.container(0, 0);
        this.settingsButtonContainer.setDepth(50);

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

            this.closeSettings();
        });

        this.scale.on('resize', this.handleResize, this);
    }

    // ==============================
    // 設定讀取與寫入
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
            this.tweens.killTweensOf(particle);
            particle.destroy();
        });

        this.particles = [];

        if (this.backgroundContainer) {
            this.backgroundContainer.removeAll(true);
        }
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
    // 螢幕尺寸調整
    // ==============================

    handleResize() {
        if (!this.scene.isActive()) return;

        const wasOpen = !!this.settingsContainer;
        const previousCategory = this.settingsCategory;

        if (wasOpen) {
            this.closeSettings();
        }

        this.drawBackground();
        this.drawLayout();

        if (wasOpen) {
            this.openSettings(previousCategory);
        }
    }

    clearLayout() {
        this.layoutContainer.removeAll(true);
    }

    drawLayout() {
        this.clearLayout();
        this.settingsButtonContainer.removeAll(true);

        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;

        if (this.isPortrait()) {
            this.drawPortraitLayout(centerX, width, height);
        } else {
            this.drawLandscapeLayout(centerX, width, height);
        }

        const scale = this.getScreenScale();

        this.layoutContainer.setScale(scale);

        this.layoutContainer.setPosition(
            centerX * (1 - scale),
            (height / 2) * (1 - scale)
        );

        this.drawSettingsButton(width, height);
    }

    // ==============================
    // 直式登入畫面
    // ==============================

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
            centerX,
            buttonStartY,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected'
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected'
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap * 2,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected'
        );
    }

    // ==============================
    // 橫式登入畫面
    // ==============================

    drawLandscapeLayout(centerX, width, height) {
        const margin = Math.max(18, width * 0.04);
        const contentWidth = Math.min(width - margin * 2, 650);
        const textScale = this.getTextScale();

        const scale = Math.min(1, height / 390, width / 650);

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

        const buttonHeight = Math.max(
            34,
            Math.min(42, height * 0.12)
        );

        const buttonGap = buttonHeight + Math.max(8, height * 0.025);
        const buttonStartY = height * 0.48;

        this.createResponsiveButton(
            centerX,
            buttonStartY,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap * 2,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            Math.max(12, 15 * scale * textScale)
        );
    }

    addLayoutText(x, y, content, style) {
        const text = this.add.text(
            x,
            y,
            content,
            style
        ).setOrigin(0.5);

        this.layoutContainer.add(text);

        return text;
    }

    createResponsiveButton(
        x,
        y,
        width,
        height,
        label,
        eventName,
        fontSize = 18
    ) {
        const container = this.add.container(x, y);

        const background = this.add.rectangle(
            0,
            0,
            width,
            height,
            0x344e3d,
            0.96
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

    // ==============================
    // 設定入口按鈕
    // ==============================

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

        this.settingsButtonContainer.add(button);
    }

    // ==============================
    // 開啟設定中心
    // ==============================

    openSettings(category = 'language') {
        if (this.settingsContainer) return;

        const width = this.scale.width;
        const height = this.scale.height;

        this.settingsCategory = category;
        this.languageMenuExpanded = false;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.58
        );

        overlay.setInteractive();

        overlay.on('pointerdown', () => {
            this.closeSettings();
        });

        this.settingsContainer.add(overlay);

        const railWidth = 64;

        const panelWidth = Math.min(
            320,
            Math.max(210, width - railWidth - 22)
        );

        const panelHeight = Math.max(
            280,
            Math.min(height - 24, 520)
        );

        const panelX = width - railWidth - panelWidth / 2 - 5;
        const panelY = height / 2;

        this.settingsPanelWidth = panelWidth;
        this.settingsPanelHeight = panelHeight;
        this.settingsPanelX = panelX;
        this.settingsPanelY = panelY;

        this.settingsPanel = this.add.rectangle(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            0x263b32,
            0.98
        );

        this.settingsPanel.setStrokeStyle(
            2,
            0xc5b78e,
            1
        );

        // 防止點擊面板空白處時誤觸背景遮罩
        this.settingsPanel.setInteractive();

        this.settingsContainer.add(this.settingsPanel);

        this.createSettingsRail(width, height);

        this.settingsPageContainer = null;

        this.buildSettingsPage();

        // 面板由右側滑入
        this.settingsPanel.x = width + panelWidth / 2;

        // 設定內容跟隨面板滑入
        if (this.settingsPageContainer) {
            this.settingsPageContainer.x = panelWidth + 40;
        }

        this.tweens.add({
            targets: this.settingsPanel,
            x: panelX,
            duration: 220,
            ease: 'Cubic.easeOut'
        });

        if (this.settingsPageContainer) {
            this.tweens.add({
                targets: this.settingsPageContainer,
                x: 0,
                duration: 220,
                ease: 'Cubic.easeOut'
            });
        }
    }

    // ==============================
    // 右側五個圖示
    // ==============================

    getSettingsCategories() {
        return [
            { id: 'language', icon: '🌐' },
            { id: 'screen', icon: '🖥️' },
            { id: 'sound', icon: '🔊' },
            { id: 'operation', icon: '🎮' },
            { id: 'system', icon: '⚙️' }
        ];
    }

    createSettingsRail(width, height) {
        this.settingsRail = this.add.container(0, 0);
        this.settingsRail.setDepth(10);

        this.settingsContainer.add(this.settingsRail);

        this.refreshSettingsRail();
    }

    refreshSettingsRail() {
        if (!this.settingsRail) return;

        this.settingsRail.removeAll(true);

        const width = this.scale.width;
        const height = this.scale.height;

        const categories = this.getSettingsCategories();

        const spacing = Math.min(62, height / 7);
        const startY = height / 2 - spacing * 2;

        categories.forEach((category, index) => {
            const y = startY + index * spacing;

            const selected =
                this.settingsCategory === category.id;

            const background = this.add.circle(
                width - 32,
                y,
                23,
                selected ? 0x82936b : 0x344e3d,
                0.98
            );

            background.setStrokeStyle(
                selected ? 2 : 1,
                0xc5b78e,
                1
            );

            const icon = this.add.text(
                width - 32,
                y,
                category.icon,
                {
                    fontSize: '22px'
                }
            ).setOrigin(0.5);

            background.setInteractive({
                useHandCursor: true
            });

            background.on('pointerdown', () => {
                this.settingsCategory = category.id;
                this.languageMenuExpanded = false;

                this.buildSettingsPage();
                this.refreshSettingsRail();
            });

            this.settingsRail.add([
                background,
                icon
            ]);
        });
    }

    // ==============================
    // 設定內容
    // ==============================

    buildSettingsPage() {
        if (!this.settingsContainer) return;

        if (this.settingsPageContainer) {
            this.tweens.killTweensOf(
                this.settingsPageContainer
            );

            this.settingsPageContainer.destroy();
        }

        // 重要：內容容器從 0,0 開始
        // 子物件使用畫面座標，不再重複加上 panelX
        const page = this.add.container(0, 0);

        this.settingsPageContainer = page;

        this.settingsContainer.add(page);

        const centerX = this.settingsPanelX;

        const top =
            this.settingsPanelY -
            this.settingsPanelHeight / 2;

        const panelWidth = this.settingsPanelWidth;

        // 標題
        const title = this.add.text(
            centerX,
            top + 32,
            '設定中心',
            {
                fontSize: '19px',
                color: '#f3e8cb',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        page.add(title);

        // 關閉按鈕
        const closeButton = this.add.text(
            centerX + panelWidth / 2 - 20,
            top + 30,
            '✕',
            {
                fontSize: '19px',
                color: '#f3e8cb'
            }
        ).setOrigin(0.5);

        closeButton.setInteractive({
            useHandCursor: true
        });

        closeButton.on('pointerdown', () => {
            this.closeSettings();
        });

        page.add(closeButton);

        // 分隔線
        const divider = this.add.rectangle(
            centerX,
            top + 58,
            panelWidth - 30,
            1,
            0xc5b78e,
            0.7
        );

        page.add(divider);

        const contentY = top + 88;

        switch (this.settingsCategory) {
            case 'language':
                this.buildLanguagePage(
                    centerX,
                    contentY,
                    panelWidth
                );
                break;

            case 'screen':
                this.buildScreenPage(centerX, contentY);
                break;

            case 'sound':
                this.buildSoundPage(centerX, contentY);
                break;

            case 'operation':
                this.buildOperationPage(centerX, contentY);
                break;

            case 'system':
                this.buildSystemPage(centerX, contentY);
                break;
        }
    }

    // ==============================
    // 文字與按鈕工具
    // ==============================

    addPageText(
        x,
        y,
        value,
        size = 14,
        color = '#ffffff'
    ) {
        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            align: 'center',
            wordWrap: {
                width: Math.min(
                    this.settingsPanelWidth - 35,
                    280
                )
            }
        }).setOrigin(0.5);

        this.settingsPageContainer.add(text);

        return text;
    }

    addPageButton(
        x,
        y,
        label,
        callback,
        width = 100
    ) {
        const button = this.add.text(x, y, label, {
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#526b4e',
            padding: { x: 8, y: 7 },
            fixedWidth: width,
            align: 'center'
        }).setOrigin(0.5);

        button.setInteractive({
            useHandCursor: true
        });

        button.on('pointerdown', callback);

        this.settingsPageContainer.add(button);

        return button;
    }

    // ==============================
    // 語言設定：十面國旗
    // ==============================

    buildLanguagePage(centerX, startY, panelWidth) {
        const languages = [
            { code: 'zh-TW', flag: '🇹🇼', name: '繁體中文' },
            { code: 'zh-CN', flag: '🇨🇳', name: '简体中文' },
            { code: 'en', flag: '🇺🇸', name: 'English' },
            { code: 'ja', flag: '🇯🇵', name: '日本語' },
            { code: 'ko', flag: '🇰🇷', name: '한국어' },
            { code: 'th', flag: '🇹🇭', name: 'ไทย' },
            { code: 'fr', flag: '🇫🇷', name: 'Français' },
            { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
            { code: 'es', flag: '🇪🇸', name: 'Español' },
            { code: 'pt-BR', flag: '🇧🇷', name: 'Português' }
        ];

        const currentCode = LanguageSystem.getLanguage();

        this.addPageText(
            centerX,
            startY,
            '選擇語言 / Language',
            13,
            '#d5c9a5'
        );

        const columns = 2;

        const gapX = Math.min(
            72,
            panelWidth * 0.25
        );

        const startListY = startY + 48;

        // 根據面板高度調整國旗間距
        const rowGap = Math.min(
            53,
            Math.max(
                35,
                (this.settingsPanelHeight - 190) / 5
            )
        );

        languages.forEach((language, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);

            const x =
                centerX +
                (column === 0 ? -gapX : gapX);

            const y = startListY + row * rowGap;

            const selected = currentCode === language.code;

            const button = this.add.text(
                x,
                y,
                `${language.flag}${selected ? ' ✓' : ''}`,
                {
                    fontSize: '25px',
                    backgroundColor: selected
                        ? '#526b4e'
                        : '#344e3d',
                    padding: { x: 12, y: 7 }
                }
            ).setOrigin(0.5);

            button.setInteractive({
                useHandCursor: true
            });

            button.on('pointerdown', () => {
                LanguageSystem.setLanguage(language.code);
            });

            this.settingsPageContainer.add(button);
        });

        this.addPageText(
            centerX,
            startListY + 5 * rowGap + 2,
            '點擊國旗即可切換語言',
            10,
            '#c5b78e'
        );
    }

    // ==============================
    // 數值設定工具
    // ==============================

    addSettingRow(
        centerX,
        y,
        label,
        key,
        options = {}
    ) {
        const currentValue = this.getSetting(key);

        const formatted = options.format
            ? options.format(currentValue)
            : currentValue;

        this.addPageText(
            centerX,
            y,
            `${label}：${formatted}`,
            12,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX - 55,
            y + 28,
            '－',
            () => {
                const next = Math.max(
                    options.min,
                    Number(this.getSetting(key)) - options.step
                );

                this.setSetting(
                    key,
                    Number(next.toFixed(2))
                );
            },
            45
        );

        this.addPageButton(
            centerX + 55,
            y + 28,
            '＋',
            () => {
                const next = Math.min(
                    options.max,
                    Number(this.getSetting(key)) + options.step
                );

                this.setSetting(
                    key,
                    Number(next.toFixed(2))
                );
            },
            45
        );
    }

    addToggleRow(centerX, y, label, key) {
        const enabled = !!this.getSetting(key);

        this.addPageText(
            centerX - 28,
            y,
            `${label}：${enabled ? '開啟' : '關閉'}`,
            12,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX + 93,
            y,
            enabled ? '關閉' : '開啟',
            () => {
                this.setSetting(key, !enabled);
            },
            65
        );
    }

    // ==============================
    // 畫面設定
    // ==============================

    buildScreenPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '畫面設定',
            15,
            '#f3e8cb'
        );

        this.addSettingRow(
            centerX,
            startY + 48,
            '介面比例',
            'screenScale',
            {
                min: 0.8,
                max: 1.2,
                step: 0.1,
                format: value =>
                    `${Math.round(value * 100)}%`
            }
        );

        this.addSettingRow(
            centerX,
            startY + 125,
            '文字大小',
            'textSize',
            {
                min: 0.8,
                max: 1.4,
                step: 0.1,
                format: value =>
                    `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX,
            startY + 190,
            '調整後會立即套用於登入畫面',
            10,
            '#c8c8b5'
        );
    }

    // ==============================
    // 音效設定
    // ==============================

    buildSoundPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '音效設定',
            15,
            '#f3e8cb'
        );

        this.addToggleRow(
            centerX,
            startY + 43,
            '背景音樂',
            'backgroundMusicEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 95,
            '背景音樂音量',
            'backgroundMusicVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value =>
                    `${Math.round(value * 100)}%`
            }
        );

        this.addToggleRow(
            centerX,
            startY + 170,
            '遊戲音效',
            'soundEffectsEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 220,
            '遊戲音效音量',
            'soundEffectsVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value =>
                    `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX,
            startY + 280,
            '音效控制需等待遊戲音效系統接入',
            10,
            '#d5c9a5'
        );
    }

    // ==============================
    // 操作與體驗
    // ==============================

    buildOperationPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '操作與體驗',
            15,
            '#f3e8cb'
        );

        this.addToggleRow(
            centerX,
            startY + 48,
            '操作提示',
            'operationTipsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 98,
            '場景動畫',
            'animationsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 148,
            '夜間模式',
            'nightModeEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 198,
            '省電模式',
            'powerSavingEnabled'
        );

        this.addPageText(
            centerX,
            startY + 260,
            '其他場景將逐步接入這些設定',
            10,
            '#d5c9a5'
        );
    }

    // ==============================
    // 系統設定
    // ==============================

    buildSystemPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '系統設定',
            15,
            '#f3e8cb'
        );

        this.addPageText(
            centerX,
            startY + 55,
            '遊戲版本：Alpha 2.0',
            12,
            '#ffffff'
        );

        this.addPageText(
            centerX,
            startY + 90,
            '《鱗片與種子：地下生態物語》',
            10,
            '#d5c9a5'
        );

        this.addPageButton(
            centerX,
            startY + 150,
            '恢復預設設定',
            () => {
                SettingsSystem.reset();

                this.languageMenuExpanded = false;

                this.buildSettingsPage();
                this.refreshSettingsRail();
            },
            160
        );

        this.addPageText(
            centerX,
            startY + 215,
            '只重設遊戲設定，不會刪除遊戲存檔',
            10,
            '#d5c9a5'
        );
    }

    // ==============================
    // 關閉設定中心
    // ==============================

    closeSettings() {
        if (!this.settingsContainer) return;

        this.tweens.killTweensOf(
            this.settingsContainer
        );

        if (this.settingsPanel) {
            this.tweens.killTweensOf(
                this.settingsPanel
            );
        }

        if (this.settingsPageContainer) {
            this.tweens.killTweensOf(
                this.settingsPageContainer
            );
        }

        if (this.settingsRail) {
            this.tweens.killTweensOf(
                this.settingsRail
            );
        }

        // 移除所有設定元件，避免關閉後殘留
        this.settingsContainer.removeAll(true);
        this.settingsContainer.destroy();

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;
        this.settingsPanel = null;

        this.settingsPanelWidth = null;
        this.settingsPanelHeight = null;
        this.settingsPanelX = null;
        this.settingsPanelY = null;

        this.languageMenuExpanded = false;
    }
}
