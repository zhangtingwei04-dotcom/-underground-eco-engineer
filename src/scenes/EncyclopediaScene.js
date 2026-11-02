// 地下生態工程師 - 生物與環境圖鑑場景 (Encyclopedia Scene)

class EncyclopediaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EncyclopediaScene' });
    }

    create() {
        const scene = this;
        console.log("【圖鑑系統】已進入圖鑑檢視畫面。");

        // 繪製半透明的圖鑑背景底框
        let bg = scene.add.graphics();
        bg.fillStyle(0x1a110b, 0.9);
        bg.fillRect(50, 50, 700, 500);

        // 讀取多語言標題
        let title = "📖 生物與環境圖鑑 / Encyclopedia";
        if (window.gameLocales) {
            title = "📖 " + window.gameLocales.translate("creature_hognose_snake") + " - " + window.gameLocales.translate("game_title");
        }
        scene.add.text(80, 80, title, { font: "24px Arial", fill: "#ffffff", fontStyle: "bold" });

        // 顯示核心生物：豬鼻蛇的圖鑑說明
        let desc = "【 核心生物資料 】\n\n挖掘力：15\n偏好環境：乾燥\n\n擁有一隻朝天的豬鼻子，擅長在沙土中挖掘，遇到危險時是個演技派的裝死高手。";
        if (window.gameLocales) {
            desc = `【 ${window.gameLocales.translate("creature_hognose_snake")} 】\n\n` +
                   `⛏️ ${window.gameLocales.translate("stats_digging")}：15\n` +
                   `🏠 ${window.gameLocales.translate("creature_hognose_desc")}`;
        }
        scene.add.text(80, 150, desc, { font: "16px Arial", fill: "#dddddd", wordWrap: { width: 640 } });

        // 返回主要地下場景的按鈕
        let btnBack = scene.add.text(80, 480, "[ ✕ 關閉圖鑑 / Close ]", { font: "18px Arial", fill: "#ff5722" }).setInteractive();
        btnBack.on('pointerdown', function() {
            console.log("【圖鑑系統】關閉圖鑑，返回主場景。");
            // 未來在此實作切換回主畫面的邏輯：scene.scene.stop('EncyclopediaScene');
        });
    }
}

// 掛載至全域，方便 index.html 讀取
window.EncyclopediaScene = EncyclopediaScene;
