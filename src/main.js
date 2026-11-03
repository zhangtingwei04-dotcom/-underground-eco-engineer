import { handleGameStart } from './save-bootstrap.js';
import { TerrariumSelectScene } from './scenes/TerrariumSelectScene.js';
import { UndergroundScene } from './scenes/UndergroundScene.js';
import { EncyclopediaScene } from './scenes/EncyclopediaScene.js';

window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('【系統】正在初始化地下生態研究站與雲端存檔...');

        const startResult = await handleGameStart();

        if (!['existing_save', 'created'].includes(startResult.status)) {
            throw new Error(
                startResult.error || '遊戲初始化失敗，無法啟動。'
            );
        }

        console.log('【系統】存檔校驗完成，準備啟動遊戲引擎。');

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

        window.game = new Phaser.Game(config);

    } catch (error) {
        console.error('【系統錯誤】遊戲初始化失敗：', error);
        alert('遊戲初始化失敗，請重新整理頁面或檢查存檔連線。');
    }
});
    try {
        console.log('【系統】正在初始化地下生態研究站與雲端存檔...');
        
        // 先嘗試初始化並檢查是否已有存檔
        const hasExistingSave = await handleGameStart('cozy');

        if (!hasExistingSave) {
            // 如果是全新開局，彈出 Cozy vs Challenge 選擇介面
            const selectedMode = await promptForSurvivalMode();
            // 帶入玩家選擇的模式重新執行初始化遷移
            await handleGameStart(selectedMode);
        }
        
        console.log('【系統】存檔校驗完成，準備啟動遊戲引擎。');
    } catch (error) {
        console.error('【系統警告】初始化發生異常，將以離線模式運行:', error);
    }

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

    const game = new Phaser.Game(config);
});

/**
 * 建立一個美觀的開局生存模式選擇彈窗
 */
function promptForSurvivalMode() {
    return new Promise((resolve) => {
        // 建立遮罩背景
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.85); display: flex; justify-content: center;
            align-items: center; z-index: 9999; font-family: sans-serif; color: #f8fafc;
        `;

        // 彈窗本體
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1e293b; padding: 40px; border-radius: 12px; max-width: 600px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #334155;
            text-align: center;
        `;

        modal.innerHTML = `
            <h2 style="margin-top: 0; color: #38bdf8; font-size: 24px;">歡迎來到《鱗片與種子：地下生態物語》</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 30px;">請選擇您的研究體驗模式。注意：建立存檔後將由伺服器永久鎖定，無法中途切換！</p>
            
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <div id="btn-cozy" style="flex: 1; background: #0f172a; border: 2px solid #38bdf8; border-radius: 8px; padding: 20px; cursor: pointer; text-align: left; transition: all 0.2s;">
                    <h3 style="margin: 0 0 10px 0; color: #38bdf8;">🌿 Cozy 療癒模式</h3>
                    <p style="font-size: 12px; color: #cbd5e1; margin: 0; line-height: 1.5;">寵物不會死亡。適合專心享受生態箱建設、基因培育、圖鑑收集與溫馨 NPC 感情線。</p>
                </div>
                
                <div id="btn-challenge" style="flex: 1; background: #0f172a; border: 2px solid #64748b; border-radius: 8px; padding: 20px; cursor: pointer; text-align: left; transition: all 0.2s;">
                    <h3 style="margin: 0 0 10px 0; color: #f43f5e;">⚡ Challenge 真實模擬</h3>
                    <p style="font-size: 12px; color: #cbd5e1; margin: 0; line-height: 1.5;">嚴格的離線生態模擬。溫濕度異常與照護失誤可能導致疾病甚至死亡，考驗極致專業。</p>
                </div>
            </div>

            <button id="btn-confirm" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">確認模式並進入研究站</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        let selected = 'cozy';
        const cozyCard = modal.querySelector('#btn-cozy');
        const challengeCard = modal.querySelector('#btn-challenge');

        cozyCard.onclick = () => {
            selected = 'cozy';
            cozyCard.style.borderColor = '#38bdf8';
            cozyCard.style.background = '#1e293b';
            challengeCard.style.borderColor = '#64748b';
            challengeCard.style.background = '#0f172a';
        };

        challengeCard.onclick = () => {
            selected = 'challenge';
            challengeCard.style.borderColor = '#f43f5e';
            challengeCard.style.background = '#1e293b';
            cozyCard.style.borderColor = '#38bdf8';
            cozyCard.style.background = '#0f172a';
        };

        modal.querySelector('#btn-confirm').onclick = () => {
            document.body.removeChild(overlay);
            resolve(selected);
        };
    });
}