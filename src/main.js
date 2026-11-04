// 鱗片與種子：地下生態物語
// Main Entry Point

import { LoginScene } from './scenes/LoginScene.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', () => {

    try {

        console.log('【系統】正在啟動地下生態研究站...');

        // Phaser 遊戲設定
        const config = {

            type: Phaser.AUTO,

            width: 1024,

            height: 768,

            parent: 'game-container',

            backgroundColor: '#1a1a1a',

            scene: [
                LoginScene,
                TerrariumSelectScene,
                UndergroundScene,
                EncyclopediaScene
            ]
        };

        // 建立遊戲
        window.game = new Phaser.Game(config);

        console.log('【系統】入口畫面初始化完成。');

    } catch (error) {

        console.error('【系統錯誤】遊戲啟動失敗：', error);

        alert(
            '遊戲啟動失敗，請重新整理頁面或檢查程式碼。'
        );
    }

});