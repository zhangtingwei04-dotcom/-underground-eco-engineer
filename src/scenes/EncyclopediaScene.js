// 地下生態工程師 - 生物圖鑑與收藏管理場景 (Encyclopedia Scene)

export class EncyclopediaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EncyclopediaScene' });
    }

    create() {
        const scene = this;
        console.log("【圖鑑系統】進入生物圖鑑與收藏介面...");

        // 背景
        scene.add.rectangle(400, 300, 800, 600, 0x1a110b);

        // 標題文字
        let titleText = window.gameLocales ? window.gameLocales.translate("menu_encyclopedia") : "生物圖鑑";
        scene.add.text(40, 30, `📖 ${titleText} / Creature Encyclopedia`, { font: "22px Arial", fill: "#ffffff", fontStyle: "bold" });

        // 返回遊戲探索畫面按鈕
        let backBtn = scene.add.text(650, 30, "[ 返回地下探索 ]", { font: "15px Arial", fill: "#00ff00" }).setInteractive();
        backBtn.on('pointerdown', function() {
            window.location.reload(); // 簡易返回重新載入主畫面
        });

        // 定義生物圖鑑資料清單（已解鎖與未解鎖剪影）
        const creatures = [
            {
                id: "hognose_snake",
                nameKey: "creature_hognose_snake",
                descKey: "creature_hognose_desc",
                unlocked: true,
                diggingPower: 15,
                humidity: "乾燥 (Dry)",
                skill: "裝死防禦 (Play Dead)"
            },
            {
                id: "underground_ant",
                nameKey: "creature_ant_name",
                descKey: "creature_ant_desc",
                unlocked: false, // 尚未解鎖
                diggingPower: 5,
                humidity: "潮濕 (Moist)",
                skill: "群體隧道清理"
            }
        ];

        // 繪製左側生物清單選擇列
        creatures.forEach((creature, index) => {
            let y = 110 + index * 65;
            let displayName = creature.unlocked ? 
                (window.gameLocales ? window.gameLocales.translate(creature.nameKey) : "豬鼻蛇") : 
                "🔒 ??? (未解鎖)";
            let color = creature.unlocked ? "#ffeb3b" : "#777777";

            let itemBox = scene.add.rectangle(160, y, 240, 50, 0x3e2723).setInteractive();
            itemBox.setStrokeStyle(1, 0x5c4033);
            scene.add.text(60, y - 10, displayName, { font: "15px Arial", fill: color, fontStyle: "bold" });

            itemBox.on('pointerdown', function() {
                showCreatureDetail(scene, creature);
            });
        });

        showCreatureDetail(scene, creatures[0]);
    }
}

function showCreatureDetail(scene, creature) {
    if (scene.detailGroup) {
        scene.detailGroup.clear(true, true);
    } else {
        scene.detailGroup = scene.add.group();
    }

    const startX = 320;
    const startY = 95;

    let name = creature.unlocked ? (window.gameLocales ? window.gameLocales.translate(creature.nameKey) : "豬鼻蛇") : "未解鎖生物 (Locked)";
    let desc = creature.unlocked ? (window.gameLocales ? window.gameLocales.translate(creature.descKey) : "詳細生物習性說明...") : "尚未在地下探索中發現此生物。請透過不斷挖掘地層解鎖更多生態奧秘！";

    let bgPanel = scene.add.rectangle(startX + 215, startY + 205, 430, 410, 0x2e1c14);
    bgPanel.setStrokeStyle(2, 0x5c4033);
    scene.detailGroup.add(bgPanel);

    let nameTxt = scene.add.text(startX + 30, startY + 20, `📜 ${name}`, { font: "20px Arial", fill: "#ff9800", fontStyle: "bold" });
    let descTxt = scene.add.text(startX + 30, startY + 70, desc, { font: "14px Arial", fill: "#dddddd", wordWrap: { width: 380 }, lineSpacing: 4 });
    scene.detailGroup.add(nameTxt);
    scene.detailGroup.add(descTxt);

    if (creature.unlocked) {
        let statsTxt = scene.add.text(startX + 30, startY + 200, 
            `⛏️ 基礎挖掘力: ${creature.diggingPower}\n` +
            `💧 偏好棲息濕度: ${creature.humidity}\n` +
            `✨ 特殊生物技能: ${creature.skill}`, 
            { font: "14px Arial", fill: "#8bc34a", lineSpacing: 8 }
        );
        scene.detailGroup.add(statsTxt);
    } else {
        let lockTxt = scene.add.text(startX + 30, startY + 200, 
            `🔒 解鎖狀態：尚未發現\n` +
            `💡 探索提示：嘗試深入挖掘深層泥土或岩石層以解鎖此生物。`, 
            { font: "14px Arial", fill: "#f44336", lineSpacing: 8 }
        );
        scene.detailGroup.add(lockTxt);
    }
}