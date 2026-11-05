// 鱗片與種子：地下生態物語
// Terrarium Selection & Overview Scene
// AudioSystem V2.1 Integration

import { AudioSystem } from '../systems/AudioSystem.js';

export class TerrariumSelectScene extends Phaser.Scene {

    constructor() {
        super({ key: 'TerrariumSelectScene' });

        this.terrariumSystem = null;
        this.saveSystem = null;
    }

    // =====================================
    // 背景音樂預載
    // =====================================

    preload() {

        AudioSystem.preloadSceneBGM(this);

    }

    // =====================================
    // 接收資料
    // =====================================

    init(data = {}) {

        this.terrariumSystem =
            data.terrariumSystem ||
            window.globalTerrariumSystem;

        this.saveSystem =
            data.saveSystem ||
            window.globalTerrariumSaveSystem;
    }

    // =====================================
    // 場景初始化
    // =====================================

    create() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 啟動生態箱選擇場景背景音樂
        AudioSystem.playSceneBGM(this);

        // 1. 繪製背景
        this.createBackground(width, height);

        // 2. 標題與導覽文字
        this.add.text(
            width / 2,
            50,
            '🌿 我的地下生態保護區 - 生態箱總覽',
            {
                fontSize: '24px',
                color: '#e8d8c8',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        this.add.text(
            width / 2,
            85,
            '選擇一個生態箱以進入觀察、照顧寵物或進行造景佈置',
            {
                fontSize: '14px',
                color: '#b8a695',
                wordWrap: {
                    width: width - 40
                },
                align: 'center'
            }
        ).setOrigin(0.5);

        // 3. 生態箱清單
        this.renderTerrariumCards(width, height);

        // 4. 底部操作按鈕
        this.createBottomActions(width, height);
    }

    // =====================================
    // 背景
    // =====================================

    createBackground(width, height) {

        const bg = this.add.graphics();

        bg.fillStyle(0x1f1611, 1);
        bg.fillRect(0, 0, width, height);

        bg.lineStyle(2, 0x4a382a, 0.8);

        bg.strokeRect(
            30,
            30,
            width - 60,
            height - 60
        );
    }

    // =====================================
    // 生態箱卡片
    // =====================================

    renderTerrariumCards(width, height) {

        if (!this.terrariumSystem) {

            console.warn(
                '[TerrariumSelect] TerrariumSystem not found.'
            );

            return;
        }

        const terrariums =
            typeof this.terrariumSystem.getAllTerrariums === 'function'
                ? this.terrariumSystem.getAllTerrariums()
                : [];

        const startY = 140;
        const cardWidth = width - 120;
        const cardHeight = 90;

        if (terrariums.length === 0) {

            this.add.text(
                width / 2,
                height / 2,
                '目前沒有任何生態箱，請點擊下方按鈕建立第一個小世界！',
                {
                    fontSize: '16px',
                    color: '#8a7f72',
                    wordWrap: {
                        width: width - 60
                    },
                    align: 'center'
                }
            ).setOrigin(0.5);

            return;
        }

        terrariums.forEach((terrarium, index) => {

            const cardX = 60;
            const cardY = startY + index * 105;

            const cardBg = this.add.graphics();

            const isActive =
                terrarium.id ===
                this.terrariumSystem.activeTerrariumId;

            cardBg.fillStyle(
                isActive ? 0x3d2b1f : 0x2b1d14,
                0.9
            );

            cardBg.lineStyle(
                2,
                isActive ? 0xd4a373 : 0x5c4d41,
                1
            );

            cardBg.fillRoundedRect(
                cardX,
                cardY,
                cardWidth,
                cardHeight,
                10
            );

            cardBg.strokeRoundedRect(
                cardX,
                cardY,
                cardWidth,
                cardHeight,
                10
            );

            // 生態箱名稱
            this.add.text(
                cardX + 20,
                cardY + 15,
                `${terrarium.name} [ID: ${terrarium.id}]`,
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            );

            // 生態環境資料
            const dim = terrarium.dimensions || {
                width: 30,
                depth: 30,
                height: 30
            };

            const env = terrarium.environment || {
                temperature: 24,
                humidity: 50
            };

            const creaturesCount =
                terrarium.creatures
                    ? terrarium.creatures.length
                    : 0;

            const summaryStr =
                `尺寸: ${dim.width}x${dim.depth}x${dim.height}cm | ` +
                `溫度: ${env.temperature}°C | ` +
                `濕度: ${env.humidity}% | ` +
                `寵物數: ${creaturesCount}`;

            this.add.text(
                cardX + 20,
                cardY + 45,
                summaryStr,
                {
                    fontSize: '13px',
                    color: '#b8a695',
                    wordWrap: {
                        width: cardWidth - 40
                    }
                }
            );

            // 活躍生態箱標籤
            if (isActive) {

                this.add.text(
                    cardX + cardWidth - 110,
                    cardY + 15,
                    '✨ 當前活躍',
                    {
                        fontSize: '12px',
                        color: '#ffd59e',
                        backgroundColor: '#5c4d41',
                        padding: {
                            x: 6,
                            y: 3
                        }
                    }
                );
            }

            // 卡片點擊區域
            const hitArea = this.add.zone(
                cardX + cardWidth / 2,
                cardY + cardHeight / 2,
                cardWidth,
                cardHeight
            );

            hitArea.setInteractive({
                useHandCursor: true
            });

            hitArea.on('pointerdown', () => {

                this.terrariumSystem.setActiveTerrarium(
                    terrarium.id
                );

                if (this.saveSystem) {

                    this.saveSystem.saveAllTerrariums(
                        this.terrariumSystem
                    );
                }

                console.log(
                    `[TerrariumSelect] 切換至生態箱: ${terrarium.id}`
                );

                this.scene.start(
                    'UndergroundScene',
                    {
                        terrariumId: terrarium.id
                    }
                );
            });
        });
    }

    // =====================================
    // 底部操作按鈕
    // =====================================

    createBottomActions(width, height) {

        const btnY = height - 60;

        // 建立新生態箱
        const createBtn = this.add.text(
            width / 2 - 120,
            btnY,
            '＋ 建立新生態箱',
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#4a382a',
                padding: {
                    x: 14,
                    y: 10
                }
            }
        ).setOrigin(0.5).setInteractive({
            useHandCursor: true
        });

        createBtn.on('pointerdown', () => {

            const newId =
                `terrarium_${Date.now().toString().slice(-4)}`;

            try {

                this.terrariumSystem.createTerrarium(
                    newId,
                    'standard',
                    `標準生態箱 #${this.terrariumSystem.getAllTerrariums().length + 1}`
                );

                if (this.saveSystem) {

                    this.saveSystem.saveAllTerrariums(
                        this.terrariumSystem
                    );
                }

                this.scene.restart({

                    terrariumSystem: this.terrariumSystem,
                    saveSystem: this.saveSystem

                });

            } catch (err) {

                console.error(
                    '建立生態箱失敗:',
                    err
                );
            }
        });

        // 返回主畫面
        const backBtn = this.add.text(
            width / 2 + 120,
            btnY,
            '返回主畫面',
            {
                fontSize: '14px',
                color: '#b8a695',
                backgroundColor: '#2b1d14',
                padding: {
                    x: 14,
                    y: 10
                }
            }
        ).setOrigin(0.5).setInteractive({
            useHandCursor: true
        });

        backBtn.on('pointerdown', () => {

            this.scene.start('UndergroundScene');

        });
    }
}

// =====================================
// 全域掛載
// =====================================

window.TerrariumSelectScene = TerrariumSelectScene;