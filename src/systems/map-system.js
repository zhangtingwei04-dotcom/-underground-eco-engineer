// 地下生態工程師 - 地下土壤剖面地圖生成系統

/**
 * 依據地層深度動態初始化地下 2D 方塊陣列地圖
 * @param {number} rows - 地圖總列數（縱深）
 * @param {number} cols - 地圖總欄數（橫寬）
 * @returns {Array} 生成的 2D 地圖資料矩陣
 */
function generateUndergroundMap(rows = 6, cols = 8) {
    let mapData = [];

    for (let r = 0; r < rows; r++) {
        mapData[r] = [];
        for (let c = 0; c < cols; c++) {
            let blockType = "dirt_block";
            let hardness = 15;
            let maxHp = 100;

            // 依據健檢報告建議，實作「土壤分層邏輯」
            if (r < 2) {
                // 最上層 0~1 列：鬆軟的淺層沙土
                blockType = "sand_block";
                hardness = 5;
                maxHp = 30;
            } else if (r >= 4) {
                // 最深層 4~5 列：堅硬的花崗岩深層岩石
                blockType = "granite_block";
                hardness = 50;
                maxHp = 500;
            }

            // 建立每個獨立方塊的實體動態狀態機制
            mapData[r][c] = {
                id: `block_${r}_${c}`,
                row: r,
                col: c,
                type: blockType,
                hardness: hardness,
                max_hp: maxHp,
                current_hp: maxHp, // 初始化滿血耐久度
                isDug: false      // 標記該方塊是否已被挖穿空出
            };
        }
    }
    console.log(`【地圖系統】成功生成 ${rows}x${cols} 的地下分層剖面網格。`);
    return mapData;
}

/**
 * 在 Phaser 3 場景中繪製網格方塊（供未來前端渲染調用）
 * @param {Object} scene - Phaser Scene 實例
 * @param {Array} mapData - 生成的 2D 地圖矩陣
 */
function renderPhaserMap(scene, mapData) {
    const TILE_SIZE = 64; // 每個方塊設定為 64x64 像素
    const START_X = 140;  // 置中對齊的起始橫座標
    const START_Y = 150;  // 避開上方 UI 的起始縱座標

    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            let block = mapData[r][c];
            if (block.isDug) continue; // 如果挖穿了就不畫

            // 根據不同方塊類型，給予不同的暫代地底顏色
            let color = 0x8b5a2b; // 預設泥土：棕褐色
            if (block.type === "sand_block") color = "0xd2b48c"; // 沙土：淺黃褐
            if (block.type === "granite_block") color = "0x708090"; // 岩石：深灰藍

            // 使用 Phaser 的 Graphics 繪製方塊矩形
            let rect = scene.add.graphics();
            rect.fillStyle(parseInt(color), 1);
            rect.fillRect(START_X + c * TILE_SIZE, START_Y + r * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
        }
    }
}

// 導出模組
if (typeof module !== 'undefined') {
    module.exports = { generateUndergroundMap, renderPhaserMap };
}
