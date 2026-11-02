// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：商店綜合管理與購買系統 (Shop System)

window.ShopSystem = {
    /**
     * 購買每日進貨清單中的爬蟲個體
     */
    buyDailyStockItem: function(stockId, userSaveData) {
        if (!userSaveData.shop_daily_stock || !userSaveData.shop_daily_stock.stock_items) {
            return { success: false, message_zh: "目前沒有可用的商店庫存。" };
        }

        const items = userSaveData.shop_daily_stock.stock_items;
        const targetItem = items.find(item => item.stock_id === stockId);

        if (!targetItem) {
            return { success: false, message_zh: "找不到指定的商品。" };
        }

        if (targetItem.is_purchased) {
            return { success: false, message_zh: "此個體已經被買走了！" };
        }

        // 檢查金錢是否足夠 (假設使用 CurrencySystem)
        const price = targetItem.price;
        const hasEnoughMoney = window.CurrencySystem ? 
            window.CurrencySystem.pay(price, "coins") : true; // 預設降級容錯

        if (!hasEnoughMoney) {
            return { success: false, message_zh: "生態金幣不足，無法購買此個體！" };
        }

        // 標記為已購買
        targetItem.is_purchased = true;

        // 將個體送入玩家的「新生物接收區 (Reception Zone)」
        if (!userSaveData.reception_zone) {
            userSaveData.reception_zone = [];
        }

        const acquiredCreature = {
            instance_id: "creature_" + Date.now(),
            species_id: targetItem.species_id,
            species_name_zh: targetItem.species_name_zh,
            genetics: targetItem.genetics,
            phenotype: targetItem.genetics ? targetItem.genetics.phenotype : {},
            life: { age: 0, life_stage: "juvenile" },
            origin_story: targetItem.origin_story,
            acquired_at: new Date().toISOString()
        };

        userSaveData.reception_zone.push(acquiredCreature);

        return {
            success: true,
            creature: acquiredCreature,
            message_zh: `成功購入【${targetItem.species_name_zh}】！已透過溫控快遞送達您的「新生物接收區」。`
        };
    }
};