// 鱗片與種子：地下生態物語 | NPC 任務兌換與特定時間贈禮系統
// Scales & Seeds: Underground Ecosystem Tales - NPC Reward & Exchange System

export class NpcRewardSystem {
    constructor() {
        // 設定三位 NPC 的「任務道具兌換」與「特殊時間贈禮」資料庫
        this.npcProfiles = {
            // 1. 羅莎 (Rosa) - 地層探險家
            rosa: {
                name: "羅莎",
                title: "地層探險家",
                // 任務道具兌換清單 (以物易物)
                exchanges: [
                    {
                        id: "exchange_rosa_01",
                        requiredItem: "fossil_fragment", // 需要的任務道具 ID
                        requiredAmount: 3,
                        rewardItem: "deep_red_sand",    // 兌換到的特殊物品 ID
                        rewardAmount: 1,
                        name: "古老化石碎片 3個 ➔ 深層赤紅荒漠沙 1包",
                        description: "羅莎對地底化石特別有興趣，拿化石給她能換到高品質的沙漠底材。"
                    },
                    {
                        id: "exchange_rosa_02",
                        requiredItem: "glowing_ore",
                        requiredAmount: 5,
                        rewardItem: "wild_morph_gene_sample",
                        rewardAmount: 1,
                        name: "發光礦石 5個 ➔ 神祕野生基因晶片 1個",
                        description: "用罕見的地底礦石向羅莎換取紀錄野生豬鼻蛇變異基因的舊晶片。"
                    }
                ],
                // 特殊時間送禮規則
                timedGifts: [
                    {
                        id: "rosa_weekend_gift",
                        name: "探險家的週末戰利品",
                        condition: () => {
                            const day = new Date().getDay();
                            return day === 0 || day === 6; // 週末 (六、日)
                        },
                        rewardItem: "substrate_sand",
                        rewardAmount: 5,
                        dialogue: "哈哈！週末剛好從深坑探險回來，順手多挖了一袋高級沙材，拿去用吧！"
                    },
                    {
                        id: "rosa_night_gift",
                        name: "深夜地底夜宵",
                        condition: () => {
                            const hour = new Date().getHours();
                            return hour >= 22 || hour < 4; // 晚上 10點 ~ 凌晨 4點
                        },
                        rewardItem: "frozen_mouse",
                        rewardAmount: 3,
                        dialogue: "這麼晚還在照顧爬蟲啊？深夜地底可冷了，這幾隻優質小白鼠拿去給蛇補充體力吧！"
                    }
                ]
            },

            // 2. 艾美 (Amy) - 爬蟲生態與學者
            amy: {
                name: "艾美",
                title: "生態學者",
                exchanges: [
                    {
                        id: "exchange_amy_01",
                        requiredItem: "shed_skin_sample", // 蛇蛻樣本
                        requiredAmount: 2,
                        rewardItem: "shedding_supplement",
                        rewardAmount: 2,
                        name: "完整蛇蛻樣本 2份 ➔ 專業脫皮保健劑 2瓶",
                        description: "把豬鼻蛇完整的蛇蛻交給艾美研究，她會回饋專業的脫皮護理藥劑。"
                    }
                ],
                timedGifts: [
                    {
                        id: "amy_morning_check",
                        name: "早晨晨檢問候",
                        condition: () => {
                            const hour = new Date().getHours();
                            return hour >= 6 && hour <= 9; // 早晨 6點 ~ 9點
                        },
                        rewardItem: "shedding_supplement",
                        rewardAmount: 1,
                        dialogue: "早安！早上的生態箱環境數據最準確了，這瓶保養劑送給你，記得定期關心牠們的皮膚喔。"
                    }
                ]
            },

            // 3. 老麥克 (Old Mac) - 地底資深資產與物資補給員
            old_mac: {
                name: "老麥克",
                title: "資深補給員",
                exchanges: [
                    {
                        id: "exchange_mac_01",
                        requiredItem: "scrap_metal", // 廢鐵/金屬零件
                        requiredAmount: 10,
                        rewardItem: "water_dish_small",
                        rewardAmount: 1,
                        name: "廢棄金屬零件 10個 ➔ 精緻陶瓷水盆 1個",
                        description: "老麥克擅長用回收資源修繕設施，拿廢鐵可以跟他換取堅固的造景家具。"
                    }
                ],
                timedGifts: [
                    {
                        id: "mac_first_day_month",
                        name: "月度補給發放",
                        condition: () => {
                            const date = new Date().getDate();
                            return date === 1; // 每月 1 號
                        },
                        rewardItem: "frozen_mouse",
                        rewardAmount: 10,
                        dialogue: "又是新的一個月啦！這是本月的基礎物資配給，拿去好生照料你的那些小傢伙！"
                    }
                ]
            }
        };
    }

    /**
     * 檢查指定 NPC 目前是否有符合「特殊時間」可以領取的免費贈禮
     * @param {string} npcId (rosa / amy / old_mac)
     * @param {Object} playerClaimedGifts 玩家已領取的禮物紀錄
     */
    getAvailableTimedGifts(npcId, playerClaimedGifts = {}) {
        const profile = this.npcProfiles[npcId];
        if (!profile) return [];

        const available = [];
        const todayStr = new Date().toISOString().split('T')[0]; // 例如 "2026-11-03"

        for (const gift of profile.timedGifts) {
            const giftKey = `${gift.id}_${todayStr}`;
            // 檢查是否符合時間條件，且今天尚未領取過
            if (gift.condition() && !playerClaimedGifts[giftKey]) {
                available.push({
                    ...gift,
                    giftKey: giftKey
                });
            }
        }
        return available;
    }

    /**
     * 執行「任務道具兌換」
     * @param {string} npcId NPC 代號
     * @param {string} exchangeId 兌換項目 ID
     * @param {Object} playerInventory 玩家當前的背包 items 物件
     */
    processExchange(npcId, exchangeId, playerInventory) {
        const profile = this.npcProfiles[npcId];
        if (!profile) return { success: false, reason: "找不到該 NPC。" };

        const exchange = profile.exchanges.find(e => e.id === exchangeId);
        if (!exchange) return { success: false, reason: "找不到該兌換項目。" };

        const currentAmount = playerInventory[exchange.requiredItem] || 0;
        if (currentAmount < exchange.requiredAmount) {
            return {
                success: false,
                reason: `道具不足！需要 [${exchange.requiredItem}] x${exchange.requiredAmount}，但你只有 ${currentAmount} 個。`
            };
        }

        // 扣除任務道具，發放獎勵
        playerInventory[exchange.requiredItem] -= exchange.requiredAmount;
        if (playerInventory[exchange.requiredItem] <= 0) {
            delete playerInventory[exchange.requiredItem];
        }

        playerInventory[exchange.rewardItem] = (playerInventory[exchange.rewardItem] || 0) + exchange.rewardAmount;

        console.log(`[NpcRewardSystem] 成功透過 ${profile.name} 完成兌換: ${exchange.name}`);
        return {
            success: true,
            rewardItem: exchange.rewardItem,
            rewardAmount: exchange.rewardAmount,
            message: `成功向 ${profile.name} 兌換了 [${exchange.rewardItem}] x${exchange.rewardAmount}！`
        };
    }
}

window.NpcRewardSystem = NpcRewardSystem;