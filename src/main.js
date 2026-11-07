
// 鱗片與種子：地下生態物語
// Main Entry Point - iPhone Responsive Fullscreen

import { AudioSystem } from './systems/AudioSystem.js';
import { LanguageSystem } from './systems/language-system.js';
import { SettingsSystem } from './systems/settings-system.js';

import { LoginScene } from './scenes/LoginScene.js?v=ko-logo-approved-20261107-8';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', async () => {

    try {

        console.log('【系統】正在啟動地下生態研究站...');

        // 1. 初始化語言系統
        await LanguageSystem.initialize();

        console.log(
            '【語系系統】目前語言：',
            LanguageSystem.getLanguage()
        );

        // 2. 初始化遊戲設定
        SettingsSystem.load();

        console.log(
            '【設定系統】設定載入完成：',
            SettingsSystem.getSettings()
        );

        // 3. 確認遊戲容器
        const container = document.getElementById('game-container');

        if (!container) {
            throw new Error('找不到 game-container');
        }

        // 4. 取得畫面尺寸
        const getScreenSize = () => {

            const rect = container.getBoundingClientRect();

            return {
                width: Math.max(1, Math.round(rect.width)),
                height: Math.max(1, Math.round(rect.height))
            };
        };

        const initialSize = getScreenSize();

        // 5. Phaser 遊戲設定
        const config = {

            type: Phaser.AUTO,

            width: initialSize.width,
            height: initialSize.height,

            parent: 'game-container',

            backgroundColor: '#1a110b',

            scale: {

                mode: Phaser.Scale.RESIZE,

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

        // 6. 建立遊戲
        window.game = new Phaser.Game(config);

        // 7. 初始化音效系統
        AudioSystem.initialize(window.game);

        // 8. 畫面尺寸調整
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

        // 9. 監聽瀏覽器尺寸
        window.addEventListener('resize', resizeGame);

        // 10. 監聽手機方向
        window.addEventListener('orientationchange', () => {

            setTimeout(resizeGame, 300);
            setTimeout(resizeGame, 700);

        });

        // 11. 監聽 iPhone 可視範圍
        if (window.visualViewport) {

            window.visualViewport.addEventListener(
                'resize',
                resizeGame
            );

        }

        // 12. 監聽遊戲容器尺寸
        if (window.ResizeObserver) {

            const observer = new ResizeObserver(() => {
                resizeGame();
            });

            observer.observe(container);

        }

        console.log('【系統】入口畫面初始化完成。');

    } catch (error) {

        console.error(
            '【系統錯誤】遊戲啟動失敗：',
            error
        );

        const errorMessage = error?.message || String(error);

        alert(
            '遊戲啟動失敗！\n\n' +
            '錯誤原因：' + errorMessage +
            '\n\n請截圖或複製錯誤內容，提供給開發者。'
        );

    }

});
