// 地下生態工程師 - 挖掘與能量消耗系統
function handleDigging(creature, blockHardness) {
    // 檢查生物精力是否足夠
    if (creature.base_stats.current_energy < 10) {
        console.log(`${creature.id} 太累了，需要休息！`);
        return false;
    }

    // 計算挖掘進度 (生物挖掘力 / 地塊硬度)
    let progress = creature.base_stats.digging_power / blockHardness;
    
    // 消耗精力
    creature.base_stats.current_energy -= 10;
    
    console.log(`${creature.id} 正在挖掘，消耗 10 點精力。剩餘精力: ${creature.base_stats.current_energy}`);
    return progress;
}
