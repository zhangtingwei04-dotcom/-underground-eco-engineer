
// 鱗片與種子：地下生態物語
// Main Entry Point - Fullscreen Responsive Layout

import { LanguageSystem } from './systems/language-system.js';

import { LoginScene } from './scenes/LoginScene.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', async () => {

    try {

        console.log('【系統】正在啟動地下生態研究站...');

        await LanguageSystem.initialize();

        console.log(
            '【語系系統】目前語言：',
            LanguageSystem.getLanguage()
        );

        const config = {

            type: Phaser.AUTO,

            // 初始尺寸，啟動後會依照容器調整
            width: window.innerWidth,
            height: window.innerHeight,

            parent: 'game-container',

            backgroundColor: '#1a110b',

            scale: {

                // 真正依照容器尺寸調整遊戲世界
                mode: Phaser.Scale.RESIZE,

                autoCenter: Phaser.Scale.CENTER_BOTH,

                expandParent: false
            },

            scene: [
                LoginScene,
                TerrariumSelectScene,
                UndergroundScene,
                EncyclopediaScene
            ]
        };

        window.game = new Phaser.Game(config);

        // 監聽螢幕尺寸變化
        let resizeTimer = null;

        const resizeGame = () => {

            if (!window.game) return;

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {

                const container = document.getElementById('game-container');

                if (!container) return;

                const width = container.clientWidth;
                const height = container.clientHeight;

                if (width <= 0 || height <= 0) return;

                window.game.scale.resize(width, height);

                console.log(
                    '【畫面調整】',
                    width >= height ? '橫向模式' : '直向模式',
                    width + ' × ' + height
                );

            }, 100);
        };

        window.addEventListener('resize', resizeGame);

        window.addEventListener('orientationchange', () => {
            setTimeout(resizeGame, 300);
        });

        console.log('【系統】入口畫面初始化完成。');

    } catch (error) {

        console.error('【系統錯誤】遊戲啟動失敗：', error);

        alert(
            '遊戲啟動失敗，請重新整理頁面或檢查程式碼。'
        );
    }

});
