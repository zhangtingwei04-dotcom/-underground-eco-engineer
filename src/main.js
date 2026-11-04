
// 鱗片與種子：地下生態物語
// Main Entry Point - Responsive Portrait & Landscape

import { LanguageSystem } from './systems/language-system.js';

import { LoginScene } from './scenes/LoginScene.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', async () => {

    try {

        console.log('【系統】正在啟動地下生態研究站...');

        // 初始化語言系統
        await LanguageSystem.initialize();

        console.log(
            '【語系系統】目前語言：',
            LanguageSystem.getLanguage()
        );

        // 建立 Phaser 遊戲設定
        const config = {

            type: Phaser.AUTO,

            width: 1024,
            height: 768,

            parent: 'game-container',

            backgroundColor: '#1a1a1a',

            scale: {

                // 保持原始遊戲比例，自動適應螢幕
                mode: Phaser.Scale.FIT,

                // 自動置中
                autoCenter: Phaser.Scale.CENTER_BOTH,

                // 允許遊戲畫布隨螢幕尺寸調整
                expandParent: false
            },

            // 遊戲場景
            scene: [
                LoginScene,
                TerrariumSelectScene,
                UndergroundScene,
                EncyclopediaScene
            ]
        };

        // 建立遊戲
        window.game = new Phaser.Game(config);

        // 監聽螢幕方向與尺寸變化
        const resizeGame = () => {

            if (!window.game) return;

            const width = window.innerWidth;
            const height = window.innerHeight;

            console.log(
                '【畫面調整】',
                width >= height ? '橫向模式' : '直向模式',
                width + ' × ' + height
            );

            window.game.scale.refresh();
        };

        // 監聽手機旋轉
        window.addEventListener('resize', resizeGame);

        window.addEventListener('orientationchange', () => {
            setTimeout(resizeGame, 200);
        });

        console.log('【系統】入口畫面初始化完成。');

    } catch (error) {

        console.error('【系統錯誤】遊戲啟動失敗：', error);

        alert(
            '遊戲啟動失敗，請重新整理頁面或檢查程式碼。'
        );
    }

});
