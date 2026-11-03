// 鱗片與種子：地下生態物語 | NPC 紀念品與時間循環贈禮系統 (四 NPC 完整版)
// Scales & Seeds: Underground Ecosystem Tales - NPC Souvenir & Reward System

export class NpcRewardSystem {
    constructor() {
        this.npcProfiles = {
            // 1. 老馬克 (Old Mac) - 商店老闆 / 爬蟲導師
            old_mac: {
                name: "老馬克",
                title: "商店老闆 / 爬蟲導師",
                uniqueSouvenirs: [
                    {
                        id: "mac_souvenir_handdrawn_map",
                        name: "老馬克的手繪基因譜系地圖",
                        type: "souvenir",
                        rewardItem: "mac_handdrawn_gene_map",
                        dialogue: "這是我年輕時一手一筆畫下來的豬鼻蛇基因圖譜，全世界就這唯一一份。好孩子，把它掛在你工作室的牆上吧！"
                    },
                    {
                        id: "mac_accessory_vintage_sensor",
                        name: "老派黃銅微氣候感測器",
                        type: "accessory",
                        rewardItem: "vintage_brass_sensor",
                        dialogue: "這是我當年剛來地下城時用的感測器，雖然樣子老舊，但準確度沒話說！送給你當作入行紀念！"
                    }
                ],
                recurringGifts: [
                    {
                        id: "mac_recurring_sunday",
                        name: "導師的週日溫馨補給",
                        condition: () => new Date().getDay() === 0, // 每週日
                        rewardItem: "shedding_supplement",
                        rewardAmount: 2,
                        dialogue: "又到了週日啦，照顧爬蟲急躁不得。拿兩瓶脫皮保養劑去備用吧。"
                    },
                    {
                        id: "mac_recurring_monthly",
                        name: "老字號商店常客回饋",
                        condition: () => new Date().getDate() === 15, // 每月15日
                        rewardItem: "frozen_mouse",
                        rewardAmount: 6,
                        dialogue: "新進了一批優質冷凍小白鼠，拿幾隻去給你的小傢伙補充體力！"
                    }
                ],
                exchanges: [
                    {
                        id: "exchange_mac_genetics",
                        requiredItem: "shed_skin_sample",
                        requiredAmount: 3,
                        rewardItem: "micro_climate_sensor",
                        rewardName: "微氣候感測器",
                        name: "蛇蛻基因樣本 3份 ➔ 微氣候感測器 1個",
                        description: "用你的爬蟲育種資料與老馬克交換精準控制生態箱溫濕度的專業感測器。"
                    }
                ]
            },

            // 2. 艾米 (Amy) - 特快溫控快遞員
            amy: {
                name: "艾米",
                title: "特快溫控快遞員",
                uniqueSouvenirs: [
                    {
                        id: "amy_souvenir_badge",
                        name: "艾米的特快車隊第一號榮譽徽章",
                        type: "souvenir",
                        rewardItem: "amy_express_badge",
                        dialogue: "嘿！恭喜你完成了我們的首次合作！這是特快車隊成立時鑄造的限定徽章，全地下城不超過五枚喔！"
                    },
                    {
                        id: "amy_accessory_insulated_pack",
                        name: "風暴級溫控防震包",
                        type: "accessory",
                        rewardItem: "storm_proof_insulated_pack",
                        dialogue: "這是我以前穿梭惡劣氣壓帶專用的防震保溫包，現在把它交給你，保護好你那些嬌貴的寶貝！"
                    }
                ],
                recurringGifts: [
                    {
                        id: "amy_recurring_afternoon",
                        name: "氣壓驟變補給包",
                        condition: () => {
                            const hour = new Date().getHours();
                            return hour >= 14 && hour <= 16;
                        },
                        rewardItem: "shedding_supplement",
                        rewardAmount: 1,
                        dialogue: "午後氣壓開始變化了！這瓶保養劑順路給你送來，別忘記留意箱內濕度！"
                    },
                    {
                        id: "amy_recurring_morning",
                        name: "晨間快遞順路禮",
                        condition: () => {
                            const hour = new Date().getHours();
                            return hour >= 7 && hour <= 9;
                        },
                        rewardItem: "frozen_mouse",
                        rewardAmount: 3,
                        dialogue: "特快專遞！順路多帶了幾份飼料，快簽收，我還要趕去下個地點呢！"
                    }
                ],
                exchanges: [
                    {
                        id: "exchange_amy_express",
                        requiredItem: "scrap_metal",
                        requiredAmount: 8,
                        rewardItem: "express_insulated_box",
                        rewardName: "快遞專用恆溫箱",
                        name: "廢棄金屬零件 8個 ➔ 快遞專用恆溫箱 1個",
                        description: "艾米用快遞運送時汰換的零件，幫你改造成具備絕佳溫控的小型培育箱配件。"
                    }
                ]
            },

            // 3. 羅莎 (Rosa) - 地層探險家 / 稀有物資商人
            rosa: {
                name: "羅莎",
                title: "地層探險家",
                uniqueSouvenirs: [
                    {
                        id: "rosa_souvenir_first_fossil",
                        name: "古地層始祖螺化石標本",
                        type: "souvenir",
                        rewardItem: "ancient_ammonite_fossil",
                        dialogue: "哈哈！這可是我在地底四千公尺親手挖出來的第一塊始祖螺化石！這份珍貴的紀念品就送給你啦！"
                    },
                    {
                        id: "rosa_accessory_climber_belt",
                        name: "探險家多功能腰帶",
                        type: "accessory",
                        rewardItem: "explorer_utility_belt",
                        dialogue: "拿著這個！這條腰帶能幫你在地底採集時多裝不少工具，可別把它弄壞了！"
                    }
                ],
                recurringGifts: [
                    {
                        id: "rosa_recurring_weekend",
                        name: "探險家的週末戰利品",
                        condition: () => {
                            const day = new Date().getDay();
                            return day === 6 || day === 0; // 週末
                        },
                        rewardItem: "substrate_sand",
                        rewardAmount: 5,
                        dialogue: "這個週末在深坑大有斬獲！順手帶了包赤紅荒漠沙回來，拿去幫你的生態箱鋪底吧！"
                    }
                ],
                exchanges: [
                    {
                        id: "exchange_rosa_fossil",
                        requiredItem: "fossil_fragment",
                        requiredAmount: 3,
                        rewardItem: "wild_morph_gene_sample",
                        rewardName: "神祕野生基因晶片",
                        name: "古老化石碎片 3個 ➔ 神祕野生基因晶片 1個",
                        description: "拿地底深處挖到的化石與羅莎交換罕見的野生基因密碼。"
                    }
                ]
            },

            // 4. 老莫 (Old Mo) - 廢土工匠 / 培育箱改裝師
            old_mo: {
                name: "老莫",
                title: "廢土工匠 / 培育箱改裝師",
                uniqueSouvenirs: [
                    {
                        id: "mo_accessory_wrenches",
                        name: "老莫的第 001 號手工鍛造溫控扳手",
                        type: "accessory",
                        rewardItem: "mo_forged_wrench",
                        dialogue: "哼……這把扳手跟我四十年了，幫無數個箱子調過溫控。拿去，別把它弄丟了。"
                    },
                    {
                        id: "mo_souvenir_blueprint",
                        name: "地下第一代生態箱原始設計圖",
                        type: "souvenir",
                        rewardItem: "first_gen_terrarium_blueprint",
                        dialogue: "這是當年我們剛建立地下城時画的箱子圖紙。現在交給你，算是我這手藝有後繼者了。"
                    }
                ],
                recurringGifts: [
                    {
                        id: "mo_recurring_maintenance",
                        name: "工匠的維修零組件袋",
                        condition: () => new Date().getDay() === 3, // 每週三（定期維修日）
                        rewardItem: "scrap_metal",
                        rewardAmount: 5,
                        dialogue: "今天剛清完工作檯，這幾塊廢金屬和修繕零組件拿去，說不定你組裝設備用得上。"
                    }
                ],
                exchanges: [
                    {
                        id: "exchange_mo_ventilation",
                        requiredItem: "scrap_metal",
                        requiredAmount: 12,
                        rewardItem: "custom_ventilation_fan",
                        rewardName: "客製化高效通風風扇",
                        name: "廢棄金屬零件 12個 ➔ 客製化高效通風風扇 1個",
                        description: "交給老莫足夠的金屬零件，他能幫你的生態箱打造成高效散熱與循環的通風系統。"
                    }
                ]
            }
        };
    }

    /**
     * 檢查並取得 NPC 當前應該發放的贈禮
     */
    checkNpcGift(npcId, playerData) {
        const profile = this.npcProfiles[npcId];
        if (!profile) return null;

        playerData.claimedSouvenirs = playerData.claimedSouvenirs || [];
        playerData.claimedDailyGifts = playerData.claimedDailyGifts || {};

        const todayStr = new Date().toISOString().split('T')[0];

        // 1. 優先領取絕版紀念品 / 配件
        for (const souvenir of profile.uniqueSouvenirs) {
            if (!playerData.claimedSouvenirs.includes(souvenir.id)) {
                return {
                    isUnique: true,
                    giftId: souvenir.id,
                    name: souvenir.name,
                    type: souvenir.type,
                    rewardItem: souvenir.rewardItem,
                    rewardAmount: 1,
                    dialogue: souvenir.dialogue
                };
            }
        }

        // 2. 領完後切換為日常循環贈禮
        for (const gift of profile.recurringGifts) {
            const giftKey = `${gift.id}_${todayStr}`;
            if (gift.condition() && !playerData.claimedDailyGifts[giftKey]) {
                return {
                    isUnique: false,
                    giftId: giftKey,
                    name: gift.name,
                    type: "consumable",
                    rewardItem: gift.rewardItem,
                    rewardAmount: gift.rewardAmount,
                    dialogue: gift.dialogue
                };
            }
        }

        return null;
    }

    /**
     * 發放贈禮並標記存檔
     */
    claimGift(npcId, giftResult, playerData) {
        if (!giftResult) return false;

        playerData.inventory = playerData.inventory || { items: {} };
        playerData.inventory.items = playerData.inventory.items || {};

        const currentAmount = playerData.inventory.items[giftResult.rewardItem] || 0;
        playerData.inventory.items[giftResult.rewardItem] = currentAmount + giftResult.rewardAmount;

        if (giftResult.isUnique) {
            if (!playerData.claimedSouvenirs.includes(giftResult.giftId)) {
                playerData.claimedSouvenirs.push(giftResult.giftId);
            }
            console.log(`[NpcReward] 獲得絕版紀念品/配件: [${giftResult.name}]`);
        } else {
            playerData.claimedDailyGifts[giftResult.giftId] = Date.now();
            console.log(`[NpcReward] 獲得日常資源: [${giftResult.name}] x${giftResult.rewardAmount}`);
        }

        return true;
    }

    /**
     * 執行任務道具兌換
     */
    processExchange(npcId, exchangeId, playerData) {
        const profile = this.npcProfiles[npcId];
        if (!profile || !profile.exchanges) return { success: false, reason: "該 NPC 無可兌換項目。" };

        const exchange = profile.exchanges.find(e => e.id === exchangeId);
        if (!exchange) return { success: false, reason: "找不到該兌換項目。" };

        playerData.inventory = playerData.inventory || { items: {} };
        playerData.inventory.items = playerData.inventory.items || {};

        const currentAmount = playerData.inventory.items[exchange.requiredItem] || 0;
        if (currentAmount < exchange.requiredAmount) {
            return {
                success: false,
                reason: `道具不足！需要 [${exchange.requiredItem}] x${exchange.requiredAmount}，但你目前只有 ${currentAmount} 個。`
            };
        }

        playerData.inventory.items[exchange.requiredItem] -= exchange.requiredAmount;
        if (playerData.inventory.items[exchange.requiredItem] <= 0) {
            delete playerData.inventory.items[exchange.requiredItem];
        }

        const rewardCurrent = playerData.inventory.items[exchange.rewardItem] || 0;
        playerData.inventory.items[exchange.rewardItem] = rewardCurrent + 1;

        console.log(`[NpcRewardSystem] 成功透過 ${profile.name} 完成兌換: ${exchange.name}`);
        return {
            success: true,
            rewardItem: exchange.rewardItem,
            message: `成功向 ${profile.name} 兌換了 [${exchange.rewardName}]！`
        };
    }
}

window.NpcRewardSystem = NpcRewardSystem;