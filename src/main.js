
// 鱗片與種子：地下生態物語
// Main Entry Point - iPhone Responsive Fullscreen

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

        const container = document.getElementById('game-container');

        if (!container) {
            throw new Error('找不到 game-container');
        }

        const getScreenSize = () => {

            const rect = container.getBoundingClientRect();

            return {
                width: Math.max(1, Math.round(rect.width)),
                height: Math.max(1, Math.round(rect.height))
            };
        };

        const initialSize = getScreenSize();

        const config = {

            type: Phaser.AUTO,

            width: initialSize.width,
            height: initialSize.height,

            parent: 'game-container',

            backgroundColor: '#1a110b',

            scale: {

                mode: Phaser.Scale.RESIZE,

                // 關閉 Phaser 自動置中
                autoCenter: Phaser.Scale.NO_CENTER,

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

        let resizeTimer = null;

        const resizeGame = () => {

            if (!window.game || !window.game.scale) {
                return;
            }

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {

                const size = getScreenSize();

                window.game.scale.resize(
                    size.width,
                    size.height
                );

                console.log(
                    '【畫面調整】',
                    size.width >= size.height
                        ? '橫向模式'
                        : '直向模式',
                    size.width + ' × ' + size.height
                );

            }, 150);
        };

        // 監聽一般視窗尺寸變化
        window.addEventListener('resize', resizeGame);

        // 監聽手機方向變化
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeGame, 300);
            setTimeout(resizeGame, 700);
        });

        // 監聽 iPhone Safari 可視區域變化
        if (window.visualViewport) {
            window.visualViewport.addEventListener(
                'resize',
                resizeGame
            );
        }

        // 監聽遊戲容器尺寸變化
        if (window.ResizeObserver) {

            const observer = new ResizeObserver(() => {
                resizeGame();
            });

            observer.observe(container);

        }

        console.log('【系統】入口畫面初始化完成。');

    } catch (error) {

        console.error('【系統錯誤】遊戲啟動失敗：', error);

        alert(
            '遊戲啟動失敗，請重新整理頁面或檢查程式碼。'
        );
    }

});
