// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：商店每日進貨與刷新系統 (Shop Daily Stock & Refresh System)

window.ShopDailyStockSystem = {
    // 預設每日刷新上限
    MAX_DAILY_AD_REFRESH: 1,

    /**
     * 取得今日的字串日期 Seed (例如 "2026-11-02")
     */
    getTodayDateString: function() {
        const today = new Date();
        return today.getFullYear() + "-" + 
               String(today.getMonth() + 1).padStart(2, '0') + "-" + 
               String(today.getDate()).padStart(2, '0');
    },

    /**
     * 將字串轉為簡易數字 Seed
     */
    hashString: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    },

    /**
     * 載入或生成今日商店的 3~5 隻候選個體
     */
    getDailyStock: function(speciesDataList, userSaveData) {
        const todayStr = this.getTodayDateString();
        
        // 檢查存檔是否已有今日進貨紀錄
        if (!userSaveData.shop_daily_stock) {
            userSaveData.shop_daily_stock = {
                last_date: todayStr,
                refresh_count: 0,
                stock_items: []
            };
        }

        // 如果跨日了，自動重置每日刷新次數與進貨
        if (userSaveData.shop_daily_stock.last_date !== todayStr) {
            userSaveData.shop_daily_stock.last_date = todayStr;
            userSaveData.shop_daily_stock.refresh_count = 0;
            userSaveData.shop_daily_stock.stock_items = this.generateStockList(todayStr, 0, speciesDataList);
        } else if (userSaveData.shop_daily_stock.stock_items.length === 0) {
            // 初始化生成
            userSaveData.shop_daily_stock.stock_items = this.generateStockList(todayStr, 0, speciesDataList);
        }

        return userSaveData.shop_daily_stock;
    },

    /**
     * 核心邏輯：依據 Date Seed 與 刷新次數 生成固定個體
     */
    generateStockList: function(dateStr, refreshCount, speciesDataList) {
        const baseSeed = this.hashString(dateStr + "_stock_count_" + refreshCount);
        const itemCount = 3 + (baseSeed % 3); // 隨機生成 3 ~ 5 隻
        const resultStock = [];

        for (let i = 0; i < itemCount; i++) {
            const itemSeed = baseSeed + (i * 1337);
            const species = speciesDataList[itemSeed % speciesDataList.length];
            
            // 呼叫我們之前建好的基因系統生成個體
            const genetics = window.CreatureGeneticsSystem ? 
                window.CreatureGeneticsSystem.generateGenetics(species, itemSeed) : null;
            
            // 計算估算售價
            const basePrice = species.base_price || 200;
            const rarityMultiplier = genetics ? (genetics.genotype.trait_potency > 0.8 ? 2.0 : 1.0) : 1.0;
            const finalPrice = Math.floor(basePrice * rarityMultiplier);

            resultStock.push({
                stock_id: "stock_" + dateStr + "_" + refreshCount + "_" + i,
                species_id: species.id,
                species_name_zh: species.species_name_zh,
                price: finalPrice,
                is_purchased: false,
                genetics: genetics,
                // 個體來源歷史記錄 (Provenance)
                origin_story: {
                    source_type: "daily_shop",
                    acquired_date: dateStr,
                    shop_batch: "Batch-" + dateStr
                }
            });
        }

        return resultStock;
    },

    /**
     * 手動刷新 (看廣告或使用刷新券)
     */
    triggerAdRefresh: function(speciesDataList, userSaveData) {
        const stockData = userSaveData.shop_daily_stock;
        
        if (stockData.refresh_count >= this.MAX_DAILY_AD_REFRESH) {
            return { success: false, message_zh: "今日手動刷新次數已達上限！" };
        }

        stockData.refresh_count += 1;
        const todayStr = this.getTodayDateString();
        
        // 生成全新清單，但不影響機率權重 (公平刷新)
        stockData.stock_items = this.generateStockList(todayStr, stockData.refresh_count, speciesDataList);

        return {
            success: true,
            message_zh: "已成功進貨一批新的爬蟲個體！",
            stock_items: stockData.stock_items
        };
    }
};