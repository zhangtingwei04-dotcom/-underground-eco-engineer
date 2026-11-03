// 鱗片與種子：地下生態物語 | 羅莎的地下探險特產交易系統
// Scales & Seeds: Underground Ecosystem Tales - Rosa Special Trade System

export class RosaTradeSystem {
    constructor() {
        // 羅莎專屬的稀有地底特產庫存
        this.specialStock = [
            {
                id: "deep_red_sand",
                name: "深層赤紅荒漠沙",
                type: "substrate",
                price: 450,
                stock: 10,
                description: "來自地層深處的乾燥細沙，具有極佳的透氣與保溫性。"
            },
            {
                id: "ancient_driftwood",
                name: "古地層化石木造景",
                type: "decoration",
                price: 800,
                stock: 3,
                description: "經歷數百年地壓形成的奇特沉木，豬鼻蛇非常喜歡在上頭磨蹭與躲藏。"
            },
            {
                id: "wild_morph_gene_sample",
                name: "神祕野生基因晶片",
                type: "genetics",
                price: 2500,
                stock: 1,
                description: "羅莎在深坑底部挖掘到的古老遺物，似乎記錄著罕見的體色基因密碼。"
            }
        ];
    }

    /**
     * 取得羅莎當前的特產庫存
     */
    getStock() {
        return this.specialStock;
    }

    /**
     * 玩家向羅莎購買稀有道具
     * @param {string} itemId 道具 ID
     * @param {Object} playerMoney 玩家當前金錢
     */
    buyItem(itemId, playerMoney) {
        const itemIndex = this.specialStock.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
            return { success: false, reason: '找不到此項地底特產。' };
        }

        const item = this.specialStock[itemIndex];
        if (item.stock <= 0) {
            return { success: false, reason: '這件稀有寶貝已經被買光囉！等我下次探險回來吧！' };
        }

        if (playerMoney < item.price) {
            return { success: false, reason: '生態基金不足，探險可不接受賒帳記帳！' };
        }

        // 扣除庫存
        item.stock -= 1;
        console.log(`[RosaTrade] 玩家成功向羅莎購入: ${item.name}`);

        return {
            success: true,
            item: item,
            cost: item.price,
            reason: `成功購入 [${item.name}]！羅莎笑著把戰利品交給了你。`
        };
    }
}

window.RosaTradeSystem = RosaTradeSystem;