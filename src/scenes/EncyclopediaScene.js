// 鱗片與種子：地下生態物語
// Encyclopedia Scene
// Creature Encyclopedia & Collection Management
// AudioSystem V2.1 Integration

import { AudioSystem } from '../systems/AudioSystem.js';

export class EncyclopediaScene extends Phaser.Scene {

    constructor() {

        super({ key: 'EncyclopediaScene' });

        this.detailGroup = null;
    }

    // =====================================
    // 背景音樂預載
    // =====================================

    preload() {

        AudioSystem.preloadSceneBGM(this);

    }

    // =====================================
    // 場景初始化
    // =====================================

    create() {

        const scene = this;

        console.log(
            '【圖鑑系統】進入生物圖鑑與收藏介面...'
        );

        // 啟動圖鑑場景背景音樂
        AudioSystem.playSceneBGM(this);

        // 背景
        scene.add.rectangle(
            400,
            300,
            800,
            600,
            0x1a110b
        );

        // 標題文字
        const titleText = window.gameLocales
            ? window.gameLocales.translate('menu_encyclopedia')
            : '生物圖鑑';

        scene.add.text(
            40,
            30,
            `📖 ${titleText} / Creature Encyclopedia`,
            {
                font: '22px Arial',
                fill: '#ffffff',
                fontStyle: 'bold'
            }
        );

        // 返回地下探索畫面
        const backBtn = scene.add.text(
            650,
            30,
            '[ 返回地下探索 ]',
            {
                font: '15px Arial',
                fill: '#00ff00'
            }
        ).setInteractive({
            useHandCursor: true
        });

        backBtn.on('pointerdown', () => {

            // 使用 Phaser 場景切換
            // 讓 AudioSystem 可以正常進行背景音樂淡入淡出
            scene.scene.start('UndergroundScene');

        });

        // =====================================
        // 生物圖鑑資料
        // =====================================

        const creatures = [

            {
                id: 'hognose_snake',

                nameKey: 'creature_hognose_snake',

                descKey: 'creature_hognose_desc',

                unlocked: true,

                diggingPower: 15,

                humidity: '乾燥 (Dry)',

                skill: '裝死防禦 (Play Dead)'
            },

            {
                id: 'underground_ant',

                nameKey: 'creature_ant_name',

                descKey: 'creature_ant_desc',

                unlocked: false,

                diggingPower: 5,

                humidity: '潮濕 (Moist)',

                skill: '群體隧道清理'
            }

        ];

        // =====================================
        // 左側生物清單
        // =====================================

        creatures.forEach((creature, index) => {

            const y = 110 + index * 65;

            const displayName = creature.unlocked
                ? (
                    window.gameLocales
                        ? window.gameLocales.translate(creature.nameKey)
                        : '豬鼻蛇'
                )
                : '🔒 ??? (未解鎖)';

            const color = creature.unlocked
                ? '#ffeb3b'
                : '#777777';

            const itemBox = scene.add.rectangle(
                160,
                y,
                240,
                50,
                0x3e2723
            ).setInteractive({
                useHandCursor: true
            });

            itemBox.setStrokeStyle(
                1,
                0x5c4033
            );

            scene.add.text(
                60,
                y - 10,
                displayName,
                {
                    font: '15px Arial',
                    fill: color,
                    fontStyle: 'bold'
                }
            );

            itemBox.on('pointerdown', () => {

                showCreatureDetail(
                    scene,
                    creature
                );

            });
        });

        // 預設顯示第一隻生物
        showCreatureDetail(
            scene,
            creatures[0]
        );
    }
}

// =====================================
// 生物詳細資訊
// =====================================

function showCreatureDetail(scene, creature) {

    if (scene.detailGroup) {

        scene.detailGroup.clear(
            true,
            true
        );

    } else {

        scene.detailGroup = scene.add.group();
    }

    const startX = 320;
    const startY = 95;

    const name = creature.unlocked
        ? (
            window.gameLocales
                ? window.gameLocales.translate(creature.nameKey)
                : '豬鼻蛇'
        )
        : '未解鎖生物 (Locked)';

    const desc = creature.unlocked
        ? (
            window.gameLocales
                ? window.gameLocales.translate(creature.descKey)
                : '詳細生物習性說明...'
        )
        : '尚未在地下探索中發現此生物。請透過不斷挖掘地層解鎖更多生態奧秘！';

    // 詳細資訊背景
    const bgPanel = scene.add.rectangle(
        startX + 215,
        startY + 205,
        430,
        410,
        0x2e1c14
    );

    bgPanel.setStrokeStyle(
        2,
        0x5c4033
    );

    scene.detailGroup.add(bgPanel);

    // 生物名稱
    const nameTxt = scene.add.text(
        startX + 30,
        startY + 20,
        `📜 ${name}`,
        {
            font: '20px Arial',
            fill: '#ff9800',
            fontStyle: 'bold'
        }
    );

    // 生物介紹
    const descTxt = scene.add.text(
        startX + 30,
        startY + 70,
        desc,
        {
            font: '14px Arial',
            fill: '#dddddd',
            wordWrap: {
                width: 380
            },
            lineSpacing: 4
        }
    );

    scene.detailGroup.add(nameTxt);
    scene.detailGroup.add(descTxt);

    // =====================================
    // 已解鎖生物
    // =====================================

    if (creature.unlocked) {

        const statsTxt = scene.add.text(
            startX + 30,
            startY + 200,

            `⛏️ 基礎挖掘力: ${creature.diggingPower}\n` +
            `💧 偏好棲息濕度: ${creature.humidity}\n` +
            `✨ 特殊生物技能: ${creature.skill}`,

            {
                font: '14px Arial',
                fill: '#8bc34a',
                lineSpacing: 8
            }
        );

        scene.detailGroup.add(statsTxt);

    } else {

        // =====================================
        // 未解鎖生物
        // =====================================

        const lockTxt = scene.add.text(
            startX + 30,
            startY + 200,

            `🔒 解鎖狀態：尚未發現\n` +
            `💡 探索提示：嘗試深入挖掘深層泥土或岩石層以解鎖此生物。`,

            {
                font: '14px Arial',
                fill: '#f44336',
                lineSpacing: 8
            }
        );

        scene.detailGroup.add(lockTxt);
    }
}

// =====================================
// 全域掛載
// =====================================

window.EncyclopediaScene = EncyclopediaScene;