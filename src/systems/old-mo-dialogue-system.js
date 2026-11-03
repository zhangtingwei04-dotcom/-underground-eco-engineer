// 鱗片與種子：地下生態物語 | 老莫 (Old Mo) 個人對話與互動系統
// Scales & Seeds: Underground Ecosystem Tales - Old Mo Dialogue System

export class OldMoDialogueSystem {
    constructor() {
        this.npcId = "old_mo";
        this.name = "老莫";
        this.title = "廢土工匠 / 培育箱改裝師";
    }

    /**
     * 取得老莫的基礎招呼語（依據玩家互動記憶動態變化）
     * @param {Object} interactionMemory 玩家的互動記憶狀態
     */
    getGreeting(interactionMemory = {}) {
        const hasMet = interactionMemory.has_met;

        if (!hasMet) {
            return {
                text: "……哼，新來的？看你手忙腳亂的樣子。這座地下城的箱子可經不起外行亂搞，有什麼硬體問題，拿零件來找我。",
                optionText: "你好，我是剛來的新手飼養員！",
                nextState: "met_first_time"
            };
        }

        const greetings = [
            "嗯。箱子沒漏風吧？工具放著，有話快說。",
            "這批廢金屬品質還算行……你來得正好，我有個箱子結構想跟你談談。",
            "照顧爬蟲跟修理機器一樣，馬虎不得。溫度計數值對了嗎？",
            "……看你這表情，又想改裝什麼奇怪的通風管了？說吧。"
        ];

        const randomIndex = Math.floor(Math.random() * greetings.length);
        return {
            text: greetings[randomIndex],
            optionText: "關於生態箱改裝與零件...",
            nextState: "main_menu"
        };
    }

    /**
     * 取得老莫的專屬對話分支
     * @param {string} topicCode 主題代號
     */
    getDialogueTopic(topicCode) {
        const topics = {
            craftsmanship: {
                title: "關於工匠手藝",
                dialogue: "外頭那些量產貨在地下城撐不過兩個月。溫濕度控制、氣壓緩衝、箱體密封……每一個細節都得靠手工打磨。想把豬鼻蛇養好，先學會愛護你的工具。"
            },
            terrarium_advice: {
                title: "培育箱改裝建議",
                dialogue: "如果你的沙漠箱濕度老是降不下來，多半是通風口開錯位置了。拿 12 個廢金屬零件來，我幫你改個客製化高效風扇，包準乾爽。"
            },
            about_underground: {
                title: "地下城的過去",
                dialogue: "……年輕時這地方可沒現在這麼熱鬧。我們幾個人拿著焊接槍，一寸一寸把岩壁挖開。現在看到你們這些年輕人願意留下來照顧這些小生命，挺好的。"
            }
        };

        return topics[topicCode] || {
            title: "沈默",
            dialogue: "老莫只是看了你一眼，默默繼續擦拭手上的扳手。"
        };
    }

    /**
     * 當玩家領取老莫的「紀念品 / 絕版配件」時的專屬台詞
     */
    getSouvenirDialogue(souvenirId) {
        const lines = {
            mo_accessory_wrenches: "哼……這把扳手跟我四十年了，幫無數個箱子調過溫控。拿去，別把它弄丟了。",
            mo_souvenir_blueprint: "這是當年我們剛建立地下城時画的箱子圖紙。現在交給你，算是我這手藝有後繼者了。"
        };
        return lines[souvenirId] || "拿去吧，這對你有用。";
    }

    /**
     * 當玩家日常領取週三維修零組件時的台詞
     */
    getRecurringGiftDialogue() {
        return "今天剛清完工作檯，這幾塊廢金屬和修繕零組件拿去，說不定你組裝設備用得上。";
    }
}

window.OldMoDialogueSystem = OldMoDialogueSystem;