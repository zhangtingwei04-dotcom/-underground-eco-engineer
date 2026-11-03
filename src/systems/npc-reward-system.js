// 鱗片與種子：地下生態物語 | NPC 紀念品與時間循環贈禮系統
// Scales & Seeds: Underground Ecosystem Tales - NPC Souvenir & Reward System

export class NpcRewardSystem {
    constructor() {
        this.npcProfiles = {
            // 1. 老馬克 (Old Mac) - 商店老闆 / 爬蟲導師
            old_mac: {
                name: "老馬克",
                title: "商店老闆 / 爬蟲導師",
                // 【絕版紀念品與特殊配件】（一生限定領取一次）
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
                // 【日常/特定時間循環贈禮】（紀念品領完後，改送這個）
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
                ]
            }
        };
    }

    /**
     * 檢查並取得 NPC 當前應該發放的贈禮（優先發放「一次性紀念品/配件」，領完後自動改送「日常消耗品」）
     * @param {string} npcId (old_mac / amy / rosa)
     * @param {Object} playerSaveData 玩家完整的存檔資料
     */
    checkNpcGift(npcId, playerData) {
        const profile = this.npcProfiles[npcId];
        if (!profile) return null;

        // 確保存檔中有記錄已被領取紀念品的集合 (claimedSouvenirs)
        playerData.claimedSouvenirs = playerData.claimedSouvenirs || [];
        playerData.claimedDailyGifts = playerData.claimedDailyGifts || {};

        const todayStr = new Date().toISOString().split('T')[0];

        // 【第一優先】檢查是否還有尚未領取的限定紀念品 / 特殊配件
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

        // 【第二優先】若紀念品與配件都已領取過，自動切換為日常/時間循環贈禮
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

        return null; // 當前沒有可領取的贈禮
    }

    /**
     * 玩家領取贈禮，並寫入存檔防重領
     */
    claimGift(npcId, giftResult, playerData) {
        if (!giftResult) return false;

        playerData.inventory = playerData.inventory || { items: {} };
        playerData.inventory.items = playerData.inventory.items || {};

        // 1. 發放物品至背包
        const currentAmount = playerData.inventory.items[giftResult.rewardItem] || 0;
        playerData.inventory.items[giftResult.rewardItem] = currentAmount + giftResult.rewardAmount;

        // 2. 標記領取狀態
        if (giftResult.isUnique) {
            // 一生一次的紀念品，記錄到絕版清單
            if (!playerData.claimedSouvenirs.includes(giftResult.giftId)) {
                playerData.claimedSouvenirs.push(giftResult.giftId);
            }
            console.log(`[NpcReward] 玩家獲得絕版紀念品/配件: [${giftResult.name}]`);
        } else {
            // 日常贈禮，記錄今日已領取
            playerData.claimedDailyGifts[giftResult.giftId] = Date.now();
            console.log(`[NpcReward] 玩家獲得日常資源: [${giftResult.name}] x${giftResult.rewardAmount}`);
        }

        return true;
    }
}

window.NpcRewardSystem = NpcRewardSystem;