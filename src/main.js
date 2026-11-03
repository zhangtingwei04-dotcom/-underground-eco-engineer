// 鱗片與種子：地下生態物語 | 遊戲主入口與初始化 (ES Module 版)
// Scales & Seeds: Underground Ecosystem Tales - Main Entry

import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { SaveSystem } from './systems/save-system.js';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        UndergroundScene,
        EncyclopediaScene,
        TerrariumSelectScene
    ]
};

window.addEventListener('load', () => {
    // 初始化全域遊戲存檔管理器 (整合雲端與本地)
    window.gameSaveManager = new SaveSystem();
    console.log('[Main] 存檔管理器已初始化');

    // 啟動 Phaser 遊戲執行個體
    const game = new Phaser.Game(config);
    window.gameInstance = game;
});