// 地下生態工程師 - 資源背包管理系統 (Inventory System)

window.GameInventorySystem = {
    /**
     * 初始化全域背包結構（若尚不存在）
     */
    initInventory: function() {
        if (!window.gameEngineState.inventory) {
            window.gameEngineState.inventory = {
                sand_particle: 0,
                humus: 0,
                raw_stone: 0
            };
            console.log("【背包系統】背包初始化完成。");
        }
    },

    /**
     * 增加指定資源到背包中
     * @param {string} itemId - 資源 ID (例如 'sand_particle')
     * @param {number} amount - 增加數量
     * @returns {Object} 當前背包狀態回報
     */
    addItem: function(itemId, amount = 1) {
        this.initInventory();
        
        if (window.gameEngineState.inventory[itemId] !== undefined) {
            window.gameEngineState.inventory[itemId] += amount;
        } else {
            // 若為新種類資源則動態新增
            window.gameEngineState.inventory[itemId] = amount;
        }

        console.log(`【背包系統】成功獲得資源 [${itemId}] +${amount}。當前持有量: ${window.gameEngineState.inventory[itemId]}`);
        return { success: true, inventory: window.gameEngineState.inventory };
    },

    /**
     * 取得目前背包內所有資源的總覽
     * @returns {Object}
     */
    getInventory: function() {
        this.initInventory();
        return window.gameEngineState.inventory;
    }
};