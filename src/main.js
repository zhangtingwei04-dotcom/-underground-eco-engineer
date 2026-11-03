/**
 * 《鱗片與種子：地下生態物語》 - 遊戲主入口 (src/main.js)
 * 整合雲端存檔引導、生存模式校驗與 Phaser 遊戲初始化
 */

import { handleGameStart } from './save-bootstrap.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

// 當網頁 DOM 載入完成時執行初始化流程
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('【系統】正在初始化地下生態研究站與雲端存檔...');
        
        // 執行開局存檔同步與生存模式鎖定（預設為 'cozy'，可依開局選單動態調整為 'challenge'）
        await handleGameStart('cozy');
        
        console.log('【系統】存檔校驗與遷移完成，準備啟動 Phaser 遊戲。');
    } catch (error) {
        console.error('【系統警告】雲端同步初始化發生異常，將以離線模式運行:', error);
    }

    // Phaser 遊戲核心設定
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

    // 建立 Phaser 遊戲實例
    const game = new Phaser.Game(config);
});