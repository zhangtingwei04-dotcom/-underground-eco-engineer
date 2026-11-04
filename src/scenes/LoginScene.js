// 鱗片與種子：地下生態物語
// Login Scene - Responsive Layout & Collapsible Language Settings

import { LanguageSystem } from '../systems/language-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.languageMenuContainer = null;
    }

    create() {

        this.settingsContainer = null;
        this.languageMenuContainer = null;

        this.backgroundContainer = this.add.container(0, 0);
        this.layoutContainer = this.add.container(0, 0);
        this.particles = [];

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {

            if (this.settingsContainer) {
                this.settingsContainer.destroy();
                this.settingsContainer = null;
                this.languageMenuContainer = null;
            }

            this.drawLayout();
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
            0x263b32, 0x263b32,
            0x14241e, 0x14241e, 1
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
        graphics.fillCircle(
            x,
            y - 45 * size,
            30 * size
        );

        this.backgroundContainer.add(graphics);
    }

    handleResize() {

        if (!this.scene.isActive()) return;

        if (this.settingsContainer) {
            this.settingsContainer.destroy();
            this.settingsContainer = null;
            this.languageMenuContainer = null;
        }

        this.drawBackground();
        this.drawLayout();
    }

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
    }

    // 直向版面
    drawPortraitLayout(centerX, width, height) {

        const shortScreen = height < 650;

        this.addLayoutText(
            centerX,
            height * 0.12,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: width < 360 ? '22px' : '28px',
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
                fontSize: '18px',
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
                fontSize: '13px',
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

    // 橫向版面
    drawLandscapeLayout(centerX, width, height) {

        const margin = Math.max(18, width * 0.04);
        const contentWidth = Math.min(width - margin * 2, 650);

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
                fontSize: `${titleSize}px`,
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
                fontSize: `${welcomeSize}px`,
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
                fontSize: `${messageSize}px`,
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
            Math.max(12, 15 * scale)
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            Math.max(12, 15 * scale)
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap * 2,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            Math.max(12, 15 * scale)
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

    // 建立一般按鈕
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

        background.setStrokeStyle(
            2,
            0xc5b78e,
            0.9
        );

        const text = this.add.text(
            0,
            0,
            label,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: `${fontSize}px`,
                color: '#f5ecd9',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: width - 20 }
            }
        ).setOrigin(0.5);

        container.add([background, text]);

        background.setInteractive({
            useHandCursor: true
        });

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

    // 設定按鈕
    drawSettingsButton(width, height) {

        const button = this.add.text(
            width - 18,
            18,
            '⚙️',
            {
                fontSize: '27px',
                backgroundColor: '#344e3d',
                padding: {
                    x: 9,
                    y: 7
                }
            }
        ).setOrigin(1, 0);

        button.setInteractive({
            useHandCursor: true
        });

        button.on('pointerdown', () => {
            this.openSettings();
        });

        this.layoutContainer.add(button);
    }

    // 開啟設定視窗
    openSettings() {

        if (this.settingsContainer) return;

        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        const panelWidth = Math.min(width - 28, 460);
        const panelHeight = Math.min(height - 28, 500);

        const overlay = this.add.rectangle(
            centerX,
            centerY,
            width,
            height,
            0x000000,
            0.78
        );

        overlay.setInteractive();

        const panel = this.add.rectangle(
            centerX,
            centerY,
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

        const title = this.add.text(
            centerX,
            centerY - panelHeight / 2 + 35,
            '⚙️ 設定 / Settings',
            {
                fontSize: '23px',
                color: '#f3e8cb',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        const subtitle = this.add.text(
            centerX,
            centerY - panelHeight / 2 + 72,
            '選擇遊戲語言 / Select Language',
            {
                fontSize: '14px',
                color: '#d5c9a5'
            }
        ).setOrigin(0.5);

        this.settingsContainer.add([
            title,
            subtitle
        ]);

        this.createSettingsLanguages(
            centerX,
            centerY,
            panelWidth,
            panelHeight,
            false
        );

        const closeButton = this.add.text(
            centerX,
            centerY + panelHeight / 2 - 32,
            '關閉 / Close',
            {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#72513b',
                padding: {
                    x: 22,
                    y: 9
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

    // 十種語言收合式選單
    createSettingsLanguages(
        centerX,
        centerY,
        panelWidth,
        panelHeight,
        expanded = false
    ) {

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

        const current = languages.find(
            language => language.code === currentLanguage
        ) || languages[2];

        // 清除舊選單
        if (this.languageMenuContainer) {
            this.languageMenuContainer.destroy();
        }

        this.languageMenuContainer = this.add.container(0, 0);

        this.settingsContainer.add(
            this.languageMenuContainer
        );

        // 目前語言按鈕
        const currentButton = this.add.text(
            centerX,
            centerY - 65,
            `${current.name}  ${expanded ? '▲' : '▼'}`,
            {
                fontSize: '17px',
                color: '#f5d68d',
                backgroundColor: '#526b4e',
                padding: {
                    x: 20,
                    y: 12
                },
                fixedWidth: Math.min(260, panelWidth * 0.75),
                align: 'center'
            }
        ).setOrigin(0.5);

        currentButton.setInteractive({
            useHandCursor: true
        });

        currentButton.on('pointerdown', () => {

            this.createSettingsLanguages(
                centerX,
                centerY,
                panelWidth,
                panelHeight,
                !expanded
            );

        });

        this.languageMenuContainer.add(currentButton);

        // 收合狀態
        if (!expanded) {
            return;
        }

        // 展開狀態
        const columns = 2;
        const gapX = Math.min(170, panelWidth * 0.38);
        const rowGap = Math.min(36, panelHeight * 0.09);

        const startY = centerY - 15;

        languages.forEach((language, index) => {

            const column = index % columns;
            const row = Math.floor(index / columns);

            const x = centerX +
                (column === 0 ? -gapX / 2 : gapX / 2);

            const y = startY + row * rowGap;

            const selected =
                currentLanguage === language.code;

            const button = this.add.text(
                x,
                y,
                (selected ? '✓ ' : '') + language.name,
                {
                    fontSize: '14px',
                    color: selected ? '#f5d68d' : '#ffffff',
                    backgroundColor: selected
                        ? '#526b4e'
                        : '#344e3d',
                    padding: {
                        x: 8,
                        y: 7
                    },
                    fixedWidth: Math.min(150, panelWidth * 0.42),
                    align: 'center'
                }
            ).setOrigin(0.5);

            button.setInteractive({
                useHandCursor: true
            });

            button.on('pointerdown', () => {

                if (
                    LanguageSystem.getLanguage() === language.code
                ) {

                    this.createSettingsLanguages(
                        centerX,
                        centerY,
                        panelWidth,
                        panelHeight,
                        false
                    );

                    return;
                }

                LanguageSystem.setLanguage(language.code);

            });

            this.languageMenuContainer.add(button);

        });
    }

    // 關閉設定
    closeSettings() {

        if (this.settingsContainer) {

            this.settingsContainer.destroy();

            this.settingsContainer = null;
            this.languageMenuContainer = null;
        }
    }
}