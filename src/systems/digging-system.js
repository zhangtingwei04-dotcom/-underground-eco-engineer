/**
 * 地下生態工程師 - 核心挖掘與方塊耐久度系統 (健檢修正版)
 * @param {Object} creature - 生物數據
 * @param {Object} blockState - 地圖方塊當前動態狀態
 * @returns {Object} 挖掘結果回報
 */
function executeDigging(creature, blockState) {
    // 【問題 3 修正】強制安全性資料驗證：防止生物或方塊實體缺失
    if (!creature || !creature.base_stats || !blockState) {
        return { success: false, error: "INVALID_ENTITIES", progress: 0, message: "錯誤：無效的生物或方塊資料。" };
    }

    // 【問題 1 & 4 修正】防止 max_hp 缺失導致進度出現 NaN，若無設定則依硬度動態補底
    if (!blockState.max_hp || typeof blockState.max_hp !== 'number' || blockState.max_hp <= 0) {
        blockState.max_hp = blockState.hardness * 10; 
    }
    if (blockState.current_hp === undefined || blockState.current_hp === null) {
        blockState.current_hp = blockState.max_hp;
    }

    // 若方塊早已被挖除，直接返回成功
    if (blockState.current_hp <= 0) {
        return { success: true, isDestroyed: true, progress: 100, message: "方塊之前已被挖除。" };
    }

    // 檢查生物目前精力
    const ENERGY_COST = 10;
    const currentEnergy = creature.base_stats.current_energy !== undefined ? creature.base_stats.current_energy : 0;
    if (currentEnergy < ENERGY_COST) {
        return { success: false, error: "LOW_ENERGY", progress: ((blockState.max_hp - blockState.current_hp) / blockState.max_hp) * 100, message: `${creature.id} 精力不足，無法挖掘！` };
    }

    // 扣除精力
    creature.base_stats.current_energy = Math.max(0, currentEnergy - ENERGY_COST);

    // 【問題 2 修正】實作硬度倍率公式，並確保硬度不為零或負數
    const safeHardness = Math.max(1, blockState.hardness || 1);
    
    // 計算基礎傷害：實際傷害 = 生物挖掘力 / (方塊硬度 / 5) -> 以沙土硬度5為基準倍率1
    let hardnessMultiplier = safeHardness / 5;
    let baseDamage = (creature.base_stats.digging_power || 1) / hardnessMultiplier;

    // 生物特殊天賦補正（例如：豬鼻蛇挖掘沙土有額外 1.5 倍加成）
    if (creature.id === "hognose_snake" && blockState.type === "sand_block") {
        baseDamage *= 1.5;
    }

    // 確保單次挖掘至少造成 1 點傷害
    const finalDamage = Math.max(1, Math.round(baseDamage));

    // 扣除方塊耐久
    blockState.current_hp = Math.max(0, blockState.current_hp - finalDamage);

    // 計算精確進度條百分比
    let progressPercent = ((blockState.max_hp - blockState.current_hp) / blockState.max_hp) * 100;
    progressPercent = Math.min(100, Math.max(0, parseFloat(progressPercent.toFixed(1))));

    const isDestroyed = blockState.current_hp <= 0;

    return {
        success: true,
        isDestroyed: isDestroyed,
        damageDealt: finalDamage,
        progress: progressPercent,
        remainingEnergy: creature.base_stats.current_energy,
        message: isDestroyed ? `挖穿了！成功移除 ${blockState.type}。` : `正在挖掘，造成 ${finalDamage} 點傷害。`
    };
}

if (typeof module !== 'undefined') { module.exports = { executeDigging }; }
