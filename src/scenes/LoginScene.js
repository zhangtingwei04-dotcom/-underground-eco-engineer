
// 鱗片與種子：地下生態物語
// Login Scene - Responsive Portrait & Landscape

import { LanguageSystem } from '../systems/language-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });
    }

    create() {

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {
            this.scene.restart();
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
        });

        this.scale.on('resize', this.handleResize, this);

        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });
    }

    // 判斷目前方向
    isPortrait() {
        return this.scale.height > this.scale.width;
    }

    // 背景
    drawBackground() {

        const graphics = this.add.graphics();

        graphics.fillGradientStyle(
            0x263b32,
            0x263b32,
            0x14241e,
            0x14241e,
            1
        );

        graphics.fillRect(0, 0, 1024, 768);

        graphics.fillStyle(0xe6c58b, 0.12);
        graphics.fillCircle(510, 280, 230);

        graphics.fillStyle(0xd8b878, 0.08);
        graphics.fillCircle(510, 280, 160);

        graphics.fillStyle(0x17251d, 1);
        graphics.fillEllipse(512, 720, 1200, 230);

        graphics.fillStyle(0x526354, 0.9);
        graphics.fillEllipse(70, 610, 240, 180);

        graphics.fillStyle(0x394b3d, 1);
        graphics.fillEllipse(950, 620, 280, 190);

        this.drawPlant(110, 590, 0x8fc99b);
        this.drawPlant(900, 600, 0x9bcf9a);
        this.drawPlant(190, 660, 0xb5d8a2);
        this.drawPlant(830, 670, 0xb5d8a2);

        for (let i = 0; i < 35; i++) {

            const x = Phaser.Math.Between(30, 994);
            const y = Phaser.Math.Between(100, 700);

            const radius = Phaser.Math.FloatBetween(1, 3);

            const particle = this.add.circle(
                x,
                y,
                radius,
                0xe8d9a5,
                0.55
            );

            this.tweens.add({
                targets: particle,
                alpha: 0.15,
                y: y - Phaser.Math.Between(10, 35),
                duration: Phaser.Math.Between(1800, 3500),
                yoyo: true,
                repeat: -1
            });
        }
    }

    // 植物
    drawPlant(x, y, color) {

        const graphics = this.add.graphics();

        graphics.lineStyle(4, 0x789b72, 1);

        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y - 55);
        graphics.strokePath();

        graphics.fillStyle(color, 0.9);

        graphics.fillEllipse(
            x - 13,
            y - 35,
            25,
            12
        );

        graphics.fillEllipse(
            x + 13,
            y - 48,
            25,
            12
        );

        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(x, y - 45, 30);
    }

    // 重新排版
    handleResize() {

        if (!this.scene.isActive()) return;

        this.drawLayout();
    }

    // 清除舊版面
    clearLayout() {

        if (this.layoutContainer) {
            this.layoutContainer.destroy(true);
        }
    }

    // 建立版面
    drawLayout() {

        this.clearLayout();

        this.layoutContainer = this.add.container(0, 0);

        const portrait = this.isPortrait();

        const width = this.scale.width;
        const height = this.scale.height;

        if (portrait) {
            this.drawPortraitLayout(width, height);
        } else {
            this.drawLandscapeLayout(width, height);
        }
    }

    // 直向版面
    drawPortraitLayout(width, height) {

        const centerX = width / 2;

        const scaleFactor = Math.min(
            width / 390,
            height / 700
        );

        const titleSize = Math.max(
            23,
            Math.min(34, 34 * scaleFactor)
        );

        const subtitleSize = Math.max(
            13,
            Math.min(18, 18 * scaleFactor)
        );

        const buttonWidth = Math.min(width - 48, 330);
        const buttonHeight = 54;

        const compact = height < 650;

        const titleY = height * 0.13;
        const subtitleY = height * 0.20;
        const welcomeY = height * 0.30;
        const messageY = height * 0.37;

        const buttonStartY = compact
            ? height * 0.49
            : height * 0.48;

        const buttonGap = compact ? 65 : 72;

        const languageTitleY = Math.min(
            height - 95,
            buttonStartY + buttonGap * 3 + 5
        );

        this.addLayoutText(
            centerX,
            titleY,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${titleSize}px`,
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
            subtitleY,
            LanguageSystem.t('game.subtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${subtitleSize}px`,
                color: '#d5c9a5',
                align: 'center',
                wordWrap: { width: width - 40 }
            }
        );

        this.addLayoutText(
            centerX,
            welcomeY,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#f0e6ce',
                align: 'center',
                wordWrap: { width: width - 40 }
            }
        );

        this.addLayoutText(
            centerX,
            messageY,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: width - 48 }
            }
        );

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

        this.drawResponsiveLanguages(
            centerX,
            languageTitleY,
            width,
            height,
            true
        );
    }

    // 橫向版面
    drawLandscapeLayout(width, height) {

        const centerX = width / 2;

        const ratio = Math.min(
            width / 1024,
            height / 768
        );

        this.addLayoutText(
            centerX,
            height * 0.16,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${Math.max(27, 48 * ratio)}px`,
                color: '#f3e8cb',
                fontStyle: 'bold',
                stroke: '#243b2e',
                strokeThickness: 6,
                align: 'center',
                wordWrap: { width: width - 40 }
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.24,
            LanguageSystem.t('game.subtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '20px',
                color: '#d5c9a5',
                align: 'center'
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.36,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                color: '#f0e6ce',
                align: 'center'
            }
        );

        this.addLayoutText(
            centerX,
            height * 0.43,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '15px',
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: width - 100 }
            }
        );

        const buttonWidth = Math.min(330, width * 0.34);
        const buttonHeight = 55;

        const buttonGap = Math.min(78, height * 0.105);

        const buttonStartY = height * 0.59;

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

        this.drawResponsiveLanguages(
            centerX,
            height * 0.93,
            width,
            height,
            false
        );
    }

    // 加入版面文字
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

    // 自適應按鈕
    createResponsiveButton(
        x,
        y,
        width,
        height,
        label,
        eventName
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
                fontSize: '18px',
                color: '#f5ecd9',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: width - 24 }
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
                scale: 1.03,
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

    // 語言選單
    drawResponsiveLanguages(
        centerX,
        titleY,
        width,
        height,
        portrait
    ) {

        const title = this.addLayoutText(
            centerX,
            titleY,
            LanguageSystem.t('ui.language'),
            {
                fontSize: '14px',
                color: '#e5dcc5',
                align: 'center'
            }
        );

        const languages = LanguageSystem.getAvailableLanguages();

        const currentLanguage = LanguageSystem.getLanguage();

        const columns = portrait ? 5 : 10;

        const rows = Math.ceil(languages.length / columns);

        const gapX = portrait
            ? Math.min(65, (width - 32) / columns)
            : Math.min(82, (width - 40) / columns);

        const gapY = 25;

        const startY = titleY + 27;

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
                    fontSize: portrait ? '12px' : '14px',
                    color: currentLanguage === language.code
                        ? '#f5d68d'
                        : '#c5c5b5',
                    fontStyle: currentLanguage === language.code
                        ? 'bold'
                        : 'normal'
                }
            );

            label.setInteractive({
                useHandCursor: true
            });

            label.on('pointerdown', () => {
                LanguageSystem.setLanguage(language.code);
            });
        });
    }
}
