import { handleGameStart } from './save-bootstrap.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('【系統】正在初始化地下生態研究站與雲端存檔...');

        // 初始化存檔，不再選擇任何生存模式
        const startResult = await handleGameStart();

        // 確認存檔初始化成功
        if (!startResult || !['existing_save', 'created'].includes(startResult.status)) {
            throw new Error(
                startResult?.error || '遊戲初始化失敗，無法啟動。'
            );
        }

        // 載入玩家存檔
        window.playerSaveData = startResult.save;

        console.log('【系統】存檔校驗完成，準備啟動遊戲引擎。');

        // Phaser 遊戲設定
        const config = {
            type: Phaser.AUTO,
            width: 1024,
            height: 768,
            parent: 'game-container',
            backgroundColor: '#1a1a1a',
            scene: [
                TerrariumSelectScene,
                UndergroundScene,
                EncyclopediaScene
            ]
        };

        // 啟動遊戲
        window.game = new Phaser.Game(config);

        console.log('【系統】地下生態研究站啟動完成。');

    } catch (error) {
        console.error('【系統錯誤】遊戲初始化失敗：', error);

        alert(
            '遊戲初始化失敗，請重新整理頁面或檢查存檔連線。'
        );
    }
});