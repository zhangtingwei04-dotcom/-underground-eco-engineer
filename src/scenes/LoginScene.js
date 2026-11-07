// 鱗片與種子：地下生態物語
// Login Scene V3.2
// Dual Background + Rising Magical Particles + Smaller Wooden Start Button
// Phaser 3.80.1
// 保留原有語言、設定、音訊及響應式功能

import { AudioSystem } from '../systems/AudioSystem.js';
import { LanguageSystem } from '../systems/language-system.js';
import { SettingsSystem } from '../systems/settings-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.settingsRail = null;
        this.settingsRailItems = [];

        this.settingsCategory = null;
        this.settingsExpanded = false;

        this.particles = [];
        this.backgroundTweens = [];

        this.languageListener = null;
        this.languageReadyListener = null;

        this.backgroundKey = null;

        this.startButton = null;
        this.startButtonGlow = [];
        this.startButtonParticles = [];

        this.layoutTweens = [];
    }

    // =====================================
    // 背景圖片、木製按鈕與背景音樂預載
    // =====================================

    preload() {

        this.load.image(
            'login_background_landscape',
            'assets/images/login-background-landscape.jpg'
        );

        this.load.image(
            'login_background_portrait',
            'assets/images/login-background-portrait.jpg'
        );

        this.load.image(
            'btn_start_frame',
            'assets/images/ui/btn-start-frame.png'
        );

        this.load.on('loaderror', file => {

            if (file.key === 'btn_start_frame') {

                console.error(
                    '[LoginScene] 木板按鈕圖片載入失敗，將使用備用木牌。請確認路徑及大小寫：assets/images/ui/btn-start-frame.png'
                );
            }
        });

        AudioSystem.preloadSceneBGM(this);
    }

    // =====================================
    // 初始化
    // =====================================

    create() {

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;
        this.settingsRailItems = [];

        this.settingsCategory = null;
        this.settingsExpanded = false;

        this.startButton = null;
        this.startButtonGlow = [];
        this.startButtonParticles = [];

        this.layoutTweens = [];
        this.backgroundTweens = [];

        SettingsSystem.load();

        AudioSystem.playSceneBGM(this);

        this.backgroundContainer = this.add.container(0, 0);
        this.backgroundContainer.setDepth(-100);

        this.layoutContainer = this.add.container(0, 0);
        this.layoutContainer.setDepth(100);

        this.settingsButtonContainer = this.add.container(0, 0);
        this.settingsButtonContainer.setDepth(1100);

        this.particles = [];

        this.drawBackground();
        this.drawLayout();

        this.languageListener = () => {

            if (!this.scene.isActive()) return;

            this.drawLayout();

            if (this.settingsExpanded) {
                this.refreshSettings();
            }
        };

        this.languageReadyListener = () => {

            if (!this.scene.isActive()) return;

            this.drawLayout();

            if (this.settingsExpanded) {
                this.refreshSettings();
            }
        };

        window.addEventListener(
            'languageChanged',
            this.languageListener
        );

        window.addEventListener(
            'languageDictionariesReady',
            this.languageReadyListener
        );

        LanguageSystem.initialize()
            .then(() => {

                if (!this.scene.isActive()) return;

                this.drawLayout();

                if (this.settingsExpanded) {
                    this.refreshSettings();
                }

            })
            .catch(error => {

                console.error(
                    '[LoginScene] 語言初始化失敗',
                    error
                );

            });

        this.events.once('shutdown', () => {

            window.removeEventListener(
                'languageChanged',
                this.languageListener
            );

            window.removeEventListener(
                'languageDictionariesReady',
                this.languageReadyListener
            );

            this.scale.off(
                'resize',
                this.handleResize,
                this
            );

            this.closeSettings();

            this.clearLayout();
            this.clearBackground();
        });

        this.scale.on(
            'resize',
            this.handleResize,
            this
        );
    }

    // =====================================
    // 介面動畫管理
    // =====================================

    addLayoutTween(config) {

        const tween = this.tweens.add(config);

        this.layoutTweens.push(tween);

        return tween;
    }

    clearLayoutTweens() {

        this.layoutTweens.forEach(tween => {

            if (tween) {
                tween.stop();
            }

        });

        this.layoutTweens = [];
    }

    // =====================================
    // 設定讀取與寫入
    // =====================================

    getSetting(key) {
        return SettingsSystem.get(key);
    }

    setSetting(key, value) {

        SettingsSystem.set(key, value);

        if (
            key === 'screenScale' ||
            key === 'textSize'
        ) {
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

    // =====================================
    // 背景清理
    // =====================================

    clearBackground() {

        this.backgroundTweens.forEach(tween => {

            if (tween) {
                tween.stop();
            }

        });

        this.backgroundTweens = [];

        this.particles.forEach(particle => {

            if (!particle) return;

            this.tweens.killTweensOf(particle);

            if (particle.list) {

                particle.list.forEach(child => {
                    this.tweens.killTweensOf(child);
                });
            }

            particle.destroy();
        });

        this.particles = [];

        if (this.backgroundContainer) {
            this.backgroundContainer.removeAll(true);
        }

        this.backgroundKey = null;
    }

    // =====================================
    // 背景繪製
    // =====================================

    drawBackground() {

        this.clearBackground();

        const width = this.scale.width;
        const height = this.scale.height;

        const portrait = this.isPortrait();

        const imageKey = portrait
            ? 'login_background_portrait'
            : 'login_background_landscape';

        if (this.textures.exists(imageKey)) {

            const background = this.add.image(
                width / 2,
                height / 2,
                imageKey
            );

            background.setOrigin(0.5);

            const sourceWidth = background.width;
            const sourceHeight = background.height;

            const scale = Math.max(
                width / sourceWidth,
                height / sourceHeight
            );

            background.setScale(scale);

            this.backgroundContainer.add(background);

            this.backgroundKey = imageKey;

        } else {

            console.warn(
                `[LoginScene] 背景圖片尚未載入：${imageKey}`
            );

            this.drawFallbackBackground(width, height);
        }

        // 背景魔法微光粒子：從底部向上飄浮

        const particleCount = Math.min(
            100,
            Math.max(35, Math.floor(width * height / 12000))
        );

        const particleColors = [
            0xe8f6c7,
            0xffdf9b,
            0xa9e8c5
        ];

        for (let i = 0; i < particleCount; i++) {

            const x = Phaser.Math.Between(
                10,
                Math.max(11, width - 10)
            );

            const startY = height + Phaser.Math.Between(10, 100);

            const radius = Phaser.Math.FloatBetween(1, 2.5);

            const color = particleColors[
                Phaser.Math.Between(0, particleColors.length - 1)
            ];

            const particle = this.add.container(
                x,
                startY
            );

            const glow = this.add.circle(
                0,
                0,
                radius * 3.5,
                color,
                0.12
            );

            glow.setBlendMode(
                Phaser.BlendModes.ADD
            );

            const core = this.add.circle(
                0,
                0,
                radius,
                color,
                0.75
            );

            core.setBlendMode(
                Phaser.BlendModes.ADD
            );

            particle.add([
                glow,
                core
            ]);

            this.backgroundContainer.add(particle);
            this.particles.push(particle);

            const duration = Phaser.Math.Between(
                9000,
                16000
            );

            const drift = Phaser.Math.Between(
                -35,
                35
            );

            const targetX = Phaser.Math.Clamp(
                x + drift,
                5,
                width - 5
            );

            const riseTween = this.tweens.add({

                targets: particle,

                y: -30,

                x: targetX,

                alpha: {
                    from: 0.08,
                    to: Phaser.Math.FloatBetween(0.45, 0.85)
                },

                duration,

                delay: Phaser.Math.Between(0, 7000),

                repeat: -1,

                yoyo: false,

                ease: 'Sine.easeInOut'
            });

            this.backgroundTweens.push(riseTween);

            const glowTween = this.tweens.add({

                targets: glow,

                alpha: {
                    from: 0.08,
                    to: 0.32
                },

                scale: {
                    from: 0.75,
                    to: 1.4
                },

                duration: Phaser.Math.Between(1300, 2600),

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'
            });

            this.backgroundTweens.push(glowTween);

            const coreTween = this.tweens.add({

                targets: core,

                alpha: {
                    from: 0.25,
                    to: 0.95
                },

                scale: {
                    from: 0.75,
                    to: 1.2
                },

                duration: Phaser.Math.Between(1000, 2200),

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'
            });

            this.backgroundTweens.push(coreTween);
        }
    }

    // =====================================
    // 備用背景
    // =====================================

    drawFallbackBackground(width, height) {

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

    // =====================================
    // 螢幕尺寸調整
    // =====================================

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
                this.selectSettingsCategory(previousCategory);
            }
        }
    }

    clearLayout() {

        this.clearLayoutTweens();

        this.startButton = null;
        this.startButtonGlow = [];
        this.startButtonParticles = [];

        this.layoutContainer.removeAll(true);
    }

    // =====================================
    // 版面配置
    // =====================================

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

        this.drawLanguageButton(width, height);
        this.drawSettingsButton(width, height);
    }

    // =====================================
    // 直式登入畫面
    // =====================================

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
                stroke: '#392619',
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
            'guestSelected',
            18,
            true
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            18,
            true
        );

        this.createResponsiveButton(
            centerX,
            buttonStartY + buttonGap * 2,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            18,
            true
        );
    }

    // =====================================
    // 橫式登入畫面
    // =====================================

    drawLandscapeLayout(centerX, width, height) {

        const textScale = this.getTextScale();
        const margin = Math.max(16, width * 0.02);

        // 橫式不再放置大型底板，讓背景與巨蜥完整露出。
        // 文字及木製按鈕直接疊在背景上，以描邊和陰影維持辨識度。
        // 恢復原本左側操作區尺寸；僅將遊戲標題獨立置中，避免被操作內容擠壓。
        const leftAreaWidth = Math.min(width * 0.32, 330);
        const leftCenterX = Math.max(
            leftAreaWidth / 2 + margin,
            width * 0.17
        );

        const scale = Math.min(1, height / 390, width / 720);
        const titleSize = Math.max(20, 31 * scale);
        const welcomeSize = Math.max(13, 16 * scale);
        const messageSize = Math.max(10, 11 * scale);
        const top = Math.max(25, height * 0.085);

        // 遊戲標題獨立置於畫面上方中央，不與左側操作區重疊。
        this.addLayoutText(
            centerX,
            top,
            LanguageSystem.t('game.title'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${titleSize * textScale}px`,
                color: '#f6e9ca',
                fontStyle: 'bold',
                stroke: '#302014',
                strokeThickness: 5,
                shadow: {
                    offsetX: 1,
                    offsetY: 2,
                    color: '#160f0a',
                    blur: 6,
                    fill: true
                },
                align: 'center',
                wordWrap: { width: width * 0.58 }
            }
        );

        this.addLayoutText(
            leftCenterX,
            height * 0.255,
            LanguageSystem.t('login.welcome'),
            {
                fontFamily: 'Georgia, serif',
                fontSize: `${welcomeSize * textScale}px`,
                color: '#fff0d2',
                stroke: '#253329',
                strokeThickness: 4,
                shadow: { offsetX: 1, offsetY: 2, color: '#160f0a', blur: 4, fill: true },
                align: 'center',
                wordWrap: { width: leftAreaWidth - 16 }
            }
        );

        this.addLayoutText(
            leftCenterX,
            height * 0.335,
            LanguageSystem.t('login.welcome_message'),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: `${messageSize * textScale}px`,
                color: '#f3ead8',
                stroke: '#1b211b',
                strokeThickness: 4,
                shadow: { offsetX: 1, offsetY: 2, color: '#160f0a', blur: 4, fill: true },
                align: 'center',
                wordWrap: { width: leftAreaWidth - 24 }
            }
        );

        const buttonWidth = Math.min(leftAreaWidth - 18, 290);
        const buttonHeight = Math.max(38, Math.min(49, height * 0.125));
        const buttonGap = buttonHeight + Math.max(6, height * 0.018);
        const buttonStartY = height * 0.515;
        const buttonFontSize = Math.max(13, 16 * scale * textScale);

        this.createResponsiveButton(
            leftCenterX,
            buttonStartY,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.start_exploring'),
            'guestSelected',
            buttonFontSize,
            true
        );

        this.createResponsiveButton(
            leftCenterX,
            buttonStartY + buttonGap,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.login'),
            'loginSelected',
            buttonFontSize,
            true
        );

        this.createResponsiveButton(
            leftCenterX,
            buttonStartY + buttonGap * 2,
            buttonWidth,
            buttonHeight,
            LanguageSystem.t('login.create_account'),
            'registerSelected',
            buttonFontSize,
            true
        );
    }

    // =====================================
    // 一般文字
    // =====================================

    addLayoutText(x, y, content, style) {

        const text = this.add.text(x, y, content, style)
            .setOrigin(0.5);

        this.layoutContainer.add(text);

        return text;
    }
        // =====================================
    // 木製按鈕微光
    // =====================================

    createStartButtonGlow(container, width, height) {

        // 光暈與木牌同步縮小至 65%
        const glowScale = 0.65;

        const visualWidth = width * glowScale;
        const visualHeight = height * glowScale;

        const layers = [
            {
                padding: 17 * glowScale,
                alpha: 0.045
            },
            {
                padding: 11 * glowScale,
                alpha: 0.075
            },
            {
                padding: 6 * glowScale,
                alpha: 0.12
            }
        ];

        layers.forEach((layer, index) => {

            const glow = this.add.graphics();

            glow.fillStyle(
                0xffd879,
                layer.alpha
            );

            glow.fillRoundedRect(
                -visualWidth / 2 - layer.padding,
                -visualHeight / 2 - layer.padding,
                visualWidth + layer.padding * 2,
                visualHeight + layer.padding * 2,
                15 * glowScale
            );

            container.add(glow);

            this.startButtonGlow.push(glow);

            this.addLayoutTween({

                targets: glow,

                alpha: {
                    from: 0.55,
                    to: 1
                },

                scaleX: {
                    from: 0.985,
                    to: 1.025
                },

                scaleY: {
                    from: 0.985,
                    to: 1.025
                },

                duration: 1700 + index * 300,

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'
            });
        });

        // 周圍裝飾粒子同步縮小
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {

            const angle =
                (Math.PI * 2 / particleCount) * i;

            const radiusX = visualWidth / 2 + 13 * glowScale;
            const radiusY = visualHeight / 2 + 12 * glowScale;

            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;

            const particle = this.add.circle(
                x,
                y,
                (1.4 + (i % 3) * 0.5) * glowScale,
                0xffe8a8,
                0.8
            );

            particle.setBlendMode(
                Phaser.BlendModes.ADD
            );

            container.add(particle);

            this.startButtonParticles.push(particle);

            this.addLayoutTween({

                targets: particle,

                x: x + (i % 2 === 0 ? 5 : -5) * glowScale,

                y: y - (6 + (i % 3) * 3) * glowScale,

                alpha: {
                    from: 0.12,
                    to: 0.95
                },

                scale: {
                    from: 0.7,
                    to: 1.35
                },

                duration: 1500 + i * 170,

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'
            });
        }
    }

    // =====================================
    // 開始按鈕點擊光效
    // =====================================

    pulseStartButton() {

        if (!this.startButton) return;

        this.addLayoutTween({

            targets: this.startButton,

            scale: 1.045,

            duration: 130,

            yoyo: true,

            ease: 'Sine.easeOut'
        });

        this.startButtonGlow.forEach(glow => {

            this.addLayoutTween({

                targets: glow,

                alpha: 1,

                duration: 180,

                yoyo: true,

                ease: 'Sine.easeOut'
            });
        });
    }

    // =====================================
    // 備用木製按鈕
    // 圖片載入失敗時使用
    // =====================================

    createFallbackWoodenButton(width, height) {

        // 備用木牌尺寸同步縮小至 65%
        const buttonScale = 0.82;

        width *= buttonScale;
        height *= buttonScale;

        const wood = this.add.graphics();

        const left = -width / 2;
        const top = -height / 2;

        wood.fillStyle(0x24160d, 1);

        wood.fillRoundedRect(
            left - 2,
            top - 2,
            width + 4,
            height + 4,
            10
        );

        wood.fillStyle(0x98602f, 1);

        wood.fillRoundedRect(
            left,
            top,
            width,
            height,
            9
        );

        wood.fillStyle(0x694020, 1);

        wood.fillRoundedRect(
            left + 4,
            top + 4,
            width - 8,
            height - 8,
            7
        );

        wood.fillStyle(0x85512b, 1);

        wood.fillRoundedRect(
            left + 7,
            top + 7,
            width - 14,
            height - 14,
            5
        );

        wood.lineStyle(
            1.5,
            0xd6aa69,
            0.95
        );

        wood.strokeRoundedRect(
            left + 5,
            top + 5,
            width - 10,
            height - 10,
            6
        );

        wood.lineStyle(
            1,
            0x4d2c18,
            0.42
        );

        wood.beginPath();
        wood.moveTo(left + 16, top + height * 0.30);
        wood.lineTo(left + width - 16, top + height * 0.30);
        wood.strokePath();

        wood.beginPath();
        wood.moveTo(left + 18, top + height * 0.72);
        wood.lineTo(left + width - 18, top + height * 0.72);
        wood.strokePath();

        wood.fillStyle(0x4b2a17, 0.55);

        wood.fillEllipse(
            left + 14,
            0,
            5,
            3
        );

        wood.fillEllipse(
            left + width - 14,
            0,
            5,
            3
        );

        wood.fillStyle(0xf1d29a, 0.9);

        wood.fillCircle(
            left + 9,
            top + 9,
            1.5
        );

        wood.fillCircle(
            left + width - 9,
            top + 9,
            1.5
        );

        wood.fillCircle(
            left + 9,
            top + height - 9,
            1.5
        );

        wood.fillCircle(
            left + width - 9,
            top + height - 9,
            1.5
        );

        return wood;
    }

    // =====================================
    // 響應式按鈕
    // useImage = true 時使用木製按鈕
    // =====================================

    createResponsiveButton(
        x,
        y,
        width,
        height,
        label,
        eventName,
        fontSize = 18,
        useImage = false
    ) {

        const container = this.add.container(x, y);

        if (useImage) {

            // 僅「開始探索」保留呼吸光暈，避免三個按鈕同時閃爍。
            if (eventName === 'guestSelected') {
                this.createStartButtonGlow(
                    container,
                    width,
                    height
                );
            }

            const buttonScale = 0.82;

            const visualWidth = width * buttonScale;
            const visualHeight = height * buttonScale;

            // 優先使用正式木牌圖片
            if (this.textures.exists('btn_start_frame')) {

                const woodenImage = this.add.image(
                    0,
                    0,
                    'btn_start_frame'
                );

                woodenImage.setDisplaySize(
                    visualWidth,
                    visualHeight
                );
                // 暖化原木牌素材，讓木色更柔和自然
                woodenImage.setTint(0xffe5c6);

                container.add(woodenImage);

            } else {

                const fallbackWood = this.createFallbackWoodenButton(
                    width,
                    height
                );

                container.add(fallbackWood);

                console.warn(
                    '[LoginScene] 找不到 btn_start_frame，已使用備用木製按鈕。'
                );
            }

            if (eventName === 'guestSelected') {
                this.startButton = container;
            }

            // 木牌上的動態文字
            const text = this.add.text(
                0,
                0,
                label,
                {
                    fontFamily: 'Georgia, serif',
                    fontSize: `${fontSize * 0.82}px`,
                    color: '#fff1cf',
                    fontStyle: 'bold',
                    stroke: '#50351f',
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 1,
                        offsetY: 2,
                        color: '#21140c',
                        blur: 3,
                        fill: true
                    },
                    align: 'center',
                    wordWrap: {
                        width: visualWidth - 24
                    }
                }
            ).setOrigin(0.5);

            container.add(text);

            // 點擊區域與木牌視覺尺寸同步縮小，避免透明區域過大
            const hitArea = this.add.rectangle(
                0,
                0,
                visualWidth * 1.12,
                visualHeight * 1.18,
                0xffffff,
                0.001
            );

            hitArea.setInteractive({
                useHandCursor: true
            });

            container.add(hitArea);

            hitArea.on('pointerover', () => {

                this.addLayoutTween({

                    targets: container,

                    scale: 1.025,

                    duration: 150,

                    ease: 'Sine.easeOut'
                });

            });

            hitArea.on('pointerout', () => {

                this.addLayoutTween({

                    targets: container,

                    scale: 1,

                    duration: 150,

                    ease: 'Sine.easeOut'
                });

            });

            hitArea.on('pointerdown', () => {

                this.pulseStartButton();

                this.events.emit(eventName);
            });

            this.layoutContainer.add(container);

            return container;
        }

        // =================================
        // 一般按鈕
        // 登入、建立帳號繼續使用
        // =================================

        const background = this.add.rectangle(
            0,
            0,
            width,
            height,
            0x65452b,
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
                wordWrap: {
                    width: width - 20
                }
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

            background.setFillStyle(0x89623b);

            this.addLayoutTween({

                targets: container,

                scale: 1.02,

                duration: 150
            });
        });

        background.on('pointerout', () => {

            background.setFillStyle(0x65452b);

            this.addLayoutTween({

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

    // =====================================
    // 主畫面語言地球按鈕
    // =====================================

    drawLanguageButton(width, height) {

        const button = this.add.container(width - 87, 32);
        const wood = this.add.graphics();

        wood.fillStyle(0x21150e, 0.95);
        wood.fillRoundedRect(-24, -24, 48, 48, 9);
        wood.fillStyle(0x684326, 1);
        wood.fillRoundedRect(-21, -21, 42, 42, 7);
        wood.fillStyle(0x8b6038, 1);
        wood.fillRoundedRect(-17, -17, 34, 34, 5);
        wood.lineStyle(1.5, 0xe0bd7d, 1);
        wood.strokeRoundedRect(-19, -19, 38, 38, 6);

        // 使用 Phaser Graphics 原生線條繪製地球，不依賴 Emoji 字型。
        const globe = this.add.graphics();
        globe.lineStyle(1.8, 0xf6dfb0, 1);
        globe.strokeCircle(0, 0, 10);
        globe.strokeEllipse(0, 0, 10, 18);
        globe.beginPath();
        globe.moveTo(-9, 0);
        globe.lineTo(9, 0);
        globe.moveTo(-7, -5);
        globe.lineTo(7, -5);
        globe.moveTo(-7, 5);
        globe.lineTo(7, 5);
        globe.strokePath();

        const hitArea = this.add.rectangle(0, 0, 48, 48, 0xffffff, 0.001);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => button.setScale(1.07));
        hitArea.on('pointerout', () => button.setScale(1));
        hitArea.on('pointerdown', () => {
            if (!this.settingsExpanded) this.openSettings();
            this.selectSettingsCategory('language');
        });

        button.add([wood, globe, hitArea]);
        this.settingsButtonContainer.add(button);
    }

    // =====================================
    // 設定主按鈕
    // =====================================

    drawSettingsButton(width, height) {

        const button = this.add.container(width - 31, 32);
        const wood = this.add.graphics();

        // 深色木牌底座、木紋與黃銅包邊
        wood.fillStyle(0x21150e, 0.95);
        wood.fillRoundedRect(-24, -24, 48, 48, 9);
        wood.fillStyle(0x684326, 1);
        wood.fillRoundedRect(-21, -21, 42, 42, 7);
        wood.fillStyle(0x8b6038, 1);
        wood.fillRoundedRect(-17, -17, 34, 34, 5);
        wood.lineStyle(1.5, 0xe0bd7d, 1);
        wood.strokeRoundedRect(-19, -19, 38, 38, 6);
        wood.lineStyle(1, 0x4a2d19, 0.8);
        wood.beginPath();
        wood.moveTo(-12, -8);
        wood.lineTo(11, -8);
        wood.moveTo(-13, 8);
        wood.lineTo(12, 8);
        wood.strokePath();

        const icon = this.add.text(0, 0, '⚙', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '23px',
            color: '#f6dfb0',
            stroke: '#4a2d19',
            strokeThickness: 2
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(0, 0, 48, 48, 0xffffff, 0.001);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            button.setScale(1.07);
            icon.setColor('#fff0c9');
        });
        hitArea.on('pointerout', () => {
            button.setScale(1);
            icon.setColor('#f6dfb0');
        });
        hitArea.on('pointerdown', () => {
            if (this.settingsExpanded) this.closeSettings();
            else this.openSettings();
        });

        button.add([wood, icon, hitArea]);
        this.settingsButtonContainer.add(button);
    }

    // =====================================
    // 四個設定分類；語言切換由主畫面獨立的地球按鈕開啟。
    // =====================================

    getSettingsCategories() {

        return [
            { id: 'screen', icon: '▤', label: '畫面' },
            { id: 'sound', icon: '♫', label: '音效' },
            { id: 'operation', icon: '✥', label: '操作' },
            { id: 'system', icon: '⚙', label: '系統' }
        ];
    }

    // =====================================
    // 開啟設定
    // =====================================

    openSettings() {

        if (this.settingsExpanded) return;

        this.settingsExpanded = true;
        this.settingsCategory = null;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        this.settingsRail = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsRail);

        this.settingsRailItems = [];

        this.refreshSettingsRail();
    }

    // =====================================
    // 建立或更新五個分類圖標
    // =====================================

    refreshSettingsRail() {

        if (!this.settingsRail) return;

        const categories = this.getSettingsCategories();

        const x = this.scale.width - 30;
        const startY = 91;
        const spacing = 49;

        if (this.settingsRailItems.length > 0) {

            this.settingsRailItems.forEach(item => {

                const selected =
                    this.settingsCategory === item.category.id;

                item.glow.setFillStyle(
                    0xe0bd7d,
                    selected ? 0.28 : 0.12
                );

                item.glow.setAlpha(
                    selected ? 1 : 0.7
                );

                item.background.setFillStyle(
                    selected ? 0x8b6038 : 0x684326,
                    0.94
                );

                item.background.setStrokeStyle(
                    selected ? 2 : 1.2,
                    selected ? 0xffe2a6 : 0xd0a064,
                    1
                );

                item.icon.setAlpha(1);
            });

            return;
        }

        categories.forEach((category, index) => {

            const y = startY + index * spacing;
            const selected = this.settingsCategory === category.id;

            const glow = this.add.circle(
                x,
                y,
                24,
                0xc58b4d,
                selected ? 0.22 : 0.07
            );

            const background = this.add.circle(
                x,
                y,
                19,
                selected ? 0x8b6038 : 0x684326,
                0.94
            );

            background.setStrokeStyle(
                selected ? 2 : 1.2,
                selected ? 0xffe2a6 : 0xd0a064,
                1
            );

            let icon;

            if (category.id === 'language') {

                // 語言功能使用地球圖示，不再顯示「文」字。
                icon = this.add.graphics();
                icon.lineStyle(1.8, 0xf2d39a, 1);
                icon.strokeCircle(x, y, 9);
                icon.strokeEllipse(x, y, 9, 17);
                icon.beginPath();
                icon.moveTo(x - 8, y);
                icon.lineTo(x + 8, y);
                icon.moveTo(x - 6, y - 5);
                icon.lineTo(x + 6, y - 5);
                icon.moveTo(x - 6, y + 5);
                icon.lineTo(x + 6, y + 5);
                icon.strokePath();

            } else {

                icon = this.add.text(
                    x,
                    y,
                    category.icon,
                    {
                        fontFamily: 'Georgia, serif',
                        fontSize: '20px',
                        fontStyle: 'bold',
                        color: '#f2d39a',
                        stroke: '#392316',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);
            }

            background.setInteractive({
                useHandCursor: true
            });

            background.on('pointerover', () => {

                glow.setAlpha(0.32);

                background.setStrokeStyle(
                    2,
                    0xb5ffdf,
                    1
                );
            });

            background.on('pointerout', () => {

                const isSelected =
                    this.settingsCategory === category.id;

                glow.setAlpha(isSelected ? 1 : 0.7);

                background.setStrokeStyle(
                    isSelected ? 2 : 1.2,
                    isSelected ? 0xffdfa8 : 0xb9854c,
                    1
                );
            });

            background.on('pointerdown', () => {
                this.selectSettingsCategory(category.id);
            });

            this.settingsRail.add([
                glow,
                background,
                icon
            ]);

            this.settingsRailItems.push({
                category,
                glow,
                background,
                icon
            });

            glow.setAlpha(0);
            background.setAlpha(0);
            icon.setAlpha(0);

            this.tweens.add({
                targets: [glow, background, icon],
                alpha: 1,
                x: { from: x + 12, to: x },
                duration: 180,
                delay: index * 45,
                ease: 'Cubic.easeOut'
            });
        });
    }

    // =====================================
    // 分類切換
    // =====================================

    selectSettingsCategory(category) {

        if (!this.settingsExpanded) return;

        if (this.settingsCategory === category) {

            this.settingsCategory = null;

            this.clearSettingsPage();
            this.refreshSettingsRail();

            return;
        }

        this.settingsCategory = category;

        this.refreshSettingsRail();

        this.buildSettingsPage();
    }

    // =====================================
    // 清除面板內容
    // =====================================

    clearSettingsPage() {

        if (!this.settingsPageContainer) return;

        this.tweens.killTweensOf(
            this.settingsPageContainer
        );

        this.settingsPageContainer.removeAll(true);
        this.settingsPageContainer.destroy();

        this.settingsPageContainer = null;
    }

    // =====================================
    // 更新設定
    // =====================================

    refreshSettings() {

        if (!this.settingsExpanded) return;

        this.refreshSettingsRail();

        if (this.settingsCategory) {
            this.buildSettingsPage();
        }
    }

    // =====================================
    // 面板尺寸
    // =====================================

    getPanelSize(category) {

        const width = this.scale.width;

        const panelWidth = Math.min(
            320,
            Math.max(230, width - 76)
        );

        const heights = {
            // 語言改為兩欄五列，提供足夠點擊空間。
            language: 300,
            screen: 245,
            sound: 345,
            operation: 325,
            system: 235
        };

        return {
            width: Math.min(panelWidth, width - 72),
            height: heights[category] || 245
        };
    }

    // =====================================
    // 面板位置
    // =====================================

    getSettingsPosition() {

        const size = this.getPanelSize(
            this.settingsCategory
        );

        const railX = this.scale.width - 30;
        const panelCenterX = railX - 27 - size.width / 2;

        const minY = size.height / 2 + 12;
        const maxY = this.scale.height - size.height / 2 - 12;

        const centerY = minY <= maxY
            ? Phaser.Math.Clamp(
                this.scale.height * 0.5,
                minY,
                maxY
            )
            : this.scale.height / 2;

        return {
            x: panelCenterX,
            y: centerY
        };
    }

    // =====================================
    // 建立溫暖木質設定面板
    // =====================================

    buildSettingsPage() {

        if (!this.settingsContainer || !this.settingsCategory) return;

        this.clearSettingsPage();
        this.settingsPageContainer = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsPageContainer);

        const size = this.getPanelSize(this.settingsCategory);
        const position = this.getSettingsPosition();
        const centerX = position.x;
        const centerY = position.y;
        const panelLeft = centerX - size.width / 2;
        const panelTop = centerY - size.height / 2;

        const panel = this.add.graphics();

        // 木牌厚度與陰影
        panel.fillStyle(0x1b110b, 0.78);
        panel.fillRoundedRect(panelLeft + 4, panelTop + 6, size.width, size.height, 13);
        panel.fillStyle(0x3b2618, 1);
        panel.fillRoundedRect(panelLeft, panelTop, size.width, size.height, 13);
        panel.fillStyle(0x70492b, 1);
        panel.fillRoundedRect(panelLeft + 4, panelTop + 4, size.width - 8, size.height - 8, 10);
        panel.fillStyle(0x805735, 1);
        panel.fillRoundedRect(panelLeft + 8, panelTop + 8, size.width - 16, size.height - 16, 8);

        // 木紋刻線
        panel.lineStyle(1, 0x4b2e1b, 0.75);
        for (let i = 0; i < 5; i++) {
            const y = panelTop + 49 + i * Math.max(34, (size.height - 70) / 5);
            panel.beginPath();
            panel.moveTo(panelLeft + 13, y);
            panel.lineTo(panelLeft + size.width - 13, y);
            panel.strokePath();
        }

        // 黃銅雙層邊框與角落鉚釘
        panel.lineStyle(2, 0xe0bd7d, 0.98);
        panel.strokeRoundedRect(panelLeft + 3, panelTop + 3, size.width - 6, size.height - 6, 11);
        panel.lineStyle(1, 0x3d2516, 0.9);
        panel.strokeRoundedRect(panelLeft + 8, panelTop + 8, size.width - 16, size.height - 16, 8);
        panel.fillStyle(0xf0d49b, 0.95);
        panel.fillCircle(panelLeft + 13, panelTop + 13, 2);
        panel.fillCircle(panelLeft + size.width - 13, panelTop + 13, 2);
        panel.fillCircle(panelLeft + 13, panelTop + size.height - 13, 2);
        panel.fillCircle(panelLeft + size.width - 13, panelTop + size.height - 13, 2);
        this.settingsPageContainer.add(panel);

        const titleMap = {
            language: 'LANGUAGE / 語言',
            screen: 'DISPLAY / 畫面',
            sound: 'AUDIO / 音效',
            operation: 'CONTROL / 操作',
            system: 'SYSTEM / 系統'
        };

        const title = this.add.text(centerX, panelTop + 20, titleMap[this.settingsCategory], {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f7dfad',
            stroke: '#392316',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        this.settingsPageContainer.add(title);

        const contentStartY = centerY - size.height / 2 + 64;
        switch (this.settingsCategory) {
            case 'language': this.buildLanguagePage(centerX, contentStartY); break;
            case 'screen': this.buildScreenPage(centerX, contentStartY); break;
            case 'sound': this.buildSoundPage(centerX, contentStartY); break;
            case 'operation': this.buildOperationPage(centerX, contentStartY); break;
            case 'system': this.buildSystemPage(centerX, contentStartY); break;
        }

        this.settingsPageContainer.setAlpha(1);
        this.settingsPageContainer.setScale(1);
    }

    // =====================================
    // 設定文字
    // =====================================

    addPageText(
        x,
        y,
        value,
        size = 13,
        color = '#f1e2c5'
    ) {

        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            fontFamily: 'Arial, sans-serif',
            stroke: '#392316',
            strokeThickness: 3,
            align: 'center',
            wordWrap: {
                width: Math.max(
                    160,
                    this.getPanelSize(this.settingsCategory).width - 30
                )
            }
        }).setOrigin(0.5);

        this.settingsPageContainer.add(text);

        return text;
    }

    // =====================================
    // 全息文字按鈕
    // =====================================

    addPageButton(x, y, label, callback, width = 90) {

        const buttonContainer = this.add.container(x, y);
        const background = this.add.graphics();

        const drawWood = (hover = false) => {
            background.clear();
            background.fillStyle(0x2a1a10, 0.95);
            background.fillRoundedRect(-width / 2 + 1, -12, width, 27, 5);
            background.fillStyle(hover ? 0x9a6b3e : 0x79502f, 1);
            background.fillRoundedRect(-width / 2, -14, width, 27, 5);
            background.fillStyle(hover ? 0xb18451 : 0x8b6038, 1);
            background.fillRoundedRect(-width / 2 + 3, -11, width - 6, 21, 3);
            background.lineStyle(1.2, 0xe0bd7d, 0.98);
            background.strokeRoundedRect(-width / 2 + 2, -12, width - 4, 23, 4);
            background.lineStyle(1, 0x57371f, 0.8);
            background.beginPath();
            background.moveTo(-width / 2 + 8, -4);
            background.lineTo(width / 2 - 8, -4);
            background.strokePath();
        };
        drawWood();

        const isResetButton = label === '重設為預設值';
        const text = this.add.text(
            isResetButton ? 9 : 0,
            0,
            label,
            {
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                color: '#f8e7c4',
                fontStyle: 'bold',
                stroke: '#392316',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);

        const children = [background, text];

        if (isResetButton) {
            // 使用環形回轉箭頭，表達回到預設狀態的動作。
            const resetIcon = this.add.text(-width / 2 + 19, 0, '↻', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '22px',
                color: '#ffe0a2',
                stroke: '#392316',
                strokeThickness: 2,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            children.push(resetIcon);
        }

        const hitArea = this.add.rectangle(0, 0, width, 30, 0xffffff, 0.001);
        hitArea.setInteractive({ useHandCursor: true });
        children.push(hitArea);
        buttonContainer.add(children);

        hitArea.on('pointerover', () => {
            drawWood(true);
            buttonContainer.setScale(1.035);
        });
        hitArea.on('pointerout', () => {
            drawWood(false);
            buttonContainer.setScale(1);
        });
        hitArea.on('pointerdown', callback);

        this.settingsPageContainer.add(buttonContainer);
        return buttonContainer;
    }

    // =====================================
    // 十種語言
    // =====================================

    drawLanguageFlag(container, code, width, height) {

        // 使用 Phaser Graphics 繪製旗幟，不依賴手機系統 Emoji 字型。
        const g = this.add.graphics();
        const x = -width / 2;
        const y = -height / 2;
        const stripe = (color, sx, sy, sw, sh) => {
            g.fillStyle(color, 1);
            g.fillRect(sx, sy, sw, sh);
        };
        const circle = (color, cx, cy, radius) => {
            g.fillStyle(color, 1);
            g.fillCircle(cx, cy, radius);
        };

        if (code === 'zh-TW') {
            stripe(0xfe0000, x, y, width, height);
            stripe(0x000095, x + 2, y + 2, width * 0.42, height * 0.48);
            circle(0xffffff, x + width * 0.21, y + height * 0.25, height * 0.105);
            circle(0x000095, x + width * 0.21, y + height * 0.25, height * 0.055);
        } else if (code === 'zh-CN') {
            stripe(0xde2910, x, y, width, height);
            circle(0xffde00, x + width * 0.23, y + height * 0.32, height * 0.17);
            [0, 1, 2, 3].forEach((n) => circle(0xffde00, x + width * (0.43 + (n % 2) * 0.12), y + height * (0.17 + Math.floor(n / 2) * 0.2), height * 0.045));
        } else if (code === 'en') {
            stripe(0xffffff, x, y, width, height);
            for (let n = 0; n < 7; n++) stripe(0xb22234, x, y + n * height / 7, width, height / 13);
            stripe(0x3c3b6e, x, y, width * 0.43, height * 0.56);
            for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) circle(0xffffff, x + width * (0.055 + col * 0.1), y + height * (0.1 + row * 0.17), 0.45);
        } else if (code === 'ja') {
            stripe(0xffffff, x, y, width, height);
            circle(0xbc002d, 0, 0, height * 0.29);
        } else if (code === 'ko') {
            stripe(0xffffff, x, y, width, height);
            circle(0xcd2e3a, -width * 0.025, -height * 0.045, height * 0.25);
            circle(0x0047a0, width * 0.025, height * 0.045, height * 0.25);
            stripe(0x111111, x + 3, y + 2, width * 0.2, 1.5);
            stripe(0x111111, x + 3, y + 5, width * 0.2, 1.5);
            stripe(0x111111, x + width - width * 0.2 - 3, y + height - 4, width * 0.2, 1.5);
            stripe(0x111111, x + width - width * 0.2 - 3, y + height - 7, width * 0.2, 1.5);
        } else if (code === 'th') {
            stripe(0xa51931, x, y, width, height);
            stripe(0xf4f5f8, x, y + height * 0.18, width, height * 0.16);
            stripe(0x2d2a4a, x, y + height * 0.34, width, height * 0.32);
            stripe(0xf4f5f8, x, y + height * 0.66, width, height * 0.16);
        } else if (code === 'fr') {
            stripe(0x0055a4, x, y, width / 3, height);
            stripe(0xffffff, x + width / 3, y, width / 3, height);
            stripe(0xef4135, x + width * 2 / 3, y, width / 3, height);
        } else if (code === 'de') {
            stripe(0x000000, x, y, width, height / 3);
            stripe(0xdd0000, x, y + height / 3, width, height / 3);
            stripe(0xffce00, x, y + height * 2 / 3, width, height / 3);
        } else if (code === 'es') {
            stripe(0xaa151b, x, y, width, height);
            stripe(0xf1bf00, x, y + height * 0.25, width, height * 0.5);
            stripe(0xaa151b, x, y + height * 0.75, width, height * 0.25);
        } else if (code === 'pt-BR') {
            stripe(0x009b3a, x, y, width, height);
            g.fillStyle(0xffdf00, 1);
            g.fillPoints([
                { x: 0, y: y + 1 },
                { x: width * 0.46, y: y + height / 2 },
                { x: 0, y: y + height - 1 },
                { x: -width * 0.46, y: y + height / 2 }
            ], true);
            circle(0x002776, 0, 0, height * 0.27);
        }

        g.lineStyle(1, 0xf4e5c7, 0.85);
        g.strokeRect(x, y, width, height);
        container.add(g);
        return g;
    }

    buildLanguagePage(centerX, startY) {

        const languages = [
            { code: 'zh-TW', label: '繁體中文' },
            { code: 'zh-CN', label: '简体中文' },
            { code: 'en', label: 'English' },
            { code: 'ja', label: '日本語' },
            { code: 'ko', label: '한국어' },
            { code: 'th', label: 'ไทย' },
            { code: 'fr', label: 'Français' },
            { code: 'de', label: 'Deutsch' },
            { code: 'es', label: 'Español' },
            { code: 'pt-BR', label: 'Português' }
        ];

        const currentCode = LanguageSystem.getLanguage();
        const panelWidth = this.getPanelSize('language').width;
        const columns = 2;
        const gapX = 10;
        const gapY = 8;
        const cellWidth = (panelWidth - 28 - gapX) / columns;
        const cellHeight = 36;
        const startX = centerX - panelWidth / 2 + 14 + cellWidth / 2;
        const firstY = startY + 15;

        languages.forEach((language, index) => {

            const column = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + column * (cellWidth + gapX);
            const y = firstY + row * (cellHeight + gapY);
            const selected = currentCode === language.code;
            const item = this.add.container(x, y);
            const background = this.add.graphics();

            const drawButton = (active = selected, hover = false) => {
                background.clear();
                background.fillStyle(0x2a1a10, 0.95);
                background.fillRoundedRect(-cellWidth / 2 + 1, -cellHeight / 2 + 2, cellWidth, cellHeight, 6);
                background.fillStyle(active ? 0x987044 : (hover ? 0x8a6038 : 0x694326), 1);
                background.fillRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                background.lineStyle(active ? 1.8 : 1, active ? 0xffdfa0 : 0xd0a064, 1);
                background.strokeRoundedRect(-cellWidth / 2 + 1, -cellHeight / 2 + 1, cellWidth - 2, cellHeight - 2, 5);
            };

            drawButton();

            const label = this.add.text(
                20,
                0,
                (selected ? '✓ ' : '') + language.label,
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '11px',
                    fontStyle: selected ? 'bold' : 'normal',
                    color: selected ? '#fff0c9' : '#f4e5c7',
                    stroke: '#392316',
                    strokeThickness: 2,
                    align: 'left',
                    fixedWidth: cellWidth - 43
                }
            ).setOrigin(0, 0.5);

            const hitArea = this.add.rectangle(0, 0, cellWidth, cellHeight, 0xffffff, 0.001);
            hitArea.setInteractive({ useHandCursor: true });
            item.add(background);
            this.drawLanguageFlag(item, language.code, 27, 18);
            item.add([label, hitArea]);
            this.settingsPageContainer.add(item);

            hitArea.on('pointerover', () => {
                drawButton(selected, true);
                item.setScale(1.025);
            });

            hitArea.on('pointerout', () => {
                drawButton();
                item.setScale(1);
            });

            hitArea.on('pointerdown', () => {
                if (LanguageSystem.getLanguage() === language.code) return;
                this.time.delayedCall(0, () => {
                    if (!this.scene.isActive()) return;
                    LanguageSystem.setLanguage(language.code);
                });
            });

            item.setAlpha(0);
            item.setScale(0.94);
            this.tweens.add({
                targets: item,
                alpha: 1,
                scale: 1,
                duration: 150,
                delay: index * 18,
                ease: 'Cubic.easeOut'
            });
        });
    }

    // =====================================
    // 數值設定工具
    // =====================================

    addSettingRow(centerX, y, label, key, options = {}) {

        const currentValue = this.getSetting(key);

        const formatted = options.format
            ? options.format(currentValue)
            : currentValue;

        this.addPageText(
            centerX,
            y,
            `${label}：${formatted}`,
            12
        );

        this.addPageButton(
            centerX - 48,
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
            42
        );

        this.addPageButton(
            centerX + 48,
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
            42
        );
    }

    // =====================================
    // 開關設定
    // =====================================

    addToggleRow(centerX, y, label, key) {

        const enabled = !!this.getSetting(key);

        this.addPageText(
            centerX - 25,
            y,
            `${label}：${enabled ? '開啟' : '關閉'}`,
            12
        );

        this.addPageButton(
            centerX + 83,
            y,
            enabled ? '● 開啟' : '○ 關閉',
            () => {
                this.setSetting(
                    key,
                    !this.getSetting(key)
                );
            },
            66
        );
    }

    // =====================================
    // AUDIO 五個音效頻道
    // =====================================

    addAudioChannelRow(
        centerX,
        y,
        label,
        enabledKey,
        volumeKey
    ) {

        const enabled = !!this.getSetting(enabledKey);

        const volume = Number(
            this.getSetting(volumeKey)
        ) || 0;

        const controlAlpha = enabled ? 1 : 0.45;

        const channelName = this.add.text(
            centerX - 80,
            y,
            label,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#f4e5c7',
                stroke: '#392316',
                strokeThickness: 2,
                align: 'right',
                fixedWidth: 75
            }
        ).setOrigin(1, 0.5);

        channelName.setAlpha(controlAlpha);

        this.settingsPageContainer.add(channelName);

        const createCompactButton = (
            x,
            symbol,
            callback
        ) => {

            const button = this.add.container(x, y);

            const background = this.add.graphics();

            background.fillStyle(
                0x79502f,
                enabled ? 1 : 0.5
            );

            background.fillRoundedRect(
                -12,
                -14,
                24,
                28,
                5
            );

            background.lineStyle(
                1,
                0xe0bd7d,
                enabled ? 1 : 0.45
            );

            background.strokeRoundedRect(
                -12,
                -14,
                24,
                28,
                5
            );

            const text = this.add.text(
                0,
                0,
                symbol,
                {
                    fontSize: '15px',
                    color: '#f8e7c4',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            const hitArea = this.add.rectangle(
                0,
                0,
                32,
                36,
                0xffffff,
                0.001
            );

            button.add([
                background,
                text,
                hitArea
            ]);

            hitArea.setInteractive({
                useHandCursor: true
            });

            if (!enabled) {

                button.setAlpha(0.45);
                hitArea.disableInteractive();

            } else {

                hitArea.on('pointerover', () => {

                    background.clear();

                    background.fillStyle(
                        0x9a6b3e,
                        1
                    );

                    background.fillRoundedRect(
                        -12,
                        -14,
                        24,
                        28,
                        5
                    );

                    background.lineStyle(
                        1.5,
                        0xffe2a6,
                        1
                    );

                    background.strokeRoundedRect(
                        -12,
                        -14,
                        24,
                        28,
                        5
                    );
                });

                hitArea.on('pointerout', () => {

                    background.clear();

                    background.fillStyle(
                        0x694326,
                        0.95
                    );

                    background.fillRoundedRect(
                        -12,
                        -14,
                        24,
                        28,
                        5
                    );

                    background.lineStyle(
                        1,
                        0xd1a05e,
                        0.9
                    );

                    background.strokeRoundedRect(
                        -12,
                        -14,
                        24,
                        28,
                        5
                    );
                });

                hitArea.on('pointerdown', callback);
            }

            this.settingsPageContainer.add(button);

            return button;
        };

        createCompactButton(
            centerX - 30,
            '－',
            () => {

                const current = Number(
                    this.getSetting(volumeKey)
                ) || 0;

                const next = Math.max(
                    0,
                    current - 0.1
                );

                this.setSetting(
                    volumeKey,
                    Number(next.toFixed(2))
                );
            }
        );

        const percentage = this.add.text(
            centerX,
            y,
            `${Math.round(volume * 100)}%`,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#f1d19a',
                stroke: '#392316',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);

        percentage.setAlpha(controlAlpha);

        this.settingsPageContainer.add(percentage);

        createCompactButton(
            centerX + 30,
            '＋',
            () => {

                const current = Number(
                    this.getSetting(volumeKey)
                ) || 0;

                const next = Math.min(
                    1,
                    current + 0.1
                );

                this.setSetting(
                    volumeKey,
                    Number(next.toFixed(2))
                );
            }
        );

        this.addPageButton(
            centerX + 75,
            y,
            enabled ? '● 開啟' : '○ 關閉',
            () => {

                this.setSetting(
                    enabledKey,
                    !this.getSetting(enabledKey)
                );
            },
            62
        );
    }

    // =====================================
    // 畫面設定
    // =====================================

    buildScreenPage(centerX, startY) {

        this.addPageText(
            centerX,
            startY,
            '畫面設定',
            14,
            '#f1d19a'
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
            startY + 115,
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
    }

    // =====================================
    // 音效設定
    // =====================================

    buildSoundPage(centerX, startY) {

        this.addPageText(
            centerX,
            startY,
            '音效設定',
            14,
            '#f1d19a'
        );

        const channels = [

            {
                label: '背景音樂',
                enabled: 'backgroundMusicEnabled',
                volume: 'backgroundMusicVolume'
            },

            {
                label: '環境音',
                enabled: 'ambientSoundEnabled',
                volume: 'ambientSoundVolume'
            },

            {
                label: 'NPC 特殊音樂',
                enabled: 'npcMusicEnabled',
                volume: 'npcMusicVolume'
            },

            {
                label: '爬蟲與兩棲聲音',
                enabled: 'creatureSoundEnabled',
                volume: 'creatureSoundVolume'
            },

            {
                label: '遊戲音效',
                enabled: 'soundEffectsEnabled',
                volume: 'soundEffectsVolume'
            }
        ];

        const rowSpacing = 48;

        channels.forEach((channel, index) => {

            const rowY =
                startY + 38 + index * rowSpacing;

            this.addAudioChannelRow(
                centerX,
                rowY,
                channel.label,
                channel.enabled,
                channel.volume
            );
        });
    }

    // =====================================
    // 操作設定
    // =====================================

    buildOperationPage(centerX, startY) {

        this.addPageText(
            centerX,
            startY,
            '操作設定',
            14,
            '#f1d19a'
        );

        this.addToggleRow(
            centerX,
            startY + 48,
            '操作提示',
            'operationTipsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 95,
            '場景動畫',
            'animationsEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 142,
            '夜間模式',
            'nightModeEnabled'
        );

        this.addToggleRow(
            centerX,
            startY + 189,
            '省電模式',
            'powerSavingEnabled'
        );
    }

    // =====================================
    // 系統設定
    // =====================================

    buildSystemPage(centerX, startY) {

        this.addPageText(
            centerX,
            startY,
            '系統設定',
            14,
            '#f1d19a'
        );

        this.addPageText(
            centerX,
            startY + 48,
            '遊戲版本：Alpha 2.0',
            12
        );

        this.addPageText(
            centerX,
            startY + 78,
            '《鱗片與種子》',
            11
        );

        this.addPageButton(
            centerX,
            startY + 130,
            '重設為預設值',
            () => {

                SettingsSystem.reset();

                this.refreshSettings();
            },
            130
        );
    }

    // =====================================
    // 關閉全部設定
    // =====================================

    closeSettings() {

        if (this.settingsContainer) {

            this.tweens.killTweensOf(
                this.settingsContainer
            );

            this.settingsContainer.removeAll(true);
            this.settingsContainer.destroy();
        }

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;

        this.settingsRailItems = [];

        this.settingsCategory = null;
        this.settingsExpanded = false;
    }
}