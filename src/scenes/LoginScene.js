
// 鱗片與種子：地下生態物語
// LoginScene
// Settings Rail Stable Version
// Language Refresh + Audio Controls + Responsive Layout

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

        this.languageListener = null;
        this.languageReadyListener = null;
    }

    // ==============================
    // 初始化
    // ==============================

    create() {
        this.settingsContainer = null;
        this.settingsPageContainer = null;
        this.settingsRail = null;
        this.settingsRailItems = [];

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

        // 語言切換監聽
        this.languageListener = () => {

            // 更新登入畫面文字
            this.drawLayout();

            // 設定面板開啟時，保留目前分類
            if (this.settingsExpanded) {
                this.refreshSettings();
            }
        };

        // 語言字典載入完成監聽
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

        // 初始化語言字典
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

        // 場景結束時清理事件
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
        });

        this.scale.on(
            'resize',
            this.handleResize,
            this
        );
    }

    // ==============================
    // 設定讀取與寫入
    // ==============================

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
                this.selectSettingsCategory(previousCategory);
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
    // 設定主按鈕
    // ==============================

    drawSettingsButton(width, height) {

        const button = this.add.container(width - 30, 32);

        const glow = this.add.circle(
            0,
            0,
            25,
            0x20b982,
            0.10
        );

        const background = this.add.circle(
            0,
            0,
            22,
            0x09271f,
            0.88
        );

        background.setStrokeStyle(1.5, 0x55d6a4, 0.95);

        const icon = this.add.text(0, 0, '⚙️', {
            fontSize: '24px'
        }).setOrigin(0.5);

        background.setInteractive({ useHandCursor: true });

        background.on('pointerover', () => {
            glow.setAlpha(0.3);
            background.setStrokeStyle(2, 0x9affd3, 1);
        });

        background.on('pointerout', () => {
            glow.setAlpha(0.1);
            background.setStrokeStyle(1.5, 0x55d6a4, 0.95);
        });

        background.on('pointerdown', () => {

            if (this.settingsExpanded) {
                this.closeSettings();
            } else {
                this.openSettings();
            }
        });

        button.add([glow, background, icon]);

        this.settingsButtonContainer.add(button);
    }

    // ==============================
    // 五個設定分類
    // ==============================

    getSettingsCategories() {

        return [
            { id: 'screen', icon: '🖥️', label: '畫面' },
            { id: 'sound', icon: '🔊', label: '音效' },
            { id: 'operation', icon: '🎮', label: '操作' },
            { id: 'language', icon: '🌐', label: '語言' },
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

        this.settingsRailItems = [];

        // 五個圖標只建立一次
        this.refreshSettingsRail();
    }

    // ==============================
    // 建立或更新五個分類圖標
    // 核心修正：切換分類不再刪除重建
    // ==============================

    refreshSettingsRail() {

        if (!this.settingsRail) return;

        const categories = this.getSettingsCategories();

        const x = this.scale.width - 30;
        const startY = 91;
        const spacing = 49;

        // 已建立圖標：只更新外觀，不重新建立、不播放進場動畫
        if (this.settingsRailItems.length > 0) {

            this.settingsRailItems.forEach(item => {

                const selected =
                    this.settingsCategory === item.category.id;

                item.glow.setFillStyle(
                    0x20d69a,
                    selected ? 0.22 : 0.07
                );

                item.glow.setAlpha(
                    selected ? 1 : 0.7
                );

                item.background.setFillStyle(
                    selected ? 0x12513d : 0x09271f,
                    0.94
                );

                item.background.setStrokeStyle(
                    selected ? 2 : 1.2,
                    selected ? 0x9affd3 : 0x4abf91,
                    1
                );

                item.icon.setAlpha(1);
            });

            return;
        }

        // 首次建立圖標
        categories.forEach((category, index) => {

            const y = startY + index * spacing;
            const selected = this.settingsCategory === category.id;

            const glow = this.add.circle(
                x,
                y,
                24,
                0x20d69a,
                selected ? 0.22 : 0.07
            );

            const background = this.add.circle(
                x,
                y,
                19,
                selected ? 0x12513d : 0x09271f,
                0.94
            );

            background.setStrokeStyle(
                selected ? 2 : 1.2,
                selected ? 0x9affd3 : 0x4abf91,
                1
            );

            const icon = this.add.text(
                x,
                y,
                category.icon,
                {
                    fontSize: '20px'
                }
            ).setOrigin(0.5);

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
                    isSelected ? 0x9affd3 : 0x4abf91,
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

            // 只有第一次展開設定時播放進場動畫
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

    // ==============================
    // 分類切換
    // ==============================

    selectSettingsCategory(category) {

        if (!this.settingsExpanded) return;

        if (this.settingsCategory === category) {

            this.settingsCategory = null;

            this.clearSettingsPage();
            this.refreshSettingsRail();

            return;
        }

        this.settingsCategory = category;

        // 只更新圖標外觀
        this.refreshSettingsRail();

        // 更新面板內容
        this.buildSettingsPage();
    }

    // ==============================
    // 清除面板內容
    // ==============================

    clearSettingsPage() {

        if (!this.settingsPageContainer) return;

        this.tweens.killTweensOf(
            this.settingsPageContainer
        );

        this.settingsPageContainer.removeAll(true);
        this.settingsPageContainer.destroy();

        this.settingsPageContainer = null;
    }

    // ==============================
    // 更新設定
    // ==============================

    refreshSettings() {

        if (!this.settingsExpanded) return;

        // 不重新建立五個圖標
        this.refreshSettingsRail();

        if (this.settingsCategory) {
            this.buildSettingsPage();
        }
    }

    // ==============================
    // 面板尺寸
    // ==============================

    getPanelSize(category) {

        const width = this.scale.width;

        const panelWidth = Math.min(
            320,
            Math.max(230, width - 76)
        );

        const heights = {
            language: 205,
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

    // ==============================
    // 面板位置
    // ==============================

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

    // ==============================
    // 建立翡翠全息設定面板
    // ==============================

    buildSettingsPage() {

        if (
            !this.settingsContainer ||
            !this.settingsCategory
        ) {
            return;
        }

        this.clearSettingsPage();

        this.settingsPageContainer = this.add.container(0, 0);
        this.settingsContainer.add(this.settingsPageContainer);

        const size = this.getPanelSize(this.settingsCategory);
        const position = this.getSettingsPosition();

        const centerX = position.x;
        const centerY = position.y;

        const panelLeft = centerX - size.width / 2;
        const panelTop = centerY - size.height / 2;

        // 外圍柔和光暈
        const glow = this.add.graphics();

        glow.fillStyle(0x13d995, 0.10);

        glow.fillRoundedRect(
            panelLeft - 5,
            panelTop - 5,
            size.width + 10,
            size.height + 10,
            17
        );

        this.settingsPageContainer.add(glow);

        // 深翡翠底板
        const panel = this.add.graphics();

        panel.fillStyle(0x061d18, 1);

        panel.fillRoundedRect(
            panelLeft,
            panelTop,
            size.width,
            size.height,
            13
        );

        // 外框
        panel.lineStyle(2, 0x42dba5, 0.95);

        panel.strokeRoundedRect(
            panelLeft,
            panelTop,
            size.width,
            size.height,
            13
        );

        // 內框
        panel.lineStyle(1, 0x9affd3, 0.35);

        panel.strokeRoundedRect(
            panelLeft + 5,
            panelTop + 5,
            size.width - 10,
            size.height - 10,
            10
        );

        // 頂部裝飾線
        panel.lineStyle(2, 0x53dca8, 0.75);

        panel.beginPath();
        panel.moveTo(panelLeft + 18, panelTop + 35);
        panel.lineTo(panelLeft + size.width - 18, panelTop + 35);
        panel.strokePath();

        // 光點
        panel.fillStyle(0xb1ffe0, 0.9);
        panel.fillCircle(panelLeft + 13, panelTop + 13, 2);
        panel.fillCircle(panelLeft + size.width - 13, panelTop + 13, 2);

        this.settingsPageContainer.add(panel);

        // 標題
        const titleMap = {
            language: 'LANGUAGE / 語言',
            screen: 'DISPLAY / 畫面',
            sound: 'AUDIO / 音效',
            operation: 'CONTROL / 操作',
            system: 'SYSTEM / 系統'
        };

        const title = this.add.text(
            centerX,
            panelTop + 19,
            titleMap[this.settingsCategory],
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#baffdf',
                stroke: '#09291f',
                strokeThickness: 2,
                align: 'center'
            }
        ).setOrigin(0.5);

        this.settingsPageContainer.add(title);

        const contentStartY =
            centerY - size.height / 2 + 64;

        switch (this.settingsCategory) {

            case 'language':
                this.buildLanguagePage(centerX, contentStartY);
                break;

            case 'screen':
                this.buildScreenPage(centerX, contentStartY);
                break;

            case 'sound':
                this.buildSoundPage(centerX, contentStartY);
                break;

            case 'operation':
                this.buildOperationPage(centerX, contentStartY);
                break;

            case 'system':
                this.buildSystemPage(centerX, contentStartY);
                break;
        }

        // 移除分類切換時的縮放動畫
        // 避免面板每次切換都出現跳動
        this.settingsPageContainer.setAlpha(1);
        this.settingsPageContainer.setScale(1);
    }

    // ==============================
    // 設定文字
    // ==============================

    addPageText(
        x,
        y,
        value,
        size = 13,
        color = '#f0ffef'
    ) {

        const text = this.add.text(x, y, value, {
            fontSize: `${size}px`,
            color,
            fontFamily: 'Arial, sans-serif',
            stroke: '#04130f',
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

    // ==============================
    // 全息文字按鈕
    // ==============================

    addPageButton(x, y, label, callback, width = 90) {

        const buttonContainer = this.add.container(x, y);

        const background = this.add.graphics();

        background.fillStyle(0x104936, 0.95);

        background.fillRoundedRect(
            -width / 2,
            -13,
            width,
            26,
            6
        );

        background.lineStyle(1, 0x55d9a5, 0.9);

        background.strokeRoundedRect(
            -width / 2,
            -13,
            width,
            26,
            6
        );

        const text = this.add.text(0, 0, label, {
            fontSize: '12px',
            color: '#e5fff2',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        buttonContainer.add([
            background,
            text
        ]);

        const hitArea = this.add.rectangle(
            0,
            0,
            width,
            28,
            0xffffff,
            0.001
        );

        hitArea.setInteractive({
            useHandCursor: true
        });

        buttonContainer.add(hitArea);

        hitArea.on('pointerover', () => {

            background.clear();

            background.fillStyle(0x1c7252, 1);

            background.fillRoundedRect(
                -width / 2,
                -13,
                width,
                26,
                6
            );

            background.lineStyle(1.5, 0xa4ffda, 1);

            background.strokeRoundedRect(
                -width / 2,
                -13,
                width,
                26,
                6
            );

            buttonContainer.setScale(1.04);
        });

        hitArea.on('pointerout', () => {

            background.clear();

            background.fillStyle(0x104936, 0.95);

            background.fillRoundedRect(
                -width / 2,
                -13,
                width,
                26,
                6
            );

            background.lineStyle(1, 0x55d9a5, 0.9);

            background.strokeRoundedRect(
                -width / 2,
                -13,
                width,
                26,
                6
            );

            buttonContainer.setScale(1);
        });

        hitArea.on('pointerdown', callback);

        this.settingsPageContainer.add(buttonContainer);

        return buttonContainer;
    }

    // ==============================
    // 十種語言
    // ==============================

    buildLanguagePage(centerX, startY) {

        const languages = [

            { code: 'zh-TW', flag: '🇹🇼', label: '繁體中文' },
            { code: 'zh-CN', flag: '🇨🇳', label: '简体中文' },
            { code: 'en', flag: '🇺🇸', label: 'English' },
            { code: 'ja', flag: '🇯🇵', label: '日本語' },
            { code: 'ko', flag: '🇰🇷', label: '한국어' },

            { code: 'th', flag: '🇹🇭', label: 'ไทย' },
            { code: 'fr', flag: '🇫🇷', label: 'Français' },
            { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
            { code: 'es', flag: '🇪🇸', label: 'Español' },
            { code: 'pt-BR', flag: '🇧🇷', label: 'Português' }
        ];

        const currentCode = LanguageSystem.getLanguage();

        const panelWidth =
            this.getPanelSize('language').width;

        const cellWidth = (panelWidth - 24) / 5;

        const startX =
            centerX - panelWidth / 2 + 12 + cellWidth / 2;

        const rowGap = 62;

        languages.forEach((language, index) => {

            const column = index % 5;
            const row = Math.floor(index / 5);

            const x = startX + column * cellWidth;
            const y = startY + 18 + row * rowGap;

            const selected = currentCode === language.code;

            const item = this.add.container(x, y);

            if (selected) {

                const selectedGlow = this.add.circle(
                    0,
                    -8,
                    18,
                    0x24d99b,
                    0.17
                );

                selectedGlow.setStrokeStyle(
                    1.5,
                    0x9affd3,
                    0.85
                );

                item.add(selectedGlow);
            }

            const flag = this.add.text(
                0,
                -8,
                language.flag,
                {
                    fontSize: selected ? '27px' : '25px'
                }
            ).setOrigin(0.5);

            const label = this.add.text(
                0,
                19,
                language.label,
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '8px',
                    fontStyle: selected ? 'bold' : 'normal',
                    color: selected ? '#aaffd8' : '#effff5',
                    stroke: '#04130f',
                    strokeThickness: 2,
                    align: 'center',
                    fixedWidth: cellWidth - 1,
                    wordWrap: {
                        width: cellWidth - 1
                    }
                }
            ).setOrigin(0.5);

            item.add([
                flag,
                label
            ]);

            const hitArea = this.add.rectangle(
                0,
                4,
                cellWidth - 2,
                55,
                0xffffff,
                0.001
            );

            hitArea.setInteractive({
                useHandCursor: true
            });

            item.add(hitArea);

            hitArea.on('pointerover', () => {
                item.setScale(1.08);
                label.setColor('#b5ffdc');
            });

            hitArea.on('pointerout', () => {

                item.setScale(1);

                label.setColor(
                    selected ? '#aaffd8' : '#effff5'
                );
            });

            hitArea.on('pointerdown', () => {

                // 保持語言分類開啟
                this.settingsCategory = 'language';

                LanguageSystem.setLanguage(language.code);
            });

            this.settingsPageContainer.add(item);

            // 國旗首次顯示動畫
            item.setAlpha(0);
            item.setScale(0.85);

            this.tweens.add({
                targets: item,
                alpha: 1,
                scale: selected ? 1.06 : 1,
                duration: 160,
                delay: index * 25,
                ease: 'Cubic.easeOut'
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

    // ==============================
    // 開關設定
    // ==============================

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

    // ==============================
    // 五大音效頻道
    // ==============================

    addAudioChannelRow(
        centerX,
        y,
        label,
        enabledKey,
        volumeKey
    ) {

        const enabled = !!this.getSetting(enabledKey);
        const volume = Number(this.getSetting(volumeKey)) || 0;

        this.addPageText(
            centerX - 48,
            y,
            label,
            11,
            '#effff5'
        );

        // 音效開關：右移 7px、下移 5px
        this.addPageButton(
            centerX + 82,
            y + 5,
            enabled ? '● 開啟' : '○ 關閉',
            () => {

                this.setSetting(
                    enabledKey,
                    !this.getSetting(enabledKey)
                );
            },
            65
        );

        // 音量百分比
        this.addPageText(
            centerX + 5,
            y + 23,
            `${Math.round(volume * 100)}%`,
            11,
            '#baffdf'
        );

        // 降低音量
        this.addPageButton(
            centerX - 35,
            y + 23,
            '－',
            () => {

                const current =
                    Number(this.getSetting(volumeKey)) || 0;

                const next = Math.max(0, current - 0.1);

                this.setSetting(
                    volumeKey,
                    Number(next.toFixed(2))
                );
            },
            30
        );

        // 增加音量
        this.addPageButton(
            centerX + 45,
            y + 23,
            '＋',
            () => {

                const current =
                    Number(this.getSetting(volumeKey)) || 0;

                const next = Math.min(1, current + 0.1);

                this.setSetting(
                    volumeKey,
                    Number(next.toFixed(2))
                );
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
            14,
            '#baffdf'
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
            14,
            '#baffdf'
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

        channels.forEach((channel, index) => {

            this.addAudioChannelRow(
                centerX,
                startY + 38 + index * 48,
                channel.label,
                channel.enabled,
                channel.volume
            );
        });
    }

    // ==============================
    // 操作設定
    // ==============================

    buildOperationPage(centerX, startY) {

        this.addPageText(
            centerX,
            startY,
            '操作設定',
            14,
            '#baffdf'
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
            14,
            '#baffdf'
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
