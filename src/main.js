// 地下生態工程師 | Underground Eco-Engineer
// 核心主程式 - Alpha 0.2 整合動態與個體樣貌變異系統

window.gameEngineState = {
    creature: {
        id: "hognose_snake",
        base_stats: { digging_power: 15, max_energy: 100, current_energy: 100, energy_regen: 2, current_stress: 0 },
        morph: null // 將在初始化時自動生成專屬樣貌
    },
    inventory: { sand_particle: 5, humus: 0, raw_stone: 2 },
    habitat: { rest_area_count: 0 },
    mapData: null,
    selectedBlock: null
};

// 初始化第一個個體樣貌
if (window.CreatureMorphSystem) {
    window.gameEngineState.creature.morph = window.CreatureMorphSystem.generateIndividualMorph();
}

// 1. 地下探索主遊戲場景
class UndergroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UndergroundScene' });
    }

    create() {
        const scene = this;
        console.log("【系統總整合】進入地下探索主場景...");

        if (window.gameLocales && typeof window.gameLocales.initialize === 'function') {
            window.gameLocales.initialize();
        }
        if (window.GameInventorySystem) {
            window.GameInventorySystem.initInventory();
        }

        scene.titleText = scene.add.text(20, 15, "⚙️ 地下生態工程師 / Eco-Engineer", { font: "18px Arial", fill: "#ffffff", fontStyle: "bold" });
        scene.biostatText = scene.add.text(20, 45, "", { font: "12px Arial", fill: "#ffeb3b" });
        scene.invText = scene.add.text(20, 75, "", { font: "12px Arial", fill: "#4caf50", fontStyle: "bold" });
        scene.habitatText = scene.add.text(20, 98, "", { font: "12px Arial", fill: "#03a9f4", fontStyle: "bold" });
        scene.msgText = scene.add.text(20, 565, "💡 點擊地塊挖礦收集資源，體驗活潑的寵物動態！", { font: "13px Arial", fill: "#8bc34a" });

        // 中英文切換按鈕
        let btnZh = scene.add.text(430, 15, "[ 中文 ]", { font: "12px Arial", fill: "#00ff00" }).setInteractive();
        btnZh.on('pointerdown', function() {
            if (window.gameLocales) {
                window.gameLocales.switchLanguage('zh-TW');
                refreshUItext(scene);
            }
        });

        let btnEn = scene.add.text(485, 15, "[ EN ]", { font: "12px Arial", fill: "#00ff00" }).setInteractive();
        btnEn.on('pointerdown', function() {
            if (window.gameLocales) {
                window.gameLocales.switchLanguage('en');
                refreshUItext(scene);
            }
        });

        // 📖 圖鑑按鈕
        let btnEncyclopedia = scene.add.text(535, 15, "[ 📖 圖鑑 ]", { font: "12px Arial", fill: "#ffeb3b" }).setInteractive();
        btnEncyclopedia.on('pointerdown', function() {
            scene.scene.start('EncyclopediaScene');
        });

        // 🎲 重新抽樣品系按鈕 (測試用)
        let btnReroll = scene.add.text(610, 15, "[ 🎲 換樣貌 ]", { font: "12px Arial", fill: "#e91e63", fontStyle: "bold" }).setInteractive();
        btnReroll.on('pointerdown', function() {
            if (window.CreatureMorphSystem) {
                window.gameEngineState.creature.morph = window.CreatureMorphSystem.generateIndividualMorph();
                let m = window.gameEngineState.creature.morph;
                scene.msgText.setText(`✨ 獲得全新個體！品系: [${m.name_zh}] | 稀有度: ${m.rarity}`);
                renderPetOnScene(scene);
            }
        });

        // ⛺ 建造休息區按鈕
        let btnBuild = scene.add.text(610, 38, "[ ⛺ 蓋休息區 ]", { font: "12px Arial", fill: "#ff9800", fontStyle: "bold" }).setInteractive();
        btnBuild.on('pointerdown', function() {
            if (window.GameHabitatSystem) {
                let res = window.GameHabitatSystem.buildRestArea();
                scene.msgText.setText(res.message);
            }
        });

        // 存檔與讀檔按鈕
        let btnSave = scene.add.text(710, 15, "[ 💾 存 ]", { font: "12px Arial", fill: "#ff9800" }).setInteractive();
        btnSave.on('pointerdown', function() {
            if (window.GameSaveSystem) {
                let res = window.GameSaveSystem.saveGame();
                let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
                scene.msgText.setText(`[系統反饋] ${msg}`);
            }
        });

        let btnLoad = scene.add.text(710, 38, "[ 📂 讀 ]", { font: "12px Arial", fill: "#03a9f4" }).setInteractive();
        btnLoad.on('pointerdown', function() {
            if (window.GameSaveSystem) {
                let res = window.GameSaveSystem.loadGame();
                let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
                scene.msgText.setText(`[系統反饋] ${msg}`);
                drawActiveMap(scene);
                renderPetOnScene(scene);
            }
        });

        // 初始化地圖與環境
        if (typeof generateUndergroundMap === 'function') {
            window.gameEngineState.mapData = generateUndergroundMap(6, 8);
        } else {
            window.gameEngineState.mapData = mockGenerateMap(6, 8);
        }

        scene.mapContainer = scene.add.group();
        drawActiveMap(scene);
        renderPetOnScene(scene);

        // 自動精力恢復與動態更新
        scene.time.addEvent({
            delay: 2000,
            callback: function() {
                if (typeof updateCreatureEnergy === 'function') {
                    updateCreatureEnergy(window.gameEngineState.creature, true);
                }
                if (window.GameHabitatSystem) {
                    window.GameHabitatSystem.applyRestAreaEffect(window.gameEngineState.creature);
                }
            },
            loop: true
        });
    }

    update() {
        if (!this.biostatText || !window.gameEngineState.creature) return;
        const stats = window.gameEngineState.creature.base_stats;
        const morph = window.gameEngineState.creature.morph || { name_zh: "野生型", rarity: "Common" };
        const creatureName = window.gameLocales ? window.gameLocales.translate("creature_hognose_snake") : "豬鼻蛇";
        
        this.biostatText.setText(
            `🐍 ${creatureName} (${morph.name_zh} [${morph.rarity}]) | ⚡ 精力: ${stats.current_energy}/${stats.max_energy} | ⛏️ 挖力: ${stats.digging_power}`
        );

        const inv = window.GameInventorySystem ? window.GameInventorySystem.getInventory() : { sand_particle: 0, humus: 0, raw_stone: 0 };
        this.invText.setText(
            `🎒 資源 -> 細沙: ${inv.sand_particle || 0} | 腐植質: ${inv.humus || 0} | 碎石: ${inv.raw_stone || 0}`
        );

        const habitat = window.gameEngineState.habitat || { rest_area_count: 0 };
        this.habitatText.setText(
            `⛺ 地下休息區: ${habitat.rest_area_count} 座 (被動回精降壓中)`
        );
    }
}

// 2. 在畫面上繪製與更新活潑的寵物靈魂
function renderPetOnScene(scene) {
    if (scene.petContainer) {
        scene.petContainer.destroy();
    }
    const morph = window.gameEngineState.creature.morph;
    if (window.CreatureMorphSystem && morph) {
        scene.petContainer = window.CreatureMorphSystem.renderCreatureSprite(scene, 100, 200, morph);
    }
}

// 3. 遊戲總設定
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2b1d11',
    scene: [UndergroundScene, EncyclopediaScene]
};

const game = new Phaser.Game(config);

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
    const START_Y = 135;

    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            let block = mapData[r][c];
            if (block.isDug) continue;

            let color = 0x8b5a2b;
            if (block.type === "sand_block") color = 0xd2b48c;
            if (block.type === "granite_block") color = 0x708090;

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
        case "sand_block": itemId = "sand_particle"; amount = Math.floor(Math.random() * 2) + 1; break;
        case "dirt_block": itemId = "humus"; amount = 1; break;
        case "granite_block": itemId = "raw_stone"; amount = 1; break;
    }

    window.GameInventorySystem.addItem(itemId, amount);
    return { itemId: itemId, amount: amount };
}

function executeClickDig(scene, block, rect, zone) {
    const creature = window.gameEngineState.creature;
    let result = typeof executeDigging === 'function' ? executeDigging(creature, block) : { success: false, message: "挖掘系統未載入" };

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