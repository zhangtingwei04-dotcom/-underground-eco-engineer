// 地下生態工程師 - 能量循環與時間恢復系統

/**
 * 處理生物的週期性精力恢復邏輯（可供 Phaser 的 update 循環或定時器呼叫）
 * @param {Object} creature - 要恢復精力的生物實體 (例如豬鼻蛇)
 * @param {boolean} isResting - 生物當前是否處於閒置/休息狀態
 * @returns {Object} 恢復後的生物精力狀態
 */
function updateCreatureEnergy(creature, isResting = true) {
    // 1. 安全檢查：防止傳入空資料
    if (!creature || !creature.base_stats) {
        return { success: false, error: "INVALID_CREATURE", message: "錯誤：無法讀取生物數據。" };
    }

    const stats = creature.base_stats;
    const maxEnergy = stats.max_energy || 100;
    
    // 初始化當前精力（防呆機制）
    if (stats.current_energy === undefined) {
        stats.current_energy = maxEnergy;
    }

    // 2. 邊界檢查：如果精力已經滿了，不需要恢復
    if (stats.current_energy >= maxEnergy) {
        stats.current_energy = maxEnergy; // 確保不溢出
        return { success: true, energyChanged: 0, current: stats.current_energy, message: "精力已達上限，充滿活力！" };
    }

    // 3. 計算恢復量：讀取 json 定義的恢復速度（hognose 預設為 2）
    let regenAmount = stats.energy_regen || 2;

    // 如果玩家讓生物進到特定的「躲避屋」或標記為「深度休息」，恢復效率加倍
    if (isResting) {
        regenAmount *= 2; 
    }

    // 4. 執行恢復並確保不超過最大值上限
    const previousEnergy = stats.current_energy;
    stats.current_energy = Math.min(maxEnergy, previousEnergy + regenAmount);
    
    const energyGained = stats.current_energy - previousEnergy;

    return {
        success: true,
        energyChanged: energyGained,
        current: stats.current_energy,
        message: `${creature.id} 正在休息，恢復了 ${energyGained} 點精力。`
    };
}

// 導出模組
if (typeof module !== 'undefined') {
    module.exports = { updateCreatureEnergy };
}
