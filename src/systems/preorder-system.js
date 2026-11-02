// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：預購進度、互動與接收區管理系統 (Pre-Order & Reception System)

window.PreorderSystem = {
    // 預購訂單狀態枚舉
    STATUS: {
        SEARCHING: "SEARCHING",          // 尋找合適個體中
        SUPPLIER_CONFIRMED: "CONFIRMED", // 繁殖者已確認
        IN_TRANSIT: "IN_TRANSIT",        // 溫控包裹配送中
        ARRIVED: "ARRIVED",              // 已到達接收區
        COMPLETED: "COMPLETED"           // 已順利安置入生態箱
    },

    /**
     * 建立全新預購訂單
     */
    createPreorder: function(type, targetSpec, userSaveData) {
        const todayStr = window.ShopDailyStockSystem ? window.ShopDailyStockSystem.getTodayDateString() : "2026-11-02";
        const orderId = "PO_" + Date.now();

        const newOrder = {
            order_id: orderId,
            type: type, // "targeted_species", "reserved_morph", "mystery_box"
            target_spec: targetSpec, // 要求的物種或稀有度標記
            status: this.STATUS.SEARCHING,
            created_date: todayStr,
            estimated_days: 2 + Math.floor(Math.random() * 2), // 預計 2~3 天到貨
            assigned_creature: null // 到貨後生成個體
        };

        if (!userSaveData.preorders) userSaveData.preorders = [];
        userSaveData.preorders.push(newOrder);

        return {
            success: true,
            order: newOrder,
            message_zh: "老馬克已收到您的預購需求，並開始聯繫合作繁殖者！"
        };
    },

    /**
     * 檢查每日預購進度更新 (每日跨日結算時呼叫)
     */
    processDailyPreorders: function(userSaveData, speciesDataList) {
        if (!userSaveData.preorders) return [];

        const updatedOrders = [];

        userSaveData.preorders.forEach(order => {
            if (order.status === this.STATUS.SEARCHING) {
                order.status = this.STATUS.SUPPLIER_CONFIRMED;
                updatedOrders.push({ order: order, event: "supplier_found" });
            } else if (order.status === this.STATUS.SUPPLIER_CONFIRMED) {
                order.status = this.STATUS.IN_TRANSIT;
                updatedOrders.push({ order: order, event: "in_transit" });
            } else if (order.status === this.STATUS.IN_TRANSIT) {
                // 抵達接收區，使用統一基因系統生成專屬個體
                const seed = Math.floor(Math.random() * 899999 + 100000);
                const species = speciesDataList[0]; // 示範用預設物種
                
                order.assigned_creature = window.CreatureGeneticsSystem ? 
                    window.CreatureGeneticsSystem.generateGenetics(species, seed) : {};
                
                // 設定來源歷史
                order.assigned_creature.origin_story = {
                    source_type: "preorder_" + order.type,
                    acquired_date: window.ShopDailyStockSystem.getTodayDateString(),
                    order_id: order.order_id
                };

                order.status = this.STATUS.ARRIVED;
                updatedOrders.push({ order: order, event: "arrived_at_reception" });
            }
        });

        return updatedOrders;
    }
};