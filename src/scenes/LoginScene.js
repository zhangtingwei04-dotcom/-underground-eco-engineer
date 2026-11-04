
import { LanguageSystem } from '../systems/language-system.js';
import { SettingsSystem } from '../systems/settings-system.js';

export class LoginScene extends Phaser.Scene {

    constructor() {
        super({ key: 'LoginScene' });

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsButtonContainer = null;
        this.settingsRail = null;

        this.settingsCategory = null;
        this.settingsExpanded = false;

        this.particles = [];
    }

    create() {
        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;

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
        const button = this.add.container(width - 30, 32);

        const background = this.add.circle(
            0,
            0,
            22,
            0x344e3d,
            0.35
        );

        background.setStrokeStyle(1.5, 0xc5b78e, 0.9);

        const icon = this.add.text(0, 0, '⚙️', {
            fontSize: '25px'
        }).setOrigin(0.5);

        background.setInteractive({ useHandCursor: true });

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
    // 分類資料
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

    // ==============================
    // 開啟設定
    // ==============================

    openSettings() {
        if (this.settingsExpanded) return;

        this.settingsExpanded = true;
        this.settingsCategory = null;

        this.settingsContainer = this.add.container(0, 0);
        this.settingsContainer.setDepth(1000);

        this.settingsRail = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsRail);

        this.refreshSettingsRail();
    }

    // ==============================
    // 五個分類垂直展開
    // ==============================

    refreshSettingsRail() {
        if (!this.settingsRail) return;

        this.settingsRail.removeAll(true);

        const x = this.scale.width - 30;
        const startY = 91;
        const spacing = 49;

        this.getSettingsCategories().forEach((category, index) => {
            const y = startY + index * spacing;

            const selected = this.settingsCategory === category.id;

            const background = this.add.circle(
                x,
                y,
                20,
                selected ? 0x82936b : 0x344e3d,
                0.30
            );

            background.setStrokeStyle(
                1.5,
                selected ? 0xf0d99b : 0xc5b78e,
                0.9
            );

            const icon = this.add.text(x, y, category.icon, {
                fontSize: '21px'
            }).setOrigin(0.5);

            background.setInteractive({ useHandCursor: true });

            background.on('pointerdown', () => {
                this.selectSettingsCategory(category.id);
            });

            this.settingsRail.add([background, icon]);

            background.setAlpha(0);
            icon.setAlpha(0);

            this.tweens.add({
                targets: [background, icon],
                alpha: 1,
                x: { from: x + 16, to: x },
                duration: 180,
                delay: index * 65,
                ease: 'Cubic.easeOut'
            });
        });
    }

    // ==============================
    // 分類開關
    // ==============================

    selectSettingsCategory(category) {
        // 再點一次相同分類：收起內容
        if (this.settingsCategory === category) {
            this.settingsCategory = null;
            this.clearSettingsPage();
            this.refreshSettingsRail();
            return;
        }

        // 點其他分類：切換內容
        this.settingsCategory = category;

        this.refreshSettingsRail();
        this.buildSettingsPage();
    }

    // ==============================
    // 清除選單內容
    // ==============================

    clearSettingsPage() {
        if (!this.settingsPageContainer) return;

        this.tweens.killTweensOf(this.settingsPageContainer);

        this.settingsPageContainer.removeAll(true);
        this.settingsPageContainer.destroy();

        this.settingsPageContainer = null;
    }

    refreshSettings() {
        if (!this.settingsExpanded) return;

        this.refreshSettingsRail();

        if (this.settingsCategory) {
            this.buildSettingsPage();
        }
    }

    // ==============================
    // 浮動式選單位置
    // ==============================

    getSettingsPosition() {
        const index = this.getSettingsCategories().findIndex(
            item => item.id === this.settingsCategory
        );

        const anchorY = 91 + Math.max(0, index) * 49;

        return {
            x: this.scale.width - 145,
            y: Phaser.Math.Clamp(
                anchorY,
                45,
                this.scale.height - 45
            )
        };
    }

    // ==============================
    // 建立透明設定內容
    // ==============================

    buildSettingsPage() {
        if (!this.settingsContainer || !this.settingsCategory) {
            return;
        }

        this.clearSettingsPage();

        this.settingsPageContainer = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsPageContainer);

        const position = this.getSettingsPosition();

        switch (this.settingsCategory) {
            case 'language':
                this.buildLanguagePage(position.x, position.y);
                break;

            case 'screen':
                this.buildScreenPage(position.x, position.y);
                break;

            case 'sound':
                this.buildSoundPage(position.x, position.y);
                break;

            case 'operation':
                this.buildOperationPage(position.x, position.y);
                break;

            case 'system':
                this.buildSystemPage(position.x, position.y);
                break;
        }
    }

    // ==============================
    // 透明文字
    // ==============================

    addPageText(x, y, value, size = 13, color = '#f3e8cb') {
        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            fontFamily: 'Arial, sans-serif',
            stroke: '#17251d',
            strokeThickness: 2,
            align: 'center',
            wordWrap: {
                width: 210
            }
        }).setOrigin(0.5);

        this.settingsPageContainer.add(text);

        return text;
    }

    // ==============================
    // 無方框文字按鈕
    // ==============================

    addPageButton(x, y, label, callback, width = 90) {
        const button = this.add.text(x, y, label, {
            fontSize: '13px',
            color: '#f3e8cb',
            padding: { x: 5, y: 5 },
            fixedWidth: width,
            align: 'center',
            stroke: '#17251d',
            strokeThickness: 2
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setColor('#ffe5a5');
            button.setScale(1.08);
        });

        button.on('pointerout', () => {
            button.setColor('#f3e8cb');
            button.setScale(1);
        });

        button.on('pointerdown', callback);

        this.settingsPageContainer.add(button);

        return button;
    }

    // ==============================
    // 語言：兩排五面國旗
    // ==============================

    buildLanguagePage(centerX, centerY) {
        const languages = [
            { code: 'zh-TW', flag: '🇹🇼' },
            { code: 'zh-CN', flag: '🇨🇳' },
            { code: 'en', flag: '🇺🇸' },
            { code: 'ja', flag: '🇯🇵' },
            { code: 'ko', flag: '🇰🇷' },
            { code: 'th', flag: '🇹🇭' },
            { code: 'fr', flag: '🇫🇷' },
            { code: 'de', flag: '🇩🇪' },
            { code: 'es', flag: '🇪🇸' },
            { code: 'pt-BR', flag: '🇧🇷' }
        ];

        const currentCode = LanguageSystem.getLanguage();

        // 依照螢幕寬度調整間距
        const spacingX = Math.min(
            35,
            Math.max(27, (this.scale.width - 90) / 4)
        );

        const spacingY = 43;

        // 國旗排列在語言圖標左側
        const gridCenterX = Math.min(
            this.scale.width - 30 - spacingX * 2 - 15,
            centerX
        );

        const startX = gridCenterX - spacingX * 2;
        const startY = centerY - spacingY / 2;

        languages.forEach((language, index) => {
            const column = index % 5;
            const row = Math.floor(index / 5);

            const x = startX + column * spacingX;
            const y = startY + row * spacingY;

            const selected = currentCode === language.code;

            const flag = this.add.text(
                x,
                y,
                language.flag,
                {
                    fontSize: selected ? '29px' : '26px',
                    stroke: selected ? '#f5d98f' : '#17251d',
                    strokeThickness: selected ? 2 : 1
                }
            ).setOrigin(0.5);

            flag.setInteractive({ useHandCursor: true });

            flag.on('pointerover', () => {
                flag.setScale(1.2);
            });

            flag.on('pointerout', () => {
                flag.setScale(1);
            });

            flag.on('pointerdown', () => {
                // 選擇語言後自動收起國旗
                this.settingsCategory = null;
                this.clearSettingsPage();
                this.refreshSettingsRail();

                LanguageSystem.setLanguage(language.code);
            });

            this.settingsPageContainer.add(flag);

            // 國旗逐一淡入
            flag.setAlpha(0);
            flag.setScale(0.65);

            this.tweens.add({
                targets: flag,
                alpha: 1,
                scale: selected ? 1.08 : 1,
                duration: 170,
                delay: index * 75,
                ease: 'Back.easeOut'
            });
        });
    }

    // ==============================
    // 數值設定工具
    // ==============================

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
            centerX - 45,
            y + 28,
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
            centerX + 45,
            y + 28,
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
            centerX - 20,
            y,
            `${label}：${enabled ? '開啟' : '關閉'}`,
            12
        );

        this.addPageButton(
            centerX + 82,
            y,
            enabled ? '●' : '○',
            () => {
                this.setSetting(key, !enabled);
            },
            30
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
            14
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

    // ==============================
    // 音效設定
    // ==============================

    buildSoundPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '音效設定',
            14
        );

        this.addToggleRow(
            centerX,
            startY + 45,
            '背景音樂',
            'backgroundMusicEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 85,
            '音樂音量',
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
            startY + 155,
            '遊戲音效',
            'soundEffectsEnabled'
        );

        this.addSettingRow(
            centerX,
            startY + 195,
            '音效音量',
            'soundEffectsVolume',
            {
                min: 0,
                max: 1,
                step: 0.1,
                format: value =>
                    `${Math.round(value * 100)}%`
            }
        );
    }

    // ==============================
    // 操作與體驗
    // ==============================

    buildOperationPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '操作設定',
            14
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

    // ==============================
    // 系統設定
    // ==============================

    buildSystemPage(centerX, startY) {
        this.addPageText(
            centerX,
            startY,
            '系統設定',
            14
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
            '恢復預設設定',
            () => {
                SettingsSystem.reset();
                this.refreshSettings();
            },
            130
        );
    }

    // ==============================
    // 關閉全部設定
    // ==============================

    closeSettings() {
        if (this.settingsContainer) {
            this.tweens.killTweensOf(this.settingsContainer);

            this.settingsContainer.removeAll(true);
            this.settingsContainer.destroy();
        }

        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;

        this.settingsCategory = null;
        this.settingsExpanded = false;
    }
}
