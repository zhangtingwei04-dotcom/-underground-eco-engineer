
// 鱗片與種子：地下生態物語
// Login Scene - Responsive Portrait & Landscape Layout

import { LanguageSystem } from '../systems/language-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });
    }

    create() {

        this.backgroundContainer = this.add.container(0, 0);
        this.layoutContainer = this.add.container(0, 0);
        this.particles = [];

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {
            this.scene.restart();
        };

        window.addEventListener('languageChanged', this.languageListener);

        this.events.once('shutdown', () => {
            window.removeEventListener('languageChanged', this.languageListener);
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

            const x = Phaser.Math.Between(10, Math.max(11, width - 10));
            const y = Phaser.Math.Between(20, Math.max(21, height - 20));

            const particle = this.add.circle(
                x, y,
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
            x - 13 * size, y - 35 * size,
            25 * size, 12 * size
        );

        graphics.fillEllipse(
            x + 13 * size, y - 48 * size,
            25 * size, 12 * size
        );

        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(x, y - 45 * size, 30 * size);

        this.backgroundContainer.add(graphics);
    }

    handleResize() {

        if (!this.scene.isActive()) return;

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
    }

    // 直向版面：保留原本配置
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
            height * 0.20,
            LanguageSystem.t('game.subtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '15px',
                color: '#d5c9a5',
                align: 'center',
                wordWrap: { width: width - 32 }
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.29,
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
            height * 0.36,
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
        const buttonStartY = height * 0.48;

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

        const languageY = Math.min(
            height - 90,
            buttonStartY + buttonGap * 3 + 5
        );

        this.drawResponsiveLanguages(
            centerX, languageY, width, true
        );
    }

    // 橫向版面：專門針對 iPhone 橫向小螢幕
    drawLandscapeLayout(centerX, width, height) {

        const margin = Math.max(18, width * 0.04);
        const contentWidth = Math.min(width - margin * 2, 650);

        // 依照高度縮放，避免文字過大
        const scale = Math.min(
            1,
            height / 390,
            width / 650
        );

        const titleSize = Math.max(18, 30 * scale);
        const subtitleSize = Math.max(11, 13 * scale);
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
            top + height * 0.105,
            LanguageSystem.t('game.subtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${subtitleSize}px`,
                color: '#d5c9a5',
                align: 'center',
                wordWrap: { width: contentWidth }
            }
        );

        this.addLayoutText(
            centerX,
            top + height * 0.22,
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
            top + height * 0.30,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: `${messageSize}px`,
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: contentWidth }
            }
        );

        // 三個按鈕垂直置中
        const buttonWidth = Math.min(260, width * 0.42);
        const buttonHeight = Math.max(34, Math.min(42, height * 0.12));
        const buttonGap = buttonHeight + Math.max(8, height * 0.025);

        const buttonStartY = height * 0.53;

        this.createResponsiveButton(
            centerX, buttonStartY,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected',
            Math.max(12, 15 * scale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            Math.max(12, 15 * scale)
        );

        this.createResponsiveButton(
            centerX, buttonStartY + buttonGap * 2,
            buttonWidth, buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            Math.max(12, 15 * scale)
        );

        this.drawResponsiveLanguages(
            centerX,
            height - 43,
            width,
            false
        );
    }

    addLayoutText(x, y, content, style) {

        const text = this.add.text(x, y, content, style).setOrigin(0.5);

        this.layoutContainer.add(text);

        return text;
    }

    createResponsiveButton(
        x, y, width, height, label, eventName, fontSize = 18
    ) {

        const container = this.add.container(x, y);

        const background = this.add.rectangle(
            0, 0,
            width, height,
            0x344e3d,
            0.96
        );

        background.setStrokeStyle(2, 0xc5b78e, 0.9);

        const text = this.add.text(
            0, 0,
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

    drawResponsiveLanguages(centerX, titleY, width, portrait) {

        this.addLayoutText(
            centerX,
            titleY,
            LanguageSystem.t('ui.language'),
            {
                fontSize: portrait ? '14px' : '11px',
                color: '#e5dcc5',
                align: 'center'
            }
        );

        const languages = LanguageSystem.getAvailableLanguages();
        const currentLanguage = LanguageSystem.getLanguage();

        const columns = portrait ? 5 : 10;

        const gapX = portrait
            ? Math.min(65, (width - 32) / columns)
            : Math.min(55, (width - 40) / columns);

        const gapY = portrait ? 24 : 17;
        const startY = titleY + (portrait ? 25 : 17);

        languages.forEach((language, index) => {

            const column = index % columns;
            const row = Math.floor(index / columns);

            const rowCount = Math.min(
                columns,
                languages.length - row * columns
            );

            const rowWidth = (rowCount - 1) * gapX;
            const startX = centerX - rowWidth / 2;

            const label = this.addLayoutText(
                startX + column * gapX,
                startY + row * gapY,
                language.code,
                {
                    fontSize: portrait ? '12px' : '10px',
                    color: currentLanguage === language.code
                        ? '#f5d68d'
                        : '#c5c5b5',
                    fontStyle: currentLanguage === language.code
                        ? 'bold'
                        : 'normal'
                }
            );

            label.setInteractive({ useHandCursor: true });

            label.on('pointerdown', () => {
                LanguageSystem.setLanguage(language.code);
            });
        });
    }
}
