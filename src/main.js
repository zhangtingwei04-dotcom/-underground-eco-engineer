// 地下生態工程師 | Underground Eco-Engineer
// 核心主程式 - Alpha 0.1 總整合系統

window.gameEngineState = {
    creature: {
        id: "hognose_snake",
        base_stats: { digging_power: 15, max_energy: 100, current_energy: 100, energy_regen: 2, current_stress: 0 }
    },
    mapData: null,
    selectedBlock: null
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2b1d11',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log("【系統總整合】正在加載核心組件...");
}

function create() {
    const scene = this;
    console.log("【系統總整合】進入主場景建立...");

    // 1. 初始化中英雙語管理器
    if (window.gameLocales && typeof window.gameLocales.initialize === 'function') {
        window.gameLocales.initialize();
    }

    // 標題與生物狀態面板
    scene.titleText = scene.add.text(20, 15, "⚙️ 地下生態工程師 / Eco-Engineer", { font: "20px Arial", fill: "#ffffff", fontStyle: "bold" });
    scene.biostatText = scene.add.text(20, 50, "", { font: "14px Arial", fill: "#ffeb3b" });
    scene.msgText = scene.add.text(20, 560, "💡 點擊下方地塊開始挖掘！", { font: "14px Arial", fill: "#8bc34a" });

    // 2. 中英文切換按鈕
    let btnZh = scene.add.text(530, 15, "[ 繁體中文 ]", { font: "14px Arial", fill: "#00ff00" }).setInteractive();
    btnZh.on('pointerdown', function() {
        if (window.gameLocales) {
            window.gameLocales.switchLanguage('zh-TW');
            refreshUItext(scene);
        }
    });

    let btnEn = scene.add.text(640, 15, "[ English ]", { font: "14px Arial", fill: "#00ff00" }).setInteractive();
    btnEn.on('pointerdown', function() {
        if (window.gameLocales) {
            window.gameLocales.switchLanguage('en');
            refreshUItext(scene);
        }
    });

    // 3. 存檔與讀檔介面串接
    let btnSave = scene.add.text(530, 45, "[ 💾 存檔 ]", { font: "14px Arial", fill: "#ff9800" }).setInteractive();
    btnSave.on('pointerdown', function() {
        if (window.GameSaveSystem) {
            let res = window.GameSaveSystem.saveGame();
            let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
            scene.msgText.setText(`[系統反饋] ${msg}`);
        }
    });

    let btnLoad = scene.add.text(630, 45, "[ 📂 讀檔 ]", { font: "14px Arial", fill: "#03a9f4" }).setInteractive();
    btnLoad.on('pointerdown', function() {
        if (window.GameSaveSystem) {
            let res = window.GameSaveSystem.loadGame();
            let msg = window.gameLocales ? window.gameLocales.translate(res.message) : res.message;
            scene.msgText.setText(`[系統反饋] ${msg}`);
            drawActiveMap(scene); // 重繪讀取的地圖狀態
        }
    });

    // 4. 初始化 2D 地圖與動態環境模擬
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

    // 5. 自動精力恢復定時器 (每 2 秒)
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

function refreshUItext(scene) {
    if (!window.gameLocales) return;
    const translatedTitle = window.gameLocales.translate("game_title");
    scene.titleText.setText(`⚙️ ${translatedTitle} / Eco-Engineer`);
}

function update() {
    if (!this.biostatText || !window.gameEngineState.creature) return;
    const stats = window.gameEngineState.creature.base_stats;
    const creatureName = window.gameLocales ? window.gameLocales.translate("creature_hognose_snake") : "豬鼻蛇";
    
    this.biostatText.setText(
        `🐍 目前生物: ${creatureName} (Hognose)\n` +
        `⚡ 精力值: ${stats.current_energy} / ${stats.max_energy}  |  ⛏️ 挖掘力: ${stats.digging_power} (沙土 1.5x 特性)\n` +
        `😰 壓力值: ${stats.current_stress || 0} / 100`
    );
}

function drawActiveMap(scene) {
    scene.mapContainer.clear(true, true);
    const mapData = window.gameEngineState.mapData;
    const TILE_SIZE = 60;
    const START_X = 160;
    const START_Y = 140;

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

function executeClickDig(scene, block, rect, zone) {
    const creature = window.gameEngineState.creature;

    let result;
    if (typeof executeDigging === 'function') {
        result = executeDigging(creature, block);
    } else {
        result = { success: false, message: "挖掘系統未載入" };
    }

    scene.msgText.setText(`[挖掘反饋] ${result.message}`);

    // 計算環境舒適與壓力
    if (window.GameEnvironmentSystem) {
        window.GameEnvironmentSystem.updateCreatureComfort(creature, block);
    }

    if (result.success && result.isDestroyed) {
        block.isDug = true;
        rect.destroy();
        zone.destroy();
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