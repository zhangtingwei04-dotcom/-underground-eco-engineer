// 地下生態工程師 | Underground Eco-Engineer
// 核心主程式 - 總整合系統 (Phaser 3 運行版)

// 1. 遊戲全局狀態 (全域變數，供跨系統讀取)
window.gameEngineState = {
    creature: {
        id: "hognose_snake",
        base_stats: { digging_power: 15, max_energy: 100, current_energy: 100, energy_regen: 2 }
    },
    mapData: null,
    selectedBlock: null
};

// 2. Phaser 3 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2b1d11', // 深褐色地底背景
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// 3. 預先載入階段
function preload() {
    console.log("【系統總整合】正在加載核心組件...");
    // 註：在純網頁環境下，我們會直接在記憶體中聯動載入的 systems 模組
}

// 4. 遊戲世界建立與地地圖生成
// 修改後的 create 函式（請在 main.js 內找到對應區塊進行替換或整體覆蓋）
function create() {
    const scene = this;
    console.log("【系統總整合】進入主場景建立...");

    // 1. 初始化中英雙語管理器
    if (window.gameLocales && typeof window.gameLocales.initialize === 'function') {
        window.gameLocales.initialize();
    }

    // 顯示中英雙語遊戲標題文字
    scene.titleText = scene.add.text(20, 20, "⚙️ 地下生態工程師 / Eco-Engineer", { font: "24px Arial", fill: "#ffffff", weight: "bold" });
    scene.biostatText = scene.add.text(20, 60, "", { font: "14px Arial", fill: "#ffeb3b" });

    // 2. 實作【中英文即時切換按鈕 UI】
    // 建立繁中切換按鈕
    let btnZh = scene.add.text(550, 20, "[ 繁體中文 ]", { font: "16px Arial", fill: "#00ff00" }).setInteractive();
    btnZh.on('pointerdown', function() {
        if (window.gameLocales) {
            window.gameLocales.switchLanguage('zh-TW');
            refreshUItext(scene);
        }
    });

    // 建立英文切換按鈕
    let btnEn = scene.add.text(670, 20, "[ English ]", { font: "16px Arial", fill: "#00ff00" }).setInteractive();
    btnEn.on('pointerdown', function() {
        if (window.gameLocales) {
            window.gameLocales.switchLanguage('en');
            refreshUItext(scene);
        }
    });

    // 3. 生成 2D 土壤分層剖面數據
    if (typeof generateUndergroundMap === 'function') {
        window.gameEngineState.mapData = generateUndergroundMap(6, 8);
    } else {
        window.gameEngineState.mapData = mockGenerateMap(6, 8);
    }

    drawActiveMap(scene);

    // 4. 定時恢復體力
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

// 🌐 配合 locales-loader 新增的介面語系刷新函式
function refreshUItext(scene) {
    if (!window.gameLocales) return;
    
    // 動態透過全域語系管理器抓取翻譯，即時替換標題與 console 提示
    const translatedTitle = window.gameLocales.translate("game_title");
    scene.titleText.setText(`⚙️ ${translatedTitle} / Eco-Engineer`);
    console.log(`【介面刷新】語系已動態切換，當前標題為: ${translatedTitle}`);
}
    const scene = this;
    console.log("【系統總整合】進入主場景建立...");

    // 顯示中英雙語遊戲標題文字
    scene.add.text(20, 20, "⚙️ 地下生態工程師 / Eco-Engineer", { font: "24px Arial", fill: "#ffffff", weight: "bold" });
    
    // 渲染左側生物狀態欄資訊
    scene.biostatText = scene.add.text(20, 60, "", { font: "14px Arial", fill: "#ffeb3b" });

    // 【地圖系統整合】呼叫 map-system 生成 2D 土壤分層剖面數據 (6列 x 8欄)
    if (typeof generateUndergroundMap === 'function') {
        window.gameEngineState.mapData = generateUndergroundMap(6, 8);
    } else {
        // 若模組尚未瀏覽器全域化，則啟動內建防底機制
        window.gameEngineState.mapData = mockGenerateMap(6, 8);
    }

    // 執行地圖畫面方塊鋪設渲染
    drawActiveMap(scene);

    // 建立一個畫面定時器：每隔 2 秒自動觸發一次精力的時間恢復（結合 energy-system）
    scene.time.addEvent({
        delay: 2000,
        callback: function() {
            if (typeof updateCreatureEnergy === 'function') {
                updateCreatureEnergy(window.gameEngineState.creature, true);
            } else {
                // 防底精力恢復
                let stats = window.gameEngineState.creature.base_stats;
                stats.current_energy = Math.min(stats.max_energy, stats.current_energy + 4);
            }
        },
        loop: true
    });
}

// 5. 每秒幀率即時刷新
function update() {
    // 即時更新畫面上豬鼻蛇的當前體力數值
    const stats = window.gameEngineState.creature.base_stats;
    this.biostatText.setText(
        `🐍 目前生物: 豬鼻蛇 (Hognose)\n` +
        `⚡ 精力值: ${stats.current_energy} / ${stats.max_energy}\n` +
        `⛏️ 挖掘力: ${stats.digging_power} (沙土有 1.5 倍挖掘天賦)`
    );
}

// 🎨 動態地圖繪製與交互點擊綁定機制
function drawActiveMap(scene) {
    const mapData = window.gameEngineState.mapData;
    const TILE_SIZE = 60;
    const START_X = 160; // 側視圖置中偏移
    const START_Y = 140;

    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            let block = mapData[r][c];
            if (block.isDug) continue;

            // 決定顏色分層
            let color = 0x8b5a2b; // 泥土
            if (block.type === "sand_block") color = 0xd2b48c; // 沙土
            if (block.type === "granite_block") color = 0x708090; // 岩石

            // 建立方塊的可點擊互動區域
            let zone = scene.add.zone(START_X + c * TILE_SIZE + TILE_SIZE/2, START_Y + r * TILE_SIZE + TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            zone.setInteractive();

            // 繪製方塊外觀
            let rect = scene.add.graphics();
            rect.fillStyle(color, 1);
            rect.fillRect(START_X + c * TILE_SIZE, START_Y + r * TILE_SIZE, TILE_SIZE - 3, TILE_SIZE - 3);

            // 為每個方塊綁定滑鼠點擊挖掘事件
            zone.on('pointerdown', function() {
                executeClickDig(scene, block, rect, zone);
            });
        }
    }
}

// ⛏️ 點擊挖掘核心處理邏輯 (串接 digging-system)
function executeClickDig(scene, block, rect, zone) {
    const creature = window.gameEngineState.creature;
    
    // 呼叫我們之前健檢優化後的 executeDigging 演算法
    let result;
    if (typeof executeDigging === 'function') {
        result = executeDigging(creature, block);
    } else {
        // 內建兼容執行公式
        if (creature.base_stats.current_energy < 10) {
            result = { success: false, message: "精力不足！" };
        } else {
            creature.base_stats.current_energy -= 10;
            let dmg = block.type === "sand_block" ? 23 : (block.type === "dirt_block" ? 5 : 2);
            block.current_hp = Math.max(0, block.current_hp - dmg);
            result = { success: true, isDestroyed: block.current_hp <= 0, message: `造成 ${dmg} 點破壞` };
        }
    }

    console.log(`[挖掘反饋] ${result.message}`);

    if (result.success && result.isDestroyed) {
        block.isDug = true;
        rect.destroy(); // 從 Phaser 畫面上移除該方塊
        zone.destroy(); // 銷毀該區域的點擊事件
        console.log(`🎉 成功挖穿地層座標 [${block.row}, ${block.col}] 的 ${block.type}！`);
    }
}

// 兼容防底地圖生成器
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
