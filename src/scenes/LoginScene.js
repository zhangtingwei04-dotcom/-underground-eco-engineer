// 鱗片與種子：地下生態物語
// Login Scene - Cozy Fantasy Underground Research Station

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

        // 監聽語言切換
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

    /**
     * 繪製溫馨地下生態背景
     */
    drawBackground() {

        const graphics = this.add.graphics();

        // 地下洞穴背景
        graphics.fillGradientStyle(
            0x263b32,
            0x263b32,
            0x14241e,
            0x14241e,
            1
        );

        graphics.fillRect(0, 0, 1024, 768);

        // 遠方暖色光源
        graphics.fillStyle(0xe6c58b, 0.12);
        graphics.fillCircle(510, 280, 230);

        graphics.fillStyle(0xd8b878, 0.08);
        graphics.fillCircle(510, 280, 160);

        // 地面
        graphics.fillStyle(0x17251d, 1);
        graphics.fillEllipse(512, 720, 1200, 230);

        // 左側岩石
        graphics.fillStyle(0x526354, 0.9);
        graphics.fillEllipse(70, 610, 240, 180);

        graphics.fillStyle(0x394b3d, 1);
        graphics.fillEllipse(950, 620, 280, 190);

        // 發光植物
        this.drawPlant(110, 590, 0x8fc99b);
        this.drawPlant(900, 600, 0x9bcf9a);
        this.drawPlant(190, 660, 0xb5d8a2);
        this.drawPlant(830, 670, 0xb5d8a2);

        // 空氣中的微光
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

    /**
     * 繪製植物
     */
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

    /**
     * 遊戲標題
     */
    drawTitle() {

        const title = this.add.text(
            512,
            125,
            LanguageSystem.t('gameTitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '58px',
                color: '#f3e8cb',
                fontStyle: 'bold',
                stroke: '#243b2e',
                strokeThickness: 6
            }
        );

        title.setOrigin(0.5);

        this.add.text(
            512,
            185,
            LanguageSystem.t('gameSubtitle'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                color: '#d5c9a5',
                letterSpacing: 3
            }
        ).setOrigin(0.5);
    }

    /**
     * 歡迎文字
     */
    drawWelcome() {

        this.add.text(
            512,
            275,
            LanguageSystem.t('welcome'),
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
            LanguageSystem.t('welcomeMessage'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#d2d8c1',
                align: 'center',
                wordWrap: {
                    width: 780
                }
            }
        ).setOrigin(0.5);
    }

    /**
     * 建立按鈕
     */
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
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        container.add([
            background,
            text
        ]);

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

    /**
     * 三種入口功能
     */
    drawButtons() {

        this.createButton(
            512,
            430,
            LanguageSystem.t('startExploring'),
            'guestSelected'
        );

        this.createButton(
            512,
            515,
            LanguageSystem.t('login'),
            'loginSelected'
        );

        this.createButton(
            512,
            600,
            LanguageSystem.t('createAccount'),
            'registerSelected'
        );
    }

    /**
     * 語言選擇
     */
    drawLanguageSelector() {

        this.add.text(
            512,
            700,
            `${LanguageSystem.t('language')}:`,
            {
                fontSize: '16px',
                color: '#e5dcc5'
            }
        ).setOrigin(0.5);

        const english = this.add.text(
            455,
            735,
            'English',
            {
                fontSize: '17px',
                color: LanguageSystem.isEnglish()
                    ? '#f5d68d'
                    : '#c5c5b5'
            }
        ).setOrigin(0.5);

        const chinese = this.add.text(
            570,
            735,
            '繁體中文',
            {
                fontSize: '17px',
                color: LanguageSystem.isTraditionalChinese()
                    ? '#f5d68d'
                    : '#c5c5b5'
            }
        ).setOrigin(0.5);

        english.setInteractive({
            useHandCursor: true
        });

        chinese.setInteractive({
            useHandCursor: true
        });

        english.on('pointerdown', () => {
            LanguageSystem.setLanguage('en');
        });

        chinese.on('pointerdown', () => {
            LanguageSystem.setLanguage('zh-TW');
        });
    }
}