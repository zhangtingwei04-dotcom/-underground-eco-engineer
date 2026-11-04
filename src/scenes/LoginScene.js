
// 鱗片與種子：地下生態物語
// Login Scene - Multilingual Underground Research Station

import { LanguageSystem } from '../systems/language-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });
    }

    create() {

        this.drawBackground();
        this.drawTitle();
        this.drawWelcome();
        this.drawButtons();
        this.drawLanguageSelector();

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
    }

    // 地下洞穴背景
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

    // 繪製植物
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

    // 遊戲標題
    drawTitle() {

        this.add.text(
            512,
            125,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '48px',
                color: '#f3e8cb',
                fontStyle: 'bold',
                stroke: '#243b2e',
                strokeThickness: 6,
                align: 'center',
                wordWrap: { width: 900 }
            }
        ).setOrigin(0.5);

        this.add.text(
            512,
            185,
            LanguageSystem.t('game.subtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                color: '#d5c9a5',
                align: 'center',
                wordWrap: { width: 850 }
            }
        ).setOrigin(0.5);
    }

    // 歡迎文字
    drawWelcome() {

        this.add.text(
            512,
            275,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '25px',
                color: '#f0e6ce',
                align: 'center'
            }
        ).setOrigin(0.5);

        this.add.text(
            512,
            325,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#d2d8c1',
                align: 'center',
                wordWrap: { width: 780 }
            }
        ).setOrigin(0.5);
    }

    // 建立按鈕
    createButton(x, y, label, eventName) {

        const container = this.add.container(x, y);

        const background = this.add.rectangle(
            0,
            0,
            330,
            62,
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
                fontSize: '21px',
                color: '#f5ecd9',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: 300 }
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
                scale: 1.04,
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

        return container;
    }

    // 三種入口功能
    drawButtons() {

        this.createButton(
            512,
            430,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected'
        );

        this.createButton(
            512,
            515,
            LanguageSystem.t('login.login'),
            'loginSelected'
        );

        this.createButton(
            512,
            600,
            LanguageSystem.t('login.create_account'),
            'registerSelected'
        );
    }

    // 十種語言選擇
    drawLanguageSelector() {

        this.add.text(
            512,
            680,
            LanguageSystem.t('ui.language'),
            {
                fontSize: '16px',
                color: '#e5dcc5'
            }
        ).setOrigin(0.5);

        const languages = LanguageSystem.getAvailableLanguages();

        const currentLanguage = LanguageSystem.getLanguage();

        const startX = 512 - ((languages.length - 1) * 82) / 2;

        languages.forEach((language, index) => {

            const x = startX + index * 82;

            const label = this.add.text(
                x,
                720,
                language.code,
                {
                    fontSize: '14px',
                    color: currentLanguage === language.code
                        ? '#f5d68d'
                        : '#c5c5b5',
                    fontStyle: currentLanguage === language.code
                        ? 'bold'
                        : 'normal'
                }
            ).setOrigin(0.5);

            label.setInteractive({
                useHandCursor: true
            });

            label.on('pointerdown', () => {
                LanguageSystem.setLanguage(language.code);
            });
        });
    }
}
