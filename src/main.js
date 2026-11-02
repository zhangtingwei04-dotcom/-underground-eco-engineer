// 地下生態工程師 | Underground Eco-Engineer
// 核心主程式 - Alpha 0.2 總整合系統（內建圖鑑場景）

window.gameEngineState = {
    creature: {
        id: "hognose_snake",
        base_stats: { digging_power: 15, max_energy: 100, current_energy: 100, energy_regen: 2, current_stress: 0 }
    },
    inventory: { sand_particle: 0, humus: 0, raw_stone: 0 },
    mapData: null,
    selectedBlock: null
};

// 1. 地下探索主遊戲場景
class UndergroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UndergroundScene' });
    }

    create() {
        const scene = this;
        console.log("【系統總整合】進入主場景建立...");

        if (window.gameLocales && typeof window.gameLocales.initialize === 'function') {
            window.gameLocales.initialize();
        }
        if (window.GameInventorySystem) {
            window.GameInventorySystem.initInventory();
        }

        scene.titleText = scene.add.text(20, 15, "⚙️ 地下生態工程師 / Eco-Engineer", { font: "18px Arial", fill: "#ffffff", fontStyle: "bold" });
        scene.biostatText = scene.add.text(20, 45, "", { font: "12px Arial", fill: "#ffeb3b" });
        scene.invText = scene.add.text(20, 80, "", { font: "12px Arial", fill: "#4caf50", fontStyle: "bold" });
        scene.msgText = scene.add.text(20, 565, "💡 點擊下方地塊開始挖掘並收集資源！", { font: "13px Arial", fill: "#8bc34a" });

        // 中英文切換按鈕
        let btnZh = scene.add.text(480, 15, "[ 中文 ]", { font: "13px Arial", fill: "#00ff00" }).setInteractive();
        btnZh.on('pointerdown', function() {
            if (window.gameLocales) {
                window.gameLocales.switchLanguage('zh-TW');
                refreshUItext(scene);
            }
        });

        let btnEn = scene.add.text(545, 15, "[ EN ]", { font: "13px Arial", fill: "#00ff00" }).setInteractive();
        btnEn.on('pointerdown', function() {
            if (window.gameLocales) {
                window.gameLocales.switchLanguage('en');
                refreshUItext(scene);
            }
        });

        // 📖 開啟生物圖鑑按鈕
        let btnEncyclopedia = scene.add.text(610, 15, "[ 📖 圖鑑 ]", { font: "13px Arial", fill: "#ffeb3b" }).setInteractive();
        btnEncyclopedia.on('pointerdown', function() {
            scene.scene.start('EncyclopediaScene');
        });

        // 存檔與讀檔按鈕
        let btnSave = scene.add.text(480, 42, "[ 💾 存 ]", { font: "13px Arial", fill: "#ff9800" }).setInteractive();
        btnSave.on('pointerdown', function() {
            if (window.GameSaveSystem) {
                let res = window.GameSaveSystem.saveGame();
                let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
                scene.msgText.setText(`[系統反饋] ${msg}`);
            }
        });

        let btnLoad = scene.add.text(545, 42, "[ 📂 讀 ]", { font: "13px Arial", fill: "#03a9f4" }).setInteractive();
        btnLoad.on('pointerdown', function() {
            if (window.GameSaveSystem) {
                let res = window.GameSaveSystem.loadGame();
                let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
                scene.msgText.setText(`[系統反饋] ${msg}`);
                drawActiveMap(scene);
            }
        });

        // 初始化地圖
        if (typeof generateUndergroundMap === 'function') {
            window.gameEngineState.mapData = generateUndergroundMap(6, 8);
        } else {
            window.gameEngineState.mapData = mockGenerateMap(6, 8);
        }

        if (window.GameEnvironmentSystem) {
            window.GameEnvironmentSystem.initializeMapEnvironment(window.gameEngineState.mapData);
        }

        scene.mapContainer = scene.add.group();
        drawActiveMap(scene);

        scene.time.addEvent({
            delay: 2000,
            callback: function() {
                if (typeof updateCreatureEnergy === 'function') {
                    updateCreatureEnergy(window.gameEngineState.creature, true);
                }
            },
            loop: true
        });
    }

    update() {
        if (!this.biostatText || !window.gameEngineState.creature) return;
        const stats = window.gameEngineState.creature.base_stats;
        const creatureName = window.gameLocales ? window.gameLocales.translate("creature_hognose_snake") : "豬鼻蛇";
        
        this.biostatText.setText(
            `🐍 生物: ${creatureName} | ⚡ 精力: ${stats.current_energy}/${stats.max_energy} | ⛏️ 挖力: ${stats.digging_power} | 😰 壓: ${stats.current_stress || 0}`
        );

        const inv = window.GameInventorySystem ? window.GameInventorySystem.getInventory() : { sand_particle: 0, humus: 0, raw_stone: 0 };
        this.invText.setText(
            `🎒 資源 -> 細沙: ${inv.sand_particle || 0} | 腐植質: ${inv.humus || 0} | 碎石: ${inv.raw_stone || 0}`
        );
    }
}


// 2. 生物圖鑑收藏場景
class EncyclopediaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EncyclopediaScene' });
    }

    create() {
        const scene = this;
        console.log("【圖鑑系統】進入生物圖鑑與收藏介面...");

        scene.add.rectangle(400, 300, 800, 600, 0x1a110b);

        let titleText = window.gameLocales ? window.gameLocales.translate("menu_encyclopedia") : "生物圖鑑";
        scene.add.text(40, 30, `📖 ${titleText} / Creature Encyclopedia`, { font: "20px Arial", fill: "#ffffff", fontStyle: "bold" });

        let backBtn = scene.add.text(620, 30, "[ 返回地下探索 ]", { font: "14px Arial", fill: "#00ff00" }).setInteractive();
        backBtn.on('pointerdown', function() {
            scene.scene.start('UndergroundScene');
        });

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
                unlocked: false,
                diggingPower: 5,
                humidity: "潮濕 (Moist)",
                skill: "群體隧道清理"
            }
        ];

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

    let nameTxt = scene.add.text(startX + 30, startY + 20, `📜 ${name}`, { font: "18px Arial", fill: "#ff9800", fontStyle: "bold" });
    let descTxt = scene.add.text(startX + 30, startY + 65, desc, { font: "13px Arial", fill: "#dddddd", wordWrap: { width: 380 }, lineSpacing: 4 });
    scene.detailGroup.add(nameTxt);
    scene.detailGroup.add(descTxt);

    if (creature.unlocked) {
        let statsTxt = scene.add.text(startX + 30, startY + 200, 
            `⛏️ 基礎挖掘力: ${creature.diggingPower}\n` +
            `💧 偏好棲息濕度: ${creature.humidity}\n` +
            `✨ 特殊生物技能: ${creature.skill}`, 
            { font: "13px Arial", fill: "#8bc34a", lineSpacing: 8 }
        );
        scene.detailGroup.add(statsTxt);
    } else {
        let lockTxt = scene.add.text(startX + 30, startY + 200, 
            `🔒 解鎖狀態：尚未發現\n` +
            `💡 探索提示：嘗試深入挖掘深層泥土或岩石層以解鎖此生物。`, 
            { font: "13px Arial", fill: "#f44336", lineSpacing: 8 }
        );
        scene.detailGroup.add(lockTxt);
    }
}


// 3. 遊戲總配置與啟動
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2b1d11',
    scene: [UndergroundScene, EncyclopediaScene]
};

const game = new Phaser.Game(config);


// 4. 輔助函式 (地圖繪製與資源掉落)
function refreshUItext(scene) {
    if (!window.gameLocales) return;
    const translatedTitle = window.gameLocales.translate("game_title");
    scene.titleText.setText(`⚙️ ${translatedTitle} / Eco-Engineer`);
}

function drawActiveMap(scene) {
    scene.mapContainer.clear(true, true);
    const mapData = window.gameEngineState.mapData;
    const TILE_SIZE = 60;
    const START_X = 160;
    const START_Y = 145;

    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            let block = mapData[r][c];
            if (block.isDug) continue;

            let color = 0x8b5a2b; // 泥土
            if (block.type === "sand_block") color = 0xd2b48c; // 沙土
            if (block.type === "granite_block") color = 0x708090; // 岩石

            let zone = scene.add.zone(START_X + c * TILE_SIZE + TILE_SIZE/2, START_Y + r * TILE_SIZE + TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            zone.setInteractive();

            let rect = scene.add.graphics();
            rect.fillStyle(color, 1);
            rect.fillRect(START_X + c * TILE_SIZE, START_Y + r * TILE_SIZE, TILE_SIZE - 3, TILE_SIZE - 3);

            scene.mapContainer.add(zone);
            scene.mapContainer.add(rect);

            zone.on('pointerdown', function() {
                executeClickDig(scene, block, rect, zone);
            });
        }
    }
}

function handleBlockDrop(blockType) {
    if (!window.GameInventorySystem) return { itemId: "sand_particle", amount: 1 };

    let itemId = "sand_particle";
    let amount = 1;

    switch (blockType) {
        case "sand_block":
            itemId = "sand_particle";
            amount = Math.floor(Math.random() * 2) + 1;
            break;
        case "dirt_block":
            itemId = "humus";
            amount = 1;
            break;
        case "granite_block":
            itemId = "raw_stone";
            amount = 1;
            break;
    }

    window.GameInventorySystem.addItem(itemId, amount);
    return { itemId: itemId, amount: amount };
}

function executeClickDig(scene, block, rect, zone) {
    const creature = window.gameEngineState.creature;

    let result;
    if (typeof executeDigging === 'function') {
        result = executeDigging(creature, block);
    } else {
        result = { success: false, message: "挖掘系統未載入" };
    }

    if (window.GameEnvironmentSystem) {
        window.GameEnvironmentSystem.updateCreatureComfort(creature, block);
    }

    if (result.success && result.isDestroyed) {
        block.isDug = true;
        rect.destroy();
        zone.destroy();

        let drop = handleBlockDrop(block.type);
        scene.msgText.setText(`🎉 成功挖穿！獲得資源 [${drop.itemId}] +${drop.amount}`);
    } else {
        scene.msgText.setText(`[挖掘反饋] ${result.message}`);
    }
}

function mockGenerateMap(rows, cols) {
    let arr = [];
    for (let r = 0; r < rows; r++) {
        arr[r] = [];
        for (let c = 0; c < cols; c++) {
            let type = r < 2 ? "sand_block" : (r >= 4 ? "granite_block" : "dirt_block");
            let hardness = type === "sand_block" ? 5 : (type === "dirt_block" ? 15 : 50);
            let hp = type === "sand_block" ? 30 : (type === "dirt_block" ? 100 : 500);
            arr[r][c] = { row: r, col: c, type: type, hardness: hardness, max_hp: hp, current_hp: hp, isDug: false };
        }
    }
    return arr;
}