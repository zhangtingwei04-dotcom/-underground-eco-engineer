// 地下生態工程師 - 模組化挖掘與方塊耐久系統

/**
 * 處理單次點擊/時間週期的挖掘動作
 * @param {Object} creature - 執行挖掘的生物實體 (例如豬鼻蛇)
 * @param {Object} blockInstanceState - 當前地圖上該方塊的動態狀態機制
 * @returns {Object} 挖掘結果狀態
 */
function processDigging(creature, blockInstanceState) {
    // 1. 安全檢查：防止方塊數據異常（硬度或血量小於等於0）
    if (!blockInstanceState || blockInstanceState.current_hp <= 0) {
        return { success: false, reason: "BLOCK_ALREADY_DESTROYED", message: "方塊已被挖除" };
    }

    // 2. 體力檢查：確保生物目前精力充足
    const ENERGY_COST = 10;
    if (creature.base_stats.current_energy < ENERGY_COST) {
        return { success: false, reason: "LOW_ENERGY", message: `${creature.id} 太累了，需要休息！` };
    }

    // 3. 消耗精力
    creature.base_stats.current_energy -= ENERGY_COST;

    // 4. 計算傷害（挖掘效率機制）：防止硬度為0導致除以零錯誤
    const targetHardness = Math.max(1, blockInstanceState.hardness);
    
    // 計算本次挖掘造成的傷害值
    let damage = creature.base_stats.digging_power;
    
    // 特性影響補正（例如：豬鼻蛇挖掘沙土效率加倍）
    if (creature.id === "hognose_snake" && blockInstanceState.type === "sand_block") {
        damage *= 2; 
    }

    // 5. 扣除方塊當前耐久度 (HP)
    blockInstanceState.current_hp -= damage;
    if (blockInstanceState.current_hp < 0) blockInstanceState.current_hp = 0;

    // 6. 計算總累積進度百分比 (0% - 100%)
    let progressPercent = ((blockInstanceState.max_hp - blockInstanceState.current_hp) / blockInstanceState.max_hp) * 100;
    progressPercent = Math.min(100, Math.max(0, progressPercent)); // 邊界與上限保護

    // 7. 判定方塊是否破壞完成
    const isDestroyed = blockInstanceState.current_hp <= 0;

    return {
        success: true,
        isDestroyed: isDestroyed,
        progress: progressPercent,
        remainingEnergy: creature.base_stats.current_energy,
        message: isDestroyed ? `成功挖穿 ${blockInstanceState.type}！` : `正在挖掘，方塊剩餘耐久: ${blockInstanceState.current_hp}`
    };
}

// 導出模組供未來 Phaser 或 Node 環境使用
if (typeof module !== 'undefined') {
    module.exports = { processDigging };
}
