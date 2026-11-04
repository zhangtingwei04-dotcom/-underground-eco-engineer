
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

        this.settingsCategory = null;
        this.settingsExpanded = false;

        this.particles = [];
    }

    create() {
        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;
        this.settingsPanel = null;

        this.settingsCategory = null;
        this.settingsExpanded = false;

        SettingsSystem.load();

        this.backgroundContainer = this.add.container(0, 0);
        this.layoutContainer = this.add.container(0, 0);

        this.settingsButtonContainer = this.add.container(0, 0);
        this.settingsButtonContainer.setDepth(1100);

        this.particles = [];

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {
            this.drawLayout();

            if (this.settingsExpanded) {
                this.refreshSettings();
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

        if (this.settingsExpanded) {
            this.refreshSettings();
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

        const wasOpen = this.settingsExpanded;
        const previousCategory = this.settingsCategory;

        if (wasOpen) {
            this.closeSettings();
        }

        this.drawBackground();
        this.drawLayout();

        if (wasOpen) {
            this.openSettings();

            if (previousCategory) {
                this.settingsCategory = previousCategory;
                this.refreshSettings();
            }
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
        const text = this.add.text(x, y, content, style)
            .setOrigin(0.5);

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
    // 單一設定圖示
    // ==============================

    drawSettingsButton(width, height) {
        const button = this.add.container(
            width - 30,
            32
        );

        const background = this.add.circle(
            0,
            0,
            23,
            0x344e3d,
            0.98
        );

        background.setStrokeStyle(
            2,
            0xc5b78e,
            1
        );

        const icon = this.add.text(
            0,
            0,
            '⚙️',
            {
                fontSize: '25px'
            }
        ).setOrigin(0.5);

        background.setInteractive({
            useHandCursor: true
        });

        background.on('pointerdown', () => {
            if (this.settingsExpanded) {
                this.closeSettings();
            } else {
                this.openSettings();
            }
        });

        button.add([background, icon]);

        this.settingsButtonContainer.add(button);
    }

    // ==============================
    // 五個設定分類
    // ==============================

    getSettingsCategories() {
        return [
            { id: 'language', icon: '🌐', label: '語言' },
            { id: 'screen', icon: '🖥️', label: '畫面' },
            { id: 'sound', icon: '🔊', label: '音效' },
            { id: 'operation', icon: '🎮', label: '操作' },
            { id: 'system', icon: '⚙️', label: '系統' }
        ];
    }

    openSettings() {
        if (this.settingsExpanded) return;

        this.settingsExpanded = true;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        this.settingsRail = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsRail);

        this.refreshSettingsRail();
    }

    // ==============================
    // 垂直展開分類
    // ==============================

    refreshSettingsRail() {
        if (!this.settingsRail) return;

        this.settingsRail.removeAll(true);

        const width = this.scale.width;

        const categories = this.getSettingsCategories();

        const startX = width - 30;
        const startY = 91;
        const spacing = 51;

        categories.forEach((category, index) => {
            const y = startY + index * spacing;

            const background = this.add.circle(
                startX,
                y,
                21,
                this.settingsCategory === category.id
                    ? 0x82936b
                    : 0x344e3d,
                0.98
            );

            background.setStrokeStyle(
                this.settingsCategory === category.id ? 2 : 1,
                0xc5b78e,
                1
            );

            const icon = this.add.text(
                startX,
                y,
                category.icon,
                {
                    fontSize: '21px'
                }
            ).setOrigin(0.5);

            background.setInteractive({
                useHandCursor: true
            });

            background.on('pointerdown', () => {
                this.selectSettingsCategory(category.id);
            });

            this.settingsRail.add([
                background,
                icon
            ]);

            if (index === 0) {
                this.tweens.add({
                    targets: [background, icon],
                    alpha: { from: 0, to: 1 },
                    x: { from: startX + 20, to: startX },
                    duration: 160,
                    delay: index * 35,
                    ease: 'Cubic.easeOut'
                });
            } else {
                this.tweens.add({
                    targets: [background, icon],
                    alpha: { from: 0, to: 1 },
                    x: { from: startX + 20, to: startX },
                    duration: 160,
                    delay: index * 35,
                    ease: 'Cubic.easeOut'
                });
            }
        });
    }

    // ==============================
    // 選取分類
    // ==============================

    selectSettingsCategory(category) {
        this.settingsCategory = category;

        this.refreshSettingsRail();
        this.buildSettingsPage();
    }

    refreshSettings() {
        if (!this.settingsExpanded) return;

        this.refreshSettingsRail();
        this.buildSettingsPage();
    }

    // ==============================
    // 設定內容面板
    // ==============================

    getSettingsPanelSize() {
        const sizes = {
            language: { width: 235, height: 250 },
            screen: { width: 235, height: 230 },
            sound: { width: 235, height: 340 },
            operation: { width: 235, height: 290 },
            system: { width: 235, height: 235 }
        };

        const size = sizes[this.settingsCategory] || sizes.language;

        return {
            width: Math.min(size.width, this.scale.width - 80),
            height: Math.min(size.height, this.scale.height - 20)
        };
    }

    buildSettingsPage() {
        if (!this.settingsContainer || !this.settingsCategory) {
            return;
        }

        if (this.settingsPageContainer) {
            this.settingsPageContainer.destroy();
            this.settingsPageContainer = null;
        }

        const size = this.getSettingsPanelSize();

        const panelWidth = size.width;
        const panelHeight = size.height;

        const width = this.scale.width;
        const height = this.scale.height;

        const iconSpacing = 51;
        const categoryIndex = this.getSettingsCategories().findIndex(
            item => item.id === this.settingsCategory
        );

        const anchorY = 91 + Math.max(0, categoryIndex) * iconSpacing;

        const panelX = width - 70 - panelWidth / 2;

        let panelY = anchorY + panelHeight / 2;

        if (panelY + panelHeight / 2 > height - 8) {
            panelY = anchorY - panelHeight / 2;
        }

        panelY = Phaser.Math.Clamp(
            panelY,
            panelHeight / 2 + 8,
            height - panelHeight / 2 - 8
        );

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
            0.97
        );

        this.settingsPanel.setStrokeStyle(
            2,
            0xc5b78e,
            1
        );

        this.settingsPanel.setInteractive();

        this.settingsContainer.add(this.settingsPanel);

        this.settingsPageContainer = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsPageContainer);

        const contentY = panelY - panelHeight / 2 + 30;

        switch (this.settingsCategory) {
            case 'language':
                this.buildLanguagePage(panelX, contentY, panelWidth);
                break;

            case 'screen':
                this.buildScreenPage(panelX, contentY);
                break;

            case 'sound':
                this.buildSoundPage(panelX, contentY);
                break;

            case 'operation':
                this.buildOperationPage(panelX, contentY);
                break;

            case 'system':
                this.buildSystemPage(panelX, contentY);
                break;
        }

        this.settingsPageContainer.setAlpha(0);

        this.tweens.add({
            targets: this.settingsPageContainer,
            alpha: 1,
            duration: 160,
            ease: 'Cubic.easeOut'
        });
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
                    this.settingsPanelWidth - 24,
                    215
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
    // 語言設定：兩排五面國旗
    // ==============================

    buildLanguagePage(centerX, startY, panelWidth) {
        const languages = [
            { code: 'zh-TW', flag: '🇹🇼', name: '繁中' },
            { code: 'zh-CN', flag: '🇨🇳', name: '简中' },
            { code: 'en', flag: '🇺🇸', name: 'EN' },
            { code: 'ja', flag: '🇯🇵', name: '日本語' },
            { code: 'ko', flag: '🇰🇷', name: '한국어' },
            { code: 'th', flag: '🇹🇭', name: 'ไทย' },
            { code: 'fr', flag: '🇫🇷', name: 'FR' },
            { code: 'de', flag: '🇩🇪', name: 'DE' },
            { code: 'es', flag: '🇪🇸', name: 'ES' },
            { code: 'pt-BR', flag: '🇧🇷', name: 'PT' }
        ];

        const currentCode = LanguageSystem.getLanguage();

        this.addPageText(
            centerX,
            startY,
            '選擇語言',
            15,
            '#f3e8cb'
        );

        const columns = 5;
        const gapX = Math.min(39, (panelWidth - 30) / 5);
        const gapY = 75;

        const startListY = startY + 65;

        languages.forEach((language, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);

            const x =
                centerX +
                (column - 2) * gapX;

            const y = startListY + row * gapY;

            const selected = currentCode === language.code;

            const background = this.add.rectangle(
                x,
                y,
                38,
                57,
                selected ? 0x647d58 : 0x344e3d,
                1
            );

            background.setStrokeStyle(
                selected ? 2 : 1,
                0xc5b78e,
                0.9
            );

            const flag = this.add.text(
                x,
                y - 8,
                language.flag,
                {
                    fontSize: '22px'
                }
            ).setOrigin(0.5);

            const name = this.add.text(
                x,
                y + 16,
                language.name,
                {
                    fontSize: '9px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

            background.setInteractive({
                useHandCursor: true
            });

            background.on('pointerdown', () => {
                LanguageSystem.setLanguage(language.code);
            });

            this.settingsPageContainer.add([
                background,
                flag,
                name
            ]);
        });

        this.addPageText(
            centerX,
            startListY + gapY + 47,
            '選擇你想使用的遊戲語言',
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
            y + 27,
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
            y + 27,
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
            centerX + 83,
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
            startY + 122,
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
            startY + 185,
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
            startY + 91,
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
            startY + 165,
            '遊戲音效',
            'soundEffectsEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 211,
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
            startY + 273,
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
                this.refreshSettings();
            },
            160
        );

        this.addPageText(
            centerX,
            startY + 205,
            '只重設遊戲設定，不會刪除遊戲存檔',
            10,
            '#d5c9a5'
        );
    }

    // ==============================
    // 關閉設定選單
    // ==============================

    closeSettings() {
        if (!this.settingsContainer) {
            this.settingsExpanded = false;
            this.settingsCategory = null;
            return;
        }

        this.tweens.killTweensOf(
            this.settingsContainer
        );

        if (this.settingsRail) {
            this.tweens.killTweensOf(
                this.settingsRail
            );
        }

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

        this.settingsCategory = null;
        this.settingsExpanded = false;
    }
}
