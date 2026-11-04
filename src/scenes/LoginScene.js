
import { LanguageSystem } from '../systems/language-system.js';
import { SettingsSystem } from '../systems/settings-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.languageMenuExpanded = false;
        this.settingsCategory = 'language';
    }

    create() {
        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.languageMenuExpanded = false;
        this.settingsCategory = 'language';

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

        window.addEventListener('languageChanged', this.languageListener);

        this.events.once('shutdown', () => {
            window.removeEventListener(
                'languageChanged',
                this.languageListener
            );

            this.scale.off('resize', this.handleResize, this);
        });

        this.scale.on('resize', this.handleResize, this);
    }

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

    clearBackground() {
        this.particles.forEach(particle => particle.destroy());
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
            const x = Phaser.Math.Between(10, Math.max(11, width - 10));
            const y = Phaser.Math.Between(20, Math.max(21, height - 20));

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
        graphics.fillEllipse(x - 13 * size, y - 35 * size, 25 * size, 12 * size);
        graphics.fillEllipse(x + 13 * size, y - 48 * size, 25 * size, 12 * size);

        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(x, y - 45 * size, 30 * size);

        this.backgroundContainer.add(graphics);
    }

    handleResize() {
        if (!this.scene.isActive()) return;

        this.drawBackground();
        this.drawLayout();

        if (this.settingsContainer) {
            this.closeSettings();
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
            centerX, buttonStartY, buttonWidth, buttonHeight,
            LanguageSystem.t('login.start_exploring'), 'guestSelected'
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap, buttonWidth, buttonHeight,
            LanguageSystem.t('login.login'), 'loginSelected'
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap * 2, buttonWidth, buttonHeight,
            LanguageSystem.t('login.create_account'), 'registerSelected'
        );
    }

    drawLandscapeLayout(centerX, width, height) {
        const margin = Math.max(18, width * 0.04);
        const contentWidth = Math.min(width - margin * 2, 650);
        const textScale = this.getTextScale();

        const scale = Math.min(1, height / 390, width / 650);

        const titleSize = Math.max(18, 30 * scale);
        const welcomeSize = Math.max(13, 17 * scale);
        const messageSize = Math.max(10, 11 * scale);
        const top = Math.max(22, height * 0.09);

        this.addLayoutText(centerX, top, LanguageSystem.t('game.title'), {
            fontFamily: 'Georgia, serif',
            fontSize: `${titleSize * textScale}px`,
            color: '#f3e8cb',
            fontStyle: 'bold',
            stroke: '#243b2e',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: contentWidth }
        });

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
            centerX, buttonStartY, buttonWidth, buttonHeight,
            LanguageSystem.t('login.start_exploring'), 'guestSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap, buttonWidth, buttonHeight,
            LanguageSystem.t('login.login'), 'loginSelected',
            Math.max(12, 15 * scale * textScale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap * 2, buttonWidth, buttonHeight,
            LanguageSystem.t('login.create_account'), 'registerSelected',
            Math.max(12, 15 * scale * textScale)
        );
    }

    addLayoutText(x, y, content, style) {
        const text = this.add.text(x, y, content, style).setOrigin(0.5);
        this.layoutContainer.add(text);
        return text;
    }

    createResponsiveButton(x, y, width, height, label, eventName, fontSize = 18) {
        const container = this.add.container(x, y);

        const background = this.add.rectangle(
            0, 0, width, height, 0x344e3d, 0.96
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
        const button = this.add.text(width - 18, 18, '⚙️', {
            fontSize: '27px',
            backgroundColor: '#344e3d',
            padding: { x: 9, y: 7 }
        }).setOrigin(1, 0);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => this.openSettings());

        this.settingsButtonContainer.add(button);
    }

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
            centerX, centerY, width, height, 0x000000, 0.78
        );

        overlay.setInteractive();

        const panel = this.add.rectangle(
            centerX, centerY, panelWidth, panelHeight, 0x263b32, 1
        );

        panel.setStrokeStyle(3, 0xc5b78e, 1);

        this.settingsContainer.add([overlay, panel]);

        const title = this.add.text(
            centerX,
            centerY - panelHeight / 2 + 30,
            '⚙️ 設定中心 / Settings',
            {
                fontSize: '20px',
                color: '#f3e8cb',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        this.settingsContainer.add(title);

        const closeButton = this.add.text(
            centerX,
            centerY + panelHeight / 2 - 24,
            '關閉 / Close',
            {
                fontSize: '15px',
                color: '#ffffff',
                backgroundColor: '#72513b',
                padding: { x: 22, y: 7 }
            }
        ).setOrigin(0.5);

        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeSettings());

        this.settingsContainer.add(closeButton);

        this.buildSettingsPage();
    }

    // 五張插畫式分類卡片
    createSettingsCards(centerX, centerY, panelWidth, panelHeight) {
        const categories = [
            { id: 'language', title: '語言設定', subtitle: 'LANGUAGE', icon: 'globe', color: 0x567b69 },
            { id: 'screen', title: '畫面設定', subtitle: 'DISPLAY', icon: 'screen', color: 0x657b70 },
            { id: 'sound', title: '音效設定', subtitle: 'SOUND', icon: 'sound', color: 0x806b4e },
            { id: 'operation', title: '操作與體驗', subtitle: 'EXPERIENCE', icon: 'controller', color: 0x6d7650 },
            { id: 'system', title: '系統設定', subtitle: 'SYSTEM', icon: 'gear', color: 0x665f4c }
        ];

        const gap = 8;
        const cardWidth = (panelWidth - 36) / 2;
        const cardHeight = 57;
        const startX = centerX - cardWidth - gap / 2;
        const startY = centerY - panelHeight / 2 + 70;

        categories.forEach((category, index) => {
            const fullWidth = index === 4;
            const x = fullWidth
                ? centerX
                : startX + (index % 2) * (cardWidth + gap);

            const y = fullWidth
                ? startY + 2 * (cardHeight + gap)
                : startY + Math.floor(index / 2) * (cardHeight + gap);

            const w = fullWidth ? panelWidth - 24 : cardWidth;

            this.createCategoryCard(
                x, y, w, cardHeight, category
            );
        });
    }

    createCategoryCard(x, y, width, height, category) {
        const selected = this.settingsCategory === category.id;

        const card = this.add.container(x, y);

        const background = this.add.rectangle(
            0, 0, width, height,
            selected ? 0x82936b : category.color,
            0.98
        );

        background.setStrokeStyle(
            selected ? 3 : 1,
            selected ? 0xf0d69c : 0xb6aa83,
            1
        );

        card.add(background);

        const art = this.add.graphics();
        this.drawCardIcon(art, category.icon);
        card.add(art);

        const title = this.add.text(
            -width / 2 + 55,
            -7,
            category.title,
            {
                fontSize: '14px',
                color: '#fff4dc',
                fontStyle: 'bold'
            }
        ).setOrigin(0, 0.5);

        const subtitle = this.add.text(
            -width / 2 + 55,
            13,
            category.subtitle,
            {
                fontSize: '9px',
                color: '#e4d8b8'
            }
        ).setOrigin(0, 0.5);

        const arrow = this.add.text(
            width / 2 - 18,
            0,
            selected ? '▼' : '›',
            {
                fontSize: '18px',
                color: '#fff4dc'
            }
        ).setOrigin(0.5);

        card.add([title, subtitle, arrow]);

        background.setInteractive({ useHandCursor: true });

        background.on('pointerdown', () => {
            this.settingsCategory =
                this.settingsCategory === category.id ? null : category.id;

            this.languageMenuExpanded = false;
            this.buildSettingsPage();
        });

        this.settingsPageContainer.add(card);
    }

    drawCardIcon(graphics, type) {
        graphics.lineStyle(2, 0xf1e4c3, 1);
        graphics.fillStyle(0xf1e4c3, 0.12);

        if (type === 'globe') {
            graphics.strokeCircle(-1, 0, 15);
            graphics.strokeEllipse(-1, 0, 9, 29);
            graphics.beginPath();
            graphics.moveTo(-16, 0);
            graphics.lineTo(14, 0);
            graphics.strokePath();
            graphics.strokeEllipse(-1, 0, 29, 9);
        }

        if (type === 'screen') {
            graphics.strokeRoundedRect(-17, -12, 32, 22, 3);
            graphics.beginPath();
            graphics.moveTo(-1, 10);
            graphics.lineTo(-1, 16);
            graphics.moveTo(-9, 16);
            graphics.lineTo(7, 16);
            graphics.strokePath();
            graphics.fillCircle(8, -5, 2);
        }

        if (type === 'sound') {
            graphics.beginPath();
            graphics.moveTo(-15, -6);
            graphics.lineTo(-7, -6);
            graphics.lineTo(2, -14);
            graphics.lineTo(2, 14);
            graphics.lineTo(-7, 6);
            graphics.lineTo(-15, 6);
            graphics.closePath();
            graphics.strokePath();
            graphics.strokeArc(2, 0, 13, -0.9, 0.9, false);
            graphics.strokeArc(2, 0, 19, -0.9, 0.9, false);
        }

        if (type === 'controller') {
            graphics.strokeRoundedRect(-18, -9, 36, 19, 7);
            graphics.beginPath();
            graphics.moveTo(-10, 0);
            graphics.lineTo(-2, 0);
            graphics.moveTo(-6, -4);
            graphics.lineTo(-6, 4);
            graphics.strokePath();
            graphics.fillCircle(8, -2, 2);
            graphics.fillCircle(13, 3, 2);
        }

        if (type === 'gear') {
            graphics.strokeCircle(0, 0, 12);
            graphics.strokeCircle(0, 0, 5);
            for (let i = 0; i < 8; i++) {
                const angle = Math.PI * 2 * i / 8;
                const x1 = Math.cos(angle) * 12;
                const y1 = Math.sin(angle) * 12;
                const x2 = Math.cos(angle) * 17;
                const y2 = Math.sin(angle) * 17;

                graphics.beginPath();
                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
                graphics.strokePath();
            }
        }
    }

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

        this.createSettingsCards(
            centerX, centerY, panelWidth, panelHeight
        );

        if (!this.settingsCategory) return;

        const contentY = centerY - panelHeight / 2 + 270;

        if (this.settingsCategory === 'language') {
            this.buildLanguagePage(centerX, contentY, panelWidth, panelHeight);
        }

        if (this.settingsCategory === 'screen') {
            this.buildScreenPage(centerX, contentY);
        }

        if (this.settingsCategory === 'sound') {
            this.buildSoundPage(centerX, contentY);
        }

        if (this.settingsCategory === 'operation') {
            this.buildOperationPage(centerX, contentY);
        }

        if (this.settingsCategory === 'system') {
            this.buildSystemPage(centerX, contentY);
        }
    }

    addPageText(x, y, value, size = 15, color = '#ffffff') {
        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            align: 'center',
            wordWrap: {
                width: Math.min(this.scale.width - 70, 380)
            }
        }).setOrigin(0.5);

        this.settingsPageContainer.add(text);
        return text;
    }

    addPageButton(x, y, label, callback, width = 100) {
        const button = this.add.text(x, y, label, {
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#526b4e',
            padding: { x: 8, y: 7 },
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
            13,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX - 65,
            y + 27,
            '－',
            () => {
                const next = Math.max(
                    options.min,
                    Number(this.getSetting(key)) - options.step
                );

                this.setSetting(key, Number(next.toFixed(2)));
            },
            45
        );

        this.addPageButton(
            centerX + 65,
            y + 27,
            '＋',
            () => {
                const next = Math.min(
                    options.max,
                    Number(this.getSetting(key)) + options.step
                );

                this.setSetting(key, Number(next.toFixed(2)));
            },
            45
        );
    }

    addToggleRow(centerX, y, label, key) {
        const enabled = !!this.getSetting(key);

        this.addPageText(
            centerX - 30,
            y,
            `${label}：${enabled ? '開啟' : '關閉'}`,
            13,
            '#f3e8cb'
        );

        this.addPageButton(
            centerX + 100,
            y,
            enabled ? '關閉' : '開啟',
            () => this.setSetting(key, !enabled),
            70
        );
    }

    buildLanguagePage(centerX, startY, panelWidth, panelHeight) {
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
            startY,
            '選擇遊戲語言 / Select Language',
            13,
            '#d5c9a5'
        );

        this.addPageButton(
            centerX,
            startY + 32,
            `${current.name}  ${this.languageMenuExpanded ? '▲' : '▼'}`,
            () => {
                this.languageMenuExpanded = !this.languageMenuExpanded;
                this.buildSettingsPage();
            },
            Math.min(220, panelWidth - 50)
        );

        if (!this.languageMenuExpanded) return;

        const gapX = Math.min(75, panelWidth * 0.22);
        const listStartY = startY + 78;
        const rowGap = 27;

        languages.forEach((language, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);

            const x = centerX + (column === 0 ? -gapX : gapX);
            const y = listStartY + row * rowGap;

            const selected = currentCode === language.code;

            this.addPageButton(
                x,
                y,
                `${selected ? '✓ ' : ''}${language.name}`,
                () => LanguageSystem.setLanguage(language.code),
                Math.min(135, panelWidth * 0.40)
            );
        });
    }

    buildScreenPage(centerX, startY) {
        this.addPageText(centerX, startY, '畫面大小', 15, '#f3e8cb');

        this.addSettingRow(
            centerX, startY + 38, '介面比例', 'screenScale',
            {
                min: 0.8,
                max: 1.2,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addSettingRow(
            centerX, startY + 105, '文字大小', 'textSize',
            {
                min: 0.8,
                max: 1.4,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX, startY + 165,
            '調整後會立即套用於登入畫面',
            11, '#c8c8b5'
        );
    }

    buildSoundPage(centerX, startY) {
        this.addPageText(centerX, startY, '音效設定', 15, '#f3e8cb');

        this.addToggleRow(
            centerX, startY + 35, '背景音樂', 'backgroundMusicEnabled'
        );

        this.addSettingRow(
            centerX, startY + 82, '背景音樂音量',
            'backgroundMusicVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addToggleRow(
            centerX, startY + 145, '遊戲音效', 'soundEffectsEnabled'
        );

        this.addSettingRow(
            centerX, startY + 190, '遊戲音效音量',
            'soundEffectsVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value => `${Math.round(value * 100)}%`
            }
        );

        this.addPageText(
            centerX, startY + 245,
            '音效控制需等待遊戲音效系統接入',
            10, '#d5c9a5'
        );
    }

    buildOperationPage(centerX, startY) {
        this.addPageText(centerX, startY, '操作與體驗', 15, '#f3e8cb');

        this.addToggleRow(
            centerX, startY + 38, '操作提示', 'operationTipsEnabled'
        );

        this.addToggleRow(
            centerX, startY + 82, '場景動畫', 'animationsEnabled'
        );

        this.addToggleRow(
            centerX, startY + 126, '夜間模式', 'nightModeEnabled'
        );

        this.addToggleRow(
            centerX, startY + 170, '省電模式', 'powerSavingEnabled'
        );

        this.addPageText(
            centerX, startY + 225,
            '這些選項目前先保存設定值，其他場景將逐步接入。',
            10, '#d5c9a5'
        );
    }

    buildSystemPage(centerX, startY) {
        this.addPageText(centerX, startY, '系統設定', 15, '#f3e8cb');

        this.addPageText(
            centerX, startY + 45,
            '遊戲版本：Alpha 2.0',
            13, '#ffffff'
        );

        this.addPageText(
            centerX, startY + 78,
            '《鱗片與種子：地下生態物語》',
            11, '#d5c9a5'
        );

        this.addPageButton(
            centerX,
            startY + 130,
            '恢復預設設定',
            () => {
                SettingsSystem.reset();
                this.languageMenuExpanded = false;
                this.buildSettingsPage();
            },
            170
        );

        this.addPageText(
            centerX, startY + 185,
            '恢復預設只重設遊戲設定，不會刪除遊戲存檔。',
            10, '#d5c9a5'
        );
    }

    closeSettings() {
        if (this.settingsContainer) {
            this.settingsContainer.destroy();
        }

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.languageMenuExpanded = false;
    }
}
